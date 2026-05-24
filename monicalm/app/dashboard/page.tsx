'use client';

import * as React from 'react';
import { QuotaCard } from '@/components/dashboard/quota-card';
import {
  UsageTrendChart,
  ModelShareChart,
} from '@/components/dashboard/usage-charts';
import { ApiKeysTable } from '@/components/dashboard/api-keys-table';
import { PricingGrid } from '@/components/dashboard/pricing-grid';
import { PRICING_CATALOG } from '@/lib/models-catalog';
import type {
  ApiToken,
  ModelShare,
  QuotaSummary,
  UsagePoint,
} from '@/types/api';

/**
 * Token Center — Genspark "high-end report" feel.
 * Hero quota card, two analytic charts, key table, pricing masonry.
 */
export default function DashboardPage() {
  const [tokens, setTokens] = React.useState<ApiToken[]>(MOCK_TOKENS);
  const [summary] = React.useState<QuotaSummary>(MOCK_SUMMARY);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-fg">
            Token 中心
          </div>
          <h1 className="mt-1 text-3xl font-medium tracking-tight">
            额度与用量分析
          </h1>
        </div>
        <div className="hidden text-xs text-muted-fg md:block">
          统计区间 · 最近 14 天
        </div>
      </header>

      <QuotaCard summary={summary} />

      <div className="grid gap-4 lg:grid-cols-2">
        <UsageTrendChart data={MOCK_TREND} />
        <ModelShareChart data={MOCK_SHARE} />
      </div>

      <ApiKeysTable
        tokens={tokens}
        onCreate={async (name, cap) => {
          // BFF call → POST /api/tokens
          const res = await fetch('/api/tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, remain_quota: cap, unlimited_quota: cap === 0 }),
          }).catch(() => null);
          if (res?.ok) {
            const t = (await res.json()) as ApiToken;
            setTokens((p) => [t, ...p]);
          } else {
            // dev fallback
            setTokens((p) => [
              {
                id: Date.now(),
                name,
                key: 'sk-' + crypto.randomUUID().replace(/-/g, '').slice(0, 40),
                remain_quota: cap,
                used_quota: 0,
                unlimited_quota: cap === 0,
                status: 1,
                expired_time: -1,
                created_time: Math.floor(Date.now() / 1000),
              },
              ...p,
            ]);
          }
        }}
        onDelete={async (id) => {
          await fetch(`/api/tokens/${id}`, { method: 'DELETE' }).catch(() => null);
          setTokens((p) => p.filter((t) => t.id !== id));
        }}
      />

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-lg font-medium tracking-tight">价格体系</h2>
          <span className="text-xs text-muted-fg">
            倍率相对于基准额度单位
          </span>
        </div>
        <PricingGrid entries={MOCK_PRICING} />
      </section>
    </div>
  );
}

/* ---------- mock data (replaced by SSR fetch in production) ---------- */

const MOCK_SUMMARY: QuotaSummary = {
  remain_quota: 386_500,
  total_quota: 500_000,
  used_quota: 113_500,
  quota_per_unit: 500_000,
};

const MOCK_TOKENS: ApiToken[] = [
  {
    id: 1,
    name: 'default',
    key: 'sk-prod-abcdef1234567890aaaaaaaaaaaaaaaa1234',
    remain_quota: 0,
    used_quota: 41_200,
    unlimited_quota: true,
    status: 1,
    expired_time: -1,
    created_time: 1714000000,
  },
  {
    id: 2,
    name: 'staging',
    key: 'sk-stg-zyxwvutsrqponmlkjihgfedcba9876543210',
    remain_quota: 80_000,
    used_quota: 12_300,
    unlimited_quota: false,
    status: 1,
    expired_time: -1,
    created_time: 1715200000,
  },
];

const MOCK_TREND: UsagePoint[] = Array.from({ length: 14 }).map((_, i) => ({
  ts: `05-${String(i + 1).padStart(2, '0')}`,
  prompt_tokens: 8000 + Math.round(Math.sin(i / 2) * 2200 + Math.random() * 1500),
  completion_tokens: 4500 + Math.round(Math.cos(i / 3) * 1400 + Math.random() * 1100),
  cost: 0,
}));

const MOCK_SHARE: ModelShare[] = [
  { model: 'gpt-5', tokens: 168_400, cost: 0 },
  { model: 'claude-sonnet-4', tokens: 121_500, cost: 0 },
  { model: 'gemini-2.5-pro', tokens: 84_200, cost: 0 },
  { model: 'deepseek-v3', tokens: 53_700, cost: 0 },
  { model: '其他', tokens: 24_300, cost: 0 },
];

/** 价格目录来自 `lib/models-catalog.ts`,确保全站模型版本一致。 */
const MOCK_PRICING = PRICING_CATALOG;
