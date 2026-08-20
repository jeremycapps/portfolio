import { describe, expect, it, vi } from 'vitest';
import handler, { config } from './answer';

describe('answer Vercel entrypoint', () => {
  it('uses the shared edge Request-to-Response contract', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const response = await handler(new Request('https://example.com/api/answer'));

    expect(config).toEqual({ runtime: 'edge' });
    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toEqual({
      error: 'Method not allowed.',
      code: 'METHOD_NOT_ALLOWED',
    });
    expect(consoleInfo).toHaveBeenCalledWith('[api/answer] GET request');
    expect(consoleInfo).toHaveBeenCalledWith(
      expect.stringMatching(/^\[api\/answer\] GET 405 \d+ms$/),
    );
    consoleInfo.mockRestore();
  });
});
