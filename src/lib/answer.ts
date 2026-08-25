import type { ComponentRecipe, DisclosureDepth } from '@facia/core';
import { ANSWER_SET_SCHEMA_PIN } from '@facia/core/schema-pin';

export interface StructuredAnswerResponse {
  protocol: 'portfolio.answer/1';
  schemaPin: {
    schema: 'facia.answer-set/2';
    packagePath: string;
    sha256: string;
  };
  recipe: ComponentRecipe;
  recipesByDepth: Record<DisclosureDepth, ComponentRecipe>;
}

export class AnswerApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'AnswerApiError';
  }
}

const DEPTHS: DisclosureDepth[] = ['glance', 'inspect', 'focus', 'audit'];

function isComponentRecipe(value: unknown, expectedDepth?: DisclosureDepth): value is ComponentRecipe {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const recipe = value as Record<string, unknown>;
  const answer = recipe?.answer as Record<string, unknown> | undefined;
  const context = recipe?.context as Record<string, unknown> | undefined;
  const components = recipe?.components;
  const visibleFields = recipe?.visibleFields;
  return typeof recipe.pattern === 'string'
    && Array.isArray(components)
    && components.every((component) => (
      component !== null
      && typeof component === 'object'
      && typeof (component as Record<string, unknown>).id === 'string'
    ))
    && Array.isArray(recipe.inspectionControls)
    && Array.isArray(recipe.actionControls)
    && Array.isArray(visibleFields)
    && visibleFields.every((item) => (
      item !== null
      && typeof item === 'object'
      && Array.isArray((item as Record<string, unknown>).fields)
      && ((item as Record<string, unknown>).fields as unknown[]).every((field) => (
        field !== null
        && typeof field === 'object'
        && typeof (field as Record<string, unknown>).key === 'string'
      ))
    ))
    && typeof answer?.question === 'string'
    && Array.isArray(answer.items)
    && DEPTHS.includes(context?.depth as DisclosureDepth)
    && (expectedDepth === undefined || context?.depth === expectedDepth);
}

function isStructuredAnswerResponse(
  body: unknown,
  requestedDepth: DisclosureDepth,
): body is StructuredAnswerResponse {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) return false;
  const candidate = body as Record<string, unknown>;
  const pin = candidate.schemaPin as Record<string, unknown> | undefined;
  const recipesByDepth = candidate.recipesByDepth as Record<string, unknown> | undefined;
  return candidate.protocol === 'portfolio.answer/1'
    && pin?.schema === ANSWER_SET_SCHEMA_PIN.schema
    && pin.packagePath === ANSWER_SET_SCHEMA_PIN.packagePath
    && pin.sha256 === ANSWER_SET_SCHEMA_PIN.sha256
    && isComponentRecipe(candidate.recipe, requestedDepth)
    && recipesByDepth !== undefined
    && DEPTHS.every((depth) => isComponentRecipe(recipesByDepth[depth], depth));
}

export async function sendStructuredAnswer(
  question: string,
  depth: DisclosureDepth,
  signal?: AbortSignal,
): Promise<StructuredAnswerResponse> {
  const response = await fetch('/api/answer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ question, depth }),
    signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new AnswerApiError('The structured answer service returned an unreadable response.', 'INVALID_RESPONSE', response.status);
  }

  if (!response.ok) {
    const error = body as { error?: unknown; code?: unknown };
    throw new AnswerApiError(
      typeof error.error === 'string' ? error.error : 'The structured answer service is unavailable.',
      typeof error.code === 'string' ? error.code : 'ANSWER_REQUEST_FAILED',
      response.status,
    );
  }

  if (!isStructuredAnswerResponse(body, depth)) {
    throw new AnswerApiError(
      'The structured answer service returned an invalid recipe.',
      'INVALID_RESPONSE',
      response.status,
    );
  }
  return body;
}
