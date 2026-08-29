import { describe, expect, it, vi } from 'vitest';
import { handleContextQueryRequest, validateContextQueryBody } from './context-core';
import type { ContextQueryResult } from './context-index';

function post(body: unknown): Request {
  return new Request('https://example.com/api/context-query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('validateContextQueryBody', () => {
  it('rejects non-object bodies', () => {
    expect(validateContextQueryBody(null).ok).toBe(false);
    expect(validateContextQueryBody([]).ok).toBe(false);
  });

  it('requires a non-empty term', () => {
    expect(validateContextQueryBody({ kind: 'prose' })).toEqual({ ok: false, error: expect.any(String) });
    expect(validateContextQueryBody({ term: '  ', kind: 'prose' }).ok).toBe(false);
  });

  it('rejects an over-long term', () => {
    expect(validateContextQueryBody({ term: 'x'.repeat(501), kind: 'prose' }).ok).toBe(false);
  });

  it('requires a valid kind', () => {
    expect(validateContextQueryBody({ term: 'x', kind: 'nonsense' }).ok).toBe(false);
    expect(validateContextQueryBody({ term: 'x' }).ok).toBe(false);
  });

  it('accepts a minimal valid body, trimming the term', () => {
    expect(validateContextQueryBody({ term: '  hello  ', kind: 'catalog' })).toEqual({
      ok: true,
      value: { term: 'hello', kind: 'catalog', expansion: undefined, limit: undefined },
    });
  });

  it('validates optional expansion and limit when present', () => {
    expect(validateContextQueryBody({ term: 'x', kind: 'prose', expansion: 'bogus' }).ok).toBe(false);
    expect(validateContextQueryBody({ term: 'x', kind: 'prose', limit: 'many' }).ok).toBe(false);
    expect(validateContextQueryBody({ term: 'x', kind: 'prose', expansion: 'neighbors', limit: 5 })).toEqual({
      ok: true,
      value: { term: 'x', kind: 'prose', expansion: 'neighbors', limit: 5 },
    });
  });
});

describe('handleContextQueryRequest', () => {
  it('rejects non-POST requests', async () => {
    const response = await handleContextQueryRequest(
      new Request('https://example.com/api/context-query'),
    );
    expect(response.status).toBe(405);
  });

  it('rejects invalid JSON', async () => {
    const response = await handleContextQueryRequest(
      new Request('https://example.com/api/context-query', { method: 'POST', body: '{not json' }),
    );
    expect(response.status).toBe(400);
  });

  it('rejects an invalid body before running a query', async () => {
    const runQuery = vi.fn();
    const response = await handleContextQueryRequest(post({ kind: 'prose' }), { runQuery });
    expect(response.status).toBe(400);
    expect(runQuery).not.toHaveBeenCalled();
  });

  it('runs the query and returns its results under the context-query protocol', async () => {
    const result: ContextQueryResult = {
      trace: ['topic'],
      results: [
        {
          recordType: 'TOPIC',
          id: 't_1',
          fileId: 'f_1',
          exchangeId: 'e_1',
          exchangeOrdinal: 1,
          rowOrdinal: 1,
          project: 'domain',
          date: '2026-08-29',
          filePath: 'transcripts/chatgpt/x.md',
          startLine: 1,
          endLine: 10,
          roles: ['USER'],
          headings: [],
          keywords: ['alpha'],
          preview: 'preview text',
          text: 'full text',
        },
      ],
    };
    const runQuery = vi.fn(async () => result);
    const response = await handleContextQueryRequest(post({ term: 'alpha', kind: 'prose' }), { runQuery });

    expect(response.status).toBe(200);
    expect(runQuery).toHaveBeenCalledWith({ term: 'alpha', kind: 'prose', expansion: undefined, limit: undefined });
    await expect(response.json()).resolves.toEqual({ protocol: 'portfolio.context-query/1', ...result });
  });

  it('returns a 500 when the query runner throws', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const runQuery = vi.fn(async () => {
      throw new Error('boom');
    });
    const response = await handleContextQueryRequest(post({ term: 'x', kind: 'catalog' }), { runQuery });
    expect(response.status).toBe(500);
    consoleError.mockRestore();
  });
});
