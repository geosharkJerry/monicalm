import { NextRequest } from 'next/server';
import { parseCookies, verifySession, SESSION_COOKIE } from '@/lib/session';
import { forwardRequest, toFriendlyError } from '@/lib/upstream';

/**
 * Transparent SSE proxy for `POST /api/chat/completions`.
 *
 *  - Verifies the user's session JWT and extracts their new-api token.
 *  - Forwards the JSON body 1:1 to `${NEW_API_BASE_URL}/v1/chat/completions`.
 *  - Streams the response body back to the client untouched, preserving the
 *    SSE framing (`data: {...}\n\n` ... `data: [DONE]\n\n`).
 *  - Aborts the upstream fetch if the client disconnects.
 *  - Converts upstream errors into a Genspark-friendly JSON envelope that
 *    the UI surfaces as a toast.
 *
 * NOTE: This route runs on the Node runtime because Node's `fetch` exposes
 * a proper `ReadableStream` for the response body that's safe to pipe.
 * (Edge fetch also works but Node is more predictable for long-lived SSE.)
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  // ---- auth ----
  const cookieHeader = req.headers.get('cookie');
  const jwt = parseCookies(cookieHeader)[SESSION_COOKIE];
  const claims = jwt ? await verifySession(jwt) : null;
  if (!claims?.token) {
    return jsonError(401, 'unauthorized', 'Sign-in required');
  }

  // ---- forward request body ----
  let bodyText: string;
  try {
    bodyText = await req.text();
    // Make sure stream is enabled — Genspark always streams.
    const parsed = JSON.parse(bodyText);
    if (parsed.stream === false) parsed.stream = true;
    bodyText = JSON.stringify(parsed);
  } catch {
    return jsonError(400, 'bad_request', 'Body must be valid JSON');
  }

  // ---- fetch upstream ----
  let upstream: Response;
  try {
    upstream = await forwardRequest('/v1/chat/completions', {
      method: 'POST',
      token: claims.token,
      body: bodyText,
      headers: { 'Content-Type': 'application/json' },
      signal: req.signal,
    });
  } catch (e: any) {
    if (e?.name === 'AbortError') {
      return new Response(null, { status: 499 });
    }
    return jsonError(502, 'upstream_unreachable', e?.message ?? 'Upstream offline');
  }

  // ---- non-OK: parse JSON error and translate ----
  if (!upstream.ok) {
    let body: any = null;
    try {
      body = await upstream.json();
    } catch {
      /* not JSON */
    }
    const friendly = toFriendlyError(upstream.status, body);
    return new Response(JSON.stringify({ error: friendly }), {
      status: friendly.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // ---- stream passthrough ----
  // Re-emit headers expected by EventSource/fetch clients. We deliberately
  // strip hop-by-hop headers like `transfer-encoding` because Next.js sets
  // those itself.
  const headers = new Headers();
  headers.set(
    'Content-Type',
    upstream.headers.get('content-type') ?? 'text/event-stream; charset=utf-8',
  );
  headers.set('Cache-Control', 'no-cache, no-transform');
  headers.set('Connection', 'keep-alive');
  headers.set('X-Accel-Buffering', 'no'); // disable nginx buffering

  return new Response(upstream.body, { status: 200, headers });
}

function jsonError(status: number, code: string, message: string) {
  return new Response(JSON.stringify({ error: { code, message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
