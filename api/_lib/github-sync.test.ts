import { afterEach, describe, expect, it } from 'vitest';
import { buildFeed, framingMap } from './github-sync';
import type { GithubEvent } from './github-activity';

function res(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body, text: async () => JSON.stringify(body) } as unknown as Response;
}

const events: GithubEvent[] = [
  { type: 'PushEvent', created_at: '2026-09-27T10:00:00Z', repo: { id: 1, name: 'me/public-repo' }, payload: { size: 2, ref: 'refs/heads/main' } },
  { type: 'PushEvent', created_at: '2026-09-26T10:00:00Z', repo: { id: 2, name: 'me/gone-private' }, payload: { size: 1, ref: 'refs/heads/main' } },
];

/** Routes GitHub API calls: the events list, then each repo's visibility check. */
function fakeFetch(visibility: Record<string, boolean>): typeof fetch {
  return (async (url: string) => {
    if (url.includes('/events/public')) return res(events);
    const match = url.match(/\/repos\/(.+)$/);
    if (match) {
      const isPrivate = visibility[match[1]];
      if (isPrivate === undefined) return res({ message: 'Not Found' }, false, 404);
      return res({ private: isPrivate });
    }
    throw new Error(`unexpected url ${url}`);
  }) as unknown as typeof fetch;
}

describe('framingMap', () => {
  it('loads curated framing keyed on repo id', () => {
    expect(framingMap().get(1327088798)).toBe('production-deployed LLM, ontology project');
  });
});

describe('buildFeed', () => {
  it('transforms events and keeps only currently-public repos', async () => {
    const doc = await buildFeed({
      handle: 'me',
      now: new Date('2026-09-28T00:00:00Z'),
      fetchImpl: fakeFetch({ 'me/public-repo': false, 'me/gone-private': true }),
    });
    expect(doc.items.map((i) => i.repo)).toEqual(['me/public-repo']); // gone-private dropped
    expect(doc.handle).toBe('me');
  });

  it('drops a repo whose visibility check 404s (deleted/renamed away)', async () => {
    const doc = await buildFeed({
      handle: 'me',
      now: new Date('2026-09-28T00:00:00Z'),
      fetchImpl: fakeFetch({ 'me/public-repo': false }), // gone-private missing → 404
    });
    expect(doc.items.map((i) => i.repo)).toEqual(['me/public-repo']);
  });

  it('throws when the events call fails', async () => {
    const failing = (async () => res({ message: 'rate limited' }, false, 403)) as unknown as typeof fetch;
    await expect(buildFeed({ handle: 'me', fetchImpl: failing })).rejects.toThrow(/GitHub 403/);
  });
});

describe('cron route auth', () => {
  afterEach(() => {
    delete process.env.CRON_SECRET;
  });

  it('rejects a request without the bearer secret before doing any work', async () => {
    process.env.CRON_SECRET = 'top-secret';
    const { default: handler } = await import('../cron/github-sync');
    const res401 = await handler(new Request('https://x/api/cron/github-sync', { method: 'POST' }));
    expect(res401.status).toBe(401);
  });
});
