/**
 * Edge-runtime client for reading user state from Cloudflare KV.
 *
 *  - In production, the Next.js Edge runtime makes an internal `fetch`
 *    against the same Cloudflare gateway, which serves the KV value
 *    directly (no Go round-trip).
 *  - In dev / when KV is unavailable, we transparently fall back to a
 *    tiny in-memory map so the page still hydrates.
 *
 * IMPORTANT: This module must stay Edge-compatible — no Node built-ins.
 */

export interface UserState {
  /** Last selected chat model. */
  preferred_model?: string;
  /** Last selected agent id. */
  preferred_agent?: string;
  /** Sidebar collapse persistence. */
  sidebar_collapsed?: boolean;
  /** Cached quota balance (atomic units). */
  remain_quota?: number;
  /** Theme preference. */
  theme?: 'light' | 'dark';
}

const memCache = new Map<string, UserState>();

function gatewayBase(): string {
  return (
    process.env.EDGE_GATEWAY_URL ??
    process.env.NEXT_PUBLIC_EDGE_GATEWAY_URL ??
    ''
  ).replace(/\/$/, '');
}

/** Read a user's state blob — Edge-safe. */
export async function readUserState(userId: string): Promise<UserState> {
  const base = gatewayBase();
  if (!base) return memCache.get(userId) ?? {};

  try {
    const r = await fetch(`${base}/internal/kv/state/${encodeURIComponent(userId)}`, {
      headers: process.env.CF_INTERNAL_TOKEN
        ? { 'X-Internal-Token': process.env.CF_INTERNAL_TOKEN }
        : undefined,
      // Edge fetch is cached by default; for personalized state we must opt out.
      cache: 'no-store',
    });
    if (!r.ok) return {};
    return ((await r.json()) as UserState) ?? {};
  } catch {
    return memCache.get(userId) ?? {};
  }
}

/** Persist a partial state update. Best-effort. */
export async function writeUserState(
  userId: string,
  patch: Partial<UserState>,
): Promise<void> {
  const base = gatewayBase();
  if (!base) {
    memCache.set(userId, { ...(memCache.get(userId) ?? {}), ...patch });
    return;
  }
  try {
    await fetch(`${base}/internal/kv/state/${encodeURIComponent(userId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.CF_INTERNAL_TOKEN
          ? { 'X-Internal-Token': process.env.CF_INTERNAL_TOKEN }
          : {}),
      },
      body: JSON.stringify(patch),
    });
  } catch {
    // Eventual consistency — silently retry next time.
  }
}
