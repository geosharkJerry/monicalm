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
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', description: 'Fast multimodal', inputRate: 1, outputRate: 3 },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'openai', description: 'Cheap & quick', inputRate: 0.15, outputRate: 0.6 },
  { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'anthropic', description: 'Reasoning + code', inputRate: 3, outputRate: 15 },
  { id: 'claude-3-5-haiku', label: 'Claude 3.5 Haiku', provider: 'anthropic', description: 'Light & fast', inputRate: 0.8, outputRate: 4 },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', provider: 'google', description: 'Long-context', inputRate: 1.25, outputRate: 5 },
];

export const DEFAULT_AGENTS: AgentOption[] = [
  { id: 'default', name: 'Plain chat', emoji: '✦', modelId: 'gpt-4o-mini', systemPrompt: 'You are a helpful assistant.' },
  { id: 'researcher', name: 'Deep researcher', emoji: '◍', modelId: 'claude-3-5-sonnet', systemPrompt: 'You are a meticulous researcher. Cite sources.' },
  { id: 'coder', name: 'Code reviewer', emoji: '◰', modelId: 'gpt-4o', systemPrompt: 'You are a senior engineer. Give code-review-grade feedback.' },
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
        <DropdownMenuLabel>Agents</DropdownMenuLabel>
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
                via {a.modelId}
              </div>
            </div>
            {a.id === selectedAgentId && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Models</DropdownMenuLabel>
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
                {m.provider} · in {m.inputRate}× / out {m.outputRate}×
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
