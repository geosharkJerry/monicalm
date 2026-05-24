'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as LucideIcons from 'lucide-react';
import { ChatInput } from '@/components/chat/chat-input';
import { MessageBubble } from '@/components/chat/message-bubble';
import { useChatStream } from '@/hooks/use-chat-stream';
import { DEFAULT_AGENTS, DEFAULT_MODELS } from '@/components/chat/model-switcher';
import { findAgentApp, type AgentApp } from '@/lib/agent-apps';
import type { Attachment, ChatMessage } from '@/types/chat';

/**
 * AI Agent Workbench — main streaming chat surface.
 *
 *  支持 `?app=<id>` 入口:
 *    - 来自 /agents 市集的卡片点击会带上 query;
 *    - 进入后自动加载该 App 的 system prompt、推荐模型与 starters;
 *    - 用户后续仍可自由切换模型 / 智能体。
 */
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatSkeleton />}>
      <ChatInner />
    </Suspense>
  );
}

function ChatInner() {
  const router = useRouter();
  const search = useSearchParams();
  const appId = search.get('app') || '';
  const activeApp: AgentApp | undefined = appId
    ? findAgentApp(appId)
    : undefined;

  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState('');
  const [modelId, setModelId] = React.useState(
    activeApp?.recommendedModelId || DEFAULT_MODELS[0].id,
  );
  const [agentId, setAgentId] = React.useState<string>(activeApp?.id || '');
  const stream = useChatStream();
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  // 当 URL 中的 app 参数变化时,自动同步模型与智能体
  React.useEffect(() => {
    if (activeApp) {
      setModelId(activeApp.recommendedModelId);
      setAgentId(activeApp.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId]);

  // Auto-scroll on new tokens
  React.useEffect(() => {
    scrollerRef.current?.scrollTo({
      top: scrollerRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, stream.partial]);

  const submit = async (text: string, attachments: Attachment[]) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      attachments,
      createdAt: new Date().toISOString(),
    };
    const assistantId = crypto.randomUUID();
    const placeholder: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      pending: true,
      createdAt: new Date().toISOString(),
      model: modelId,
    };
    const baseMessages = [...messages, userMsg];
    setMessages([...baseMessages, placeholder]);

    // 系统提示词优先来自当前激活的 Agent App,其次来自默认 agent 列表
    const builtinAgent = DEFAULT_AGENTS.find((a) => a.id === agentId);
    const systemPrompt = activeApp?.systemPrompt || builtinAgent?.systemPrompt;
    const systemMessages = systemPrompt
      ? [{ role: 'system' as const, content: systemPrompt }]
      : [];

    try {
      const final = await stream.send({
        model: modelId,
        messages: [
          ...systemMessages,
          ...baseMessages.map((m) => ({ role: m.role, content: m.content })),
        ],
      });
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: final, pending: false }
            : m,
        ),
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `⚠️ ${err?.message || '流式输出失败'}`,
                pending: false,
              }
            : m,
        ),
      );
    }
  };

  const isEmpty = messages.length === 0;
  const isStreaming = stream.status === 'streaming' || stream.status === 'connecting';

  const handlePickStarter = (s: string) => {
    setDraft(s);
  };

  const clearActiveApp = () => {
    router.replace('/chat');
    setAgentId('');
  };

  return (
    <div className="relative flex h-[calc(100dvh-56px)] flex-col">
      {/* Active App banner */}
      {activeApp && isEmpty && (
        <ActiveAppBanner app={activeApp} onClose={clearActiveApp} />
      )}

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl px-6 pb-48 pt-10">
          {isEmpty ? (
            <EmptyState
              app={activeApp}
              onPickStarter={handlePickStarter}
            />
          ) : (
            <div className="flex flex-col gap-7">
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                const streaming = isLast && m.role === 'assistant' && isStreaming;
                const displayed =
                  streaming && stream.partial ? { ...m, content: stream.partial } : m;
                return (
                  <MessageBubble
                    key={m.id}
                    message={displayed}
                    streaming={streaming}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ChatInput
        value={draft}
        onChange={setDraft}
        onSubmit={submit}
        busy={isStreaming}
        onAbort={stream.abort}
        selectedModelId={modelId}
        selectedAgentId={agentId}
        onSelectModel={setModelId}
        onSelectAgent={setAgentId}
        placeholder={
          activeApp
            ? `${activeApp.name} 已就绪 —— ${activeApp.tagline}`
            : '与你的智能体对话 —— 拖拽文件到任意位置'
        }
      />
    </div>
  );
}

/* ============================================================ *
 *  子组件                                                       *
 * ============================================================ */

function AppIcon({ name, className }: { name: string; className?: string }) {
  const Cmp =
    (LucideIcons as unknown as Record<string, React.ComponentType<any>>)[name] ??
    LucideIcons.Sparkles;
  return <Cmp className={className} />;
}

function ActiveAppBanner({
  app,
  onClose,
}: {
  app: AgentApp;
  onClose: () => void;
}) {
  return (
    <div className="border-b border-line bg-surface/60 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-6 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md hairline bg-bg">
            <AppIcon name={app.icon} className="h-3 w-3 text-fg" />
          </span>
          <span className="text-sm font-medium truncate">{app.name}</span>
          <span className="hidden text-xs text-muted-fg sm:inline truncate">
            · {app.tagline}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-muted-fg hover:text-fg whitespace-nowrap"
        >
          切换为通用对话
        </button>
      </div>
    </div>
  );
}

const GENERIC_STARTERS = [
  '总结这份 PDF,列出关键风险',
  '重构我的 React 组件以支持 SSR',
  '规划一份京都秋季 5 日游行程',
  '用三句话解释拉普拉斯变换',
];

function EmptyState({
  app,
  onPickStarter,
}: {
  app?: AgentApp;
  onPickStarter: (s: string) => void;
}) {
  const starters = app?.starters?.length ? app.starters : GENERIC_STARTERS;
  const title = app ? `开始使用「${app.name}」` : '今天我们来构建点什么？';
  const subtitle = app
    ? app.description
    : '选个智能体、上传文件、随意提问。Token 消耗实时计量。';

  return (
    <div className="mx-auto mt-12 max-w-2xl text-center animate-fade-in">
      <span className="hairline inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-3 py-1 text-xs text-muted-fg">
        <span className="breathe-dot" />
        {app ? `${app.name} · 已加载预设` : '工作台就绪'}
      </span>
      <h2 className="mt-5 text-4xl font-medium tracking-tight">{title}</h2>
      <p className="mt-3 text-sm text-muted-fg">{subtitle}</p>

      {app?.capabilities?.length ? (
        <div className="mt-5 flex flex-wrap justify-center gap-1.5">
          {app.capabilities.map((c) => (
            <span
              key={c}
              className="hairline rounded-full bg-bg/60 px-2 py-0.5 text-[10px] text-muted-fg"
            >
              {c}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {starters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onPickStarter(s)}
            className="rounded-2xl hairline bg-surface/60 px-4 py-3 text-left text-sm text-muted-fg hover:bg-surface-2 hover:text-fg transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex h-[calc(100dvh-56px)] items-center justify-center text-sm text-muted-fg">
      载入中…
    </div>
  );
}
