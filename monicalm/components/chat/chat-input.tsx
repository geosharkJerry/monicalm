'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paperclip,
  ArrowUp,
  Square,
  X,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ModelSwitcher } from './model-switcher';
import type { Attachment } from '@/types/chat';

/**
 * Genspark-style global input.
 *
 *  - Floating, wide, centered.
 *  - Drag-and-drop file uploads → minimal capsule thumbnails above the box.
 *  - Model / agent switcher sits inside the input's top-left.
 *  - Auto-growing textarea, ⌘↵ / Ctrl+↵ to submit, Esc to cancel.
 */
export interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (text: string, attachments: Attachment[]) => void;
  onAbort?: () => void;
  busy?: boolean;
  selectedModelId: string;
  selectedAgentId?: string;
  onSelectModel: (id: string) => void;
  onSelectAgent: (id: string) => void;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onAbort,
  busy,
  selectedModelId,
  selectedAgentId,
  onSelectModel,
  onSelectAgent,
  placeholder = '随意提问…',
}: ChatInputProps) {
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [dragOver, setDragOver] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  React.useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 240) + 'px';
  }, [value]);

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files).slice(0, 6).map<Attachment>((f) => ({
      id: crypto.randomUUID(),
      name: f.name,
      size: f.size,
      type: f.type,
      url: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }));
    setAttachments((prev) => [...prev, ...arr].slice(0, 6));
  };

  const handleSubmit = () => {
    const text = value.trim();
    if (!text && attachments.length === 0) return;
    if (busy) return;
    onSubmit(text, attachments);
    setAttachments([]);
    onChange('');
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-6">
      <motion.div
        layout
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={cn(
          'pointer-events-auto w-full max-w-3xl',
          'rounded-3xl hairline bg-surface/80 backdrop-blur-md shadow-glass',
          'transition-shadow duration-200',
          dragOver && 'ring-1 ring-fg/30 shadow-glow',
        )}
      >
        {/* Attachments row */}
        <AnimatePresence initial={false}>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden px-3 pt-3"
            >
              <div className="flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <AttachmentChip
                    key={a.id}
                    a={a}
                    onRemove={() =>
                      setAttachments((p) => p.filter((x) => x.id !== a.id))
                    }
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top row: switcher */}
        <div className="flex items-center gap-2 px-3 pt-3">
          <ModelSwitcher
            selectedModelId={selectedModelId}
            selectedAgentId={selectedAgentId}
            onSelectModel={onSelectModel}
            onSelectAgent={onSelectAgent}
          />
        </div>

        {/* Textarea + actions */}
        <div className="flex items-end gap-2 px-3 pb-3 pt-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full hairline text-muted-fg hover:bg-muted hover:text-fg transition-colors"
            aria-label="上传文件"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            onChange={(e) => e.target.files && addFiles(e.target.files)}
          />
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={1}
            placeholder={placeholder}
            onKeyDown={(e) => {
              if (
                (e.metaKey || e.ctrlKey) &&
                e.key === 'Enter'
              ) {
                e.preventDefault();
                handleSubmit();
              } else if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              } else if (e.key === 'Escape' && busy) {
                onAbort?.();
              }
            }}
            className={cn(
              'min-h-[36px] max-h-60 flex-1 resize-none bg-transparent',
              'px-1 py-2 text-[15px] leading-6 outline-none placeholder:text-muted-fg/70',
            )}
          />
          {busy ? (
            <button
              type="button"
              onClick={onAbort}
              className="grid h-9 w-9 place-items-center rounded-full bg-fg text-bg transition-opacity hover:opacity-90"
              aria-label="停止"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!value.trim() && attachments.length === 0}
              className={cn(
                'grid h-9 w-9 place-items-center rounded-full bg-fg text-bg',
                'transition-opacity hover:opacity-90',
                'disabled:opacity-30 disabled:cursor-not-allowed',
              )}
              aria-label="发送"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* hint */}
        <div className="border-t border-line px-4 py-1.5 text-[11px] text-muted-fg flex justify-between">
          <span>Enter 发送 · Shift+Enter 换行 · Esc 停止</span>
          <span className="hidden sm:inline">monicalm · 由 new-api 路由</span>
        </div>
      </motion.div>
    </div>
  );
}

function AttachmentChip({
  a,
  onRemove,
}: {
  a: Attachment;
  onRemove: () => void;
}) {
  const isImg = a.type.startsWith('image/');
  return (
    <div className="group inline-flex items-center gap-2 rounded-full hairline bg-surface px-2 py-1 text-xs">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-muted overflow-hidden">
        {isImg && a.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.url} alt={a.name} className="h-full w-full object-cover" />
        ) : isImg ? (
          <ImageIcon className="h-3 w-3 text-muted-fg" />
        ) : (
          <FileText className="h-3 w-3 text-muted-fg" />
        )}
      </span>
      <span className="max-w-[10rem] truncate">{a.name}</span>
      <button
        onClick={onRemove}
        className="rounded-full p-0.5 text-muted-fg opacity-0 transition-opacity hover:bg-muted hover:text-fg group-hover:opacity-100"
        aria-label="移除"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
