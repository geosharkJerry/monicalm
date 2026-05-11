import { NextRequest, NextResponse } from 'next/server';
import { verifySession, SESSION_COOKIE } from '@/lib/session';

/**
 * Edge middleware — runs at the CDN edge, before any route handler.
 *
 * Pinning to the Edge runtime (default for `middleware.ts`) means:
 *   - JWT validation happens in <1ms close to the user,
 *   - Cloudflare KV lookups in /api/edge/* are co-located,
 *   - Page hydration can read personalization state without a DB hop.
 *
 *  - Public paths (`/`, `/login`, static, `/api/auth/*`) pass through.
 *  - Authenticated paths require a valid `monicalm_session` cookie.
 *  - Admin paths additionally require `role === 'admin' | 'root'`.
 *  - All protected requests get the resolved `userId` injected as the
 *    `x-monicalm-user` header so downstream API routes can read it
 *    cheaply without re-parsing the JWT.
 */

export const config = {
  matcher: [
    // Run on everything except static assets and Next internals
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|ico|webp)$).*)',
  ],
};

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health',
];

const ADMIN_PREFIXES = ['/admin', '/api/admin'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (PUBLIC_PATHS.includes(pathname)) return NextResponse.next();

  const jwt = req.cookies.get(SESSION_COOKIE)?.value;
  const claims = jwt ? await verifySession(jwt) : null;

  if (!claims) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: { code: 'unauthorized', message: 'Sign-in required' } },
        { status: 401 },
      );
    }
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Admin gate
  if (ADMIN_PREFIXES.some((p) => pathname.startsWith(p))) {
    if (claims.role !== 'admin' && claims.role !== 'root') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: { code: 'forbidden', message: 'Admin only' } },
          { status: 403 },
        );
      }
      return NextResponse.rewrite(new URL('/login?next=' + pathname, req.url));
    }
  }

  // Inject identity headers for downstream API routes
  const headers = new Headers(req.headers);
  headers.set('x-monicalm-user', String(claims.sub));
  headers.set('x-monicalm-role', String(claims.role ?? 'user'));
  return NextResponse.next({ request: { headers } });
}
