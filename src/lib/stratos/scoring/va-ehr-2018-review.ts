import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/**
 * VA EHR — T0, the Cerner contract authorization on 2018-05-17.
 *
 * The award is the most consequential decision in the case and the one the
 * public record can say least about. Everything published on the day places
 * authorization: a ten-year ceiling of roughly $10 billion, $782 million
 * already appropriated for fiscal 2018, a mission rationale, and an
 * acknowledgement that VA would add capabilities to the DoD platform rather
 * than adopt it unchanged.
 *
 * None of that places reserve. A ceiling is permission to spend, not evidence
 * that the conversion is affordable; an appropriation is one year of a ten-year
 * program. So finance is disclosed and still indeterminate, which is the
 * distinction the rubric exists to hold. People and time have nothing at all:
 * no implementation staffing, no site-conversion cycle time.
 *
 * This resolves to FOG, and the FOG is the finding. The largest committed
 * exposure in the library is authorized at the one date where no capacity
 * question can be answered, and no published gate, pilot criterion, or
 * stopping condition accompanies it. A verdict that read anything sharper here
 * would be reading the outcome rather than the packet.
 */
export const VA_EHR_2018_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale:
    'VA framed the expected value as continuity and coordination of care — a single record shared across VA, DoD, and community providers. The mission case is documented and is not contested by anything published at this date.',
  valueSourceRefs: ['va-mission-value-2018', 'va-contract-ceiling-2018'],
  riskFloors: [
    {
      id: 'release-gating',
      status: 'unknown',
      rationale:
        'The award documents a ten-year term and a contract ceiling. It documents no release gate, pilot acceptance criterion, or condition under which deployment would pause, so no precondition can be evaluated as held or breached.',
      sourceRefs: ['va-contract-ceiling-2018'],
    },
    {
      id: 'conversion-readiness',
      status: 'unknown',
      rationale:
        'VA stated it would add Veteran, clinician, and community-care capabilities to the common platform, so the required configuration differs from the DoD source configuration. The scope of that work, and any readiness standard a site would have to meet before conversion, are undisclosed.',
      sourceRefs: ['va-specific-capability-additions-2018'],
    },
    {
      id: 'exposure-tolerance',
      status: 'unknown',
      rationale:
        'The ceiling establishes how much may be spent, not how much VA was prepared to lose. Neither the irreversible portion of the commitment nor any tolerance for it is published.',
      sourceRefs: ['va-contract-ceiling-2018', 'va-fy2018-appropriation'],
    },
  ],
  placements: {
    people: {
      kind: 'indeterminate',
      reason:
        'No implementation staffing, clinical change capacity, or site-readiness capacity is placed at award. The packet does not establish what the conversion required of people, let alone what VA had.',
    },
    time: {
      kind: 'indeterminate',
      reason:
        'The ten-year term bounds the calendar. It does not place the cycle time required to configure, verify, and remediate the system in a VA clinical setting, so no fit between required and available time can be stated.',
    },
    finance: {
      kind: 'indeterminate',
      reason:
        'A $10 billion ceiling and $782 million of fiscal 2018 appropriation are disclosed, and neither is a reserve figure. A ceiling authorizes spending rather than evidencing affordability, and one year of appropriation does not place a ten-year requirement. No lifecycle estimate is publicly usable at this date.',
    },
  },
};

export const VA_EHR_2018_REVIEW = evaluateCommitmentReview(VA_EHR_2018_REVIEW_INPUT);
