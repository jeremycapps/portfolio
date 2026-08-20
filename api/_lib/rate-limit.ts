import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// A minimal limiter surface so the check logic is testable without Upstash.
export interface RateLimiter {
  limit(id: string): Promise<{ success: boolean; reset: number }>;
}

export interface RateLimitResult {
  ok: boolean;
  retryAfter?: number; // seconds
}

export interface RateLimitDeps {
  // `undefined` → use the env-configured limiter; `null` → force-disabled.
  limiter?: RateLimiter | null;
  now?: () => number; // ms epoch, for testing
}

// Sliding window: how many chat sends one client may make per window.
const WINDOW_LIMIT = 20;
const WINDOW = '1 m' as const;

let cachedLimiter: RateLimiter | null | undefined;

// Build the limiter from env once. Fail OPEN (return null) when Upstash is not
// configured, so local dev and key-less deploys keep working — the limiter
// activates automatically once UPSTASH_REDIS_REST_URL/TOKEN are set.
function envLimiter(): RateLimiter | null {
  if (cachedLimiter !== undefined) return cachedLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    console.warn('rate-limit: Upstash not configured — rate limiting is OFF.');
    cachedLimiter = null;
    return null;
  }

  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(WINDOW_LIMIT, WINDOW),
    prefix: 'portfolio-chat',
  });
  cachedLimiter = {
    limit: (id) => ratelimit.limit(id).then((r) => ({ success: r.success, reset: r.reset })),
  };
  return cachedLimiter;
}

// Best-effort client identity from proxy headers. Vercel sets x-forwarded-for.
export function clientId(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function checkRateLimit(
  request: Request,
  deps: RateLimitDeps = {},
): Promise<RateLimitResult> {
  const limiter = deps.limiter !== undefined ? deps.limiter : envLimiter();
  if (!limiter) return { ok: true }; // disabled / unconfigured → allow

  const now = deps.now ?? (() => Date.now());
  const { success, reset } = await limiter.limit(clientId(request));
  if (success) return { ok: true };

  const retryAfter = Math.max(1, Math.ceil((reset - now()) / 1000));
  return { ok: false, retryAfter };
}

// Test seam: reset the memoized limiter between tests.
export function _resetLimiterCache(): void {
  cachedLimiter = undefined;
}
