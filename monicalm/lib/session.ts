/**
 * Lightweight session helpers used by both Node and Edge runtimes.
 *
 * Strategy:
 *  - User logs into monicalm and we issue an HS256-signed JWT cookie
 *    `monicalm_session` containing { sub: userId, token: "sk-..." }.
 *  - The BFF reads this cookie, verifies it, and forwards the embedded
 *    new-api token in the upstream `Authorization` header.
 *  - JWT verification uses `jose`, which runs identically on Edge / Node.
 */

import { jwtVerify, SignJWT } from 'jose';

export const SESSION_COOKIE = 'monicalm_session';
const JWT_ALG = 'HS256';

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s) {
    // Don't crash dev preview, but make it obvious
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET is required in production');
    }
    return new TextEncoder().encode('dev-insecure-secret-change-me');
  }
  return new TextEncoder().encode(s);
}

export interface SessionClaims {
  sub: string;        // internal user id
  token: string;      // new-api access token
  role?: 'user' | 'admin' | 'root';
  exp?: number;
  iat?: number;
}

export async function signSession(
  claims: Omit<SessionClaims, 'iat' | 'exp'>,
  ttlSeconds = 60 * 60 * 24 * 7,
): Promise<string> {
  return await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: JWT_ALG })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSeconds)
    .setIssuer('monicalm')
    .sign(secret());
}

export async function verifySession(jwt: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(jwt, secret(), {
      issuer: 'monicalm',
      algorithms: [JWT_ALG],
    });
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
}

/** Parse cookie header into a map. Edge-safe (no Node deps). */
export function parseCookies(header: string | null | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map((kv) => {
      const idx = kv.indexOf('=');
      const k = kv.slice(0, idx).trim();
      const v = decodeURIComponent(kv.slice(idx + 1).trim());
      return [k, v];
    }),
  );
}
