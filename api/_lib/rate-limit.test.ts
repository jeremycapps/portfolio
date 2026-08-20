import { describe, it, expect } from 'vitest';
import { checkRateLimit, clientId, type RateLimiter } from './rate-limit';

function req(headers: Record<string, string> = {}): Request {
  return new Request('http://x/api/chat', { method: 'POST', headers });
}

describe('clientId', () => {
  it('takes the first hop of x-forwarded-for', () => {
    expect(clientId(req({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8' }))).toBe('1.2.3.4');
  });
  it('falls back to unknown when no proxy headers', () => {
    expect(clientId(req())).toBe('unknown');
  });
});

describe('checkRateLimit', () => {
  it('allows when the limiter is disabled (null)', async () => {
    const r = await checkRateLimit(req(), { limiter: null });
    expect(r.ok).toBe(true);
  });

  it('allows when the limiter reports success', async () => {
    const limiter: RateLimiter = { limit: async () => ({ success: true, reset: 0 }) };
    const r = await checkRateLimit(req(), { limiter });
    expect(r.ok).toBe(true);
  });

  it('blocks with a rounded-up retryAfter when the limiter reports failure', async () => {
    const now = 1_000_000;
    const limiter: RateLimiter = { limit: async () => ({ success: false, reset: now + 29_500 }) };
    const r = await checkRateLimit(req(), { limiter, now: () => now });
    expect(r.ok).toBe(false);
    expect(r.retryAfter).toBe(30);
  });
});
