import { NextRequest, NextResponse } from 'next/server';
import { parseCookies, verifySession, SESSION_COOKIE } from '@/lib/session';
import { forwardRequest } from '@/lib/upstream';
import type { GeneratedCode } from '@/lib/redeem';

/**
 * Admin · persist a batch of pre-generated redeem codes into new-api.
 *
 * The frontend builds codes locally (so the admin can audit / regenerate
 * without round-trips) and then POSTs the final batch here. We chunk them
 * to avoid overwhelming the upstream DB with a single huge transaction.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHUNK = 200;

export async function POST(req: NextRequest) {
  const jwt = parseCookies(req.headers.get('cookie'))[SESSION_COOKIE];
  const claims = jwt ? await verifySession(jwt) : null;
  if (!claims || (claims.role !== 'admin' && claims.role !== 'root')) {
    return NextResponse.json(
      { error: { code: 'forbidden', message: 'Admin only' } },
      { status: 403 },
    );
  }

  let payload: { codes: GeneratedCode[] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'bad_request', message: 'Invalid JSON' } },
      { status: 400 },
    );
  }

  if (!Array.isArray(payload?.codes) || payload.codes.length === 0) {
    return NextResponse.json(
      { error: { code: 'bad_request', message: 'codes[] required' } },
      { status: 400 },
    );
  }

  let inserted = 0;
  const failures: { code: string; reason: string }[] = [];

  for (let i = 0; i < payload.codes.length; i += CHUNK) {
    const chunk = payload.codes.slice(i, i + CHUNK);
    const upstream = await forwardRequest('/api/redemption/batch', {
      method: 'POST',
      token: claims.token,
      body: JSON.stringify({ codes: chunk }),
      headers: { 'Content-Type': 'application/json' },
    }).catch((e) => {
      return new Response(
        JSON.stringify({ message: e?.message ?? 'upstream offline' }),
        { status: 502 },
      );
    });

    if (!upstream.ok) {
      const j = await upstream.json().catch(() => ({}));
      for (const c of chunk) {
        failures.push({ code: c.code, reason: j?.message ?? `HTTP ${upstream.status}` });
      }
      continue;
    }
    inserted += chunk.length;
  }

  return NextResponse.json({
    success: failures.length === 0,
    inserted,
    failed: failures.length,
    failures: failures.slice(0, 20), // cap for response size
  });
}
