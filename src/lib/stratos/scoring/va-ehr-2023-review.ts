import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/**
 * VA EHR — T3, the 2023-04-21 reset.
 *
 * The requested increment turns negative here: VA asked to stop adding
 * deployments and redirect resources to the five sites already operating. That
 * is a different question from the one T1 failed, and the case exists partly to
 * check that the engine notices. A model reading the program's reputation
 * rather than the increment in front of it would return the same adverse
 * verdict at every date.
 *
 * The readiness floors that tripped at T1 are not breached by a pause. Halting
 * conversions cannot deliver a site onto incomplete infrastructure, and it adds
 * no new capability gaps — so those conditions pass on this increment, while
 * the exposure already carried at five live systems is unchanged rather than
 * cured.
 *
 * This resolves to FOG rather than a clean pass, and the reason is finance. No
 * source published on or before this date places the cost of the remediation
 * program against remaining program funding. The $49.8 billion lifecycle
 * estimate that later reporting attaches to this period describes September
 * 2022 but was not publicly usable until 2023-05-18, a month after the reset,
 * so it cannot inform this verdict. FOG is the disciplined answer, and it is
 * still a move: the release stops being affirmatively wrong.
 */
export const VA_EHR_2023_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale: 'The continuity-of-care mission is unchanged, and the increment under review serves it directly: improving five operating systems before adding a sixth. Nothing published at this date argues the goal had stopped being worth pursuing.',
  valueSourceRefs: ['va-mission-value-2018', 'va-deployment-halt-2023'],
  riskFloors: [
    {
      id: 'infrastructure-readiness',
      status: 'pass',
      rationale: 'The increment adds no site conversion, so no site can be released onto incomplete infrastructure. The condition that tripped at the first release cannot be breached by halting deployments.',
      sourceRefs: ['va-deployment-halt-2023'],
    },
    {
      id: 'capability-availability',
      status: 'pass',
      rationale: 'No new population is moved onto the system, so the increment introduces no further reliance on unavailable capabilities. Redirecting resources to the operating sites works toward closing the existing gaps rather than widening them.',
      sourceRefs: ['va-deployment-halt-2023', 'va-sites-live-at-reset-2023'],
    },
    {
      id: 'incremental-safety-exposure',
      status: 'pass',
      rationale: 'Stopping conversions adds no further site-level patient-safety exposure. The exposure already carried at the five live systems continues, but the increment under review does not enlarge it.',
      sourceRefs: ['va-deployment-halt-2023', 'va-sites-live-at-reset-2023'],
    },
  ],
  placements: {
    people: {
      kind: 'structural-lower-bound',
      fitAtLeast: 0,
      unit: 'site-conversion staffing load',
      confidence: 0.6,
      rationale: 'The increment requires zero new site conversions, so the conversion staffing it demands cannot exceed what the halted deployments would have consumed. This establishes nonnegative fit without claiming to size VA\'s implementation reserve or the remediation requirement.',
      sources: [
        { ref: 'va-deployment-halt-2023', sourceClass: 'A' },
        { ref: 'va-sites-live-at-reset-2023', sourceClass: 'A' },
      ],
    },
    time: {
      kind: 'structural-lower-bound',
      fitAtLeast: 0,
      unit: 'verification time against deployment schedule',
      confidence: 0.55,
      rationale: 'Removing scheduled deployments creates verification time rather than consuming it. The pause duration was not announced, so this establishes nonnegative fit without quantifying the surplus.',
      sources: [{ ref: 'va-deployment-halt-2023', sourceClass: 'A' }],
    },
    finance: {
      kind: 'indeterminate',
      reason: 'No source published on or before 2023-04-21 places the cost of the remediation program against remaining program funding. The $49.8 billion lifecycle estimate became publicly usable on 2023-05-18 and is hindsight relative to this decision.',
    },
  },
};

export const VA_EHR_2023_REVIEW = evaluateCommitmentReview(VA_EHR_2023_REVIEW_INPUT);
