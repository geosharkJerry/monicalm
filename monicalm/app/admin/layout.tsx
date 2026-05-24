'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Plug, TicketPercent, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

const ADMIN_NAV = [
  { href: '/admin/users', icon: Users, label: '用户管理' },
  { href: '/admin/channels', icon: Plug, label: '渠道管理' },
  { href: '/admin/redeem', icon: TicketPercent, label: '兑换码' },
  { href: '/admin/logs', icon: ScrollText, label: '日志' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-8">
      <aside className="sticky top-20 h-fit w-56 shrink-0">
        <div className="mb-3 px-2 text-xs uppercase tracking-wider text-muted-fg">
          管理后台
        </div>
        <ul className="flex flex-col gap-0.5">
          {ADMIN_NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex h-9 items-center gap-3 rounded-xl px-2.5 text-sm transition-colors',
                    active
                      ? 'bg-muted text-fg'
                      : 'text-muted-fg hover:bg-muted/60 hover:text-fg',
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
