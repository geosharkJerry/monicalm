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
                content: `⚠️ ${err?.message || 'Stream failed'}`,
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
        placeholder="Message your agent — drop files anywhere"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto mt-12 max-w-2xl text-center animate-fade-in">
      <span className="hairline inline-flex items-center gap-1.5 rounded-full bg-surface/70 px-3 py-1 text-xs text-muted-fg">
        <span className="breathe-dot" /> workspace ready
      </span>
      <h2 className="mt-5 text-4xl font-medium tracking-tight">
        What shall we build today?
      </h2>
      <p className="mt-3 text-sm text-muted-fg">
        Choose an agent, drop files, ask anything. Token usage is metered live.
      </p>
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        {[
          'Summarize this PDF with key risks',
          'Refactor my React component for SSR',
          'Plan a 5-day Kyoto itinerary in autumn',
          'Explain Laplace transform in 3 lines',
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
