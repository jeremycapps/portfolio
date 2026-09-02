import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/** Watson × MD Anderson — T0, the public product commitment on 2013-10-18. */
export const WATSON_MD_ANDERSON_2013_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale: 'A clinical advisor that made MD Anderson expertise and current evidence usable at the point of care had a plausible mission value. The announcement establishes the ambition, not its realization.',
  valueSourceRefs: ['oea-routine-care-goal', 'oea-leukemia-first'],
  riskFloors: [
    {
      id: 'clinical-use-readiness',
      status: 'unknown',
      rationale: 'The announcement describes a prototype and intended clinical use but gives no acceptance gate between them.',
      sourceRefs: ['oea-prototype-after-year', 'oea-routine-care-goal'],
    },
    {
      id: 'ehr-integration-readiness',
      status: 'unknown',
      rationale: 'Patient-record integration is part of the value proposition, but the announcement does not place an integration plan or readiness threshold.',
      sourceRefs: ['oea-routine-care-goal'],
    },
    {
      id: 'exposure-tolerance',
      status: 'unknown',
      rationale: 'No authorized budget, irreversible exposure, or loss tolerance was published with the launch.',
      sourceRefs: ['oea-prototype-after-year'],
    },
  ],
  placements: {
    people: { kind: 'indeterminate', reason: 'The public packet does not size clinical-expert time, engineering capacity, or workflow-change staffing.' },
    time: { kind: 'indeterminate', reason: 'No deadline or verified cycle time from prototype to routine clinical use is disclosed.' },
    finance: { kind: 'indeterminate', reason: 'The announcement contains no project envelope, available funding, or maximum exposure.' },
  },
};

export const WATSON_MD_ANDERSON_2013_REVIEW = evaluateCommitmentReview(
  WATSON_MD_ANDERSON_2013_REVIEW_INPUT,
);
