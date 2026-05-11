package cfkvsync

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"sync/atomic"
	"testing"
	"time"
)

// Sanity check the synchronous worker-mode push.
func TestPushOnce_Worker(t *testing.T) {
	var hits int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&hits, 1)
		if r.Header.Get("X-Internal-Token") != "secret" {
			http.Error(w, "bad token", http.StatusForbidden)
			return
		}
		body, _ := io.ReadAll(r.Body)
		var p workerPayload
		_ = json.Unmarshal(body, &p)
		if p.UserID != "42" || p.RemainQuota != 1000 {
			http.Error(w, "bad payload", http.StatusBadRequest)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	os.Setenv("CF_KV_SYNC_ENABLED", "1")
	os.Setenv("CF_KV_SYNC_ENDPOINT", srv.URL)
	os.Setenv("CF_KV_SYNC_MODE", "worker")
	os.Setenv("CF_KV_SYNC_TOKEN", "secret")
	// reset singleton between tests
	resetSingleton()

	if err := SyncQuotaToCloudflareCtx(context.Background(), "42", 1000); err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if atomic.LoadInt32(&hits) != 1 {
		t.Fatalf("expected 1 upstream call, got %d", hits)
	}
}

// Smoke test that the async fire-and-forget path eventually delivers.
func TestEnqueue_RetriesUntilOK(t *testing.T) {
	var hits int32
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		n := atomic.AddInt32(&hits, 1)
		if n < 2 {
			http.Error(w, "boom", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusOK)
	}))
	defer srv.Close()

	os.Setenv("CF_KV_SYNC_ENABLED", "1")
	os.Setenv("CF_KV_SYNC_ENDPOINT", srv.URL)
	os.Setenv("CF_KV_SYNC_MODE", "worker")
	os.Setenv("CF_KV_SYNC_TOKEN", "")
	os.Setenv("CF_KV_SYNC_MAX_RETRIES", "5")
	resetSingleton()

	SyncQuotaToCloudflare("7", 250)

	deadline := time.Now().Add(2 * time.Second)
	for time.Now().Before(deadline) {
		if atomic.LoadInt32(&hits) >= 2 {
			return
		}
		time.Sleep(30 * time.Millisecond)
	}
	t.Fatalf("expected ≥2 attempts, got %d", hits)
}
