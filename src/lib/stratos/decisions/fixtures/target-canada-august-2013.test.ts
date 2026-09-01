import { describe, expect, it } from 'vitest';

import { TARGET_CANADA } from '../../cases';
import type { CaseProfile } from '../../cases/profile';
import { evaluateCommitmentReview } from '../../scoring/rubric';
import { validateDecisionPoint } from '../evidence-integrity';
import {
  TARGET_CANADA_AUGUST_2013_DECISION_PACKET,
  TARGET_CANADA_AUGUST_2013_DECISION_POINT,
  TARGET_CANADA_AUGUST_2013_REVIEW,
  TARGET_CANADA_AUGUST_2013_REVIEW_INPUT,
} from './target-canada-august-2013';
import { resolveDecisionPoint } from '../evidence-integrity';

describe('Target Canada August 2013 decision point', () => {
  it('passes FND-02 validation and links to the cutoff-safe August snapshot', () => {
    expect(validateDecisionPoint(TARGET_CANADA_AUGUST_2013_DECISION_POINT, TARGET_CANADA)).toEqual([]);
    expect(TARGET_CANADA_AUGUST_2013_DECISION_PACKET.snapshot).toMatchObject({
      id: 'scaling-boundary-2013-08-21',
      knowledgeCutoff: '2013-08-21',
    });
    expect(TARGET_CANADA_AUGUST_2013_DECISION_POINT).toMatchObject({
      sequence: 'T2',
      decisionDate: '2013-08-21',
      knowledgeCutoff: '2013-08-21',
      currentCommitment: { metric: { value: 68, unit: 'stores operating' } },
      requestedIncrement: { metric: { value: 56, unit: 'stores planned to open' } },
      actor: { authorityStatus: 'unknown', provenance: 'inferred' },
      irreversibility: { level: 'high', provenance: 'analytical' },
    });
  });

  it('labels framework constructs and reconstructs only the stated continuation intent', () => {
    expect(TARGET_CANADA_AUGUST_2013_DECISION_POINT.constructs).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'target-t1', provenance: 'analytical' }),
      expect.objectContaining({ id: 'target-t2', provenance: 'analytical' }),
      expect.objectContaining({ id: 'target-release-gates', provenance: 'assumption' }),
      expect.objectContaining({ id: 'target-tranche-alternatives', provenance: 'assumption' }),
    ]));
    expect(TARGET_CANADA_AUGUST_2013_DECISION_POINT.actualOperations.map(({ operation, object }) => ({
      operation,
      object,
    }))).toEqual([
      {
        operation: 'CONTINUE',
        object: 'learn, adjust, and refine operations in the existing 68 Canadian stores',
      },
      {
        operation: 'PREPARE',
        object: 'prepare to open another 56 Canadian stores by year-end',
      },
    ]);
  });

  it('keeps every named readiness, economics, and authority gap material and unknown', () => {
    expect(TARGET_CANADA_AUGUST_2013_DECISION_POINT.materialUnknowns.map(({ id }) => id)).toEqual([
      'readiness-gates-unknown',
      'inventory-in-stock-unknown',
      'distribution-thresholds-unknown',
      'mature-store-economics-unknown',
      'loss-tolerance-unknown',
      'authority-unknown',
    ]);
    expect(TARGET_CANADA_AUGUST_2013_DECISION_POINT.materialUnknowns.every((input) => (
      input.displayState === 'FOG' && input.materiality === 'material' && !('metric' in input)
    ))).toBe(true);
  });

  it('evaluates the contemporaneous review as FOG without later evidence', () => {
    expect(TARGET_CANADA_AUGUST_2013_REVIEW).toMatchObject({ outcome: 'FOG', can: 'unknown' });
    const laterFactIds = new Set([
      'canada-sales-2013',
      'canada-gross-margin-2013',
      'canada-ebit-2013',
      'stores-at-exit',
      'exit-charge-2014',
    ]);
    expect(TARGET_CANADA_AUGUST_2013_REVIEW_INPUT.valueSourceRefs.some((ref) => laterFactIds.has(ref))).toBe(false);
    expect(TARGET_CANADA_AUGUST_2013_REVIEW_INPUT.riskFloors.flatMap(({ sourceRefs }) => sourceRefs)
      .some((ref) => laterFactIds.has(ref))).toBe(false);
    expect(TARGET_CANADA_AUGUST_2013_DECISION_PACKET.contemporaneousInputs.every((input) => (
      input.publishedAt === undefined || input.publishedAt <= '2013-08-21'
    ))).toBe(true);
  });

  it('does not let additional later facts alter the contemporaneous packet or review', () => {
    const profileWithLaterWarning: CaseProfile = {
      ...TARGET_CANADA,
      facts: [
        ...TARGET_CANADA.facts,
        {
          id: 'synthetic-later-warning',
          statement: 'A deliberately later warning used to prove packet isolation.',
          observedAt: '2013-11-02',
          origin: 'reported',
          metric: { value: -999, unit: 'test-only warning units' },
          evidence: [{ sourceId: 'target-q3-results-2013', locator: 'Canadian Segment Results' }],
        },
      ],
    };
    const packet = resolveDecisionPoint(TARGET_CANADA_AUGUST_2013_DECISION_POINT, profileWithLaterWarning);

    expect(packet.contemporaneousInputs).toEqual(TARGET_CANADA_AUGUST_2013_DECISION_PACKET.contemporaneousInputs);
    expect(packet.contemporaneousInputs.some(({ factRef }) => factRef === 'synthetic-later-warning')).toBe(false);
    expect(evaluateCommitmentReview(TARGET_CANADA_AUGUST_2013_REVIEW_INPUT)).toEqual(
      TARGET_CANADA_AUGUST_2013_REVIEW,
    );
  });
});
