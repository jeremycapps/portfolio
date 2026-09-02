import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/** McDonald's × IBM AOT — T1, the field-accuracy warning on 2022-06-23. */
export const MCDONALDS_IBM_AOT_2022_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale: 'The operating thesis remained plausible and the test was still bounded to 24 restaurants. The first public accuracy reading, however, remained in the low-80% range against the reported 95%-plus condition for broader adoption.',
  valueSourceRefs: ['mcd-aot-test-24-restaurants', 'mcd-aot-low-80s-accuracy', 'mcd-aot-95-percent-gate'],
  riskFloors: [
    {
      id: 'broader-adoption-readiness',
      status: 'unknown',
      rationale: 'The 24-restaurant test had not cleared the 95%-plus accuracy gate, and the public report did not establish when or whether it would. That blocks broader adoption without proving the bounded test itself should stop.',
      sourceRefs: ['mcd-aot-test-24-restaurants', 'mcd-aot-low-80s-accuracy', 'mcd-aot-95-percent-gate'],
    },
    {
      id: 'accuracy-improvement-path',
      status: 'unknown',
      rationale: 'BTIG said the technology was evolving rapidly but supplied no observed improvement rate, validation cycle, or release date.',
      sourceRefs: ['mcd-aot-improvement-path-2022'],
    },
    {
      id: 'operational-benefit',
      status: 'unknown',
      rationale: 'The public warning did not place realized labor savings, speed improvement, or the crew-intervention load at the 24 restaurants.',
      sourceRefs: ['mcd-aot-test-24-restaurants', 'mcd-aot-low-80s-accuracy'],
    },
  ],
  placements: {
    people: { kind: 'indeterminate', reason: 'No crew-intervention, field-support, or engineering requirement is placed against available capacity.' },
    time: { kind: 'indeterminate', reason: 'The report gives no evidenced cycle time from low-80% accuracy to the 95%-plus broader-adoption gate.' },
    finance: { kind: 'indeterminate', reason: 'No program spend, per-restaurant economics, savings, or financial reserve was public at the warning boundary.' },
  },
};

export const MCDONALDS_IBM_AOT_2022_REVIEW = evaluateCommitmentReview(
  MCDONALDS_IBM_AOT_2022_REVIEW_INPUT,
);
