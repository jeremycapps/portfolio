import { afterEach, describe, expect, it, vi } from 'vitest';
import { retrieveContext, ContextRetrievalError } from './context-retrieval-client';
import type { ContextQuery } from './context-index';

afterEach(() => vi.unstubAllEnvs());

const query: ContextQuery = { term: 'kernel', kind: 'prose', expansion: 'none', limit: 5 };

describe('retrieveContext', () => {
  it('POSTs to /api/context-query with the bearer key and returns typed rows', async () => {
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;
    const fetchImpl: typeof fetch = vi.fn(async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return Response.json({
        protocol: 'portfolio.context-query/1',
        trace: [],
        results: [{ project: 'libera', fileType: 'transcript', date: '2026-03-01', filePath: 'a.md', tags: [], summary: 'summary' }],
      });
    });

    const rows = await retrieveContext(query, 'https://example.com', { fetchImpl, apiKey: 'test-key' });

    expect(capturedUrl).toBe('https://example.com/api/context-query');
    expect(capturedInit?.method).toBe('POST');
    expect((capturedInit?.headers as Record<string, string>).authorization).toBe('Bearer test-key');
    expect(JSON.parse(String(capturedInit?.body))).toEqual(query);
    expect(rows).toHaveLength(1);
  });

  it('throws without calling fetch when no API key is configured', async () => {
    vi.stubEnv('CONTEXT_QUERY_API_KEY', '');
    const fetchImpl = vi.fn();
    await expect(retrieveContext(query, 'https://example.com', { fetchImpl })).rejects.toThrow(ContextRetrievalError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws on a non-200 response', async () => {
    const fetchImpl: typeof fetch = vi.fn(async () => new Response('nope', { status: 500 }));
    await expect(
      retrieveContext(query, 'https://example.com', { fetchImpl, apiKey: 'test-key' }),
    ).rejects.toThrow(ContextRetrievalError);
  });

  it('throws when the request times out', async () => {
    const fetchImpl: typeof fetch = vi.fn((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    await expect(
      retrieveContext(query, 'https://example.com', { fetchImpl, apiKey: 'test-key', timeoutMs: 10 }),
    ).rejects.toThrow();
  });
});
