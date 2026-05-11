'use client';

import * as React from 'react';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Channel } from '@/types/api';

/**
 * Channel configuration form — the core "upstream provider" registration UI.
 *
 * Fields:
 *  - name, type (provider id), base_url, key
 *  - models: multi-select tag input
 *  - weight (1–100), rate_limit (req/s)
 *  - status toggle
 *
 * Emits a fully validated `Channel` shape on submit.
 */
const PROVIDER_TYPES = [
  { id: 1, label: 'OpenAI' },
  { id: 14, label: 'Anthropic' },
  { id: 24, label: 'Google Gemini' },
  { id: 28, label: 'Mistral' },
  { id: 36, label: 'DeepSeek' },
  { id: 41, label: 'xAI Grok' },
  { id: 99, label: 'Custom (OpenAI-compatible)' },
];

const COMMON_MODELS = [
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo',
  'claude-3-5-sonnet',
  'claude-3-5-haiku',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'deepseek-chat',
  'grok-2',
];

export interface ChannelFormProps {
  initial?: Partial<Channel>;
  onSubmit: (channel: Omit<Channel, 'id'>) => Promise<void>;
  onCancel?: () => void;
}

export function ChannelForm({ initial, onSubmit, onCancel }: ChannelFormProps) {
  const [name, setName] = React.useState(initial?.name ?? '');
  const [type, setType] = React.useState<number>(initial?.type ?? 1);
  const [baseUrl, setBaseUrl] = React.useState(initial?.base_url ?? '');
  const [key, setKey] = React.useState(initial?.key ?? '');
  const [models, setModels] = React.useState<string[]>(initial?.models ?? []);
  const [weight, setWeight] = React.useState<number>(initial?.weight ?? 10);
  const [rateLimit, setRateLimit] = React.useState<number>(
    initial?.rate_limit ?? 0,
  );
  const [status, setStatus] = React.useState<Channel['status']>(
    initial?.status ?? 1,
  );
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [modelInput, setModelInput] = React.useState('');

  const addModel = (m: string) => {
    const v = m.trim();
    if (!v) return;
    setModels((p) => Array.from(new Set([...p, v])));
    setModelInput('');
  };

  const submit = async () => {
    setErr(null);
    if (!name.trim()) return setErr('请填写渠道名称');
    if (!baseUrl.trim()) return setErr('请填写接入地址');
    if (!key.trim() && !initial?.id) return setErr('请填写渠道密钥');
    if (models.length === 0) return setErr('至少选择一个模型');

    try {
      new URL(baseUrl); // throws if invalid
    } catch {
      return setErr('接入地址必须为有效的 http(s) URL');
    }

    setBusy(true);
    try {
      await onSubmit({
        name: name.trim(),
        type,
        base_url: baseUrl.trim(),
        key: key.trim() || undefined,
        models,
        weight: Math.max(0, Math.min(100, weight)),
        rate_limit: Math.max(0, rateLimit),
        status,
      });
    } catch (e: any) {
      setErr(e?.message ?? '保存渠道失败');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-5"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="渠道名称">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="OpenAI · primary"
          />
        </Field>

        <Field label="提供商类型">
          <select
            value={type}
            onChange={(e) => setType(parseInt(e.target.value, 10))}
            className="h-9 w-full rounded-xl hairline bg-transparent px-3 text-sm outline-none focus:ring-1 focus:ring-fg/30"
          >
            {PROVIDER_TYPES.map((p) => (
              <option key={p.id} value={p.id} className="bg-bg">
                {p.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="接入地址" className="md:col-span-2">
          <Input
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://api.openai.com"
          />
        </Field>

        <Field label="渠道密钥（保密）" className="md:col-span-2">
          <Input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={initial?.id ? '••••••••  (留空表示保持不变)' : 'sk-…'}
          />
        </Field>

        <Field label="权重" hint="数值越高 = 流量越多">
          <Input
            type="number"
            min={0}
            max={100}
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value, 10) || 0)}
          />
        </Field>

        <Field label="限流（次/秒）" hint="0 = 不限制">
          <Input
            type="number"
            min={0}
            value={rateLimit}
            onChange={(e) => setRateLimit(parseInt(e.target.value, 10) || 0)}
          />
        </Field>
      </div>

      {/* Multi-select tag input */}
      <Field label="支持模型" hint="按 Enter 添加">
        <div
          className={cn(
            'min-h-[2.25rem] w-full rounded-xl hairline bg-transparent px-2 py-1.5',
            'flex flex-wrap items-center gap-1.5 focus-within:ring-1 focus-within:ring-fg/30',
          )}
        >
          {models.map((m) => (
            <Badge key={m} variant="default" className="cursor-default">
              {m}
              <button
                type="button"
                onClick={() => setModels((p) => p.filter((x) => x !== m))}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-fg/10"
                aria-label={`移除 ${m}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          <input
            value={modelInput}
            onChange={(e) => setModelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                addModel(modelInput);
              } else if (e.key === 'Backspace' && !modelInput && models.length) {
                setModels((p) => p.slice(0, -1));
              }
            }}
            placeholder={models.length === 0 ? 'gpt-4o, claude-3-5-sonnet…' : ''}
            className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-fg/60"
          />
        </div>
        {/* Quick suggestions */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {COMMON_MODELS.filter((m) => !models.includes(m)).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => addModel(m)}
              className="inline-flex items-center gap-1 rounded-full hairline bg-surface/60 px-2 py-0.5 text-[11px] text-muted-fg hover:bg-muted hover:text-fg"
            >
              <Plus className="h-2.5 w-2.5" />
              {m}
            </button>
          ))}
        </div>
      </Field>

      <Field label="状态">
        <div className="inline-flex items-center gap-2 rounded-full hairline bg-surface/60 p-0.5 text-xs">
          {[
            { v: 1, l: '启用' },
            { v: 2, l: '禁用' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setStatus(o.v as Channel['status'])}
              className={cn(
                'rounded-full px-3 py-1 transition-colors',
                status === o.v
                  ? 'bg-fg text-bg'
                  : 'text-muted-fg hover:text-fg',
              )}
            >
              {o.l}
            </button>
          ))}
        </div>
      </Field>

      {err && (
        <div className="rounded-xl hairline border-danger/40 px-3 py-2 text-xs text-danger">
          {err}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            取消
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? '保存中…' : initial?.id ? '保存修改' : '创建渠道'}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-fg">{label}</span>
        {hint && <span className="text-[10px] text-muted-fg/70">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
