import {
  ANSWER_SET_SCHEMA_PIN,
  resolveAnswerSet,
  type AnswerSetV2,
  type ComponentRecipe,
  type DisclosureDepth,
} from '@facia/core';
import { jsonError, jsonResponse } from './http';
import { checkRateLimit } from './rate-limit';
import { ModelAnswerContractError } from './model-answer';
import { generatePortfolioAnswer } from './portfolio-answer-source';

const MAX_QUESTION_CHARS = 1_000;
const DEPTHS: DisclosureDepth[] = ['glance', 'inspect', 'focus', 'audit'];

interface AnswerRequest {
  question: string;
  depth: DisclosureDepth;
}

type AnswerSource = (question: string) => AnswerSetV2 | null | Promise<AnswerSetV2 | null>;
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

export async function handleAnswerRequest(
  request: Request,
  deps: {
    answer?: AnswerSource;
    checkLimit?: RateLimitCheck;
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

  let answerSet: AnswerSetV2 | null;
  try {
    answerSet = await (deps.answer ?? generatePortfolioAnswer)(validation.value.question);
  } catch (error) {
    if (error instanceof ModelAnswerContractError) {
      const responses = {
        MODEL_REFUSED: ['The question is outside the grounded portfolio context.', 404],
        MODEL_PROVIDER_TIMEOUT: ['Structured generation timed out.', 504],
        MODEL_MALFORMED_JSON: ['The structured model returned malformed JSON.', 502],
        MODEL_SCHEMA_INVALID: ['The structured model response failed validation.', 502],
        MODEL_PROVIDER_UNAVAILABLE: ['Structured generation is unavailable.', 503],
      } as const;
      const [message, status] = responses[error.code];
      return jsonError(message, error.code, status);
    }
    console.error('Structured answer generation failed:', error);
    return jsonError('Structured generation is unavailable.', 'MODEL_PROVIDER_UNAVAILABLE', 503);
  }
  if (answerSet === null) {
    return jsonError(
      'That question does not have a deterministic portfolio model yet.',
      'QUESTION_NOT_MODELED',
      404,
    );
  }

  const recipesByDepth = {} as Record<DisclosureDepth, ComponentRecipe>;
  for (const depth of DEPTHS) {
    const result = resolveAnswerSet(answerSet, { depth, audience: 'human' });
    if (!result.ok) {
      console.error('Facia resolution failed:', result);
      return jsonError(
        'The structured answer failed validation.',
        'FACIA_RESOLUTION_FAILED',
        500,
      );
    }
    recipesByDepth[depth] = result.recipe;
  }

  return jsonResponse({
    protocol: 'portfolio.answer/1',
    schemaPin: ANSWER_SET_SCHEMA_PIN,
    recipe: recipesByDepth[validation.value.depth],
    recipesByDepth,
  });
}
