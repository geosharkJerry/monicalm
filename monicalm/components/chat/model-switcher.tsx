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
import {
  DEFAULT_MODELS as CATALOG_MODELS,
  DEFAULT_AGENTS as CATALOG_AGENTS,
} from '@/lib/models-catalog';

/** Default catalog — 单一来源:`lib/models-catalog.ts`,集中管理所有最新模型版本。 */
export const DEFAULT_MODELS: ModelOption[] = CATALOG_MODELS;
export const DEFAULT_AGENTS: AgentOption[] = CATALOG_AGENTS;

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
