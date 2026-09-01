import { describe, expect, it } from 'vitest';

import {
  ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD,
  TARGET_CANADA_COMMITMENT_SCORECARD,
  TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD,
} from '../scoring/commitment-scorecards';
import type { CommitmentReviewInput, RiskFloorInput } from '../scoring/rubric';
import {
  VALIDATED_SCALE_NOT_DETERMINED,
  adaptCommitmentReview,
  type CommitmentReviewAdapterInput,
} from './verdict-adapter';

const scale = {
  description: 'One evidenced release cohort',
  evidenceRefs: [{ sourceId: 'release-cohort', locator: 'release report, cohort table' }],
} as const;

const causeEvidenceRefs = [
  { sourceId: 'decision-packet', locator: 'commitment review' },
] as const;

function withFloor(
  source: CommitmentReviewInput,
  value: CommitmentReviewInput['value'],
  riskFloors: readonly RiskFloorInput[],
): CommitmentReviewInput {
  return {
    ...source,
    value,
    valueRationale: value === 'not-worth-pursuing'
      ? 'The evidenced value floor is breached.'
      : source.valueRationale,
    riskFloors,
  };
}

function adapterInput(commitmentReview: CommitmentReviewInput): CommitmentReviewAdapterInput {
  return { commitmentReview, causeEvidenceRefs };
}

describe('commitment-review verdict adapter', () => {
  it('maps ABSORBABLE to FIT only at an evidenced validated scale', () => {
    const mapped = adaptCommitmentReview({
      ...adapterInput(ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput),
      validatedScale: scale,
    });

    expect(mapped).toMatchObject({
      verdict: 'FIT',
      validatedScale: 'One evidenced release cohort',
      bindingDimensions: [],
      cause: { kind: 'fit', evidenceRefs: scale.evidenceRefs },
    });
  });

  it('does not invent a favorable scale for an otherwise absorbable review', () => {
    const mapped = adaptCommitmentReview(adapterInput(
      ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput,
    ));

    expect(mapped).toMatchObject({
      verdict: 'FOG',
      validatedScale: VALIDATED_SCALE_NOT_DETERMINED,
      materialUnknowns: ['Validated scale'],
      cause: { kind: 'material-uncertainty' },
    });
  });

  it('does not produce FIT when decision-specific material uncertainty remains', () => {
    const mapped = adaptCommitmentReview({
      ...adapterInput(ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput),
      validatedScale: scale,
      materialUnknowns: ['Authority boundary'],
    });

    expect(mapped).toMatchObject({
      verdict: 'FOG',
      validatedScale: 'One evidenced release cohort',
      materialUnknowns: ['Authority boundary'],
      cause: { kind: 'material-uncertainty' },
    });
  });

  it('retains native FOG unknowns and additional decision-material unknowns', () => {
    const mapped = adaptCommitmentReview({
      ...adapterInput(TARGET_CANADA_COMMITMENT_SCORECARD.commitmentReviewInput),
      materialUnknowns: ['Inventory accuracy', 'Distribution readiness'],
    });

    expect(mapped.verdict).toBe('FOG');
    expect(mapped.cause.kind).toBe('material-uncertainty');
    expect(mapped.materialUnknowns).toEqual([
      'Inventory accuracy',
      'Distribution readiness',
      'Risk floor: liquidity',
      'Risk floor: stakeholder-legitimacy',
      'Risk floor: change-readiness',
      'Risk floor: delivery-governance',
      'people capacity',
      'time capacity',
      'finance capacity',
    ]);
  });

  it('maps COLLISION while retaining independent binding model order', () => {
    const mapped = adaptCommitmentReview(adapterInput(
      TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput,
    ));

    expect(mapped).toMatchObject({
      verdict: 'COLLISION',
      bindingDimensions: ['time', 'finance'],
      cause: { kind: 'capacity' },
    });
  });

  it('uses an authored collision subtype instead of parsing display prose', () => {
    const mapped = adaptCommitmentReview({
      ...adapterInput(TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput),
      collisionCause: 'readiness',
    });
    expect(mapped.cause.kind).toBe('readiness');
  });

  it('maps a known value-floor breach to a value-floor COLLISION', () => {
    const base = ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput;
    const mapped = adaptCommitmentReview(adapterInput(withFloor(base, 'not-worth-pursuing', base.riskFloors)));

    expect(mapped).toMatchObject({
      verdict: 'COLLISION',
      cause: {
        kind: 'value-floor',
        summary: 'The evidenced value floor is breached.',
      },
    });
  });

  it('maps a known risk-floor breach to a risk-floor COLLISION', () => {
    const base = ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput;
    const riskFloors = [{
      id: 'legal-operability',
      status: 'trip',
      rationale: 'A documented legal condition prevents operation.',
      sourceRefs: ['legal-finding'],
    }] as const;
    const mapped = adaptCommitmentReview(adapterInput(withFloor(base, 'worth-pursuing', riskFloors)));

    expect(mapped).toMatchObject({
      verdict: 'COLLISION',
      cause: {
        kind: 'risk-floor',
        summary: 'A documented legal condition prevents operation.',
      },
    });
  });

  it.each([
    ['unknown value floor', 'unknown', [{
      id: 'legal-operability',
      status: 'pass',
      rationale: 'The legal floor passes.',
      sourceRefs: ['legal-finding'],
    }]],
    ['unknown risk floor', 'worth-pursuing', [{
      id: 'legal-operability',
      status: 'unknown',
      rationale: 'The legal floor is unresolved.',
      sourceRefs: ['legal-finding'],
    }]],
  ] as const)('keeps an %s in FOG', (_label, value, riskFloors) => {
    const base = ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput;
    const mapped = adaptCommitmentReview(adapterInput(withFloor(base, value, riskFloors)));
    expect(mapped.verdict).toBe('FOG');
    expect(mapped.cause.kind).toBe('material-uncertainty');
  });

  it('never ranks or collapses raw deficits across incompatible units', () => {
    const mapped = adaptCommitmentReview(adapterInput(
      TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput,
    ));

    expect(mapped.bindingDimensions).toEqual(['time', 'finance']);
    expect(JSON.stringify(mapped)).not.toMatch(/-11|-941|months|USD millions/);
  });

  it('returns deep-equal content for identical stable inputs', () => {
    const input = {
      ...adapterInput(TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput),
      collisionCause: 'capacity' as const,
      materialUnknowns: ['Workforce readiness'],
    };
    expect(adaptCommitmentReview(input)).toEqual(adaptCommitmentReview(input));
  });
});
