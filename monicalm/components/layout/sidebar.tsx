'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Compass,
  MessageSquareText,
  Bot,
  KeyRound,
  Settings,
  PanelLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Left rail navigation.
 * Genspark feel: ultra-minimal icon + label, hairline divider, smooth collapse.
 */
const NAV = [
  { href: '/explore', icon: Compass, label: '探索' },
  { href: '/chat', icon: MessageSquareText, label: '对话' },
  { href: '/agents', icon: Bot, label: '我的智能体' },
  { href: '/dashboard', icon: KeyRound, label: 'Token 中心' },
  { href: '/settings', icon: Settings, label: '设置' },
];

export function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="sticky top-0 z-30 hidden h-dvh shrink-0 border-r border-line bg-surface/60 backdrop-blur-md md:flex md:flex-col"
    >
      {/* Brand */}
      <div className="flex h-14 items-center gap-2 px-4">
        <div className="h-7 w-7 rounded-lg bg-fg text-bg grid place-items-center text-[11px] font-semibold tracking-tight">
          m
        </div>
        {!collapsed && (
          <span className="text-sm font-medium tracking-tight">monicalm</span>
        )}
        <button
          onClick={onToggle}
          aria-label="切换侧边栏"
          className={cn(
            'ml-auto rounded-md p-1.5 text-muted-fg hover:bg-muted hover:text-fg transition-colors',
            collapsed && 'ml-0 mx-auto',
          )}
        >
          <PanelLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="h-px bg-line" />

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="flex flex-col gap-0.5 px-2">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'group relative flex h-9 items-center gap-3 rounded-xl px-2.5 text-sm',
                    'transition-colors duration-200 ease-spring',
                    active
                      ? 'bg-muted text-fg'
                      : 'text-muted-fg hover:bg-muted/60 hover:text-fg',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-[18px] w-[18px] shrink-0',
                      active ? 'text-fg' : 'text-muted-fg group-hover:text-fg',
                    )}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                  {active && !collapsed && (
                    <motion.span
                      layoutId="nav-active"
                      className="ml-auto h-1.5 w-1.5 rounded-full bg-fg"
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-line p-3">
        <div
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-2 py-1.5',
            !collapsed && 'hover:bg-muted/60',
          )}
        >
          <div className="h-7 w-7 rounded-full hairline bg-surface-2" />
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-xs font-medium">访客</div>
              <div className="truncate text-[11px] text-muted-fg">免费版</div>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
