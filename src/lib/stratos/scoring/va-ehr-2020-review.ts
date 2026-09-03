import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/**
 * VA EHR — T1, the first production release at Mann-Grandstaff on 2020-10-24.
 *
 * Every source here was published on or before the decision date; the earliest
 * and most decisive were published 2020-04-27, six months ahead of it. None of
 * the later ticket burden or patient-harm findings inform this review.
 *
 * This resolves to FLOOR, not COLLISION. Two readiness conditions were
 * evidenced as breached — infrastructure incomplete, required capabilities
 * unavailable behind 84 workarounds — and floors gate capacity, so the release
 * fails before the staffing question is reached. The staffing collision is real
 * and survives in `breakingModels` and the people placement; it is simply not
 * the first thing wrong.
 *
 * Retrodictive narratives of this case tend to report it as a capacity
 * collision, because a model without a floor concept has nowhere else to route
 * a breached precondition. The distinction is worth keeping: a collision says
 * the increment was too large for the reserve, while a floor says the
 * increment should not have been released at any size until the condition
 * held.
 */
export const VA_EHR_2020_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale: 'VA stated a continuity-and-coordination-of-care mission for the shared record, and the first site placed more than 24,000 primary-care Veterans in the initial operating population. The mission case is documented; what is not documented is any threshold at which the cost of reaching it stops being worth paying.',
  valueSourceRefs: ['va-mission-value-2018', 'va-initial-population-2020'],
  riskFloors: [
    {
      id: 'infrastructure-readiness',
      status: 'trip',
      rationale: 'Critical physical and IT infrastructure upgrades were incomplete six months before the originally scheduled deployment and some remained incomplete on 2020-01-08, and the inspector general found VA had committed to the original date without sufficient information about the medical center\'s infrastructure state.',
      sourceRefs: ['va-infrastructure-incomplete-2020', 'va-date-committed-without-readiness-2020'],
    },
    {
      id: 'capability-availability',
      status: 'trip',
      rationale: 'Required capabilities were not all available at go-live: 62 systems were rated moderate or high risk and VA planned as many as 84 mitigations to work around them.',
      sourceRefs: ['va-risk-systems-2020', 'va-planned-mitigations-2020'],
    },
    {
      id: 'patient-safety-tolerance',
      status: 'unknown',
      rationale: 'The inspector general concluded that releasing with mitigated, reduced capabilities added patient-safety risk beyond the level inherent to an EHR deployment. No published threshold defines how much added risk VA was prepared to accept, so the floor is elevated but not placeable.',
      sourceRefs: ['va-patient-safety-risk-2020'],
    },
  ],
  placements: {
    people: {
      kind: 'evidenced-shortfall',
      scope: 'Mann-Grandstaff EHR rollout-support staffing',
      required: {
        value: { low: 108, high: 108 },
        unit: 'rollout-support positions',
        state: 'observed',
        confidence: 0.85,
        asOf: '2020-01-08',
        sourceRef: 'va-rollout-support-required-2020',
        sourceClass: 'A',
      },
      available: {
        value: { low: 48, high: 60 },
        unit: 'rollout-support positions',
        state: 'estimated',
        confidence: 0.7,
        asOf: '2020-01-08',
        sourceRef: 'va-rollout-support-filled-2020',
        sourceClass: 'A',
      },
    },
    time: {
      kind: 'indeterminate',
      reason: 'The original March date slipped and remediation continued into the autumn, but no published evidence places the verification cycle this release required, or whether it completed before October 24.',
    },
    finance: {
      kind: 'indeterminate',
      reason: 'The program was funded at scale and no cutoff-safe evidence places site-level deployment cost against site-level financial capacity. Finance is not the binding constraint the pre-release evidence identifies.',
    },
  },
};

export const VA_EHR_2020_REVIEW = evaluateCommitmentReview(VA_EHR_2020_REVIEW_INPUT);
