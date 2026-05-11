/**
 * Tiny utilities for talking to the Go `new-api` backend.
 *
 *  - Base URL comes from NEW_API_BASE_URL (e.g. http://127.0.0.1:3000).
 *  - All helpers are isomorphic — they work from Edge, Node, or Workers.
 *  - Auth: forward the user's new-api token as `Authorization: Bearer ...`.
 */

export function upstreamBase(): string {
  return process.env.NEW_API_BASE_URL || 'http://127.0.0.1:3000';
}

/** Build standard headers for an upstream call. */
export function upstreamHeaders(
  token: string,
  extra?: HeadersInit,
): Headers {
  const h = new Headers(extra);
  h.set('Authorization', `Bearer ${token}`);
  if (!h.has('Accept')) h.set('Accept', 'application/json, text/event-stream');
  return h;
}

/** Forward a request body & headers to the upstream `path`. */
export async function forwardRequest(
  path: string,
  init: {
    method?: string;
    token: string;
    body?: BodyInit | null;
    headers?: HeadersInit;
    signal?: AbortSignal;
  },
): Promise<Response> {
  const url = upstreamBase().replace(/\/$/, '') + path;
  const headers = upstreamHeaders(init.token, init.headers);
  return fetch(url, {
    method: init.method ?? 'GET',
    headers,
    body: init.body,
    signal: init.signal,
    // Required for SSE — keep the connection open
    // @ts-ignore — Node/Edge accept this hint
    duplex: 'half',
    cache: 'no-store',
  });
}

/** Map common upstream error shapes to a friendly UI payload. */
export interface FriendlyError {
  code: string;
  status: number;
  message: string;
}

export function toFriendlyError(status: number, body: any): FriendlyError {
  const msg = body?.error?.message ?? body?.message ?? '';
  if (status === 401 || status === 403) {
    return { status, code: 'unauthorized', message: 'Session expired. Please sign in again.' };
  }
  if (status === 402) {
    return {
      status,
      code: 'insufficient_quota',
      message: 'You are out of quota. Top up or redeem a code to continue.',
    };
  }
  if (status === 429) {
    return {
      status,
      code: 'rate_limited',
      message: msg || 'Too many requests — slow down a moment.',
    };
  }
  if (status >= 500) {
    return {
      status,
      code: 'upstream_error',
      message: msg || 'Upstream channel had a hiccup. Retry shortly.',
    };
  }
  return { status, code: 'request_failed', message: msg || `HTTP ${status}` };
}
