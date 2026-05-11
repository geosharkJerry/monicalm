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
  1: '普通用户',
  10: '管理员',
  100: '超级管理员',
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
          <h3 className="text-sm font-medium">用户</h3>
          <p className="text-xs text-muted-fg">
            调整额度、修改角色、封禁违规账号。
          </p>
        </div>
        <Input placeholder="搜索用户…" className="max-w-xs" />
      </div>

      <div className="border-t border-line">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead className="hidden md:table-cell">额度</TableHead>
              <TableHead className="hidden md:table-cell">已用</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
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
                    {u.status === 1 ? '正常' : '已封禁'}
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
                      {u.status === 1 ? '封禁' : '解封'}
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
          调整
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>调整额度 — {user.display_name}</DialogTitle>
        </DialogHeader>
        <label className="text-xs text-muted-fg">
          增减量（正数为发放，负数为扣除）
        </label>
        <Input
          type="number"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
        />
        <div className="text-xs text-muted-fg">
          当前额度：{formatTokens(user.quota)}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">取消</Button>
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
            {busy ? '提交中…' : '提交'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
