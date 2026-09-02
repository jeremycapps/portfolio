import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/** Watson × MD Anderson — T1, the $15M Phase 1A authorization on 2014-02-06. */
export const WATSON_MD_ANDERSON_2014_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale: 'Live-system testing was described as initially positive and broader access to specialist knowledge remained a plausible value case. The same Regents record explicitly says everyday physician adoption still had to be established.',
  valueSourceRefs: ['oea-live-testing-2013', 'oea-community-adoption-unproven'],
  riskFloors: [
    {
      id: 'clinical-adoption',
      status: 'unknown',
      rationale: 'The decision record identifies everyday use by physicians outside a specialty center as unproven but supplies no adoption threshold that Phase 1A had to clear.',
      sourceRefs: ['oea-community-adoption-unproven'],
    },
    {
      id: 'delivery-system-integration',
      status: 'unknown',
      rationale: 'Integration and testing in network delivery systems was work authorized for the next phase, not a readiness condition already shown to hold.',
      sourceRefs: ['oea-community-integration-next'],
    },
    {
      id: 'exposure-tolerance',
      status: 'unknown',
      rationale: 'The Board authorized up to $15 million from restricted gift funds, but the record does not disclose total lifecycle cost, received funding, or the maximum tolerable loss.',
      sourceRefs: ['oea-phase-1a-authorization'],
    },
  ],
  placements: {
    people: { kind: 'indeterminate', reason: 'No clinical, integration, or adoption-support requirement is placed against available capacity.' },
    time: { kind: 'indeterminate', reason: 'No completion date or integration-and-adoption cycle time is stated for Phase 1A.' },
    finance: { kind: 'indeterminate', reason: 'The $15 million figure is an authorization for one phase, not evidence of total project affordability or financial reserve.' },
  },
};

export const WATSON_MD_ANDERSON_2014_REVIEW = evaluateCommitmentReview(
  WATSON_MD_ANDERSON_2014_REVIEW_INPUT,
);
