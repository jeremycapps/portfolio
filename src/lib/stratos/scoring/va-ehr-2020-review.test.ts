import { describe, expect, it } from 'vitest';

import { VA_EHR_MODERNIZATION } from '../cases';
import type { CaseFact, CaseSource } from '../cases/profile';
import { evaluateCommitmentReview } from './rubric';
import { VA_EHR_2020_REVIEW, VA_EHR_2020_REVIEW_INPUT } from './va-ehr-2020-review';

const DECISION_DATE = '2020-10-24';
const facts: readonly CaseFact[] = VA_EHR_MODERNIZATION.facts;
const sources: readonly CaseSource[] = VA_EHR_MODERNIZATION.sources;

/** Every source behind a fact this review cites. */
function citedSources(): CaseSource[] {
  const factRefs = new Set([
    ...VA_EHR_2020_REVIEW_INPUT.valueSourceRefs,
    ...VA_EHR_2020_REVIEW_INPUT.riskFloors.flatMap(({ sourceRefs }) => sourceRefs),
    ...Object.values(VA_EHR_2020_REVIEW_INPUT.placements).flatMap((placement) => (
      placement.kind === 'evidenced-shortfall'
        ? [placement.required.sourceRef, placement.available.sourceRef]
        : []
    )),
  ]);
  return [...factRefs].flatMap((ref) => {
    const fact = facts.find((candidate) => candidate.id === ref);
    expect(fact, `unknown fact reference: ${ref}`).toBeDefined();
    return fact!.evidence.map((evidence) => {
      const source = sources.find((candidate) => candidate.id === evidence.sourceId);
      expect(source, `unknown source: ${evidence.sourceId}`).toBeDefined();
      return source!;
    });
  });
}

describe('VA EHR first production release, 2020-10-24', () => {
  it('reaches FLOOR on breached readiness, with the staffing collision preserved beneath it', () => {
    expect(VA_EHR_2020_REVIEW).toMatchObject({
      outcome: 'FLOOR',
      should: 'no',
      can: 'no',
      breakingModels: ['people'],
    });
    expect(VA_EHR_2020_REVIEW.reasons).toEqual([
      'Risk floor tripped: infrastructure-readiness.',
      'Risk floor tripped: capability-availability.',
    ]);
  });

  it('places the staffing shortfall as a local collision, not an assertion about VA reserve', () => {
    expect(VA_EHR_2020_REVIEW.placements.people).toMatchObject({
      status: 'collides',
      fit: { low: -60, high: -48 },
      unit: 'rollout-support positions',
      method: 'evidenced-shortfall',
    });
    expect(VA_EHR_2020_REVIEW.placements.time.status).toBe('indeterminate');
    expect(VA_EHR_2020_REVIEW.placements.finance.status).toBe('indeterminate');
  });

  it('holds the mission value case open rather than deciding the program was not worth pursuing', () => {
    // FLOOR here is about this release, not about EHR modernization as a goal.
    expect(VA_EHR_2020_REVIEW_INPUT.value).toBe('worth-pursuing');
  });

  it('keeps the elevated patient-safety risk unresolved, because no tolerance was published', () => {
    const floor = VA_EHR_2020_REVIEW_INPUT.riskFloors.find(({ id }) => id === 'patient-safety-tolerance');
    expect(floor?.status).toBe('unknown');
  });

  it('cites only sources published on or before the decision date', () => {
    for (const source of citedSources()) {
      expect(source.publishedAt <= DECISION_DATE, `${source.id} published ${source.publishedAt}`).toBe(true);
    }
  });

  it('reaches its verdict six months before the release, on evidence published 2020-04-27', () => {
    const decisive = citedSources().filter((source) => source.kind === 'audit-report');
    expect(decisive.length).toBeGreaterThan(0);
    for (const source of decisive) {
      expect(source.publishedAt).toBe('2020-04-27');
    }
  });

  it('uses none of the post-release evidence the profile also registers', () => {
    const cited = new Set(citedSources().map(({ id }) => id));
    expect(cited.has('va-oig-ticket-process-2022')).toBe(false);
  });

  it('is reproducible from its authored input', () => {
    expect(evaluateCommitmentReview(VA_EHR_2020_REVIEW_INPUT)).toEqual(VA_EHR_2020_REVIEW);
  });
});
