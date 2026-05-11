import { NextRequest, NextResponse } from 'next/server';
import { signSession, SESSION_COOKIE } from '@/lib/session';
import { upstreamBase } from '@/lib/upstream';

/**
 * Sign-in BFF endpoint.
 *  - Accepts { username, password } and proxies to new-api `/api/user/login`.
 *  - On success, mints a monicalm session JWT containing the user's id +
 *    their new-api access token, sets it as an httpOnly cookie.
 *  - This is the only place plaintext credentials touch the BFF.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let payload: { username?: string; password?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'bad_request', message: 'Invalid JSON' } },
      { status: 400 },
    );
  }

  if (!payload.username || !payload.password) {
    return NextResponse.json(
      { error: { code: 'bad_request', message: 'Username and password are required' } },
      { status: 400 },
    );
  }

  // 1. Authenticate against new-api
  const upstream = await fetch(`${upstreamBase()}/api/user/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  }).catch((e) => {
    return new Response(JSON.stringify({ message: e?.message }), { status: 502 });
  });

  let data: any = null;
  try {
    data = await upstream.json();
  } catch {
    /* ignore */
  }

  if (!upstream.ok || !data?.success) {
    return NextResponse.json(
      {
        error: {
          code: 'auth_failed',
          message: data?.message || 'Invalid credentials',
        },
      },
      { status: upstream.status || 401 },
    );
  }

  // 2. Mint session
  const userId = String(data.data?.id ?? data.data?.user_id ?? '');
  const newApiToken: string = data.data?.access_token ?? data.data?.token ?? '';
  const role: 'user' | 'admin' | 'root' =
    data.data?.role >= 100 ? 'root' : data.data?.role >= 10 ? 'admin' : 'user';

  if (!userId || !newApiToken) {
    return NextResponse.json(
      { error: { code: 'malformed_upstream', message: 'Backend did not return a token' } },
      { status: 502 },
    );
  }

  const jwt = await signSession({ sub: userId, token: newApiToken, role });

  const res = NextResponse.json({ success: true, user: { id: userId, role } });
  res.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
