import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/**
 * McDonald's × IBM AOT — T2, the decision to end the IBM path on 2024-06-17.
 *
 * Voice ordering remains worth pursuing in the company's own terminal statement.
 * The floor is narrower: this IBM path did not earn wider-adoption readiness.
 */
export const MCDONALDS_IBM_AOT_2024_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale: "McDonald's still said voice ordering belonged in the future drive-thru experience. The terminal decision rejected the IBM AOT path, not the value thesis for the category.",
  valueSourceRefs: ['mcd-aot-partnership-ended', 'mcd-voice-ordering-still-valued'],
  riskFloors: [
    {
      id: 'order-accuracy-readiness',
      status: 'trip',
      rationale: 'The last public accuracy measure placed AOT in the low-80% range against a 95%-plus broader-adoption gate. No later public measure established clearance; after the test grew beyond 100 restaurants, McDonald’s ended the IBM path and scheduled every test system for shutoff.',
      sourceRefs: [
        'mcd-aot-low-80s-accuracy',
        'mcd-aot-95-percent-gate',
        'mcd-aot-over-100-restaurants',
        'mcd-aot-partnership-ended',
        'mcd-aot-shutoff-by-july',
      ],
    },
    {
      id: 'operational-benefit',
      status: 'unknown',
      rationale: 'The test was meant to place operational savings and speed improvement, but McDonald’s did not publish those results when it ended the IBM path.',
      sourceRefs: ['mcd-aot-operational-test-purpose', 'mcd-aot-partnership-ended'],
    },
  ],
  placements: {
    people: { kind: 'indeterminate', reason: 'The terminal record does not place crew-intervention, field-support, or redeployment load against capacity.' },
    time: { kind: 'indeterminate', reason: 'The July shutoff date places the end of the IBM test, not the time required to validate a successor voice-ordering solution.' },
    finance: { kind: 'indeterminate', reason: "McDonald's disclosed no AOT budget, spend, impairment, savings, or financial reserve at any decision boundary." },
  },
};

export const MCDONALDS_IBM_AOT_2024_REVIEW = evaluateCommitmentReview(
  MCDONALDS_IBM_AOT_2024_REVIEW_INPUT,
);
