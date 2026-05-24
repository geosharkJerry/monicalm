// Package cfkvsync exposes a tiny client that lets the Go `new-api`
// backend keep Cloudflare KV in sync with the authoritative MySQL
// state of every user's quota balance.
//
// Drop this file (or the package) into the existing `new-api` codebase,
// e.g. under `pkg/cfkv/`, and call SyncQuotaToCloudflare from every
// place that mutates user quota:
//
//   - successful redeem-code top-up
//   - admin manual quota adjustment
//   - end-of-stream billing deduction (relay finish hook)
//
// The call is intentionally fire-and-forget from the caller's POV — it
// retries with exponential backoff in a goroutine and logs persistent
// failures. The KV cache is eventually consistent; if KV is briefly
// stale the edge worker will fall back to lazy-backfill via the Go API.
//
// Environment variables consumed:
//
//   CF_KV_SYNC_ENABLED        "1" to enable (default off)
//   CF_KV_SYNC_ENDPOINT       Full URL, e.g. https://gateway.example.com/internal/kv/quota
//                             (the Worker route) OR Cloudflare REST API
//                             https://api.cloudflare.com/client/v4/accounts/<acct>/storage/kv/namespaces/<ns>/values/
//   CF_KV_SYNC_MODE           "worker" (default) or "rest"
//   CF_KV_SYNC_TOKEN          Bearer/internal token authenticating this sync call
//   CF_KV_SYNC_TIMEOUT_MS     per-attempt timeout, default 1500
//   CF_KV_SYNC_MAX_RETRIES    default 3
package cfkvsync

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"
)

// ---------------- public API ----------------

// SyncQuotaToCloudflare schedules an asynchronous push of the user's
// current quota balance into Cloudflare KV. It returns immediately.
//
// Callers must hand off the value AFTER persisting the new balance to
// MySQL — never before — to avoid the edge cache ever reading a higher
// number than the database.
func SyncQuotaToCloudflare(userID string, remainQuota int64) {
	c := defaultClient()
	if !c.enabled {
		return
	}
	c.queue.enqueue(syncJob{userID: userID, remain: remainQuota})
}

// SyncQuotaToCloudflareCtx is the synchronous variant for code paths
// that need to await the round-trip (e.g. integration tests).
func SyncQuotaToCloudflareCtx(ctx context.Context, userID string, remainQuota int64) error {
	c := defaultClient()
	if !c.enabled {
		return nil
	}
	return c.pushOnce(ctx, syncJob{userID: userID, remain: remainQuota})
}

// ---------------- internals ----------------

type syncJob struct {
	userID string
	remain int64
	tries  int
}

type client struct {
	enabled    bool
	endpoint   string
	mode       string // "worker" | "rest"
	token      string
	timeout    time.Duration
	maxRetries int
	httpClient *http.Client
	queue      *jobQueue
}

var (
	once   sync.Once
	shared *client
)

// resetSingleton is exposed for tests so the package-level `once` can
// be re-armed after mutating environment variables.
func resetSingleton() {
	once = sync.Once{}
	shared = nil
}

func defaultClient() *client {
	once.Do(func() {
		shared = newClientFromEnv()
		if shared.enabled {
			shared.queue.start(shared)
		}
	})
	return shared
}

func newClientFromEnv() *client {
	enabled := os.Getenv("CF_KV_SYNC_ENABLED") == "1"
	endpoint := strings.TrimRight(os.Getenv("CF_KV_SYNC_ENDPOINT"), "/")
	mode := os.Getenv("CF_KV_SYNC_MODE")
	if mode == "" {
		mode = "worker"
	}
	token := os.Getenv("CF_KV_SYNC_TOKEN")

	timeoutMs, _ := strconv.Atoi(os.Getenv("CF_KV_SYNC_TIMEOUT_MS"))
	if timeoutMs <= 0 {
		timeoutMs = 1500
	}
	retries, _ := strconv.Atoi(os.Getenv("CF_KV_SYNC_MAX_RETRIES"))
	if retries <= 0 {
		retries = 3
	}

	if enabled && endpoint == "" {
		log.Printf("[cfkvsync] disabled: CF_KV_SYNC_ENABLED=1 but CF_KV_SYNC_ENDPOINT empty")
		enabled = false
	}

	return &client{
		enabled:    enabled,
		endpoint:   endpoint,
		mode:       mode,
		token:      token,
		timeout:    time.Duration(timeoutMs) * time.Millisecond,
		maxRetries: retries,
		httpClient: &http.Client{Timeout: time.Duration(timeoutMs+500) * time.Millisecond},
		queue:      newJobQueue(1024),
	}
}

// ---- HTTP push ----

type workerPayload struct {
	UserID      string `json:"user_id"`
	RemainQuota int64  `json:"remain_quota"`
	Ts          int64  `json:"ts"`
}

type restPayload struct {
	RemainQuota int64 `json:"remain_quota"`
	Ts          int64 `json:"ts"`
}

func (c *client) pushOnce(ctx context.Context, j syncJob) error {
	ctx, cancel := context.WithTimeout(ctx, c.timeout)
	defer cancel()

	var (
		req *http.Request
		err error
	)

	switch c.mode {
	case "rest":
		// Cloudflare REST API: PUT <endpoint>/<key>
		// `endpoint` should already be:
		// https://api.cloudflare.com/client/v4/accounts/{acct}/storage/kv/namespaces/{ns}/values
		body, _ := json.Marshal(restPayload{RemainQuota: j.remain, Ts: time.Now().Unix()})
		url := c.endpoint + "/" + j.userID
		req, err = http.NewRequestWithContext(ctx, http.MethodPut, url, bytes.NewReader(body))
		if err != nil {
			return err
		}
		req.Header.Set("Authorization", "Bearer "+c.token)
		req.Header.Set("Content-Type", "application/json")

	default: // worker
		body, _ := json.Marshal(workerPayload{
			UserID:      j.userID,
			RemainQuota: j.remain,
			Ts:          time.Now().Unix(),
		})
		req, err = http.NewRequestWithContext(ctx, http.MethodPost, c.endpoint, bytes.NewReader(body))
		if err != nil {
			return err
		}
		if c.token != "" {
			req.Header.Set("X-Internal-Token", c.token)
		}
		req.Header.Set("Content-Type", "application/json")
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		return nil
	}
	return fmt.Errorf("cf kv sync returned HTTP %d", resp.StatusCode)
}

// ---- async retry queue ----

type jobQueue struct {
	ch chan syncJob
}

func newJobQueue(buf int) *jobQueue {
	return &jobQueue{ch: make(chan syncJob, buf)}
}

func (q *jobQueue) enqueue(j syncJob) {
	select {
	case q.ch <- j:
	default:
		// Channel saturated → drop with a warning. Edge will lazy-backfill.
		log.Printf("[cfkvsync] queue full, dropping update for user=%s", j.userID)
	}
}

func (q *jobQueue) start(c *client) {
	// Two workers keep latency low without overwhelming KV.
	for i := 0; i < 2; i++ {
		go func() {
			for j := range q.ch {
				if err := c.pushWithRetry(j); err != nil {
					log.Printf(
						"[cfkvsync] giving up user=%s remain=%d: %v",
						j.userID, j.remain, err,
					)
				}
			}
		}()
	}
}

func (c *client) pushWithRetry(j syncJob) error {
	var last error
	backoff := 200 * time.Millisecond
	for attempt := 0; attempt < c.maxRetries; attempt++ {
		err := c.pushOnce(context.Background(), j)
		if err == nil {
			return nil
		}
		last = err
		time.Sleep(backoff)
		backoff *= 2
	}
	return last
}
