'use client';

import * as React from 'react';
import { Copy, Trash2, Plus, Check } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { maskKey, formatTokens } from '@/lib/utils';
import type { ApiToken } from '@/types/api';

/**
 * Minimalist API key management surface.
 * Create / copy (masked) / set per-key quota cap / delete.
 */
export function ApiKeysTable({
  tokens,
  onCreate,
  onDelete,
}: {
  tokens: ApiToken[];
  onCreate: (name: string, cap: number) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [copied, setCopied] = React.useState<number | null>(null);

  return (
    <div className="rounded-2xl hairline bg-surface/60">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-sm font-medium">API 密钥</h3>
          <p className="text-xs text-muted-fg">
            用于你的应用与 SDK，密钥仅在当前账户下生效。
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> 新建密钥
            </Button>
          </DialogTrigger>
          <CreateTokenDialog
            onCreate={async (n, c) => {
              await onCreate(n, c);
              setOpen(false);
            }}
          />
        </Dialog>
      </div>

      <div className="border-t border-line">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>密钥</TableHead>
              <TableHead className="hidden md:table-cell">已用</TableHead>
              <TableHead className="hidden md:table-cell">上限</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-fg">
                  还没有密钥 —— 创建你的第一个吧。
                </TableCell>
              </TableRow>
            )}
            {tokens.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="font-mono text-xs">
                  <span className="text-muted-fg">{maskKey(t.key)}</span>
                </TableCell>
                <TableCell className="hidden md:table-cell tabular-nums text-muted-fg">
                  {formatTokens(t.used_quota)}
                </TableCell>
                <TableCell className="hidden md:table-cell tabular-nums text-muted-fg">
                  {t.unlimited_quota ? '∞' : formatTokens(t.remain_quota)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      t.status === 1
                        ? 'outline'
                        : t.status === 2
                          ? 'default'
                          : 'danger'
                    }
                  >
                    {t.status === 1 ? '启用' : t.status === 2 ? '已禁用' : '已过期'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(t.key);
                        setCopied(t.id);
                        setTimeout(() => setCopied(null), 1200);
                      }}
                      aria-label="复制"
                    >
                      {copied === t.id ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(t.id)}
                      aria-label="删除"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function CreateTokenDialog({
  onCreate,
}: {
  onCreate: (name: string, cap: number) => Promise<void>;
}) {
  const [name, setName] = React.useState('');
  const [cap, setCap] = React.useState('0');
  const [busy, setBusy] = React.useState(false);
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>创建 API 密钥</DialogTitle>
      </DialogHeader>
      <label className="text-xs text-muted-fg">名称</label>
      <Input
        autoFocus
        placeholder="my-app-production"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="text-xs text-muted-fg">额度上限（0 = 不限）</label>
      <Input
        type="number"
        value={cap}
        onChange={(e) => setCap(e.target.value)}
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">取消</Button>
        </DialogClose>
        <Button
          variant="primary"
          disabled={!name || busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onCreate(name, parseInt(cap, 10) || 0);
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? '创建中…' : '创建密钥'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
