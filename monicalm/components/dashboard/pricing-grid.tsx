'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { PricingEntry } from '@/types/api';

/**
 * Masonry-style pricing card list. No saturated brand color, only typography
 * and hairline borders.
 */
export function PricingGrid({ entries }: { entries: PricingEntry[] }) {
  return (
    <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [column-fill:_balance]">
      {entries.map((e) => (
        <div
          key={e.model}
          className={cn(
            'mb-4 break-inside-avoid rounded-2xl hairline bg-surface/60 p-5',
            'transition-colors hover:bg-surface-2',
          )}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">{e.model}</span>
            <span className="text-[11px] uppercase tracking-wider text-muted-fg">
              {e.provider}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="text-muted-fg">Input</div>
              <div className="mt-1 font-mono text-base text-fg">
                ×{e.input_rate}
              </div>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <div className="text-muted-fg">Output</div>
              <div className="mt-1 font-mono text-base text-fg">
                ×{e.output_rate}
              </div>
            </div>
          </div>

          {(e.context || e.tags?.length) && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {e.context && (
                <span className="rounded-full hairline px-2 py-0.5 text-[10px] text-muted-fg">
                  {e.context}K ctx
                </span>
              )}
              {e.tags?.map((t) => (
                <span
                  key={t}
                  className="rounded-full hairline px-2 py-0.5 text-[10px] text-muted-fg"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
