'use client';

/**
 * /agents —— Agent App 市集
 *
 *  设计参考 Genspark 的「超级智能体 + 多 AI 应用」首页:
 *    - 顶部 hero (slogan + 搜索)
 *    - 明星应用 hero 行
 *    - 分类筛选 chips
 *    - 自适应卡片网格
 *    - 卡片为「细线 + 玻璃」无饱和度风格,符合 monicalm 视觉规范
 *
 *  点击任意卡片 → 跳转 `/chat?app=<id>`,由对话页加载预设 prompt + 推荐模型 + starters。
 */

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Sparkles, ArrowUpRight, Hash } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import {
  AGENT_APPS,
  AGENT_CATEGORIES,
  modelLabelOf,
  type AgentApp,
  type AgentAppCategory,
} from '@/lib/agent-apps';
import { cn } from '@/lib/utils';

type CategoryFilter = 'all' | AgentAppCategory;

export default function AgentsPage() {
  const [q, setQ] = React.useState('');
  const [cat, setCat] = React.useState<CategoryFilter>('all');

  const filtered = React.useMemo(() => {
    const kw = q.trim().toLowerCase();
    return AGENT_APPS.filter((a) => {
      if (cat !== 'all' && a.category !== cat) return false;
      if (!kw) return true;
      return (
        a.name.toLowerCase().includes(kw) ||
        a.tagline.toLowerCase().includes(kw) ||
        a.description.toLowerCase().includes(kw) ||
        a.capabilities.some((c) => c.toLowerCase().includes(kw))
      );
    });
  }, [q, cat]);

  const featured = React.useMemo(
    () => AGENT_APPS.filter((a) => a.featured),
    [],
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-6 pb-24 pt-8 sm:pt-12">
      {/* Hero */}
      <header className="text-center">
        <span className="hairline inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-3 py-1 text-xs text-muted-fg">
          <Sparkles className="h-3 w-3" />
          全部应用 · {AGENT_APPS.length} 个
        </span>
        <h1 className="mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
          一个工作台,所有 AI 应用
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-fg">
          挑一个智能体,点开即用。每个应用都自带专属系统提示词与推荐模型,
          无需重复配置 —— 让 AI 走进每一个具体场景。
        </p>

        {/* Search */}
        <div className="mx-auto mt-7 flex max-w-xl items-center gap-2 rounded-full hairline bg-surface/70 px-4 py-2 backdrop-blur-md">
          <Search className="h-4 w-4 text-muted-fg" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索智能体、能力或关键词…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-fg/70"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="text-xs text-muted-fg hover:text-fg"
            >
              清除
            </button>
          )}
        </div>
      </header>

      {/* Featured row — only show if no search / all category */}
      {!q && cat === 'all' && featured.length > 0 && (
        <section className="mt-10">
          <SectionLabel>明星应用</SectionLabel>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((app) => (
              <FeaturedCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      )}

      {/* Category chips */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryChip
            active={cat === 'all'}
            onClick={() => setCat('all')}
            label="全部"
            count={AGENT_APPS.length}
          />
          {AGENT_CATEGORIES.map((c) => {
            const count = AGENT_APPS.filter((a) => a.category === c.id).length;
            if (count === 0) return null;
            return (
              <CategoryChip
                key={c.id}
                active={cat === c.id}
                onClick={() => setCat(c.id)}
                label={c.label}
                count={count}
              />
            );
          })}
        </div>
      </section>

      {/* Grid */}
      <section className="mt-6">
        {filtered.length === 0 ? (
          <div className="hairline mx-auto mt-12 max-w-md rounded-2xl bg-surface/60 px-6 py-10 text-center text-sm text-muted-fg">
            没有匹配的应用 —— 换个关键词试试?
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((app, idx) => (
              <AppCard key={app.id} app={app} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* Footer hint */}
      <footer className="mt-16 border-t border-line pt-6 text-center text-xs text-muted-fg">
        想把自己的 prompt 沉淀为一个应用？很快支持「我的智能体」自助创建。
      </footer>
    </div>
  );
}

/* ============================================================ *
 *  子组件                                                       *
 * ============================================================ */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-fg">
      <span className="h-px w-4 bg-line" />
      {children}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs transition-colors hairline',
        active
          ? 'bg-fg text-bg border-transparent'
          : 'bg-surface/60 text-muted-fg hover:bg-surface-2 hover:text-fg',
      )}
    >
      <span>{label}</span>
      <span
        className={cn(
          'rounded-full px-1.5 text-[10px]',
          active ? 'bg-bg/20 text-bg' : 'bg-muted text-muted-fg',
        )}
      >
        {count}
      </span>
    </button>
  );
}

/**
 * 按名字从 Lucide 取图标。
 * 找不到时回退为 Sparkles。
 */
function AppIcon({ name, className }: { name: string; className?: string }) {
  const Cmp =
    (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[name] ??
    LucideIcons.Sparkles;
  return <Cmp className={className} />;
}

function FeaturedCard({ app }: { app: AgentApp }) {
  return (
    <Link href={`/chat?app=${app.id}`} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          'relative h-full overflow-hidden rounded-2xl hairline bg-surface/80 p-5 backdrop-blur-md',
          'transition-all duration-200 hover:bg-surface-2 hover:shadow-glass',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl hairline bg-bg">
            <AppIcon name={app.icon} className="h-5 w-5 text-fg" />
          </div>
          <span className="hairline rounded-full bg-bg/60 px-2 py-0.5 text-[10px] tracking-wider text-muted-fg">
            FEATURED
          </span>
        </div>

        <h3 className="mt-4 text-base font-medium tracking-tight">
          {app.name}
        </h3>
        <p className="mt-1 text-sm text-muted-fg line-clamp-2">{app.tagline}</p>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-fg">
          <span className="inline-flex items-center gap-1">
            <Hash className="h-3 w-3" />
            {modelLabelOf(app)}
          </span>
          <span className="inline-flex items-center gap-1 text-fg opacity-0 transition-opacity group-hover:opacity-100">
            进入 <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}

function AppCard({ app, index }: { app: AgentApp; index: number }) {
  return (
    <Link href={`/chat?app=${app.id}`} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
        className={cn(
          'relative h-full rounded-2xl hairline bg-surface/60 p-5',
          'transition-all duration-200 hover:bg-surface-2 hover:shadow-glass',
        )}
      >
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl hairline bg-bg">
            <AppIcon name={app.icon} className="h-4 w-4 text-fg" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate text-sm font-medium tracking-tight">
                {app.name}
              </h3>
              {app.beta && (
                <span className="hairline rounded-full px-1.5 text-[9px] tracking-wider text-muted-fg">
                  BETA
                </span>
              )}
              {app.featured && (
                <span className="hairline rounded-full px-1.5 text-[9px] tracking-wider text-muted-fg">
                  ★
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-fg line-clamp-2">
              {app.tagline}
            </p>
          </div>
        </div>

        {/* Capabilities */}
        <div className="mt-3 flex flex-wrap gap-1">
          {app.capabilities.slice(0, 3).map((c) => (
            <span
              key={c}
              className="hairline rounded-full bg-bg/60 px-2 py-0.5 text-[10px] text-muted-fg"
            >
              {c}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[11px] text-muted-fg">
          <span className="inline-flex items-center gap-1 truncate">
            <Hash className="h-3 w-3 shrink-0" />
            <span className="truncate">{modelLabelOf(app)}</span>
          </span>
          <span className="inline-flex items-center gap-0.5 text-fg opacity-0 transition-opacity group-hover:opacity-100">
            打开 <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </motion.div>
    </Link>
  );
}
