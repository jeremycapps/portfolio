import { describe, expect, it, vi } from 'vitest';
import handler, { config } from './resume';

describe('resume Vercel entrypoint', () => {
  it('uses the working edge Request-to-Response contract', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    const response = await handler(new Request('https://example.com/api/resume'));

    expect(config).toEqual({ runtime: 'edge' });
    expect(response.status).toBe(405);
    await expect(response.json()).resolves.toMatchObject({ code: 'METHOD_NOT_ALLOWED' });
    expect(consoleInfo).toHaveBeenCalledWith('[api/resume] GET request');
    expect(consoleInfo).toHaveBeenCalledWith(expect.stringMatching(/^\[api\/resume\] GET 405 \d+ms$/));
    consoleInfo.mockRestore();
  });
});
