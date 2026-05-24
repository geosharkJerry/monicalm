/**
 * monicalm — Cloudflare Worker edge gateway.
 *
 *  Responsibilities (in order of execution):
 *    1. CORS / preflight handling.
 *    2. IP-level rate limit (sliding window counter in RATE_LIMIT_KV).
 *    3. JWT verification (HS256, shared SESSION_SECRET with the Next.js BFF).
 *    4. Token-level rate limit (per `sub`).
 *    5. KV quota lookup — `USER_QUOTA_KV[userId]`. If <= 0 → 402.
 *    6. Transparent reverse proxy to UPSTREAM_BASE_URL with SSE streaming.
 *    7. Internal endpoints for the Go backend to push KV updates.
 *
 *  Failure of any pre-check stops the request at the edge — the Go core
 *  is never bothered by an unauthenticated, out-of-quota, or abusive caller.
 */

import { Hono, type Context } from 'hono';
import { jwtVerify } from 'jose';

// ---- Env binding shape (declared in wrangler.toml) ----
export interface Env {
  USER_QUOTA_KV: KVNamespace;
  RATE_LIMIT_KV: KVNamespace;
  UPSTREAM_BASE_URL: string;
  JWT_ISSUER: string;
  SESSION_SECRET: string;     // wrangler secret
  CF_INTERNAL_TOKEN?: string; // wrangler secret
  RATE_LIMIT_RPM_IP: string;
  RATE_LIMIT_RPM_TOKEN: string;
}

// ---- KV value shape ----
interface QuotaEntry {
  remain_quota: number;
  ts: number; // unix seconds when last synced
}

const app = new Hono<{ Bindings: Env; Variables: { userId: string; role: string } }>();

/* ---------------------------------------------------------- *
 *  Health / CORS preflight                                    *
 * ---------------------------------------------------------- */
app.get('/healthz', (c) =>
  c.json({ ok: true, ts: Date.now(), service: 'monicalm-edge' }),
);

app.options('*', (c) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(c.req.header('Origin')),
  });
});

/* ---------------------------------------------------------- *
 *  Middleware                                                  *
 * ---------------------------------------------------------- */

// 1. IP rate limit — applied to every external request.
app.use('*', async (c, next) => {
  const ip = c.req.header('cf-connecting-ip') ?? 'anon';
  const limit = parseInt(c.env.RATE_LIMIT_RPM_IP || '120', 10);
  if (!(await allowRpm(c.env.RATE_LIMIT_KV, `ip:${ip}`, limit))) {
    return jsonError(c, 429, 'rate_limited_ip', 'Too many requests from this IP.');
  }
  await next();
});

// 2. JWT + KV gate — only for /api/v1/* (the user-facing AI endpoints).
app.use('/api/v1/*', async (c, next) => {
  // ---- JWT ----
  const auth = c.req.header('authorization') ?? '';
  const cookie = c.req.header('cookie') ?? '';
  const jwt =
    auth.startsWith('Bearer ') ? auth.slice(7) : readCookie(cookie, 'monicalm_session');
  if (!jwt) {
    return jsonError(c, 401, 'unauthorized', 'Sign-in required.');
  }
  let userId: string;
  let role = 'user';
  try {
    const { payload } = await jwtVerify(
      jwt,
      new TextEncoder().encode(c.env.SESSION_SECRET),
      { issuer: c.env.JWT_ISSUER, algorithms: ['HS256'] },
    );
    userId = String(payload.sub);
    role = String(payload.role ?? 'user');
  } catch {
    return jsonError(c, 401, 'invalid_token', 'Session token is invalid or expired.');
  }

  // ---- Per-token rate limit ----
  const tokLimit = parseInt(c.env.RATE_LIMIT_RPM_TOKEN || '60', 10);
  if (!(await allowRpm(c.env.RATE_LIMIT_KV, `tok:${userId}`, tokLimit))) {
    return jsonError(c, 429, 'rate_limited_token', 'You are sending requests too fast.');
  }

  // ---- KV quota ----
  const quota = await readQuota(c.env.USER_QUOTA_KV, userId);
  if (quota === null) {
    // Cache miss — fall through and let the Go backend authoritatively decide.
    // We schedule a lazy backfill so the next call is fast.
    c.executionCtx.waitUntil(
      lazyBackfillQuota(c.env, userId).catch(() => void 0),
    );
  } else if (quota.remain_quota <= 0) {
    return jsonError(
      c,
      402,
      'insufficient_quota',
      'You are out of quota. Top up or redeem a code to continue.',
    );
  }

  c.set('userId', userId);
  c.set('role', role);
  await next();
});

/* ---------------------------------------------------------- *
 *  Transparent proxy — /api/v1/* → upstream                   *
 * ---------------------------------------------------------- */
