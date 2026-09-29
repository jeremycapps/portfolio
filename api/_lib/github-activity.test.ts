import { describe, expect, it } from 'vitest';
import {
  buildGithubBlock,
  describeActivity,
  foldForks,
  transformEvents,
  type GithubEvent,
} from './github-activity';

const NOW = new Date('2026-09-28T12:00:00Z');
const framing = new Map<number, string>([[1327088798, 'production-deployed LLM, ontology project']]);

function push(repoId: number, name: string, at: string, size = 3): GithubEvent {
  return { type: 'PushEvent', created_at: at, repo: { id: repoId, name }, payload: { size, ref: 'refs/heads/main', commits: [] } };
}
function pr(repoId: number, name: string, at: string, extra: Record<string, unknown>): GithubEvent {
  return { type: 'PullRequestEvent', created_at: at, repo: { id: repoId, name }, payload: extra };
}

describe('transformEvents', () => {
  it('groups by repo and joins curated framing on the immutable repo id', () => {
    const doc = transformEvents([push(1327088798, 'deeplethe/utopia', '2026-09-27T10:00:00Z')], framing, 'jeremycapps', NOW);
    expect(doc.items).toHaveLength(1);
    expect(doc.items[0].repoId).toBe(1327088798);
    expect(doc.items[0].framing).toBe('production-deployed LLM, ontology project');
    expect(doc.items[0].repo).toBe('deeplethe/utopia');
  });

  it('keeps framing through a rename because the join is on id, and adopts the newest name', () => {
    const doc = transformEvents(
      [
        push(1327088798, 'deeplethe/utopia', '2026-09-20T10:00:00Z'),
        push(1327088798, 'deeplethe/utopia-ng', '2026-09-27T10:00:00Z'),
      ],
      framing,
      'jeremycapps',
      NOW,
    );
    expect(doc.items).toHaveLength(1);
    expect(doc.items[0].framing).toBe('production-deployed LLM, ontology project'); // survived rename
    expect(doc.items[0].repo).toBe('deeplethe/utopia-ng'); // newest name wins
  });

  it('leaves framing null for unmapped repos', () => {
    const doc = transformEvents([push(999, 'jeremycapps/scratch', '2026-09-27T10:00:00Z')], framing, 'jeremycapps', NOW);
    expect(doc.items[0].framing).toBeNull();
  });

  it('maps PR actions to a merged/closed/open state', () => {
    const merged = pr(5, 'a/b', '2026-09-27T10:00:00Z', {
      action: 'closed',
      number: 12,
      pull_request: { title: 'Ship it', merged: true, html_url: 'https://x/12' },
    });
    const opened = pr(5, 'a/b', '2026-09-26T10:00:00Z', {
      action: 'opened',
      number: 13,
      pull_request: { title: 'Draft', state: 'open', html_url: 'https://x/13' },
    });
    const doc = transformEvents([merged, opened], framing, 'jeremycapps', NOW);
    const items = doc.items[0].activity;
    expect(items.find((i) => i.number === 12)?.state).toBe('merged');
    expect(items.find((i) => i.number === 13)?.state).toBe('open');
  });

  it('filters out noise events (watch, fork, delete, tag creation)', () => {
    const noise: GithubEvent[] = [
      { type: 'WatchEvent', created_at: '2026-09-27T10:00:00Z', repo: { id: 1, name: 'a/b' }, payload: {} },
      { type: 'ForkEvent', created_at: '2026-09-27T10:00:00Z', repo: { id: 1, name: 'a/b' }, payload: {} },
      { type: 'DeleteEvent', created_at: '2026-09-27T10:00:00Z', repo: { id: 1, name: 'a/b' }, payload: {} },
      { type: 'CreateEvent', created_at: '2026-09-27T10:00:00Z', repo: { id: 1, name: 'a/b' }, payload: { ref_type: 'tag' } },
    ];
    expect(transformEvents(noise, framing, 'jeremycapps', NOW).items).toHaveLength(0);
  });

  it('surfaces branch creation but not repo/tag creation', () => {
    const branch: GithubEvent = {
      type: 'CreateEvent',
      created_at: '2026-09-27T10:00:00Z',
      repo: { id: 1, name: 'a/b' },
      payload: { ref_type: 'branch', ref: 'feat/x' },
    };
    const doc = transformEvents([branch], framing, 'jeremycapps', NOW);
    expect(doc.items[0].activity[0]).toMatchObject({ kind: 'branch', ref: 'feat/x' });
  });

  it('sets lastActive to the most recent event and sorts repos by it', () => {
    const doc = transformEvents(
      [
        push(1, 'old/repo', '2026-09-01T10:00:00Z'),
        push(2, 'new/repo', '2026-09-27T10:00:00Z'),
      ],
      framing,
      'jeremycapps',
      NOW,
    );
    expect(doc.items.map((i) => i.repo)).toEqual(['new/repo', 'old/repo']);
    expect(doc.items[0].lastActive).toBe('2026-09-27T10:00:00Z');
  });

  it('stamps generated_at and handle', () => {
    const doc = transformEvents([], framing, 'jeremycapps', NOW);
    expect(doc.generated_at).toBe('2026-09-28T12:00:00.000Z');
    expect(doc.handle).toBe('jeremycapps');
    expect(doc.items).toEqual([]);
  });
});

