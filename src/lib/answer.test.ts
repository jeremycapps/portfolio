import { afterEach, describe, expect, it, vi } from 'vitest';
import { ANSWER_SET_SCHEMA_PIN } from '@facia/core';
import { AnswerApiError, boundAnswerHistory, sendStructuredAnswer } from './answer';

afterEach(() => vi.unstubAllGlobals());

describe('sendStructuredAnswer', () => {
  it('keeps the newest bounded history for the structured prompt', () => {
    const history = Array.from({ length: 14 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' as const : 'assistant' as const,
      content: `${index}: ${'x'.repeat(2_500)}`,
    }));
    const bounded = boundAnswerHistory(history);

    expect(bounded).toHaveLength(6);
    expect(bounded[0].content.startsWith('8:')).toBe(true);
    expect(bounded.at(-1)?.content.startsWith('13:')).toBe(true);
    expect(bounded.every((message) => message.content.length <= 2_000)).toBe(true);
    expect(bounded.reduce((sum, message) => sum + message.content.length, 0)).toBe(12_000);
  });

  it('posts the question and disclosure depth', async () => {
    const recipe = (depth: 'glance' | 'inspect' | 'focus' | 'audit') => ({
      pattern: 'list',
      components: [],
      inspectionControls: [],
      actionControls: [],
      visibleFields: [],
      context: { depth },
      answer: { question: 'Zocdoc?', items: [] },
    });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => new Response(JSON.stringify({
      protocol: 'portfolio.answer/1',
      schemaPin: ANSWER_SET_SCHEMA_PIN,
      recipe: recipe('inspect'),
      recipesByDepth: {
        glance: recipe('glance'),
        inspect: recipe('inspect'),
        focus: recipe('focus'),
        audit: recipe('audit'),
      },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));
    vi.stubGlobal('fetch', fetchMock);

    await sendStructuredAnswer('Zocdoc?', 'inspect');

    expect(fetchMock).toHaveBeenCalledWith('/api/answer', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ question: 'Zocdoc?', depth: 'inspect', history: [] }),
    }));
  });

  it('posts compact conversation history for contextual structured answers', async () => {
    const fetchMock = vi.fn(async () => new Response('{}', {
      status: 404,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(sendStructuredAnswer('What month?', 'glance', undefined, [
      { role: 'user', content: 'When did he start working on Libera?' },
      { role: 'assistant', content: '2026.' },
    ])).rejects.toBeInstanceOf(AnswerApiError);

    expect(fetchMock).toHaveBeenCalledWith('/api/answer', expect.objectContaining({
      body: JSON.stringify({
        question: 'What month?',
        depth: 'glance',
        history: [
          { role: 'user', content: 'When did he start working on Libera?' },
          { role: 'assistant', content: '2026.' },
        ],
      }),
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

  it('rejects a success response with an invalid recipe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      protocol: 'portfolio.answer/1',
      schemaPin: { schema: 'facia.answer-set/2', packagePath: 'schema.json', sha256: 'abc' },
      recipe: { pattern: 'list' },
      recipesByDepth: {},
    }), { status: 200, headers: { 'content-type': 'application/json' } })));

    await expect(sendStructuredAnswer('Zocdoc?', 'glance')).rejects.toEqual(expect.objectContaining({
      code: 'INVALID_RESPONSE',
    }));
  });
});
