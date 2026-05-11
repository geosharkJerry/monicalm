import { NextRequest, NextResponse } from 'next/server';
import { signSession, SESSION_COOKIE } from '@/lib/session';
import { upstreamBase } from '@/lib/upstream';

/**
 * 登录 BFF 端点。
 *
 *  策略:
 *    1. 优先尝试通过 new-api `/api/user/login` 进行真实鉴权;
 *    2. 若上游不可达 / 拒绝,但凭据匹配内置的「默认管理员」,
 *       则直接在 BFF 内颁发一个 admin 角色的会话 JWT。
 *
 *  内置管理员凭据:
 *      用户名: admin
 *      密  码: monicalm@2026
 *    可通过环境变量 ADMIN_USERNAME / ADMIN_PASSWORD 覆盖。
 *
 *  会话 JWT 中携带:
 *    - sub:   内部用户 id
 *    - token: 上游 new-api 的 access token(演示账号使用占位符)
 *    - role:  'user' | 'admin' | 'root'
 *  以 HttpOnly cookie `monicalm_session` 写入,7 天有效期。
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const DEFAULT_ADMIN_USER = 'admin';
const DEFAULT_ADMIN_PASS = 'monicalm@2026';

export async function POST(req: NextRequest) {
  let payload: { username?: string; password?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json(
      { error: { code: 'bad_request', message: '请求格式无效' } },
      { status: 400 },
    );
  }

  if (!payload.username || !payload.password) {
    return NextResponse.json(
      { error: { code: 'bad_request', message: '请输入用户名和密码' } },
      { status: 400 },
    );
  }

  const adminUser = process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USER;
  const adminPass = process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASS;
  const isDefaultAdmin =
    payload.username === adminUser && payload.password === adminPass;

  // 1. 尝试调用上游 new-api 进行真实鉴权
  let upstreamOk = false;
  let upstreamData: any = null;
  let upstreamStatus = 0;

  try {
    const upstream = await fetch(`${upstreamBase()}/api/user/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    upstreamStatus = upstream.status;
    try {
      upstreamData = await upstream.json();
    } catch {
      /* ignore */
    }
    upstreamOk = upstream.ok && upstreamData?.success;
  } catch {
    /* 上游不可达 → 走演示账号 fallback */
  }

  if (upstreamOk) {
    const userId = String(upstreamData.data?.id ?? upstreamData.data?.user_id ?? '');
    const newApiToken: string =
      upstreamData.data?.access_token ?? upstreamData.data?.token ?? '';
    const role: 'user' | 'admin' | 'root' =
      upstreamData.data?.role >= 100
        ? 'root'
        : upstreamData.data?.role >= 10
          ? 'admin'
          : 'user';

    if (userId && newApiToken) {
      const jwt = await signSession({ sub: userId, token: newApiToken, role });
      return setSessionCookie(
        NextResponse.json({ success: true, user: { id: userId, role } }),
        jwt,
      );
    }
  }

  // 2. Fallback —— 演示管理员凭据
  if (isDefaultAdmin) {
    const jwt = await signSession({
      sub: '1',
      token: 'sk-demo-admin-monicalm-2026',
      role: 'admin',
    });
    return setSessionCookie(
      NextResponse.json({
        success: true,
        user: { id: '1', role: 'admin', display_name: '系统管理员' },
        demo: true,
      }),
      jwt,
    );
  }

  // 3. 全部失败 —— 返回友好错误
  return NextResponse.json(
    {
      error: {
        code: 'auth_failed',
        message: upstreamData?.message || '用户名或密码错误',
      },
    },
    { status: upstreamStatus || 401 },
  );
}

function setSessionCookie(res: NextResponse, jwt: string): NextResponse {
  res.cookies.set(SESSION_COOKIE, jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
