# cfkvsync

Drop-in Go module that keeps Cloudflare KV in sync with the authoritative
MySQL state of every user's quota balance in the `new-api` backend.

## Install

Copy `cf_kv_sync.go` into the existing `new-api` repository — e.g. at
`pkg/cfkv/cf_kv_sync.go` — and adjust the package declaration if needed.

## Usage

After every quota mutation, call:

```go
import "github.com/Calcium-Ion/new-api/pkg/cfkv"

// 1. Top-up flow — after user.quota += delta is committed to MySQL
cfkv.SyncQuotaToCloudflare(strconv.Itoa(user.ID), user.Quota)

// 2. End-of-stream billing — inside the relay finish hook,
// after the row is updated:
cfkv.SyncQuotaToCloudflare(strconv.Itoa(user.ID), user.RemainQuota)

// 3. Admin manual adjust — same pattern
cfkv.SyncQuotaToCloudflare(strconv.Itoa(user.ID), user.RemainQuota)
```

The call is **fire-and-forget**: it returns instantly, retries with
exponential backoff in a background goroutine, and logs persistent
failures without blocking the request path. The edge worker is designed
to lazy-backfill on cache miss, so a dropped sync just causes one extra
upstream call — never a wrong balance.

## Configuration

| Env var | Default | Meaning |
|---|---|---|
| `CF_KV_SYNC_ENABLED`        | `0`     | Master switch. `1` to enable. |
| `CF_KV_SYNC_ENDPOINT`       | —       | Full URL. See modes below. |
| `CF_KV_SYNC_MODE`           | `worker`| `worker` (POST to gateway) or `rest` (Cloudflare API) |
| `CF_KV_SYNC_TOKEN`          | —       | Internal token or Cloudflare API token |
| `CF_KV_SYNC_TIMEOUT_MS`     | `1500`  | Per-attempt HTTP timeout |
| `CF_KV_SYNC_MAX_RETRIES`    | `3`     | Backoff steps before giving up |

### Mode `worker` (recommended)

```
CF_KV_SYNC_ENDPOINT=https://gateway.monicalm.example/internal/kv/quota
CF_KV_SYNC_TOKEN=<same value as Worker's CF_INTERNAL_TOKEN>
```

Push goes to your own Worker — no Cloudflare API quota consumed, no
public Cloudflare credentials sitting in Go's environment.

### Mode `rest`

```
CF_KV_SYNC_ENDPOINT=https://api.cloudflare.com/client/v4/accounts/<acct>/storage/kv/namespaces/<ns>/values
CF_KV_SYNC_TOKEN=<Cloudflare API token with KV write scope>
```

Use when you don't want to deploy the Worker yet, or when you want
direct write access for ops scripts.
