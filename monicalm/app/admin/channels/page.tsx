'use client';

import * as React from 'react';
import { Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ChannelForm } from '@/components/admin/channel-form';
import type { Channel } from '@/types/api';

export default function AdminChannelsPage() {
  const [channels, setChannels] = React.useState<Channel[]>(MOCK_CHANNELS);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Channel | null>(null);

  const upsert = async (data: Omit<Channel, 'id'>) => {
    if (editing) {
      // PATCH /api/admin/channels/:id
      await fetch(`/api/admin/channels/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => null);
      setChannels((p) =>
        p.map((c) => (c.id === editing.id ? { ...c, ...data } : c)),
      );
    } else {
      // POST /api/admin/channels
      const res = await fetch('/api/admin/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).catch(() => null);
      const created = res?.ok ? ((await res.json()) as Channel) : null;
      setChannels((p) => [
        created ?? { id: Date.now(), ...data, key: undefined },
        ...p,
      ]);
    }
    setOpen(false);
    setEditing(null);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-fg">
            管理后台 · 渠道
          </div>
          <h1 className="mt-1 text-2xl font-medium tracking-tight">
            上游渠道
          </h1>
        </div>
        <Dialog
          open={open}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button variant="primary" size="sm">
              <Plus className="h-3.5 w-3.5" /> 新增渠道
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editing ? `编辑 · ${editing.name}` : '新增渠道'}
              </DialogTitle>
            </DialogHeader>
            <ChannelForm
              initial={editing ?? undefined}
              onSubmit={upsert}
              onCancel={() => setOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </header>

      <div className="rounded-2xl hairline bg-surface/60">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>名称</TableHead>
              <TableHead>接入地址</TableHead>
              <TableHead>模型</TableHead>
              <TableHead>权重</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell className="font-mono text-xs text-muted-fg">
                  {c.base_url}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {c.models.slice(0, 3).map((m) => (
                      <Badge key={m} variant="default">
                        {m}
                      </Badge>
                    ))}
                    {c.models.length > 3 && (
                      <Badge variant="outline">+{c.models.length - 3}</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{c.weight}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      c.status === 1
                        ? 'outline'
                        : c.status === 2
                          ? 'default'
                          : 'danger'
                    }
                  >
                    {c.status === 1
                      ? '启用'
                      : c.status === 2
                        ? '已禁用'
                        : '自动禄出'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditing(c);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="h-3 w-3" />
                    编辑
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const MOCK_CHANNELS: Channel[] = [
  {
    id: 1,
    name: 'OpenAI · 主线',
    type: 1,
    base_url: 'https://api.openai.com',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4.1-mini', 'o3', 'o4-mini', 'gpt-4o', 'gpt-4o-mini'],
    weight: 50,
    status: 1,
    rate_limit: 100,
  },
  {
    id: 2,
    name: 'Anthropic',
    type: 14,
    base_url: 'https://api.anthropic.com',
    models: ['claude-opus-4', 'claude-sonnet-4', 'claude-haiku-4', 'claude-3-7-sonnet', 'claude-3-5-sonnet'],
    weight: 35,
    status: 1,
    rate_limit: 60,
  },
  {
    id: 3,
    name: 'Google Gemini',
    type: 24,
    base_url: 'https://generativelanguage.googleapis.com',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'],
    weight: 30,
    status: 1,
    rate_limit: 80,
  },
  {
    id: 4,
    name: 'DeepSeek',
    type: 36,
    base_url: 'https://api.deepseek.com',
    models: ['deepseek-v3', 'deepseek-r1', 'deepseek-chat'],
    weight: 25,
    status: 1,
    rate_limit: 60,
  },
  {
    id: 5,
    name: 'xAI Grok',
    type: 41,
    base_url: 'https://api.x.ai',
    models: ['grok-3', 'grok-3-mini', 'grok-2-vision'],
    weight: 15,
    status: 1,
    rate_limit: 40,
  },
];
