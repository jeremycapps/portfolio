import { describe, expect, it } from 'vitest';
import { currentWorkAnswerSet, supportsCurrentWorkQuestion } from './github-answer-source';
import type { GithubActivityDocument } from './github-activity';

const doc: GithubActivityDocument = {
  generated_at: '2026-09-28T06:00:00Z',
  handle: 'jeremycapps',
  items: [
    {
      repo: 'deeplethe/utopia',
      repoId: 1327088798,
      framing: 'production-deployed LLM, ontology project',
      lastActive: '2026-09-27T10:00:00Z',
      activity: [{ kind: 'pull_request', at: '2026-09-27T10:00:00Z', number: 1002, title: 'Refactor retrieval', state: 'open' }],
    },
    {
      repo: 'jeremycapps/scratch',
      repoId: 42,
      framing: null,
      lastActive: '2026-09-20T10:00:00Z',
      activity: [{ kind: 'push', at: '2026-09-20T10:00:00Z', commits: 3, ref: 'main' }],
    },
  ],
};

describe('supportsCurrentWorkQuestion', () => {
  it('matches current-work phrasings', () => {
    expect(supportsCurrentWorkQuestion('What are you working on?')).toBe(true);
    expect(supportsCurrentWorkQuestion('What are his recent projects?')).toBe(true);
    expect(supportsCurrentWorkQuestion('what is he up to right now')).toBe(true);
    expect(supportsCurrentWorkQuestion('show me his github')).toBe(true);
  });

  it('yields "at aroko" to the operations-role card, and ignores unrelated questions', () => {
    expect(supportsCurrentWorkQuestion('What does Jeremy do at Aroko?')).toBe(false);
    expect(supportsCurrentWorkQuestion('What technologies has Jeremy used?')).toBe(false);
  });
});

describe('currentWorkAnswerSet', () => {
  it('returns null when there is no feed yet, so the caller falls through to prose', () => {
    expect(currentWorkAnswerSet(null)).toBeNull();
    expect(currentWorkAnswerSet({ ...doc, items: [] })).toBeNull();
  });

  it('builds a temporal sequence of repos with framing and latest activity', () => {
    const set = currentWorkAnswerSet(doc)!;
    expect(set.structure).toBe('sequence');
    expect(set.sequenceKind).toBe('temporal');
    expect(set.items).toHaveLength(2);

    const utopia = set.items[0] as { payload: Record<string, unknown>; value: unknown };
    expect(utopia.value).toBe('deeplethe/utopia');
    expect(utopia.payload.significance).toBe('production-deployed LLM, ontology project');
    expect(utopia.payload.latest).toBe('PR #1002 "Refactor retrieval" (open)');
    expect(utopia.payload.url).toBe('https://github.com/deeplethe/utopia');
  });

  it('omits significance for an unframed repo', () => {
    const set = currentWorkAnswerSet(doc)!;
    const scratch = set.items[1] as { payload: Record<string, unknown> };
    expect(scratch.payload.significance).toBeUndefined();
    expect(scratch.payload.latest).toBe('pushed 3 commit(s) to main');
  });
});

describe('currentWorkAnswerSet headline', () => {
  it('leads with the latest titled PR over a newer bare push', () => {
    const set = currentWorkAnswerSet({
      ...doc,
      items: [
        {
          ...doc.items[0],
          activity: [
            { kind: 'push', at: '2026-09-28T10:00:00Z', ref: 'bench' },
            { kind: 'pull_request', at: '2026-09-27T10:00:00Z', number: 1002, title: 'Add the A/B bench', state: 'merged' },
          ],
        },
      ],
    })!;
    expect((set.items[0] as { payload: Record<string, unknown> }).payload.latest).toBe('PR #1002 "Add the A/B bench" (merged)');
  });
});
