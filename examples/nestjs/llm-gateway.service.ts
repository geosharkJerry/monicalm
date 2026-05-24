import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

export interface MessageEvent {
  data: string;
  type?: string;
}

interface MembershipTokenDebit {
  userId: string;
  tokens: number;
  model: string;
}

export interface UserService {
  debitMembershipTokens(payload: MembershipTokenDebit): Promise<void>;
}

type ChatChunk = {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  usage?: { total_tokens?: number };
  error?: { message?: string };
};

@Injectable()
export class LlmGatewayService {
  private readonly logger = new Logger(LlmGatewayService.name);

  // 国内模型优先级：主模型失败后按顺序自动降级
  private readonly fallbackModels = ['deepseek-chat', 'qwen-max', 'glow-4'];

  constructor(private readonly userService: UserService) {}

  async createStreamChat(
    prompt: string,
    model: string,
    userId: string,
  ): Promise<Observable<MessageEvent>> {
    const primary = model;
    const candidates = [primary, ...this.fallbackModels.filter((m) => m !== primary)];

    return new Observable<MessageEvent>((subscriber) => {
      let aborted = false;
      const abortController = new AbortController();

      const run = async () => {
        for (let idx = 0; idx < candidates.length && !aborted; idx++) {
          const selectedModel = candidates[idx];

          try {
            await this.streamFromOneApi({
              prompt,
              model: selectedModel,
              userId,
              signal: abortController.signal,
              emit: (evt) => subscriber.next(evt),
            });

            subscriber.complete();
            return;
          } catch (error: unknown) {
            const reason = error instanceof Error ? error.message : 'unknown error';
            const isLast = idx === candidates.length - 1;

            this.logger.warn(
              `model=${selectedModel} stream failed, fallback=${!isLast}, reason=${reason}`,
            );

            subscriber.next({
              type: 'error',
              data: JSON.stringify({
                model: selectedModel,
                code: isLast ? 'ALL_MODELS_FAILED' : 'MODEL_FALLBACK',
                message: isLast
                  ? 'All candidate models are unavailable'
                  : `Model ${selectedModel} timed out/unavailable, switching to backup model`,
              }),
            });

            if (isLast) {
              subscriber.error(new ServiceUnavailableException('No available model right now'));
              return;
            }
          }
        }
      };

      run().catch((e) => {
        this.logger.error(`createStreamChat fatal: ${String(e)}`);
        subscriber.error(new InternalServerErrorException('Failed to create stream chat'));
      });

      return () => {
        aborted = true;
        abortController.abort();
      };
    });
  }

  private async streamFromOneApi(params: {
    prompt: string;
    model: string;
    userId: string;
    signal: AbortSignal;
    emit: (event: MessageEvent) => void;
  }): Promise<void> {
    const { prompt, model, userId, signal, emit } = params;

    const baseUrl = process.env.ONE_API_URL;
    const token = process.env.ONE_API_TOKEN;

    if (!baseUrl || !token) {
      throw new Error('ONE_API_URL or ONE_API_TOKEN is missing');
    }

    const endpoint = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;

    const timeoutController = new AbortController();
    const timer = setTimeout(() => timeoutController.abort('timeout'), 30_000);

    const bridgeAbort = () => timeoutController.abort('upstream-aborted');
    signal.addEventListener('abort', bridgeAbort, { once: true });

    let estimatedCompletionTokens = 0;
    let upstreamTotalTokens = 0;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          model,
          stream: true,
          stream_options: { include_usage: true },
          messages: [{ role: 'user', content: prompt }],
          user: userId,
        }),
        signal: timeoutController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`upstream status=${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';

        for (const evt of events) {
          const line = evt
            .split('\n')
            .find((l) => l.startsWith('data:'))
            ?.replace(/^data:\s?/, '');
          if (!line) continue;

          if (line === '[DONE]') {
            emit({ type: 'done', data: '[DONE]' });
            continue;
          }

          let chunk: ChatChunk;
          try {
            chunk = JSON.parse(line) as ChatChunk;
          } catch {
            continue;
          }

          const content = chunk.choices?.[0]?.delta?.content;
          if (content) {
            estimatedCompletionTokens += this.estimateTokens(content);
            emit({ data: content });
          }

          if (chunk.usage?.total_tokens) {
            upstreamTotalTokens = chunk.usage.total_tokens;
          }

          if (chunk.error?.message) {
            throw new Error(chunk.error.message);
          }
        }
      }

      // done 后异步扣费，不阻塞 SSE 收尾
      const totalTokens = upstreamTotalTokens || this.estimateTokens(prompt) + estimatedCompletionTokens;
      void this.userService
        .debitMembershipTokens({ userId, tokens: totalTokens, model })
        .catch((e) => this.logger.error(`token debit failed user=${userId}: ${String(e)}`));
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', bridgeAbort);
    }
  }

  private estimateTokens(text: string): number {
    // 粗略估算：中英混合场景取 1 token ≈ 3.5 chars
    return Math.max(1, Math.ceil(text.length / 3.5));
  }
}
