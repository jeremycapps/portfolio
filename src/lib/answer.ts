import type { ComponentRecipe, DisclosureDepth } from '@facia/core';

export interface StructuredAnswerResponse {
  protocol: 'portfolio.answer/1';
  schemaPin: {
    schema: 'facia.answer-set/2';
    packagePath: string;
    sha256: string;
  };
  recipe: ComponentRecipe;
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

  return body as StructuredAnswerResponse;
}
