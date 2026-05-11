'use client';

import * as React from 'react';
import { ChatInput } from '@/components/chat/chat-input';
import { MessageBubble } from '@/components/chat/message-bubble';
import { useChatStream } from '@/hooks/use-chat-stream';
import { DEFAULT_AGENTS, DEFAULT_MODELS } from '@/components/chat/model-switcher';
import type { Attachment, ChatMessage } from '@/types/chat';

/**
 * AI Agent Workbench — main streaming chat surface.
 * Wide whitespace, oversized prompt, floating input pinned to bottom.
 */
export default function ChatPage() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [draft, setDraft] = React.useState('');
  const [modelId, setModelId] = React.useState(DEFAULT_MODELS[0].id);
  const [agentId, setAgentId] = React.useState<string>('');
  const stream = useChatStream();
  const scrollerRef = React.useRef<HTMLDivElement>(null);

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

    const agent = DEFAULT_AGENTS.find((a) => a.id === agentId);
    const systemMessages = agent
      ? [{ role: 'system' as const, content: agent.systemPrompt }]
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

  return (
    <div className="relative flex h-[calc(100dvh-56px)] flex-col">
      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl px-6 pb-48 pt-10">
          {isEmpty ? (
            <EmptyState />
          ) : (
            <div className="flex flex-col gap-7">
              {messages.map((m, i) => {
                const isLast = i === messages.length - 1;
                const streaming = isLast && m.role === 'assistant' && isStreaming;
                // Inject live partial into the streaming bubble
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
        placeholder="与你的智能体对话 —— 拖拽文件到任意位置"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-12 max-w-2xl text-center animate-fade-in">
      <span className="hairline inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-3 py-1 text-xs text-muted-fg">
        <span className="breathe-dot" /> 工作台就绪
      </span>
      <h2 className="mt-5 text-4xl font-medium tracking-tight">
        今天我们来构建点什么？
      </h2>
      <p className="mt-3 text-sm text-muted-fg">
        选个智能体、上传文件、随意提问。Token 消耗实时计量。
      </p>
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {[
          '总结这份 PDF，列出关键风险',
          '重构我的 React 组件以支持 SSR',
          '规划一份京都秋季 5 日游行程',
          '用三句话解释拉普拉斯变换',
        ].map((s) => (
          <button
            key={s}
            className="rounded-2xl hairline bg-surface/60 px-4 py-3 text-left text-sm text-muted-fg hover:bg-surface-2 hover:text-fg transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
