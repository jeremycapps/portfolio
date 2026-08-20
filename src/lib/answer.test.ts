import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnswerApiError, sendStructuredAnswer } from './answer';

afterEach(() => vi.unstubAllGlobals());

describe('sendStructuredAnswer', () => {
  it('posts the question and disclosure depth', async () => {
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => new Response(JSON.stringify({
      protocol: 'portfolio.answer/1',
      schemaPin: { schema: 'facia.answer-set/2', packagePath: 'schema.json', sha256: 'abc' },
      recipe: { pattern: 'list' },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await sendStructuredAnswer('Zocdoc?', 'inspect');

    expect(fetchMock).toHaveBeenCalledWith('/api/answer', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ question: 'Zocdoc?', depth: 'inspect' }),
    }));
  });

  it('preserves typed decline codes for chat fallback', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      error: 'Not modeled',
      code: 'QUESTION_NOT_MODELED',
    }), { status: 404, headers: { 'content-type': 'application/json' } })));

    await expect(sendStructuredAnswer('Unknown?', 'glance')).rejects.toEqual(expect.objectContaining({
      name: 'AnswerApiError',
      code: 'QUESTION_NOT_MODELED',
      status: 404,
    } satisfies Partial<AnswerApiError>));
  });
});
