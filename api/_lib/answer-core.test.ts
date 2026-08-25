import { describe, expect, it } from 'vitest';
import { handleAnswerRequest, validateAnswerBody } from './answer-core';
import { ModelAnswerContractError } from './model-answer';

const allow = async () => ({ ok: true as const });

function request(body: unknown): Request {
  return new Request('http://localhost/api/answer', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('validateAnswerBody', () => {
  it('defaults disclosure depth to glance', () => {
    expect(validateAnswerBody({ question: 'What did Jeremy do at Zocdoc?' })).toEqual({
      ok: true,
      value: { question: 'What did Jeremy do at Zocdoc?', depth: 'glance' },
    });
  });

  it('rejects malformed questions and disclosure depths', () => {
    expect(validateAnswerBody({ question: '' }).ok).toBe(false);
    expect(validateAnswerBody({ question: 'Zocdoc?', depth: 'everything' }).ok).toBe(false);
  });
});

describe('handleAnswerRequest', () => {
  it('resolves the modeled Zocdoc question through Facia', async () => {
    const response = await handleAnswerRequest(
      request({ question: 'What did Jeremy build at Zocdoc?', depth: 'glance' }),
      { checkLimit: allow },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.protocol).toBe('portfolio.answer/1');
    expect(body.schemaPin.schema).toBe('facia.answer-set/2');
    expect(body.recipe.pattern).toBe('list');
    expect(body.recipe.context.depth).toBe('glance');
    expect(Object.keys(body.recipesByDepth)).toEqual(['glance', 'inspect', 'focus', 'audit']);
    expect(body.recipesByDepth.audit.context.depth).toBe('audit');
    expect(body.recipe.visibleFields[0].fields.map((field: { key: string }) => field.key)).toEqual([
      'title',
      'contribution',
    ]);
  });

  it('expands the same answer deterministically at audit depth', async () => {
    const first = await handleAnswerRequest(
      request({ question: 'What was Jeremy’s work at Zocdoc?', depth: 'audit' }),
      { checkLimit: allow },
    );
    const second = await handleAnswerRequest(
      request({ question: 'What was Jeremy’s work at Zocdoc?', depth: 'audit' }),
      { checkLimit: allow },
    );
    const firstBody = await first.json();
    const secondBody = await second.json();

    expect(firstBody).toEqual(secondBody);
    expect(firstBody.recipe.visibleFields[0].fields).toHaveLength(6);
    expect(firstBody.recipe.inspectionControls).toContain('view-trace');
  });

  it('documents structured-provider unavailability for Markdown fallback', async () => {
    const response = await handleAnswerRequest(
      request({ question: 'What music does Jeremy like?' }),
      { checkLimit: allow },
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'MODEL_PROVIDER_UNAVAILABLE' });
  });

  it.each([
    ['MODEL_REFUSED', 404],
    ['MODEL_PROVIDER_TIMEOUT', 504],
    ['MODEL_MALFORMED_JSON', 502],
    ['MODEL_SCHEMA_INVALID', 502],
  ] as const)('returns a bounded %s error', async (code, status) => {
    const response = await handleAnswerRequest(
      request({ question: 'Portfolio question?' }),
      {
        checkLimit: allow,
        answer: async () => { throw new ModelAnswerContractError(code, 'bounded'); },
      },
    );
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toMatchObject({ code });
  });

  it('uses the shared rate-limit boundary', async () => {
    const response = await handleAnswerRequest(request({ question: 'Zocdoc work' }), {
      checkLimit: async () => ({ ok: false as const, retryAfter: 12 }),
    });
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('12');
    await expect(response.json()).resolves.toMatchObject({ code: 'RATE_LIMITED' });
  });
});
