import {
  ANSWER_SET_SCHEMA_PIN,
  resolveAnswerSet,
  type AnswerSetV2,
  type DisclosureDepth,
} from '@facia/core';
import { answerSystemPrompt, getConfig } from './config';
import { jsonError, jsonResponse } from './http';
import { produceMarkdownAnswer } from './markdown-answer-producer';
import { collectChat } from './provider';
import { checkRateLimit } from './rate-limit';
import { answerPortfolioQuestion } from './portfolio-answer-source';
import type { ChatMessage, StreamDeps } from './types';

const MAX_QUESTION_CHARS = 1_000;
const DEPTHS: DisclosureDepth[] = ['glance', 'inspect', 'focus', 'audit'];

interface AnswerRequest {
  question: string;
  depth: DisclosureDepth;
}

type AnswerSource = (question: string) => AnswerSetV2 | null;
type CompleteAnswer = (messages: ChatMessage[], deps?: StreamDeps) => Promise<string>;
type RateLimitCheck = (request: Request) => ReturnType<typeof checkRateLimit>;

type ValidResult =
  | { ok: true; value: AnswerRequest }
  | { ok: false; error: string };

export function validateAnswerBody(body: unknown): ValidResult {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request must be a JSON object.' };
  }
  const candidate = body as Record<string, unknown>;
  const question = typeof candidate.question === 'string' ? candidate.question.trim() : '';
  const depth = candidate.depth ?? 'glance';
  if (!question) return { ok: false, error: 'question must be a non-empty string.' };
  if (question.length > MAX_QUESTION_CHARS) return { ok: false, error: 'question is too long.' };
  if (!DEPTHS.includes(depth as DisclosureDepth)) {
    return { ok: false, error: 'depth must be glance, inspect, focus, or audit.' };
  }
  return { ok: true, value: { question, depth: depth as DisclosureDepth } };
}

export function buildAnswerMessages(question: string): ChatMessage[] {
  return [
    { role: 'system', content: answerSystemPrompt() },
    { role: 'user', content: question },
  ];
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function completeModelAnswer(
  question: string,
  requestSignal: AbortSignal,
  complete: CompleteAnswer,
  timeoutMs: number,
): Promise<{ ok: true; markdown: string } | { ok: false; response: Response }> {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort(requestSignal.reason);
  if (requestSignal.aborted) cancel();
  else requestSignal.addEventListener('abort', cancel, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort(new DOMException('Answer completion timed out.', 'TimeoutError'));
  }, timeoutMs);

  try {
    const markdown = (await complete(buildAnswerMessages(question), {
      signal: controller.signal,
    })).trim();
    if (!markdown) {
      return {
        ok: false,
        response: jsonError('The assistant returned an empty answer.', 'EMPTY_COMPLETION', 502),
      };
    }
    return { ok: true, markdown };
  } catch (error) {
    if (timedOut) {
      return {
        ok: false,
        response: jsonError('The answer took too long to complete.', 'ANSWER_TIMEOUT', 504),
      };
    }
    if (requestSignal.aborted || isAbortError(error)) {
      return {
        ok: false,
        response: jsonError('The answer request was cancelled.', 'ANSWER_CANCELLED', 499),
      };
    }
    console.error('Answer provider failed:', error);
    return {
      ok: false,
      response: jsonError('The assistant is unavailable right now.', 'PROVIDER_UNAVAILABLE', 502),
    };
  } finally {
    clearTimeout(timeout);
    requestSignal.removeEventListener('abort', cancel);
  }
}

export async function handleAnswerRequest(
  request: Request,
  deps: {
    answer?: AnswerSource;
    complete?: CompleteAnswer;
    checkLimit?: RateLimitCheck;
    timeoutMs?: number;
  } = {},
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError('Method not allowed.', 'METHOD_NOT_ALLOWED', 405);
  }

  const limit = await (deps.checkLimit ?? ((candidate) => checkRateLimit(candidate, {}, 'answer')))(request);
  if (!limit.ok) {
    return jsonError(
      'Too many requests — please slow down.',
      'RATE_LIMITED',
      429,
      limit.retryAfter === undefined ? {} : { 'retry-after': String(limit.retryAfter) },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 20_000) {
    return jsonError('Request too large.', 'REQUEST_TOO_LARGE', 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON.', 'INVALID_JSON', 400);
  }

  const validation = validateAnswerBody(body);
  if (!validation.ok) {
    return jsonError(validation.error, 'INVALID_REQUEST', 400);
  }

  let answerSet = (deps.answer ?? answerPortfolioQuestion)(validation.value.question);
  if (answerSet === null) {
    const completion = await completeModelAnswer(
      validation.value.question,
      request.signal,
      deps.complete ?? ((messages, completionDeps) => collectChat(messages, completionDeps)),
      deps.timeoutMs ?? getConfig().answerTimeoutMs,
    );
    if (!completion.ok) return completion.response;
    answerSet = produceMarkdownAnswer(validation.value.question, completion.markdown);
  }

  const result = resolveAnswerSet(answerSet, {
    depth: validation.value.depth,
    audience: 'human',
  });
  if (!result.ok) {
    console.error('Facia resolution failed:', result);
    return jsonError(
      'The structured answer failed validation.',
      'FACIA_RESOLUTION_FAILED',
      500,
    );
  }

  return jsonResponse({
    protocol: 'portfolio.answer/1',
    schemaPin: ANSWER_SET_SCHEMA_PIN,
    recipe: result.recipe,
  });
}