app.all('/api/v1/*', async (c) => {
  const url = new URL(c.req.url);
  const upstreamUrl =
    c.env.UPSTREAM_BASE_URL.replace(/\/$/, '') + url.pathname + url.search;

  // Reconstruct outbound headers
  const fwd = new Headers(c.req.raw.headers);
  fwd.delete('host');
  fwd.delete('cf-connecting-ip');
  fwd.set('x-monicalm-user', c.get('userId'));
  fwd.set('x-monicalm-role', c.get('role'));

  const upstream = await fetch(upstreamUrl, {
    method: c.req.method,
    headers: fwd,
    body: ['GET', 'HEAD'].includes(c.req.method) ? null : c.req.raw.body,
    // @ts-ignore — Workers fetch supports stream bodies via duplex hint
    duplex: 'half',
    redirect: 'manual',
  }).catch((e) => {
    return new Response(
      JSON.stringify({
        error: { code: 'upstream_unreachable', message: e?.message ?? 'offline' },
      }),
      { status: 502, headers: { 'Content-Type': 'application/json' } },
    );
  });

  // Pass through (SSE-safe — body is a ReadableStream)
  const respHeaders = new Headers(upstream.headers);
  for (const [k, v] of Object.entries(corsHeaders(c.req.header('Origin')))) {
    respHeaders.set(k, v);
  }
  respHeaders.set('X-Accel-Buffering', 'no');
  return new Response(upstream.body, {
    status: upstream.status,
    headers: respHeaders,
  });
});

/* ---------------------------------------------------------- *
 *  Internal sync — Go backend pushes KV updates here         *
 *    POST /internal/kv/quota   { user_id, remain_quota }     *
 *    Auth: X-Internal-Token must match CF_INTERNAL_TOKEN     *
 * ---------------------------------------------------------- */
app.post('/internal/kv/quota', async (c) => {
  if (
    c.env.CF_INTERNAL_TOKEN &&
    c.req.header('x-internal-token') !== c.env.CF_INTERNAL_TOKEN
  ) {
    return jsonError(c, 403, 'forbidden', 'Bad internal token');
  }
  let body: { user_id?: string | number; remain_quota?: number };
  try {
    body = await c.req.json();
  } catch {
    return jsonError(c, 400, 'bad_request', 'Invalid JSON');
  }
  if (body.user_id == null || typeof body.remain_quota !== 'number') {
    return jsonError(c, 400, 'bad_request', 'user_id and remain_quota are required');
  }
  const entry: QuotaEntry = {
    remain_quota: body.remain_quota,
    ts: Math.floor(Date.now() / 1000),
  };
  await c.env.USER_QUOTA_KV.put(String(body.user_id), JSON.stringify(entry), {
    // 24-hour TTL — Go remains the source of truth; KV is just hot cache.
    expirationTtl: 60 * 60 * 24,
  });
  return c.json({ ok: true });
});

/* ---------------------------------------------------------- *
 *  Helpers                                                    *
 * ---------------------------------------------------------- */

async function readQuota(kv: KVNamespace, userId: string): Promise<QuotaEntry | null> {
  const raw = await kv.get(userId, 'json').catch(() => null);
  return (raw as QuotaEntry | null) ?? null;
}

/**
 * Sliding-window per-minute counter.
 * Returns true if the request is allowed.
 */
async function allowRpm(kv: KVNamespace, key: string, limit: number): Promise<boolean> {
  if (limit <= 0) return true;
  const minute = Math.floor(Date.now() / 60_000);
  const k = `rpm:${key}:${minute}`;
  const cur = parseInt((await kv.get(k)) ?? '0', 10);
  if (cur >= limit) return false;
  // Fire-and-forget update; expire after 2 minutes.
  await kv.put(k, String(cur + 1), { expirationTtl: 120 });
  return true;
}

/** Schedule an async pull from upstream to backfill KV on cache miss. */
async function lazyBackfillQuota(env: Env, userId: string) {
  const r = await fetch(
    `${env.UPSTREAM_BASE_URL.replace(/\/$/, '')}/internal/quota/${encodeURIComponent(userId)}`,
    {
      headers: env.CF_INTERNAL_TOKEN
        ? { 'X-Internal-Token': env.CF_INTERNAL_TOKEN }
        : undefined,
    },
  ).catch(() => null);
  if (!r || !r.ok) return;
  const j = (await r.json().catch(() => null)) as { remain_quota?: number } | null;
  if (typeof j?.remain_quota !== 'number') return;
  await env.USER_QUOTA_KV.put(
    userId,
    JSON.stringify({ remain_quota: j.remain_quota, ts: Math.floor(Date.now() / 1000) }),
    { expirationTtl: 60 * 60 * 24 },
  );
}

function readCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      return decodeURIComponent(part.slice(i + 1).trim());
    }
  }
  return null;
}

function corsHeaders(origin: string | undefined): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin ?? '*',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Authorization, Content-Type, X-Internal-Token, X-Requested-With',
    Vary: 'Origin',
  };
}

function jsonError(
  c: Context,
  status: number,
  code: string,
  message: string,
) {
  return new Response(
    JSON.stringify({ error: { code, message } }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders(c.req.header('Origin')),
      },
    },
  );
}

export default app;
