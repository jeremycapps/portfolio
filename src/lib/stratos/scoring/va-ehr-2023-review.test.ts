import { describe, expect, it } from 'vitest';

import { VA_EHR_MODERNIZATION } from '../cases';
import type { CaseFact, CaseSource } from '../cases/profile';
import { evaluateCommitmentReview } from './rubric';
import { VA_EHR_2020_REVIEW } from './va-ehr-2020-review';
import { VA_EHR_2023_REVIEW, VA_EHR_2023_REVIEW_INPUT } from './va-ehr-2023-review';

const DECISION_DATE = '2023-04-21';
const facts: readonly CaseFact[] = VA_EHR_MODERNIZATION.facts;
const sources: readonly CaseSource[] = VA_EHR_MODERNIZATION.sources;

function citedSources(): CaseSource[] {
  const factRefs = new Set([
    ...VA_EHR_2023_REVIEW_INPUT.valueSourceRefs,
    ...VA_EHR_2023_REVIEW_INPUT.riskFloors.flatMap(({ sourceRefs }) => sourceRefs),
    ...Object.values(VA_EHR_2023_REVIEW_INPUT.placements).flatMap((placement) => (
      placement.kind === 'structural-lower-bound' ? placement.sources.map(({ ref }) => ref) : []
    )),
  ]);
  return [...factRefs].flatMap((ref) => {
    const fact = facts.find((candidate) => candidate.id === ref);
    expect(fact, `unknown fact reference: ${ref}`).toBeDefined();
    return fact!.evidence.map((evidence) => sources.find((c) => c.id === evidence.sourceId)!);
  });
}

describe('VA EHR reset, 2023-04-21', () => {
  it('reaches FOG on finance alone, with nothing breaking', () => {
    expect(VA_EHR_2023_REVIEW).toMatchObject({
      outcome: 'FOG',
      should: 'yes',
      can: 'unknown',
      breakingModels: [],
    });
    expect(VA_EHR_2023_REVIEW.reasons).toEqual(['finance fit is indeterminate.']);
  });

  it('clears the readiness floors that a pause cannot breach', () => {
    const statuses = Object.fromEntries(
      VA_EHR_2023_REVIEW_INPUT.riskFloors.map(({ id, status }) => [id, status]),
    );
    expect(statuses).toEqual({
      'infrastructure-readiness': 'pass',
      'capability-availability': 'pass',
      'incremental-safety-exposure': 'pass',
    });
  });

  it('bounds people and time from below without sizing the reserve', () => {
    expect(VA_EHR_2023_REVIEW.placements.people).toMatchObject({ status: 'fits', fitLowerBound: 0 });
    expect(VA_EHR_2023_REVIEW.placements.time).toMatchObject({ status: 'fits', fitLowerBound: 0 });
  });

  it('cites only sources published on or before the decision date', () => {
    for (const source of citedSources()) {
      expect(source.publishedAt <= DECISION_DATE, `${source.id} published ${source.publishedAt}`).toBe(true);
    }
  });

  it('keeps the $49.8B lifecycle estimate out of the verdict, because it was published a month later', () => {
    const estimate = facts.find(({ id }) => id === 'va-lifecycle-estimate-2022')!;
    const source = sources.find(({ id }) => id === estimate.evidence[0].sourceId)!;

    // Describes September 2022, but was not publicly usable until after the reset.
    expect(estimate.observedAt).toBe('2022-09-01');
    expect(source.publishedAt).toBe('2023-05-18');
    expect(source.publishedAt > DECISION_DATE).toBe(true);
    expect(citedSources().map(({ id }) => id)).not.toContain(source.id);
  });

  it('is reproducible from its authored input', () => {
    expect(evaluateCommitmentReview(VA_EHR_2023_REVIEW_INPUT)).toEqual(VA_EHR_2023_REVIEW);
  });
});

describe('VA EHR verdict discrimination across dates', () => {
  it('moves with the requested increment rather than with the program\'s reputation', () => {
    // The release that should not have happened, and the decision to stop
    // releasing, are not the same question and must not score the same.
    expect(VA_EHR_2020_REVIEW.outcome).toBe('FLOOR');
    expect(VA_EHR_2020_REVIEW.should).toBe('no');
    expect(VA_EHR_2020_REVIEW.can).toBe('no');

    expect(VA_EHR_2023_REVIEW.outcome).toBe('FOG');
    expect(VA_EHR_2023_REVIEW.should).toBe('yes');
    expect(VA_EHR_2023_REVIEW.can).toBe('unknown');
  });

  it('stops breaking on people once the increment stops adding sites', () => {
    expect(VA_EHR_2020_REVIEW.breakingModels).toEqual(['people']);
    expect(VA_EHR_2023_REVIEW.breakingModels).toEqual([]);
  });
});
