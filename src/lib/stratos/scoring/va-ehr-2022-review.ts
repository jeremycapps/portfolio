import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/**
 * VA EHR — T2, the expansion beyond the first site on 2022-03-26.
 *
 * The dates are the whole review. The inspector general published its findings
 * on the first site's support process on 2022-03-17. The next site went live
 * nine days later. Both are public, and the gap between them is the decision.
 *
 * This resolves to FLOOR for the same structural reason as T1, on a different
 * condition. More than 38,700 support tickets had been raised at the first site
 * in roughly five months, and a third of the medication-management tickets the
 * inspector general reviewed had been closed with no documented resolution —
 * closed, that is, without evidence the problem was fixed. Adding a second site
 * while the first site's findings stood open breaches a precondition, and
 * floors gate capacity, so no capacity placement is needed to reach the
 * verdict.
 *
 * The people and finance models stay indeterminate here on purpose. Ticket
 * volume evidences that support demand exceeded what was being cleared, but it
 * is not a staffing figure: there is no published count of support positions
 * required or filled at either site, so the shortfall that could be placed at
 * T1 cannot be placed here. Stating it anyway would be inventing the denominator.
 */
export const VA_EHR_2022_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale:
    'The continuity-of-care mission is unchanged and is not contested by the evidence at this date. What the published record contests is the timing of this increment, not whether the goal is worth reaching.',
  valueSourceRefs: ['va-mission-value-2018', 'va-go-live-2020'],
  riskFloors: [
    {
      id: 'first-site-remediation',
      status: 'trip',
      rationale:
        'Nine days before this deployment, the inspector general reported that support-process deficiencies at the first site remained unresolved: more than 38,700 tickets raised in roughly five months, and 33 percent of the reviewed medication-management tickets closed without documented resolution. The condition that the first site be working before a second is added was evidenced as not holding.',
      sourceRefs: ['va-support-tickets-2021', 'va-unresolved-medication-tickets-2021'],
    },
    {
      id: 'capability-availability',
      status: 'unknown',
      rationale:
        'The evidence published at this date describes support and resolution behaviour, not the configuration itself. Whether the capability gaps mitigated at the first release had been closed, or the mitigations retired, is not publicly established.',
      sourceRefs: ['va-support-tickets-2021'],
    },
    {
      id: 'patient-safety-tolerance',
      status: 'unknown',
      rationale:
        'Medication-management tickets closed without documented resolution are patient-safety relevant on their face, and the inspector general said resolving them before further deployment could reduce risk. No published threshold defines how much such risk VA was prepared to carry into a new site, so the floor is elevated but not placeable.',
      sourceRefs: ['va-unresolved-medication-tickets-2021'],
    },
  ],
  placements: {
    people: {
      kind: 'indeterminate',
      reason:
        'Ticket volume and unresolved-closure rate evidence a support system absorbing more than it cleared, but neither is a staffing figure. No source published at this date counts the support positions required or filled at either site, so no shortfall can be placed.',
    },
    time: {
      kind: 'indeterminate',
      reason:
        'Seventeen months of calendar time had passed since the first release, and the interval between the inspector general\'s report and this deployment was nine days. Elapsed time is observable; the remediation cycle time the open findings required is not, so no fit can be stated.',
    },
    finance: {
      kind: 'indeterminate',
      reason:
        'No cutoff-safe evidence places remediation cost or per-site deployment cost against remaining program funding. Finance is not the binding constraint the published evidence identifies at this date.',
    },
  },
};

export const VA_EHR_2022_REVIEW = evaluateCommitmentReview(VA_EHR_2022_REVIEW_INPUT);
