import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/**
 * Target Canada — T4, the exit, reviewed at 2015-02-25 when its cost became
 * public in the fiscal-2014 results.
 *
 * This is the one date in the case where the value floor itself fails. At T3 the
 * commitment was still worth pursuing and merely unaffordable at the requested
 * size — a collision. Here the board has discontinued operations and the
 * realized charge is reported, so the question is no longer whether the next
 * increment fits but whether the commitment clears its floor at all. It does
 * not, and the verdict hardens from COLLISION to FLOOR.
 *
 * Nothing in the library is published after this date, so the decision carries
 * no hindsight layer. That is a real property of the last decision in a closed
 * case, not a gap.
 */
export const TARGET_CANADA_2015_EXIT_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'not-worth-pursuing',
  valueRationale:
    'The board approved discontinuing Canadian operations on 2015-01-14, and the fiscal-2014 results recorded $5.105 billion of pretax impairment and exit charges against a segment that had lost $941 million in its first full year. The commitment no longer clears an economic value floor on the reporting entity\'s own evidence.',
  valueSourceRefs: ['board-approved-exit', 'exit-charge-2014', 'canada-ebit-2013'],
  riskFloors: [
    {
      id: 'liquidity',
      status: 'pass',
      rationale:
        'The parent absorbed a $5.105 billion pretax charge and continued as an operating company; liquidity did not bind the exit decision.',
      sourceRefs: ['exit-charge-2014'],
    },
    {
      id: 'legal-operability',
      status: 'pass',
      rationale:
        'Target operated 133 Canadian stores through the decision and wound them down under its own authority; the packet shows no legal prohibition on either operating or exiting.',
      sourceRefs: ['stores-at-exit', 'board-approved-exit'],
    },
  ],
  placements: {
    people: {
      kind: 'structural-upper-bound',
      fitAtMost: -17600,
      unit: 'positions released against a nonnegative retained-workforce floor',
      confidence: 0.5,
      rationale:
        'Approximately 17,600 people were employed in Canada when the exit was announced. Against a floor of retaining the workforce the commitment was built on, the fit is at most the whole of it — the capacity was not redeployed within the commitment, it was released with it.',
      sources: [
        { ref: 'employees-at-exit', sourceClass: 'A' },
        { ref: 'stores-at-exit', sourceClass: 'A' },
      ],
    },
    time: {
      kind: 'indeterminate',
      reason:
        'The elapsed operating window is observable, but the packet does not place the cycle time a recovery would have required, so no sourced time bound can be stated.',
    },
    finance: {
      kind: 'structural-upper-bound',
      fitAtMost: -5105,
      unit: 'USD millions pretax exit charge against a nonnegative capital-recovery floor',
      confidence: 0.6,
      rationale:
        'Target recorded $5.105 billion of pretax impairment and other exit charges in the fourth quarter of fiscal 2014. Against a floor of recovering committed capital, the observed fit is at most negative $5.105 billion. This is a realized charge, distinct from the segment operating loss placed at T3.',
      sources: [
        { ref: 'exit-charge-2014', sourceClass: 'A' },
        { ref: 'canada-ebit-2013', sourceClass: 'A' },
      ],
    },
  },
};

export const TARGET_CANADA_2015_EXIT_REVIEW = evaluateCommitmentReview(
  TARGET_CANADA_2015_EXIT_REVIEW_INPUT,
);
