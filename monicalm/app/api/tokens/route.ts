import { NextRequest, NextResponse } from 'next/server';
import { parseCookies, verifySession, SESSION_COOKIE } from '@/lib/session';
import { forwardRequest } from '@/lib/upstream';

/**
 * `/api/tokens` — list & create user API tokens.
 * Backed by new-api `/api/token` endpoints.
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function authToken(req: NextRequest) {
  const jwt = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE];
  const claims = jwt ? await verifySession(jwt) : null;
  return claims?.token ?? null;
}

export async function GET(req: NextRequest) {
  const token = await authToken(req);
  if (!token) return unauth();
  const upstream = await forwardRequest('/api/token/', { token });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: NextRequest) {
  const token = await authToken(req);
  if (!token) return unauth();
  const body = await req.text();
  const upstream = await forwardRequest('/api/token/', {
    method: 'POST',
    token,
    body,
    headers: { 'Content-Type': 'application/json' },
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function unauth() {
  return NextResponse.json(
    { error: { code: 'unauthorized', message: 'Sign-in required' } },
    { status: 401 },
  );
}
