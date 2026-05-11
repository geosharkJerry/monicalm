'use client';

import * as React from 'react';
import type { ChatMessage, SSEChunk } from '@/types/chat';

/**
 * useChatStream — drive a streaming completion against /api/chat/completions.
 *
 * Design notes:
 *  - Uses `fetch` with a ReadableStream reader rather than EventSource, so we
 *    can POST a JSON body (which EventSource does not support) and pass an
 *    auth bearer header.
 *  - Robust SSE parsing: handles split chunks across reads, comments (`:`),
 *    keep-alives, and the OpenAI-compatible `data: [DONE]` terminator.
 *  - Exposes `status` so the UI can show a "breathing" glow while connecting
 *    and a typewriter cursor while tokens stream in.
 */
export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'error' | 'done';

interface SendOptions {
  model: string;
  messages: Array<{ role: ChatMessage['role']; content: string }>;
  temperature?: number;
  top_p?: number;
  signal?: AbortSignal;
}

export interface UseChatStream {
  status: StreamStatus;
  /** Current incremental assistant text. */
  partial: string;
  /** The most recent error message, if any. */
  error: string | null;
  /** Token usage reported by the server (filled on finish). */
  usage: ChatMessage['usage'] | null;
  /** Start a new stream. Returns when stream ends. */
  send: (opts: SendOptions) => Promise<string>;
  /** Abort the in-flight request. */
  abort: () => void;
}

export function useChatStream(endpoint = '/api/chat/completions'): UseChatStream {
  const [status, setStatus] = React.useState<StreamStatus>('idle');
  const [partial, setPartial] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [usage, setUsage] = React.useState<ChatMessage['usage'] | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const abort = React.useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const send = React.useCallback(
    async ({ model, messages, temperature = 0.7, top_p = 1, signal }: SendOptions) => {
      // reset
      setPartial('');
      setError(null);
      setUsage(null);
      setStatus('connecting');

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const composedSignal = signal
        ? mergeSignals(ctrl.signal, signal)
        : ctrl.signal;

      let assembled = '';

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            top_p,
            stream: true,
          }),
          signal: composedSignal,
        });

        if (!res.ok || !res.body) {
          // Try to surface upstream error JSON for friendly toast handling
          let msg = `HTTP ${res.status}`;
          try {
            const j = await res.json();
            msg = j?.error?.message ?? j?.message ?? msg;
          } catch {
            /* not JSON */
          }
          throw new Error(msg);
        }

        setStatus('streaming');

        const reader = res.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buf = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          // SSE messages are separated by blank lines (\n\n)
          let sepIdx: number;
          while ((sepIdx = buf.indexOf('\n\n')) !== -1) {
            const rawEvent = buf.slice(0, sepIdx);
            buf = buf.slice(sepIdx + 2);
            const data = parseSSEDataLines(rawEvent);
            if (!data) continue;
            if (data === '[DONE]') {
              setStatus('done');
              continue;
            }
            try {
              const chunk = JSON.parse(data) as SSEChunk;
              if (chunk.error) throw new Error(chunk.error.message);
              const delta = chunk.choices?.[0]?.delta?.content ?? '';
              if (delta) {
                assembled += delta;
                setPartial(assembled);
              }
              if (chunk.usage) setUsage(chunk.usage);
            } catch (e) {
              // Tolerate occasional malformed lines (e.g. keep-alive)
              if (process.env.NODE_ENV !== 'production') {
                console.warn('[useChatStream] non-JSON chunk:', data);
              }
            }
          }
        }
        setStatus('done');
        return assembled;
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          setStatus('idle');
          return assembled;
        }
        setError(e?.message || 'Stream failed');
        setStatus('error');
        throw e;
      } finally {
        abortRef.current = null;
      }
    },
    [endpoint],
  );

  return { status, partial, error, usage, send, abort };
}

/** Pull the joined `data:` payload out of one SSE event. */
function parseSSEDataLines(raw: string): string | null {
  const lines = raw.split('\n');
  const dataLines: string[] = [];
  for (const line of lines) {
    if (!line || line.startsWith(':')) continue; // comment / keep-alive
    if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;
  return dataLines.join('\n');
}

/** Merge two AbortSignals into one. */
function mergeSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  if (a.aborted || b.aborted) ctrl.abort();
  else {
    a.addEventListener('abort', onAbort, { once: true });
    b.addEventListener('abort', onAbort, { once: true });
  }
  return ctrl.signal;
}
