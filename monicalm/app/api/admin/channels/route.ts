import { NextRequest, NextResponse } from 'next/server';
import { parseCookies, verifySession, SESSION_COOKIE } from '@/lib/session';
import { forwardRequest } from '@/lib/upstream';

/**
 * Admin · channels list + create.
 * Proxies to new-api `/api/channel/`.
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function authAdmin(req: NextRequest) {
  const jwt = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE];
  const claims = jwt ? await verifySession(jwt) : null;
  if (!claims) return null;
  if (claims.role !== 'admin' && claims.role !== 'root') return null;
  return claims;
}

export async function GET(req: NextRequest) {
  const claims = await authAdmin(req);
  if (!claims) return forbidden();
  const upstream = await forwardRequest('/api/channel/', { token: claims.token });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const claims = await authAdmin(req);
  if (!claims) return forbidden();
  const body = await req.text();
  const upstream = await forwardRequest('/api/channel/', {
    method: 'POST',
    token: claims.token,
    body,
    headers: { 'Content-Type': 'application/json' },
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function forbidden() {
  return NextResponse.json(
    { error: { code: 'forbidden', message: 'Admin only' } },
    { status: 403 },
  );
}
