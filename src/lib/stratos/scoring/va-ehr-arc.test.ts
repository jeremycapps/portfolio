import { describe, expect, it } from 'vitest';

import { VA_EHR_MODERNIZATION } from '../cases/va-ehr-modernization';
import type { CommitmentReviewInput } from './rubric';
import { evaluateCommitmentReview } from './rubric';
import { VA_EHR_2018_REVIEW, VA_EHR_2018_REVIEW_INPUT } from './va-ehr-2018-review';
import { VA_EHR_2020_REVIEW } from './va-ehr-2020-review';
import { VA_EHR_2022_REVIEW, VA_EHR_2022_REVIEW_INPUT } from './va-ehr-2022-review';
import { VA_EHR_2023_REVIEW } from './va-ehr-2023-review';

const { facts, sources } = VA_EHR_MODERNIZATION;

/** Every source behind a review's cited facts, so the cutoff can be checked. */
function citedSources(input: CommitmentReviewInput) {
  const refs = new Set([
    ...input.valueSourceRefs,
    ...input.riskFloors.flatMap(({ sourceRefs }) => sourceRefs),
  ]);
  return [...refs].flatMap((ref) => {
    const fact = facts.find((candidate) => candidate.id === ref);
    expect(fact, `unknown fact reference: ${ref}`).toBeDefined();
    return fact!.evidence.map(({ sourceId }) => sources.find((s) => s.id === sourceId)!);
  });
}

describe('VA EHR authorization, 2018-05-17', () => {
  it('reports fog rather than a verdict the award cannot support', () => {
    expect(VA_EHR_2018_REVIEW).toMatchObject({ outcome: 'FOG' });
  });

  it('holds that a ceiling and an appropriation are not a reserve', () => {
    const { finance } = VA_EHR_2018_REVIEW_INPUT.placements;
    expect(finance.kind).toBe('indeterminate');
    // Both money facts are cited by the review, so the fog is not an absence of
    // evidence about money — it is evidence that does not place capacity.
    expect(facts.find(({ id }) => id === 'va-contract-ceiling-2018')).toMatchObject({
      metric: { value: 10, unit: 'USD billions contract ceiling' },
    });
    expect(facts.find(({ id }) => id === 'va-fy2018-appropriation')).toMatchObject({
      metric: { value: 782, unit: 'USD millions appropriated' },
    });
  });

  it('cites only sources published on or before the decision date', () => {
    for (const source of citedSources(VA_EHR_2018_REVIEW_INPUT)) {
      expect(source.publishedAt <= '2018-05-17', `${source.id} published ${source.publishedAt}`).toBe(true);
    }
  });
});

describe('VA EHR expansion, 2022-03-26', () => {
  it('fails on a breached precondition rather than a capacity collision', () => {
    expect(VA_EHR_2022_REVIEW).toMatchObject({ outcome: 'FLOOR', should: 'no' });
    // No capacity model is placed, so the floor alone carries the verdict.
    expect(VA_EHR_2022_REVIEW.breakingModels).toEqual([]);
  });

  it('trips on the first site rather than on the site being added', () => {
    const tripped = VA_EHR_2022_REVIEW_INPUT.riskFloors.filter(({ status }) => status === 'trip');
    expect(tripped.map(({ id }) => id)).toEqual(['first-site-remediation']);
  });

  it('places no people shortfall, because ticket volume is not a staffing count', () => {
    expect(VA_EHR_2022_REVIEW_INPUT.placements.people.kind).toBe('indeterminate');
  });

  it('rests on findings published before the deployment it reviews', () => {
    const oig = sources.find(({ id }) => id === 'va-oig-ticket-process-2022')!;
    const goLive = sources.find(({ id }) => id === 'va-walla-walla-live-2022')!;
    expect(oig.publishedAt).toBe('2022-03-17');
    expect(goLive.publishedAt).toBe('2022-03-26');
    for (const source of citedSources(VA_EHR_2022_REVIEW_INPUT)) {
      expect(source.publishedAt <= '2022-03-26', `${source.id} published ${source.publishedAt}`).toBe(true);
    }
  });

  it('is reproducible from its authored input', () => {
    expect(evaluateCommitmentReview(VA_EHR_2022_REVIEW_INPUT)).toEqual(VA_EHR_2022_REVIEW);
  });
});

describe('the VA arc across four dates', () => {
  it('recovers at the pause instead of ratcheting on the program’s reputation', () => {
    expect([
      VA_EHR_2018_REVIEW.outcome,
      VA_EHR_2020_REVIEW.outcome,
      VA_EHR_2022_REVIEW.outcome,
      VA_EHR_2023_REVIEW.outcome,
    ]).toEqual(['FOG', 'FLOOR', 'FLOOR', 'FOG']);
  });

  it('clears the floors on the increment that stops adding sites', () => {
    // The same conditions are evaluated at every date; only the increment
    // changes. A pause cannot breach a readiness floor, so they pass.
    expect(VA_EHR_2023_REVIEW.outcome).not.toBe('FLOOR');
    expect(VA_EHR_2022_REVIEW.should).toBe('no');
    expect(VA_EHR_2023_REVIEW.should).toBe('yes');
  });
});
