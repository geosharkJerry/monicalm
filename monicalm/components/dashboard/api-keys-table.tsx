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
          <h3 className="text-sm font-medium">API tokens</h3>
          <p className="text-xs text-muted-fg">
            Use these in your apps and SDKs. Tokens are scoped to your account.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> New token
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
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead className="hidden md:table-cell">Used</TableHead>
              <TableHead className="hidden md:table-cell">Cap</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-fg">
                  No tokens yet — create your first one.
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
                    {t.status === 1 ? 'Active' : t.status === 2 ? 'Disabled' : 'Expired'}
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
                      aria-label="Copy"
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
                      aria-label="Delete"
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
        <DialogTitle>Create API token</DialogTitle>
      </DialogHeader>
      <label className="text-xs text-muted-fg">Name</label>
      <Input
        autoFocus
        placeholder="my-app-production"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <label className="text-xs text-muted-fg">Quota cap (0 = unlimited)</label>
      <Input
        type="number"
        value={cap}
        onChange={(e) => setCap(e.target.value)}
      />
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="ghost">Cancel</Button>
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
          {busy ? 'Creating…' : 'Create token'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
