import { NextRequest, NextResponse } from 'next/server';
import { parseCookies, verifySession, SESSION_COOKIE } from '@/lib/session';
import { forwardRequest } from '@/lib/upstream';

/**
 * `POST /api/redeem` — credit a redeem code to the signed-in user.
 * Proxies to new-api `/api/user/topup`.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const jwt = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE];
  const claims = jwt ? await verifySession(jwt) : null;
  if (!claims?.token) {
    return NextResponse.json(
      { success: false, message: 'Sign-in required' },
      { status: 401 },
    );
  }

  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, message: 'Invalid JSON' },
      { status: 400 },
    );
  }
  if (!body.code) {
    return NextResponse.json(
      { success: false, message: 'Code is required' },
      { status: 400 },
    );
  }

  const upstream = await forwardRequest('/api/user/topup', {
    method: 'POST',
    token: claims.token,
    body: JSON.stringify({ key: body.code }),
    headers: { 'Content-Type': 'application/json' },
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
        success: false,
        message: data?.message || 'Invalid or expired code',
      },
      { status: upstream.status || 400 },
    );
  }

  return NextResponse.json({
    success: true,
    message: data.message || 'Quota added',
    granted_quota: data.data,
  });
}
