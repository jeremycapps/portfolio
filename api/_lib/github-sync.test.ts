import { afterEach, describe, expect, it } from 'vitest';
import { buildFeed, framingMap, summarizePrBody } from './github-sync';
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
    expect(framingMap().get(1327088798)).toBe(
      "open-source contributor to DeepLethe's enterprise AI knowledge platform — building its evaluation tooling",
    );
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

describe('buildFeed enrichment and forks', () => {
  // The events API's current shape: PRs are bare numbers, pushes carry no commit count.
  const slimEvents: GithubEvent[] = [
    { type: 'PullRequestEvent', created_at: '2026-09-28T16:00:00Z', repo: { id: 10, name: 'up/proj' }, payload: { action: 'merged', number: 7, pull_request: { number: 7 } } },
    { type: 'PullRequestEvent', created_at: '2026-09-28T14:00:00Z', repo: { id: 10, name: 'up/proj' }, payload: { action: 'opened', number: 7, pull_request: { number: 7 } } },
    { type: 'PushEvent', created_at: '2026-09-28T15:00:00Z', repo: { id: 20, name: 'me/proj' }, payload: { ref: 'refs/heads/bench' } },
  ];
  const calls: string[] = [];
  const slimFetch = (async (url: string) => {
    calls.push(url);
    if (url.includes('/events/public')) return res(slimEvents);
    if (url.endsWith('/repos/up/proj')) return res({ private: false });
    if (url.endsWith('/repos/me/proj')) return res({ private: false, fork: true, parent: { id: 10, full_name: 'up/proj' } });
    if (url.endsWith('/repos/up/proj/pulls/7')) {
      return res({ title: 'Add the A/B bench', body: 'Tests whether a **prompt** change beats `variance`.\n\n## Details\nmore', state: 'closed', merged: true, html_url: 'https://github.com/up/proj/pull/7' });
    }
    throw new Error(`unexpected url ${url}`);
  }) as unknown as typeof fetch;

  afterEach(() => {
    calls.length = 0;
  });

  it('folds a fork into its upstream and fills PR details when a token is set', async () => {
    const doc = await buildFeed({ handle: 'me', token: 't', now: new Date('2026-09-29T00:00:00Z'), fetchImpl: slimFetch });
    expect(doc.items.map((i) => i.repo)).toEqual(['up/proj']); // fork row merged away
    expect(doc.items[0].activity).toHaveLength(2); // opened + merged collapse to one PR
    const [prItem, pushItem] = doc.items[0].activity;
    expect(prItem).toMatchObject({
      title: 'Add the A/B bench',
      state: 'merged',
      url: 'https://github.com/up/proj/pull/7',
      summary: 'Tests whether a prompt change beats variance.',
    });
    expect(pushItem).toMatchObject({ kind: 'push', ref: 'bench' });
  });

  it('skips PR lookups without a token, leaving the bare event', async () => {
    const doc = await buildFeed({ handle: 'me', now: new Date('2026-09-29T00:00:00Z'), fetchImpl: slimFetch });
    expect(calls.some((url) => url.includes('/pulls/'))).toBe(false);
    expect(doc.items[0].activity[0]).toMatchObject({ number: 7, state: 'merged' });
    expect(doc.items[0].activity.filter((i) => i.number === 7)).toHaveLength(2); // bare events stay distinct
    expect(doc.items[0].activity[0].title).toBeUndefined();
  });
});

describe('summarizePrBody', () => {
  it('keeps the first prose paragraph as plain text', () => {
    expect(summarizePrBody('<!-- template -->\n\n## Summary\n\nSee [the issue](https://x) for `why`.\n\nRest')).toBe('See the issue for why.');
  });

  it('keeps a paragraph that sits directly under a heading', () => {
    expect(summarizePrBody('## Problem\nIn dark mode the text was unreadable.\n\n**Cause:** tokens.')).toBe('In dark mode the text was unreadable.');
  });

  it('trims long paragraphs at a word boundary and handles empty bodies', () => {
    const long = summarizePrBody('word '.repeat(100))!;
    expect(long.length).toBeLessThanOrEqual(241);
    expect(long.endsWith('word…')).toBe(true);
    expect(summarizePrBody(null)).toBeUndefined();
    expect(summarizePrBody('')).toBeUndefined();
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
