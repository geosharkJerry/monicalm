'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Minimal sign-in screen.
 * Posts to `/api/auth/login` which mints the `monicalm_session` JWT cookie.
 *
 * `useSearchParams()` requires a Suspense boundary when statically rendered
 * (Next.js 14+), so the form is wrapped in <Suspense> below.
 */
export default function LoginPage() {
  return (
    <React.Suspense fallback={<LoginSkeleton />}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/chat';
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message ?? '用户名或密码错误');
      }
      router.replace(next);
    } catch (e: any) {
      setErr(e?.message ?? '登录失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-5 rounded-2xl hairline bg-surface/70 p-8 shadow-glass animate-fade-in"
      >
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-fg">
            monicalm
          </div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">
            登录以继续
          </h1>
          <p className="mt-2 text-xs text-muted-fg">
            默认管理员：<span className="font-mono">admin</span> / <span className="font-mono">monicalm@2026</span>
          </p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-fg">用户名</span>
          <Input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-fg">密码</span>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {err && (
          <div className="rounded-xl hairline border-danger/40 px-3 py-2 text-xs text-danger">
            {err}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          type="submit"
          disabled={busy}
          className="w-full"
        >
          {busy ? '登录中…' : '登录'}
        </Button>
      </form>
    </div>
  );
}

function LoginSkeleton() {
  return (
    <div className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm space-y-5 rounded-2xl hairline bg-surface/70 p-8 shadow-glass">
        <div className="h-3 w-16 rounded bg-muted" />
        <div className="h-6 w-40 rounded bg-muted" />
        <div className="h-9 rounded-xl bg-muted/60" />
        <div className="h-9 rounded-xl bg-muted/60" />
        <div className="h-10 rounded-full bg-muted/60" />
      </div>
    </div>
  );
}
