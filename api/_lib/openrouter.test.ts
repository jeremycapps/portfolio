import { describe, it, expect } from 'vitest';
import { getConfig } from './config';
import { streamOpenRouter } from './openrouter';
import type { ChatMessage } from './types';

function sseResponse(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

const msgs: ChatMessage[] = [{ role: 'user', content: 'hi' }];

describe('streamOpenRouter', () => {
  it('yields concatenated content deltas from SSE frames', async () => {
    const fetchImpl = (async () =>
      sseResponse([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
        'data: [DONE]\n\n',
      ])) as unknown as typeof fetch;

    const out: string[] = [];
    for await (const d of streamOpenRouter(msgs, { fetchImpl })) out.push(d);
    expect(out.join('')).toBe('Hello');
  });

  it('sends a bounded completion request', async () => {
    let sentBody: Record<string, unknown> | undefined;
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      sentBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return sseResponse(['data: [DONE]\n\n']);
    }) as typeof fetch;

    for await (const _ of streamOpenRouter(msgs, { fetchImpl })) { /* drain */ }

    expect(sentBody?.max_tokens).toBe(getConfig().maxOutputTokens);
  });

  it('passes the caller abort signal to fetch unchanged', async () => {
    const controller = new AbortController();
    let sentSignal: AbortSignal | null | undefined;
    const fetchImpl = (async (_url: string | URL | Request, init?: RequestInit) => {
      sentSignal = init?.signal;
      return sseResponse(['data: [DONE]\n\n']);
    }) as typeof fetch;

    for await (const _ of streamOpenRouter(msgs, {
      fetchImpl,
      signal: controller.signal,
    })) { /* drain */ }

    expect(sentSignal).toBe(controller.signal);
  });

  it('throws a friendly error on non-200', async () => {
    const fetchImpl = (async () =>
      new Response('nope', { status: 401 })) as unknown as typeof fetch;
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of streamOpenRouter(msgs, { fetchImpl })) { /* drain */ }
    }).rejects.toThrow(/provider request failed: 401/i);
  });
});
