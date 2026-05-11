'use client';

import * as React from 'react';
import { Download, Sparkles, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  generateRedeemCodes,
  downloadCSV,
  type GeneratedCode,
} from '@/lib/redeem';

/**
 * Admin · batch generate redeem codes → preview → CSV export.
 * Generation happens locally (offline-safe) but a final POST persists the
 * batch to the new-api backend.
 */
export default function AdminRedeemPage() {
  const [count, setCount] = React.useState('100');
  const [quota, setQuota] = React.useState('50000');
  const [prefix, setPrefix] = React.useState('MONICA');
  const [expiresDays, setExpiresDays] = React.useState('30');
  const [rows, setRows] = React.useState<GeneratedCode[]>([]);
  const [err, setErr] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [persisted, setPersisted] = React.useState<number | null>(null);

  const handleGenerate = () => {
    setErr(null);
    setPersisted(null);
    try {
      const n = parseInt(count, 10);
      const q = parseInt(quota, 10);
      const d = parseInt(expiresDays, 10) || 0;
      const expires_at =
        d > 0 ? Math.floor(Date.now() / 1000) + d * 86400 : undefined;
      const generated = generateRedeemCodes({
        count: n,
        quota: q,
        prefix: prefix.trim() || 'MONICA',
        expires_at,
      });
      setRows(generated);
    } catch (e: any) {
      setErr(e?.message ?? 'Generation failed');
    }
  };

  const persistToBackend = async () => {
    if (rows.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/redeem-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codes: rows }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setPersisted(rows.length);
    } catch (e: any) {
      setErr(e?.message ?? 'Persist failed');
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    await navigator.clipboard.writeText(rows.map((r) => r.code).join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-wider text-muted-fg">
          Admin · Redeem codes
        </div>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">
          Batch generate
        </h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        {/* Generator form */}
        <Card>
          <CardHeader>
            <CardTitle>Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Count">
              <Input
                type="number"
                min={1}
                max={10000}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </Field>
            <Field label="Quota per code (credits)">
              <Input
                type="number"
                min={1}
                value={quota}
                onChange={(e) => setQuota(e.target.value)}
              />
            </Field>
            <Field label="Prefix">
              <Input
                maxLength={12}
                value={prefix}
                onChange={(e) =>
                  setPrefix(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))
                }
              />
            </Field>
            <Field label="Expires in (days, 0 = never)">
              <Input
                type="number"
                min={0}
                value={expiresDays}
                onChange={(e) => setExpiresDays(e.target.value)}
              />
            </Field>

            {err && (
              <div className="rounded-xl hairline border-danger/40 px-3 py-2 text-xs text-danger">
                {err}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button variant="primary" onClick={handleGenerate}>
                <Sparkles className="h-3.5 w-3.5" />
                Generate
              </Button>
              {rows.length > 0 && (
                <Button
                  variant="default"
                  onClick={persistToBackend}
                  disabled={busy}
                >
                  {busy ? 'Saving…' : 'Save to server'}
                </Button>
              )}
            </div>
            {persisted !== null && (
              <div className="text-xs text-muted-fg">
                ✓ Saved {persisted} codes to backend
              </div>
            )}
          </CardContent>
        </Card>

        {/* Preview + export */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Preview</CardTitle>
              <div className="text-xs text-muted-fg">
                {rows.length === 0
                  ? 'No codes generated yet'
                  : `${rows.length.toLocaleString()} codes`}
              </div>
            </div>
            {rows.length > 0 && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={copyAll}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy all'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() =>
                    downloadCSV(rows, `monicalm-redeem-${Date.now()}.csv`)
                  }
                >
                  <Download className="h-3.5 w-3.5" />
                  Export CSV
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="max-h-[480px] overflow-y-auto rounded-xl hairline bg-bg/40">
              {rows.length === 0 ? (
                <div className="grid h-40 place-items-center text-xs text-muted-fg">
                  Configure on the left, then press Generate.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface/95 backdrop-blur-md">
                    <tr className="text-[11px] uppercase tracking-wider text-muted-fg">
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Code</th>
                      <th className="px-4 py-2 text-left">Quota</th>
                      <th className="px-4 py-2 text-left">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 200).map((r, i) => (
                      <tr key={r.code} className="border-t border-line">
                        <td className="px-4 py-1.5 text-xs text-muted-fg tabular-nums">
                          {i + 1}
                        </td>
                        <td className="px-4 py-1.5 font-mono text-xs">{r.code}</td>
                        <td className="px-4 py-1.5 tabular-nums">{r.quota}</td>
                        <td className="px-4 py-1.5 text-xs text-muted-fg">
                          {r.expires_at
                            ? new Date(r.expires_at * 1000).toLocaleDateString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                    {rows.length > 200 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="border-t border-line px-4 py-2 text-center text-xs text-muted-fg"
                        >
                          … {(rows.length - 200).toLocaleString()} more in the
                          CSV export.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-fg">{label}</span>
      {children}
    </label>
  );
}
