'use client';

import * as React from 'react';
import Link from 'next/link';
import { Search, Sun, Moon, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { BrandMark } from '@/components/brand/logo';

/**
 * Glass top bar — `backdrop-blur` over translucent surface.
 * Houses: breadcrumb / search, theme toggle, right-panel toggle.
 */
export function TopBar({
  onToggleRight,
  theme,
  onToggleTheme,
  title,
}: {
  onToggleRight: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  title?: string;
}) {
  return (
    <header
      className={cn(
        'sticky top-0 z-20 flex h-14 items-center gap-3 px-5',
        'glass',
      )}
    >
      <Link
        href="/"
        aria-label="monicalm 首页"
        className="flex items-center gap-2 text-sm transition-opacity hover:opacity-80 md:hidden"
        style={{ ['--brand-mark-cut' as any]: 'var(--bg, #0a0a0a)' }}
      >
        <span className="grid h-6 w-6 place-items-center rounded-md bg-fg text-bg">
          <BrandMark className="h-3.5 w-3.5" />
        </span>
        <span className="font-medium tracking-tight">monicalm</span>
      </Link>
      <div className="hidden items-center gap-2 text-sm md:flex">
        <span className="text-muted-fg">monicalm</span>
        {title && (
          <>
            <span className="text-muted-fg/50">/</span>
            <span className="font-medium">{title}</span>
          </>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-md items-center gap-2 rounded-full hairline bg-surface/60 px-3 py-1.5 text-sm text-muted-fg">
        <Search className="h-3.5 w-3.5" />
        <input
          className="w-full bg-transparent outline-none placeholder:text-muted-fg/60"
          placeholder="提问、运行智能体或跳转至…"
        />
        <kbd className="hairline rounded-md px-1.5 py-0.5 text-[10px] text-muted-fg">⌘K</kbd>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleTheme}
        aria-label="切换主题"
      >
        {theme === 'dark' ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleRight}
        aria-label="切换右侧面板"
      >
        <PanelRight className="h-4 w-4" />
      </Button>
    </header>
  );
}
