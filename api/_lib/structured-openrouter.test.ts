import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateOpenRouterStructured } from './structured-openrouter';

afterEach(() => vi.unstubAllEnvs());

const request = {
  name: 'portfolio_model_answer_v1',
  schema: { type: 'object', additionalProperties: false },
  messages: [{ role: 'user' as const, content: 'What did Jeremy do?' }],
};

describe('generateOpenRouterStructured', () => {
  it('requires strict JSON-schema output from the configured model', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    let body: Record<string, any> | undefined;
    const fetchImpl = vi.fn(async (_url: string | URL | Request, init?: RequestInit) => {
      body = JSON.parse(String(init?.body));
      return Response.json({ choices: [{ message: { content: '{"ok":true}' } }] });
    }) as unknown as typeof fetch;

    await expect(generateOpenRouterStructured(request, { fetchImpl })).resolves.toBe('{"ok":true}');
    expect(body?.stream).toBe(false);
    expect(body?.max_tokens).toBe(1_000);
    expect(body?.response_format).toEqual(expect.objectContaining({
      type: 'json_schema',
      json_schema: expect.objectContaining({ strict: true, name: request.name }),
    }));
  });

  it('bounds provider latency and reports a typed timeout', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const fetchImpl = vi.fn((_url: string | URL | Request, init?: RequestInit) => (
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
      })
    )) as unknown as typeof fetch;

    await expect(generateOpenRouterStructured(request, { fetchImpl, timeoutMs: 5 }))
      .rejects.toEqual(expect.objectContaining({ code: 'MODEL_PROVIDER_TIMEOUT' }));
  });

  it('preserves provider refusals as typed failures', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const fetchImpl = vi.fn(async () => Response.json({
      choices: [{ message: { content: '', refusal: 'Cannot answer from the profile.' } }],
    })) as unknown as typeof fetch;

    await expect(generateOpenRouterStructured(request, { fetchImpl }))
      .rejects.toEqual(expect.objectContaining({ code: 'MODEL_REFUSED' }));
  });
});
