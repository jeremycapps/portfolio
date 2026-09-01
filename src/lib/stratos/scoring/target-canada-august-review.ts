import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

export const TARGET_CANADA_AUGUST_2013_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale: 'The existing 68-store operation and stated continuation plan establish a live strategic commitment, but do not place readiness or reserve boundaries for another 56 stores.',
  valueSourceRefs: ['canada-stores-operating-q2', 'canada-stores-remaining-2013'],
  riskFloors: [
    { id: 'readiness', status: 'unknown', rationale: 'No documented release gates, inventory/in-stock thresholds, or distribution thresholds are available.', sourceRefs: ['canada-pilot-purpose', 'canada-stores-remaining-2013'] },
    { id: 'operating-economics', status: 'unknown', rationale: 'Q2 results are early launch evidence and do not place mature-store economics or loss tolerance.', sourceRefs: ['canada-sales-q2-2013', 'canada-gross-margin-q2-2013', 'canada-ebit-q2-2013'] },
    { id: 'authority', status: 'unknown', rationale: 'The public statement does not document the decision authority or delegation boundary for the remaining openings.', sourceRefs: ['canada-stores-remaining-2013'] },
  ],
  placements: {
    people: { kind: 'indeterminate', reason: 'Staffing and readiness capacity for another 56 stores are not quantified.' },
    time: { kind: 'indeterminate', reason: 'A year-end intent is public, but readiness cycle time and gate cadence are not.' },
    finance: { kind: 'indeterminate', reason: 'Q2 loss is observed, but remaining load, committed capital, and loss tolerance are not placed.' },
  },
};

export const TARGET_CANADA_AUGUST_2013_REVIEW = evaluateCommitmentReview(
  TARGET_CANADA_AUGUST_2013_REVIEW_INPUT,
);
