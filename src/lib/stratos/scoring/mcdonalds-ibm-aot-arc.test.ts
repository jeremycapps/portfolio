import { describe, expect, it } from 'vitest';

import { MCDONALDS_IBM_AOT } from '../cases/mcdonalds-ibm-aot';
import type { CommitmentReviewInput } from './rubric';
import { MCDONALDS_IBM_AOT_2021_REVIEW, MCDONALDS_IBM_AOT_2021_REVIEW_INPUT } from './mcdonalds-ibm-aot-2021-review';
import { MCDONALDS_IBM_AOT_2022_REVIEW, MCDONALDS_IBM_AOT_2022_REVIEW_INPUT } from './mcdonalds-ibm-aot-2022-review';
import { MCDONALDS_IBM_AOT_2024_REVIEW, MCDONALDS_IBM_AOT_2024_REVIEW_INPUT } from './mcdonalds-ibm-aot-2024-review';

const { facts, sources } = MCDONALDS_IBM_AOT;

function citedSources(input: CommitmentReviewInput) {
  const refs = new Set([
    ...input.valueSourceRefs,
    ...input.riskFloors.flatMap(({ sourceRefs }) => sourceRefs),
  ]);
  return [...refs].flatMap((ref) => {
    const fact = facts.find(({ id }) => id === ref);
    expect(fact, `unknown McDonald's AOT fact ${ref}`).toBeDefined();
    return fact!.evidence.map(({ sourceId }) => sources.find(({ id }) => id === sourceId)!);
  });
}

describe("McDonald's × IBM AOT decision arc", () => {
  it('moves from transfer fog to warning fog to a terminal readiness floor', () => {
    expect([
      MCDONALDS_IBM_AOT_2021_REVIEW.outcome,
      MCDONALDS_IBM_AOT_2022_REVIEW.outcome,
      MCDONALDS_IBM_AOT_2024_REVIEW.outcome,
    ]).toEqual(['FOG', 'FOG', 'FLOOR']);
  });

  it('keeps every review behind its own publication cutoff', () => {
    for (const [cutoff, input] of [
      ['2021-10-27', MCDONALDS_IBM_AOT_2021_REVIEW_INPUT],
      ['2022-06-23', MCDONALDS_IBM_AOT_2022_REVIEW_INPUT],
      ['2024-06-17', MCDONALDS_IBM_AOT_2024_REVIEW_INPUT],
    ] as const) {
      for (const source of citedSources(input)) {
        expect(source.publishedAt <= cutoff, `${source.id} published after ${cutoff}`).toBe(true);
      }
    }
  });

  it('lets the operational floor carry T2 without inventing a capacity collision', () => {
    expect(MCDONALDS_IBM_AOT_2024_REVIEW).toMatchObject({ outcome: 'FLOOR', should: 'no' });
    expect(MCDONALDS_IBM_AOT_2024_REVIEW.breakingModels).toEqual([]);
    expect(MCDONALDS_IBM_AOT_2024_REVIEW_INPUT.riskFloors.filter(({ status }) => status === 'trip'))
      .toHaveLength(1);
  });

  it('keeps finance indeterminate at all three boundaries', () => {
    for (const review of [
      MCDONALDS_IBM_AOT_2021_REVIEW,
      MCDONALDS_IBM_AOT_2022_REVIEW,
      MCDONALDS_IBM_AOT_2024_REVIEW,
    ]) {
      expect(review.placements.finance.status).toBe('indeterminate');
    }
  });
});
