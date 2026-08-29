import { readFileSync } from 'node:fs';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { describe, expect, it, vi } from 'vitest';
import handler, { handleFetchRequest } from './context-query';

describe('context-query Vercel entrypoint', () => {
  it('uses the shared Request-to-Response contract and runs on the Node.js runtime (no edge config)', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const response = await handleFetchRequest(new Request('https://example.com/api/context-query'));

    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toEqual({
      error: 'Method not allowed.',
      code: 'METHOD_NOT_ALLOWED',
    });
    expect(consoleInfo).toHaveBeenCalledWith('[api/context-query] GET request');
    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringMatching(/^\[api\/context-query\] GET 405 \d+ms$/),
    );
    consoleInfo.mockRestore();
  });

  it('adapts the Vercel Node request and response objects to the Fetch contract', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const request = {
      method: 'GET',
      url: '/api/context-query',
      headers: { host: 'example.com' },
    } as VercelRequest;
    const response = {
      statusCode: 200,
      setHeader: vi.fn(),
      end: vi.fn(),
    } as unknown as VercelResponse;

    await handler(request, response);

    expect(response.statusCode).toBe(405);
    expect(response.setHeader).toHaveBeenCalledWith('content-type', 'application/json; charset=utf-8');
    expect(response.end).toHaveBeenCalledWith(
      expect.objectContaining({
        toString: expect.any(Function),
      }),
    );
    const payload = vi.mocked(response.end).mock.calls[0]?.[0] as Buffer;
    expect(JSON.parse(payload.toString('utf8'))).toEqual({
      error: 'Method not allowed.',
      code: 'METHOD_NOT_ALLOWED',
    });
    consoleInfo.mockRestore();
  });

  it('uses Node-resolvable file extensions throughout its local production import chain', () => {
    for (const relativePath of ['./context-query.ts', './_lib/context-core.ts']) {
      const source = readFileSync(new URL(relativePath, import.meta.url), 'utf8');
      const localSpecifiers = [...source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)]
        .map((match) => match[1]);

      expect(localSpecifiers.length).toBeGreaterThan(0);
      expect(localSpecifiers).toEqual(
        expect.arrayContaining(localSpecifiers.map((specifier) => expect.stringMatching(/\.js$/))),
      );
    }
  });
});
