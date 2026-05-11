# monicalm-edge-gateway

Cloudflare Worker that sits in front of the Go `new-api` core and performs:

| Stage | What |
|-------|------|
| 1 | CORS / preflight |
| 2 | IP rate-limit (sliding 1-min window in `RATE_LIMIT_KV`) |
| 3 | JWT verification (HS256, shared secret with Next.js BFF) |
| 4 | Per-user rate-limit |
| 5 | KV quota read from `USER_QUOTA_KV` → 402 on `remain_quota ≤ 0` |
| 6 | Transparent reverse-proxy of `/api/v1/*` to the Go origin, SSE-safe |
| 7 | `POST /internal/kv/quota` — Go pushes refreshed balances here |

## Setup

```bash
cd workers/edge-gateway
npm i
npx wrangler kv:namespace create USER_QUOTA_KV
npx wrangler kv:namespace create RATE_LIMIT_KV
# paste the returned ids into wrangler.toml

npx wrangler secret put SESSION_SECRET     # must equal Next.js SESSION_SECRET
npx wrangler secret put CF_INTERNAL_TOKEN   # used by Go → CF sync

npx wrangler dev      # local
npx wrangler deploy   # prod
```

## KV layout

```
USER_QUOTA_KV / <userId>     →  { "remain_quota": 123456, "ts": 1715000000 }   (TTL 24h)
RATE_LIMIT_KV / rpm:ip:<ip>:<minute>     →  count   (TTL 2m)
RATE_LIMIT_KV / rpm:tok:<userId>:<minute> →  count  (TTL 2m)
```

Go is the **source of truth**. KV is *eventually consistent* hot cache. After
every quota-changing event (top-up, redeem, post-call deduction) the Go
backend `POST`s to `/internal/kv/quota` to refresh the cache.
