'use client';

import * as React from 'react';
import { Check, ChevronDown, Bot, Sparkles } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { AgentOption, ModelOption } from '@/types/chat';

/** Default catalog — overridden by /api/models in production. */
export const DEFAULT_MODELS: ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', description: '多模态、响应快', inputRate: 1, outputRate: 3 },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'openai', description: '低成本、轻量', inputRate: 0.15, outputRate: 0.6 },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'anthropic', description: '推理与代码', inputRate: 3, outputRate: 15 },
  { id: 'claude-3-5-haiku', label: 'Claude 3.5 Haiku', provider: 'anthropic', description: '轻盈快速', inputRate: 0.8, outputRate: 4 },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'google', description: '超长上下文', inputRate: 1.25, outputRate: 5 },
];

export const DEFAULT_AGENTS: AgentOption[] = [
  { id: 'default', name: '普通对话', emoji: '✦', modelId: 'gpt-4o-mini', systemPrompt: '你是一位乐于助人的智能助手。' },
  { id: 'researcher', name: '深度研究员', emoji: '◍', modelId: 'claude-3-5-sonnet', systemPrompt: '你是一名严谨的研究员，请始终标明资料出处。' },
  { id: 'coder', name: '代码评审官', emoji: '◰', modelId: 'gpt-4o', systemPrompt: '你是一名资深工程师，请以代码评审的严谨度提出反馈。' },
];

export function ModelSwitcher({
  models = DEFAULT_MODELS,
  agents = DEFAULT_AGENTS,
  selectedModelId,
  selectedAgentId,
  onSelectModel,
  onSelectAgent,
}: {
  models?: ModelOption[];
  agents?: AgentOption[];
  selectedModelId: string;
  selectedAgentId?: string;
  onSelectModel: (id: string) => void;
  onSelectAgent: (id: string) => void;
}) {
  const current = models.find((m) => m.id === selectedModelId) ?? models[0];
  const currentAgent = agents.find((a) => a.id === selectedAgentId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'inline-flex items-center gap-2 rounded-full hairline bg-surface/80 px-3.5 py-1.5',
            'text-sm hover:bg-surface-2 transition-colors duration-200',
          )}
        >
          {currentAgent ? (
            <span className="text-base leading-none">{currentAgent.emoji}</span>
          ) : (
            <Sparkles className="h-3.5 w-3.5 text-muted-fg" />
          )}
          <span className="font-medium">
            {currentAgent ? currentAgent.name : current.label}
          </span>
          <span className="text-xs text-muted-fg">· {current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-fg" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>智能体</DropdownMenuLabel>
        {agents.map((a) => (
          <DropdownMenuItem
            key={a.id}
            onSelect={() => {
              onSelectAgent(a.id);
              onSelectModel(a.modelId);
            }}
          >
            <span className="text-base leading-none">{a.emoji ?? '◌'}</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{a.name}</div>
              <div className="truncate text-[11px] text-muted-fg">
                使用 {a.modelId}
              </div>
            </div>
            {a.id === selectedAgentId && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>模型</DropdownMenuLabel>
        {models.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onSelect={() => {
              onSelectModel(m.id);
              onSelectAgent('');
            }}
          >
            <Bot className="h-3.5 w-3.5 text-muted-fg" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm">{m.label}</div>
              <div className="truncate text-[11px] text-muted-fg">
                {m.provider} · 输入 {m.inputRate}× / 输出 {m.outputRate}×
              </div>
            </div>
            {m.id === selectedModelId && !selectedAgentId && (
              <Check className="h-3.5 w-3.5" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
