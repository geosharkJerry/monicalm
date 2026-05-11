import { NextRequest, NextResponse } from 'next/server';
import { signSession, SESSION_COOKIE } from '@/lib/session';
import { upstreamBase } from '@/lib/upstream';

/**
 * 登录 BFF 端点。
 *
 *  策略:
 *    1. 若配置了 NEW_API_BASE_URL,优先通过 new-api `/api/user/login`
 *       进行真实鉴权;
 *    2. 若上游未配置 / 不可达 / 拒绝,但凭据匹配内置的「默认管理员」,
 *       则直接在 BFF 内颁发一个 admin 角色的会话 JWT。
 *
 *  内置管理员凭据:
 *      用户名: admin
 *      密  码: monicalm@2026
 *    可通过环境变量 ADMIN_USERNAME / ADMIN_PASSWORD 覆盖。
 *
 *  顶层异常一律捕获并返回 JSON,以避免 Edge runtime 抛错时
 *  Cloudflare 返回 HTML 错误页导致前端 `res.json()` 解析失败。
 */
export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const DEFAULT_ADMIN_USER = 'admin';
const DEFAULT_ADMIN_PASS = 'monicalm@2026';

export async function POST(req: NextRequest) {
  try {
    return await handle(req);
  } catch (err: any) {
    // 关键:任何意外异常都必须返回合法 JSON,否则前端解析会炸。
    return NextResponse.json(
      {
        error: {
          code: 'server_error',
          message: '服务暂时不可用,请稍后再试',
          detail: err?.message ?? String(err),
        },
      },
      { status: 500 },
    );
  }
}

async function handle(req: NextRequest): Promise<NextResponse> {
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

  // 1. 仅当配置了上游地址时,才尝试调用 new-api 进行真实鉴权
  let upstreamOk = false;
  let upstreamData: any = null;
  let upstreamStatus = 0;
  const base = upstreamBase();

  if (base) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const upstream = await fetch(`${base}/api/user/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      upstreamStatus = upstream.status;
      try {
        upstreamData = await upstream.json();
      } catch {
        /* 上游返回非 JSON,忽略 */
      }
      upstreamOk = upstream.ok && upstreamData?.success;
    } catch {
      /* 上游不可达 / 超时 → 走演示账号 fallback */
    }
  }

  if (upstreamOk) {
    const userId = String(
      upstreamData.data?.id ?? upstreamData.data?.user_id ?? '',
    );
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
