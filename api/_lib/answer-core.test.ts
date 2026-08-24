import { describe, expect, it, vi } from 'vitest';
import { buildAnswerMessages, handleAnswerRequest, validateAnswerBody } from './answer-core';

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
    const complete = vi.fn(async () => 'must not run');
    const response = await handleAnswerRequest(
      request({ question: 'What did Jeremy build at Zocdoc?', depth: 'glance' }),
      { checkLimit: allow, complete },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.protocol).toBe('portfolio.answer/1');
    expect(body.schemaPin.schema).toBe('facia.answer-set/2');
    expect(body.recipe.pattern).toBe('list');
    expect(body.recipe.context.depth).toBe('glance');
    expect(body.recipe.visibleFields[0].fields.map((field: { key: string }) => field.key)).toEqual([
      'title',
      'contribution',
    ]);
    expect(complete).not.toHaveBeenCalled();
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

  it('wraps a completed model Markdown answer for an unmodeled standalone question', async () => {
    const complete = vi.fn(async () => '# Music\n\nJeremy likes **careful listening**.');
    const response = await handleAnswerRequest(
      request({ question: 'What music does Jeremy like?' }),
      { checkLimit: allow, complete },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.recipe.pattern).toBe('detail');
    expect(body.recipe.answer.items[0].payload.markdown).toContain('**careful listening**');
    expect(complete).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ role: 'user', content: 'What music does Jeremy like?' }),
      ]),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('returns a controlled error for provider failure', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await handleAnswerRequest(
      request({ question: 'What music does Jeremy like?' }),
      {
        checkLimit: allow,
        complete: async () => { throw new Error('provider secret'); },
      },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
    consoleError.mockRestore();
  });

  it('returns a controlled error for an empty completion', async () => {
    const response = await handleAnswerRequest(
      request({ question: 'What music does Jeremy like?' }),
      { checkLimit: allow, complete: async () => '  \n ' },
    );

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toMatchObject({ code: 'EMPTY_COMPLETION' });
  });

  it('returns a controlled error when completion times out', async () => {
    const response = await handleAnswerRequest(
      request({ question: 'What music does Jeremy like?' }),
      {
        checkLimit: allow,
        timeoutMs: 5,
        complete: (_messages, deps) => new Promise((_resolve, reject) => {
          deps?.signal?.addEventListener('abort', () => reject(deps.signal?.reason), { once: true });
        }),
      },
    );

    expect(response.status).toBe(504);
    await expect(response.json()).resolves.toMatchObject({ code: 'ANSWER_TIMEOUT' });
  });

  it('returns a controlled error for cancellation', async () => {
    const controller = new AbortController();
    controller.abort(new DOMException('cancelled', 'AbortError'));
    const cancelledRequest = new Request('http://localhost/api/answer', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: 'What music does Jeremy like?' }),
      signal: controller.signal,
    });
    const response = await handleAnswerRequest(cancelledRequest, {
      checkLimit: allow,
      complete: async () => { throw new DOMException('cancelled', 'AbortError'); },
    });

    expect(response.status).toBe(499);
    await expect(response.json()).resolves.toMatchObject({ code: 'ANSWER_CANCELLED' });
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

describe('buildAnswerMessages', () => {
  it('uses the answer-only Markdown contract', () => {
    const messages = buildAnswerMessages('Explain Facia.');

    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ role: 'system' });
    expect(messages[0].content).toContain('Return only the completed reader-facing answer in Markdown');
    expect(messages[1]).toEqual({ role: 'user', content: 'Explain Facia.' });
  });
});
