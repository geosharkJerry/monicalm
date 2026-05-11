import { NextRequest, NextResponse } from 'next/server';
import { parseCookies, verifySession, SESSION_COOKIE } from '@/lib/session';
import { forwardRequest } from '@/lib/upstream';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authToken(req: NextRequest) {
  const jwt = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE];
  const claims = jwt ? await verifySession(jwt) : null;
  return claims?.token ?? null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = await authToken(req);
  if (!token) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Sign-in required' } },
      { status: 401 },
    );
  }
  const upstream = await forwardRequest(`/api/token/${params.id}`, {
    method: 'DELETE',
    token,
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const token = await authToken(req);
  if (!token) {
    return NextResponse.json(
      { error: { code: 'unauthorized', message: 'Sign-in required' } },
      { status: 401 },
    );
  }
  const body = await req.text();
  const upstream = await forwardRequest(`/api/token/${params.id}`, {
    method: 'PUT',
    token,
    body,
    headers: { 'Content-Type': 'application/json' },
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
