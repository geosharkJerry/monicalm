'use client';

import * as React from 'react';
import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { debounce, formatTokens } from '@/lib/utils';
import type { QuotaSummary, RedeemResult } from '@/types/api';

/**
 * Top-of-dashboard quota hero card with a Genspark-style oversized number
 * and a Redeem-code dialog (debounced submit).
 */
export function QuotaCard({ summary }: { summary: QuotaSummary }) {
  const usd = (summary.remain_quota / summary.quota_per_unit).toFixed(2);
  const pct = Math.min(
    100,
    Math.round((summary.used_quota / Math.max(1, summary.total_quota)) * 100),
  );

  return (
    <div className="relative overflow-hidden rounded-2xl hairline bg-surface/70 p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-fg">
            剩余额度
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-5xl font-medium tracking-tight tabular-nums">
              ${usd}
            </span>
            <span className="text-sm text-muted-fg">
              · {formatTokens(summary.remain_quota)} 额度
            </span>
          </div>
          <div className="mt-1 text-xs text-muted-fg">
            本周期已消耗总额度的 {pct}%
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RedeemDialog />
          <Button variant="primary">充值</Button>
        </div>
      </div>

      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-fg transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RedeemDialog() {
  const [code, setCode] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [result, setResult] = React.useState<RedeemResult | null>(null);

  const submit = React.useMemo(
    () =>
      debounce(async (val: string) => {
        if (!val) return;
        setSubmitting(true);
        try {
          const res = await fetch('/api/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: val }),
          });
          const data = (await res.json()) as RedeemResult;
          setResult(data);
        } catch (e: any) {
          setResult({ success: false, message: e?.message ?? '网络异常' });
        } finally {
          setSubmitting(false);
        }
      }, 300),
    [],
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">
          <Gift className="h-4 w-4" />
          兑换码
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>兑换额度码</DialogTitle>
          <DialogDescription>
            请粘贴下方的兑换码，额度将发放到当前账户。
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="MONICA-XXXX-XXXX"
          value={code}
          onChange={(e) => setCode(e.target.value.trim())}
        />
        {result && (
          <div
            className={
              'rounded-xl hairline px-3 py-2 text-xs ' +
              (result.success
                ? 'border-fg/30 text-fg'
                : 'border-danger/30 text-danger')
            }
          >
            {result.message}
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">取消</Button>
          </DialogClose>
          <Button
            variant="primary"
            disabled={!code || submitting}
            onClick={() => submit(code)}
          >
            {submitting ? '验证中…' : '兑换'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
