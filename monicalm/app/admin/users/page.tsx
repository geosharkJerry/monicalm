'use client';

import * as React from 'react';
import { UsersTable } from '@/components/admin/users-table';
import type { AdminUser } from '@/types/api';

export default function AdminUsersPage() {
  const [users, setUsers] = React.useState<AdminUser[]>(MOCK_USERS);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-wider text-muted-fg">
          管理后台 · 用户
        </div>
        <h1 className="mt-1 text-2xl font-medium tracking-tight">
          用户管理
        </h1>
      </header>

      <UsersTable
        users={users}
        onAdjustQuota={async (id, delta) => {
          await fetch(`/api/admin/users/${id}/quota`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ delta }),
          }).catch(() => null);
          setUsers((p) =>
            p.map((u) => (u.id === id ? { ...u, quota: u.quota + delta } : u)),
          );
        }}
        onToggleBan={async (id, banned) => {
          await fetch(`/api/admin/users/${id}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: banned ? 2 : 1 }),
          }).catch(() => null);
          setUsers((p) =>
            p.map((u) =>
              u.id === id ? { ...u, status: banned ? 2 : 1 } : u,
            ),
          );
        }}
      />
    </div>
  );
}

const MOCK_USERS: AdminUser[] = [
  {
    id: 1,
    username: 'alice',
    display_name: 'Alice Chen',
    email: 'alice@example.com',
    role: 10,
    status: 1,
    quota: 500_000,
    used_quota: 132_400,
    created_time: 1710000000,
  },
  {
    id: 2,
    username: 'bob',
    display_name: 'Bob Smith',
    email: 'bob@example.com',
    role: 1,
    status: 1,
    quota: 100_000,
    used_quota: 14_200,
    created_time: 1712000000,
  },
  {
    id: 3,
    username: 'carl',
    display_name: 'Carl Diaz',
    email: 'carl@example.com',
    role: 1,
    status: 2,
    quota: 50_000,
    used_quota: 49_900,
    created_time: 1714000000,
  },
];
