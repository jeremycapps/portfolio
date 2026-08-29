import { describe, expect, it, vi } from 'vitest';
import handler from './context-query';

describe('context-query Vercel entrypoint', () => {
  it('uses the shared Request-to-Response contract and runs on the Node.js runtime (no edge config)', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const response = await handler(new Request('https://example.com/api/context-query'));

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
});