describe('buildGithubBlock', () => {
  it('returns null for an empty or missing feed', () => {
    expect(buildGithubBlock(null)).toBeNull();
    expect(buildGithubBlock({ generated_at: NOW.toISOString(), handle: 'jeremycapps', items: [] })).toBeNull();
  });

  it('renders framing, dates, and activity lines', () => {
    const doc = transformEvents(
      [
        pr(1327088798, 'deeplethe/utopia', '2026-09-27T10:00:00Z', {
          action: 'opened',
          number: 1002,
          pull_request: { title: 'Refactor retrieval', state: 'open', html_url: 'https://x/1002' },
        }),
        push(1327088798, 'deeplethe/utopia', '2026-09-26T10:00:00Z', 4),
      ],
      framing,
      'jeremycapps',
      NOW,
    );
    const block = buildGithubBlock(doc)!;
    expect(block).toContain('production-deployed LLM, ontology project');
    expect(block).toContain('PR #1002 "Refactor retrieval" (open) 2026-09-27');
    expect(block).toContain('pushed 4 commit(s) to main 2026-09-26');
    expect(block).toContain('as of 2026-09-28');
  });
});

describe('describeActivity', () => {
  it('omits the commit count and empty titles the events API no longer sends', () => {
    expect(describeActivity({ kind: 'push', at: '2026-09-28T00:00:00Z', ref: 'main' })).toBe('pushed to main');
    expect(describeActivity({ kind: 'pull_request', at: '2026-09-28T00:00:00Z', number: 1005, state: 'open' })).toBe('PR #1005 (open)');
  });
});

describe('foldForks', () => {
  it('merges a fork into its upstream, taking the upstream name and framing', () => {
    const doc = transformEvents(
      [
        push(1327088798, 'deeplethe/utopia', '2026-09-27T10:00:00Z'),
        push(55, 'jeremycapps/utopia', '2026-09-28T10:00:00Z'),
        push(99, 'jeremycapps/other', '2026-09-26T10:00:00Z'),
      ],
      framing,
      'jeremycapps',
      NOW,
    );
    const folded = foldForks(doc, new Map([[55, { id: 1327088798, name: 'deeplethe/utopia' }]]), framing);
    expect(folded.items.map((i) => i.repo)).toEqual(['deeplethe/utopia', 'jeremycapps/other']);
    expect(folded.items[0].framing).toBe('production-deployed LLM, ontology project');
    expect(folded.items[0].lastActive).toBe('2026-09-28T10:00:00Z');
    expect(folded.items[0].activity).toHaveLength(2);
  });
});

describe('buildGithubBlock summaries', () => {
  it('adds a PR summary under its line when present', () => {
    const doc = {
      generated_at: NOW.toISOString(),
      handle: 'jeremycapps',
      items: [
        {
          repo: 'a/b',
          repoId: 1,
          framing: null,
          lastActive: '2026-09-27T10:00:00Z',
          activity: [{ kind: 'pull_request' as const, at: '2026-09-27T10:00:00Z', number: 3, title: 'T', state: 'merged', summary: 'Why it matters.' }],
        },
      ],
    };
    expect(buildGithubBlock(doc)).toContain('PR #3 "T" (merged) 2026-09-27\n    Why it matters.');
  });
});
