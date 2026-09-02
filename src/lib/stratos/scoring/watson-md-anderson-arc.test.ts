import { describe, expect, it } from 'vitest';

import { WATSON_MD_ANDERSON } from '../cases/watson-md-anderson';
import type { CommitmentReviewInput } from './rubric';
import { WATSON_MD_ANDERSON_2013_REVIEW, WATSON_MD_ANDERSON_2013_REVIEW_INPUT } from './watson-md-anderson-2013-review';
import { WATSON_MD_ANDERSON_2014_REVIEW, WATSON_MD_ANDERSON_2014_REVIEW_INPUT } from './watson-md-anderson-2014-review';
import { WATSON_MD_ANDERSON_2017_REVIEW, WATSON_MD_ANDERSON_2017_REVIEW_INPUT } from './watson-md-anderson-2017-review';

const { facts, sources } = WATSON_MD_ANDERSON;

function citedSources(input: CommitmentReviewInput) {
  const refs = new Set([
    ...input.valueSourceRefs,
    ...input.riskFloors.flatMap(({ sourceRefs }) => sourceRefs),
  ]);
  return [...refs].flatMap((ref) => {
    const fact = facts.find(({ id }) => id === ref);
    expect(fact, `unknown Watson fact ${ref}`).toBeDefined();
    return fact!.evidence.map(({ sourceId }) => sources.find(({ id }) => id === sourceId)!);
  });
}

describe('Watson × MD Anderson decision arc', () => {
  it('moves from fog to fog to a terminal floor', () => {
    expect([
      WATSON_MD_ANDERSON_2013_REVIEW.outcome,
      WATSON_MD_ANDERSON_2014_REVIEW.outcome,
      WATSON_MD_ANDERSON_2017_REVIEW.outcome,
    ]).toEqual(['FOG', 'FOG', 'FLOOR']);
  });

  it('keeps each review behind its own cutoff wall', () => {
    for (const [cutoff, input] of [
      ['2013-10-18', WATSON_MD_ANDERSON_2013_REVIEW_INPUT],
      ['2014-02-06', WATSON_MD_ANDERSON_2014_REVIEW_INPUT],
      ['2017-02-19', WATSON_MD_ANDERSON_2017_REVIEW_INPUT],
    ] as const) {
      for (const source of citedSources(input)) {
        expect(source.publishedAt <= cutoff, `${source.id} published after ${cutoff}`).toBe(true);
      }
    }
  });

  it('lets value and readiness floors carry T2 without inventing a reserve collision', () => {
    expect(WATSON_MD_ANDERSON_2017_REVIEW).toMatchObject({ outcome: 'FLOOR', should: 'no' });
    expect(WATSON_MD_ANDERSON_2017_REVIEW.breakingModels).toEqual([]);
    expect(WATSON_MD_ANDERSON_2017_REVIEW_INPUT.riskFloors.filter(({ status }) => status === 'trip'))
      .toHaveLength(3);
  });
});
