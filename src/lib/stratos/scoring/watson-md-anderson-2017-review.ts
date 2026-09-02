import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/**
 * Watson × MD Anderson — T2, the terminal audit-and-halt boundary.
 *
 * The floor carries the verdict. Contract value and realized spend are known,
 * but neither places MD Anderson's available financial reserve, so the review
 * does not turn their difference into a fabricated capacity collision.
 */
export const WATSON_MD_ANDERSON_2017_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'not-worth-pursuing',
  valueRationale: 'The commitment was to support treatment in routine clinical care. After $62.1 million of reported spend, the advisor had not directed care for an actual patient and the IBM contract expired before that minimum value gate was reached.',
  valueSourceRefs: ['oea-routine-care-goal', 'oea-total-spend', 'oea-never-used-on-patients', 'oea-benched-2017'],
  riskFloors: [
    {
      id: 'clinical-use-readiness',
      status: 'trip',
      rationale: 'The tool never progressed into actual patient care before the IBM contract expired.',
      sourceRefs: ['oea-never-used-on-patients', 'oea-benched-2017'],
    },
    {
      id: 'ehr-integration-readiness',
      status: 'trip',
      rationale: 'The advisor had not been updated to integrate with MD Anderson’s current Epic record, so the routine-care dependency did not hold.',
      sourceRefs: ['oea-no-epic-integration'],
    },
    {
      id: 'procurement-governance',
      status: 'trip',
      rationale: 'The audit reviewed $51.4 million of noncompetitive awards and found payments for incomplete work while gift-funded project accounts were in deficit.',
      sourceRefs: ['oea-noncompetitive-awards', 'oea-incomplete-work-paid', 'oea-gift-fund-deficit'],
    },
  ],
  placements: {
    people: { kind: 'indeterminate', reason: 'The terminal record does not place a clinical or technical staffing requirement against available capacity.' },
    time: { kind: 'indeterminate', reason: 'Twelve extensions evidence elapsed commitment cycles, but the record does not place the cycle time required to reach verified routine use.' },
    finance: { kind: 'indeterminate', reason: 'Reported spend and award value place exposure, not MD Anderson’s available reserve. Their $10.7 million difference is a governance signal, not a capacity model.' },
  },
};

export const WATSON_MD_ANDERSON_2017_REVIEW = evaluateCommitmentReview(
  WATSON_MD_ANDERSON_2017_REVIEW_INPUT,
);
