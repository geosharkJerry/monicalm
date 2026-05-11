'use client';

import * as React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { TopBar } from './topbar';
import { RightPanel, ModelParamPanel } from './right-panel';

/**
 * Application shell: left nav + top bar + main content + slide-in right panel.
 * Manages collapse state, theme, and page-transition animations.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const [rightOpen, setRightOpen] = React.useState(false);
  const [theme, setTheme] = React.useState<'light' | 'dark'>('dark');
  const pathname = usePathname();

  // Apply theme class to <html>
  React.useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }, [theme]);

  // Derive a readable title from the current path
  const title = React.useMemo(() => {
    const seg = pathname.split('/').filter(Boolean)[0];
    if (!seg) return undefined;
    const TITLE_MAP: Record<string, string> = {
      explore: '探索',
      chat: '对话',
      agents: '我的智能体',
      dashboard: 'Token 中心',
      settings: '设置',
      admin: '管理后台',
      login: '登录',
    };
    return TITLE_MAP[seg] ?? seg[0].toUpperCase() + seg.slice(1);
  }, [pathname]);

  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          theme={theme}
          onToggleTheme={() =>
            setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
          }
          onToggleRight={() => setRightOpen((o) => !o)}
        />

        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>

      <RightPanel
        open={rightOpen}
        onClose={() => setRightOpen(false)}
        title="模型参数"
      >
        <ModelParamPanel />
      </RightPanel>
    </div>
  );
}
