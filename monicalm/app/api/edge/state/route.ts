import { NextRequest, NextResponse } from 'next/server';
import { parseCookies, verifySession, SESSION_COOKIE } from '@/lib/session';
import { readUserState, writeUserState } from '@/lib/edge-kv';

/**
 * Edge runtime endpoint that returns the signed-in user's personalized
 * UI state from Cloudflare KV (preferred model, sidebar collapse, theme,
 * cached quota). The chat / dashboard pages hit this on hydration so the
 * first paint matches the user's last session without a database call.
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const jwt = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE];
  const claims = jwt ? await verifySession(jwt) : null;
  if (!claims) {
    return NextResponse.json({}, { status: 401 });
  }
  const state = await readUserState(claims.sub);
  return NextResponse.json(state, {
    headers: { 'Cache-Control': 'private, max-age=0, no-store' },
  });
}

export async function POST(req: NextRequest) {
  const jwt = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE];
  const claims = jwt ? await verifySession(jwt) : null;
  if (!claims) {
    return NextResponse.json({}, { status: 401 });
  }
  let patch: Record<string, unknown>;
  try {
    patch = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }
  await writeUserState(claims.sub, patch);
  return NextResponse.json({ ok: true });
}
