import { describe, expect, it } from 'vitest';

import { TARGET_CANADA } from '../cases';
import type { CaseFact, CaseSource } from '../cases/profile';
import { evaluateCommitmentReview } from './rubric';
import { TARGET_CANADA_AUGUST_2013_REVIEW } from './target-canada-august-review';
import {
  TARGET_CANADA_2014_WARNING_REVIEW,
  TARGET_CANADA_2014_WARNING_REVIEW_INPUT,
} from './target-canada-2014-review';
import {
  TARGET_CANADA_2015_EXIT_REVIEW,
  TARGET_CANADA_2015_EXIT_REVIEW_INPUT,
} from './target-canada-2015-review';

const facts: readonly CaseFact[] = TARGET_CANADA.facts;
const sources: readonly CaseSource[] = TARGET_CANADA.sources;

function citedSources(input: typeof TARGET_CANADA_2014_WARNING_REVIEW_INPUT): CaseSource[] {
  const refs = new Set([
    ...input.valueSourceRefs,
    ...input.riskFloors.flatMap(({ sourceRefs }) => sourceRefs),
    ...Object.values(input.placements).flatMap((placement) => (
      placement.kind === 'structural-upper-bound' ? placement.sources.map(({ ref }) => ref) : []
    )),
  ]);
  return [...refs].flatMap((ref) => {
    const fact = facts.find((candidate) => candidate.id === ref);
    expect(fact, `unknown fact reference: ${ref}`).toBeDefined();
    return fact!.evidence.map((evidence) => sources.find((s) => s.id === evidence.sourceId)!);
  });
}

describe('Target Canada first full-year evidence, 2014-02-26', () => {
  it('collides on finance where the August packet could only report fog', () => {
    expect(TARGET_CANADA_AUGUST_2013_REVIEW).toMatchObject({ outcome: 'FOG' });
    expect(TARGET_CANADA_2014_WARNING_REVIEW).toMatchObject({
      outcome: 'COLLISION',
      should: 'yes',
      can: 'no',
      breakingModels: ['finance'],
    });
  });

  it('bounds the collision on the reported segment loss, not an inferred one', () => {
    expect(TARGET_CANADA_2014_WARNING_REVIEW.placements.finance).toMatchObject({
      status: 'collides',
      fitUpperBound: -941,
      method: 'structural-upper-bound',
    });
    expect(facts.find(({ id }) => id === 'canada-ebit-2013')).toMatchObject({
      origin: 'reported',
      metric: { value: -941 },
    });
  });

  it('keeps the commitment worth pursuing, so the finding is capacity and not value', () => {
    expect(TARGET_CANADA_2014_WARNING_REVIEW_INPUT.value).toBe('worth-pursuing');
  });

  it('cites only sources published on or before the decision date', () => {
    for (const source of citedSources(TARGET_CANADA_2014_WARNING_REVIEW_INPUT)) {
      expect(source.publishedAt <= '2014-02-26', `${source.id} published ${source.publishedAt}`).toBe(true);
    }
  });
});

describe('Target Canada exit, 2015-02-25', () => {
  it('fails the value floor rather than merely colliding', () => {
    expect(TARGET_CANADA_2015_EXIT_REVIEW).toMatchObject({ outcome: 'FLOOR', should: 'no', can: 'no' });
    expect(TARGET_CANADA_2015_EXIT_REVIEW.reasons).toContain('The goal does not clear the value floor.');
  });

  it('separates the realized exit charge from the operating loss placed a year earlier', () => {
    expect(TARGET_CANADA_2015_EXIT_REVIEW.placements.finance).toMatchObject({
      status: 'collides',
      fitUpperBound: -5105,
    });
    expect(TARGET_CANADA_2014_WARNING_REVIEW.placements.finance.fitUpperBound).toBe(-941);
  });

  it('cites only sources published on or before the decision date', () => {
    for (const source of citedSources(TARGET_CANADA_2015_EXIT_REVIEW_INPUT)) {
      expect(source.publishedAt <= '2015-02-25', `${source.id} published ${source.publishedAt}`).toBe(true);
    }
  });

  it('is reproducible from its authored input', () => {
    expect(evaluateCommitmentReview(TARGET_CANADA_2015_EXIT_REVIEW_INPUT)).toEqual(TARGET_CANADA_2015_EXIT_REVIEW);
  });
});

describe('the arc across four dates', () => {
  it('hardens as evidence arrives rather than reading the same at every date', () => {
    expect([
      TARGET_CANADA_AUGUST_2013_REVIEW.outcome,
      TARGET_CANADA_2014_WARNING_REVIEW.outcome,
      TARGET_CANADA_2015_EXIT_REVIEW.outcome,
    ]).toEqual(['FOG', 'COLLISION', 'FLOOR']);
  });
});
