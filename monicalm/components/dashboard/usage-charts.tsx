'use client';

import * as React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ModelShare, UsagePoint } from '@/types/api';

/**
 * Genspark-style chart aesthetics:
 *  - No grid background, only the line / arcs.
 *  - Hairline tooltip card, no shadow, monospaced numbers.
 *  - Curves are `monotone` for soft, organic motion.
 */
const PIE_SHADES = [
  'hsl(0 0% 92%)',
  'hsl(0 0% 78%)',
  'hsl(0 0% 62%)',
  'hsl(0 0% 46%)',
  'hsl(0 0% 30%)',
];

function MinimalTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl hairline bg-surface/95 px-3 py-2 text-xs backdrop-blur-md">
      <div className="mb-1 text-muted-fg">{label ?? payload[0].name}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-3">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: p.color }}
          />
          <span className="text-muted-fg">{p.dataKey ?? p.name}</span>
          <span className="ml-auto font-mono">{p.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

export function UsageTrendChart({ data }: { data: UsagePoint[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Token consumption</CardTitle>
        <div className="text-xs text-muted-fg">Daily prompt vs. completion</div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="transparent" />
              <XAxis
                dataKey="ts"
                stroke="hsl(var(--muted-fg))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-fg))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip content={<MinimalTooltip />} cursor={{ stroke: 'hsl(var(--line))' }} />
              <Line
                type="monotone"
                dataKey="prompt_tokens"
                stroke="hsl(var(--fg))"
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="completion_tokens"
                stroke="hsl(var(--muted-fg))"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ModelShareChart({ data }: { data: ModelShare[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Model mix</CardTitle>
        <div className="text-xs text-muted-fg">By total tokens</div>
      </CardHeader>
      <CardContent>
        <div className="flex h-64 w-full items-center">
          <div className="h-full flex-1">
            <ResponsiveContainer>
              <PieChart>
                <Tooltip content={<MinimalTooltip />} />
                <Pie
                  data={data}
                  dataKey="tokens"
                  nameKey="model"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  stroke="hsl(var(--bg))"
                  strokeWidth={1}
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={PIE_SHADES[i % PIE_SHADES.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="flex w-44 flex-col gap-1.5 text-xs">
            {data.map((d, i) => (
              <li key={d.model} className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: PIE_SHADES[i % PIE_SHADES.length] }}
                />
                <span className="truncate">{d.model}</span>
                <span className="ml-auto font-mono text-muted-fg">
                  {d.tokens.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
