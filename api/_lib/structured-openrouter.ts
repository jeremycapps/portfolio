import { getConfig } from './config';
import { ModelAnswerContractError } from './model-answer';
import type { ChatMessage } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface StructuredGenerationRequest {
  messages: ChatMessage[];
  name: string;
  schema: Record<string, unknown>;
}

export interface StructuredGenerationDeps {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
}

function boundedSignal(parent: AbortSignal | undefined, timeoutMs: number): {
  signal: AbortSignal;
  cleanup: () => void;
  timedOut: () => boolean;
} {
  const controller = new AbortController();
  let timeoutReached = false;
  const abortFromParent = () => controller.abort(parent?.reason);
  if (parent?.aborted) abortFromParent();
  else parent?.addEventListener('abort', abortFromParent, { once: true });
  const timeout = setTimeout(() => {
    timeoutReached = true;
    controller.abort(new DOMException('Structured generation timed out.', 'TimeoutError'));
  }, timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      parent?.removeEventListener('abort', abortFromParent);
    },
    timedOut: () => timeoutReached,
  };
}

export async function generateOpenRouterStructured(
  request: StructuredGenerationRequest,
  deps: StructuredGenerationDeps = {},
): Promise<string> {
  const config = getConfig();
  if (!config.openRouterKey) {
    throw new ModelAnswerContractError(
      'MODEL_PROVIDER_UNAVAILABLE',
      'Structured generation is not configured.',
    );
  }
  const boundary = boundedSignal(
    deps.signal,
    deps.timeoutMs ?? config.structuredTimeoutMs,
  );
  try {
    const response = await (deps.fetchImpl ?? fetch)(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openRouterKey}`,
        'HTTP-Referer': 'https://jeremycapps.com',
        'X-Title': 'Jeremy Capps Portfolio',
      },
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        stream: false,
        max_tokens: config.maxOutputTokens,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: request.name,
            strict: true,
            schema: request.schema,
          },
        },
      }),
      signal: boundary.signal,
    });
    if (!response.ok) {
      throw new ModelAnswerContractError(
        'MODEL_PROVIDER_UNAVAILABLE',
        `Structured provider request failed with status ${response.status}.`,
      );
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ModelAnswerContractError(
        'MODEL_PROVIDER_UNAVAILABLE',
        'Structured provider returned an unreadable response.',
      );
    }
    const message = (body as { choices?: Array<{ message?: { content?: unknown; refusal?: unknown } }> })
      ?.choices?.[0]?.message;
    if (typeof message?.refusal === 'string' && message.refusal.trim()) {
      throw new ModelAnswerContractError('MODEL_REFUSED', message.refusal.trim());
    }
    if (typeof message?.content !== 'string' || !message.content.trim()) {
      throw new ModelAnswerContractError(
        'MODEL_PROVIDER_UNAVAILABLE',
        'Structured provider returned no answer content.',
      );
    }
    return message.content;
  } catch (error) {
    if (boundary.timedOut()) {
      throw new ModelAnswerContractError(
        'MODEL_PROVIDER_TIMEOUT',
        'Structured generation exceeded its time limit.',
      );
    }
    throw error;
  } finally {
    boundary.cleanup();
  }
}
