import { describe, expect, it, vi } from 'vitest';
import { jsonError, withApiLogging } from './http';

describe('jsonError', () => {
  it('returns the shared error envelope and no-store headers', async () => {
    const response = jsonError('Nope.', 'NOPE', 418, { 'retry-after': '12' });

    expect(response.status).toBe(418);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('retry-after')).toBe('12');
    await expect(response.json()).resolves.toEqual({ error: 'Nope.', code: 'NOPE' });
  });
});

describe('withApiLogging', () => {
  it('logs the request and response without changing the response', async () => {
    const logger = { info: vi.fn(), error: vi.fn() };
    const handler = withApiLogging(
      'api/test',
      async () => new Response('ok', { status: 202 }),
      logger,
    );
    const response = await handler(new Request('https://example.com/api/test'));

    expect(response.status).toBe(202);
    expect(await response.text()).toBe('ok');
    expect(logger.info).toHaveBeenNthCalledWith(1, '[api/test] GET request');
    expect(logger.info).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^\[api\/test\] GET 202 \d+ms$/),
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs and rethrows unhandled errors', async () => {
    const logger = { info: vi.fn(), error: vi.fn() };
    const failure = new Error('boom');
    const handler = withApiLogging(
      'api/test',
      async () => {
        throw failure;
      },
      logger,
    );

    await expect(handler(new Request('https://example.com/api/test'))).rejects.toBe(failure);
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringMatching(/^\[api\/test\] GET unhandled error after \d+ms$/),
      failure,
    );
  });
});
