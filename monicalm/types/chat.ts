/**
 * Shared chat / agent type definitions.
 * Keep these aligned with the OpenAI-compatible payloads that `new-api`
 * forwards through the gateway.
 */

export type Role = 'user' | 'assistant' | 'system' | 'tool';

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string; // mime
  /** Object URL for previewing; replaced with backend URL after upload. */
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  /** Final text (may include markdown / code / math). */
  content: string;
  /** While streaming, transient content goes here. */
  pending?: boolean;
  /** Multimodal user uploads. */
  attachments?: Attachment[];
  /** ISO timestamp. */
  createdAt: string;
  /** Token usage from the upstream provider. */
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  /** Backend channel / model that served this turn. */
  model?: string;
}

export interface ModelOption {
  id: string;
  label: string;
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  description?: string;
  /** Price multipliers vs base unit. */
  inputRate?: number;
  outputRate?: number;
}

export interface AgentOption {
  id: string;
  name: string;
  emoji?: string;
  modelId: string;
  systemPrompt: string;
}

/** Server-Sent Event chunk shape we expect from /api/chat/completions */
export interface SSEChunk {
  id?: string;
  object?: string;
  model?: string;
  choices?: Array<{
    index: number;
    delta?: { role?: Role; content?: string };
    finish_reason?: string | null;
  }>;
  usage?: ChatMessage['usage'];
  error?: { message: string; code?: string };
}
