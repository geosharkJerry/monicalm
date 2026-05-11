'use client';

import * as React from 'react';
import { ShieldCheck, Ban, Wallet } from 'lucide-react';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { formatTokens } from '@/lib/utils';
import type { AdminUser } from '@/types/api';

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  1: 'User',
  10: 'Admin',
  100: 'Root',
};

export function UsersTable({
  users,
  onAdjustQuota,
  onToggleBan,
}: {
  users: AdminUser[];
  onAdjustQuota: (id: number, delta: number) => Promise<void>;
  onToggleBan: (id: number, banned: boolean) => Promise<void>;
}) {
  return (
    <div className="rounded-2xl hairline bg-surface/60">
      <div className="flex items-center justify-between px-5 py-4">
        <div>
          <h3 className="text-sm font-medium">Users</h3>
          <p className="text-xs text-muted-fg">
            Adjust quota, change role, ban abusers.
          </p>
        </div>
        <Input placeholder="Search users…" className="max-w-xs" />
      </div>

      <div className="border-t border-line">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="hidden md:table-cell">Quota</TableHead>
              <TableHead className="hidden md:table-cell">Used</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-full hairline bg-surface-2 text-[11px]">
                      {u.display_name[0]?.toUpperCase() ?? u.username[0]}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm">{u.display_name}</div>
                      <div className="truncate text-[11px] text-muted-fg">
                        @{u.username}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-fg">{u.email}</TableCell>
                <TableCell>
                  <Badge variant={u.role >= 10 ? 'solid' : 'outline'}>
                    {u.role >= 10 && <ShieldCheck className="h-3 w-3" />}
                    {ROLE_LABEL[u.role]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell tabular-nums">
                  {formatTokens(u.quota)}
                </TableCell>
                <TableCell className="hidden md:table-cell tabular-nums text-muted-fg">
                  {formatTokens(u.used_quota)}
                </TableCell>
                <TableCell>
                  <Badge variant={u.status === 1 ? 'outline' : 'danger'}>
                    {u.status === 1 ? 'Active' : 'Banned'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="inline-flex items-center gap-1">
                    <AdjustQuotaDialog
                      user={u}
                      onSubmit={(delta) => onAdjustQuota(u.id, delta)}
                    />
                    <Button
                      variant={u.status === 1 ? 'danger' : 'default'}
                      size="sm"
                      onClick={() => onToggleBan(u.id, u.status === 1)}
                    >
                      <Ban className="h-3 w-3" />
                      {u.status === 1 ? 'Ban' : 'Unban'}
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

function AdjustQuotaDialog({
  user,
  onSubmit,
}: {
  user: AdminUser;
  onSubmit: (delta: number) => Promise<void>;
}) {
  const [delta, setDelta] = React.useState('0');
  const [busy, setBusy] = React.useState(false);
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Wallet className="h-3 w-3" />
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust quota — {user.display_name}</DialogTitle>
        </DialogHeader>
        <label className="text-xs text-muted-fg">
          Delta (positive to grant, negative to deduct)
        </label>
        <Input
          type="number"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
        />
        <div className="text-xs text-muted-fg">
          Current: {formatTokens(user.quota)} credits
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button
            variant="primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSubmit(parseInt(delta, 10) || 0);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'Applying…' : 'Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
