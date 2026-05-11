'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Copy, RefreshCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Markdown } from './markdown';
import type { ChatMessage } from '@/types/chat';

/**
 * Chat bubble.
 *  - User: right-aligned, soft surface-2 fill, no border.
 *  - Assistant: left-aligned, transparent, full-width markdown.
 *  - Streaming assistant: shows a breathing caret + shimmer label.
 */
export function MessageBubble({
  message,
  streaming,
  onRegenerate,
}: {
  message: ChatMessage;
  streaming?: boolean;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = React.useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'group flex w-full gap-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      {!isUser && (
        <div className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full hairline bg-surface text-[11px] font-medium">
          ✦
        </div>
      )}

      <div
        className={cn(
          'min-w-0 max-w-[78%]',
          isUser && 'rounded-2xl bg-surface-2 px-4 py-2.5 text-[15px] leading-6',
          !isUser && 'pt-1',
        )}
      >
        {/* attachments preview (user) */}
        {isUser && message.attachments && message.attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {message.attachments.map((a) => (
              <span
                key={a.id}
                className="rounded-full hairline bg-surface px-2 py-0.5 text-[11px] text-muted-fg"
              >
                {a.name}
              </span>
            ))}
          </div>
        )}

        {isUser ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <>
            {message.content ? (
              <Markdown>{message.content}</Markdown>
            ) : streaming ? (
              <span className="shimmer-text text-sm">Thinking</span>
            ) : null}
            {streaming && (
              <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-fg align-middle animate-caret-blink" />
            )}
          </>
        )}

        {/* footer actions for assistant */}
        {!isUser && !streaming && message.content && (
          <div className="mt-2 flex items-center gap-1 text-muted-fg opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] hover:bg-muted hover:text-fg"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] hover:bg-muted hover:text-fg"
              >
                <RefreshCcw className="h-3 w-3" />
                Regenerate
              </button>
            )}
            {message.model && (
              <span className="ml-auto text-[10px] uppercase tracking-wider">
                {message.model}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
