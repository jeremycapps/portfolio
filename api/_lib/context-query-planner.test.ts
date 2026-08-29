import { afterEach, describe, expect, it, vi } from 'vitest';
import { planContextQuery, parseContextPlan } from './context-query-planner';

afterEach(() => vi.unstubAllEnvs());

describe('parseContextPlan', () => {
  it('parses a valid needed plan into a typed ContextQuery', () => {
    const raw = JSON.stringify({
      schema: 'portfolio.context-plan/1',
      needed: true,
      term: 'kernel evaluate expression',
      kind: 'prose',
      expansion: 'neighbors',
      limit: 5,
    });
    expect(parseContextPlan(raw)).toEqual({
      needed: true,
      query: { term: 'kernel evaluate expression', kind: 'prose', expansion: 'neighbors', limit: 5 },
    });
  });

  it('returns needed:false for a well-formed not-needed plan', () => {
    const raw = JSON.stringify({
      schema: 'portfolio.context-plan/1',
      needed: false,
      term: null,
      kind: null,
      expansion: null,
      limit: null,
    });
    expect(parseContextPlan(raw)).toEqual({ needed: false });
  });

  it('returns needed:false for malformed JSON', () => {
    expect(parseContextPlan('not json')).toEqual({ needed: false });
  });

  it('returns needed:false when a needed plan is missing term or kind', () => {
    const raw = JSON.stringify({
      schema: 'portfolio.context-plan/1',
      needed: true,
      term: null,
      kind: null,
      expansion: null,
      limit: null,
    });
    expect(parseContextPlan(raw)).toEqual({ needed: false });
  });
});

describe('planContextQuery', () => {
  it('returns a typed query when the model plans a retrieval', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const fetchImpl: typeof fetch = vi.fn(async () => Response.json({
      choices: [{
        message: {
          content: JSON.stringify({
            schema: 'portfolio.context-plan/1',
            needed: true,
            term: 'design system migration',
            kind: 'prose',
            expansion: 'none',
            limit: 6,
          }),
        },
      }],
    }));

    const result = await planContextQuery('How did the design system migration actually go?', [], { fetchImpl });

    expect(result).toEqual({
      needed: true,
      query: { term: 'design system migration', kind: 'prose', expansion: 'none', limit: 6 },
    });
  });

  it('returns needed:false when the provider is not configured (no throw)', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const result = await planContextQuery('What technologies has Jeremy used?');
    expect(result).toEqual({ needed: false });
  });

  it('returns needed:false when the model refuses', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const fetchImpl: typeof fetch = vi.fn(async () => Response.json({
      choices: [{ message: { refusal: 'cannot plan this' } }],
    }));
    const result = await planContextQuery('anything', [], { fetchImpl });
    expect(result).toEqual({ needed: false });
  });

  it('returns needed:false when generation times out', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const fetchImpl: typeof fetch = vi.fn((_url, init) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    const result = await planContextQuery('anything', [], { fetchImpl, timeoutMs: 10 });
    expect(result).toEqual({ needed: false });
  });
});
