import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

/** McDonald's × IBM AOT — T0, the capability-transfer commitment on 2021-10-27. */
export const MCDONALDS_IBM_AOT_2021_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale: 'A drive-thru order taker that improves customer convenience and crew experience has plausible operating value. The joint statement claimed early benefits but did not publish the measurements behind them.',
  valueSourceRefs: ['mcd-aot-pre-transfer-pilot', 'mcd-aot-pre-transfer-accuracy', 'mcd-aot-benefit-claim'],
  riskFloors: [
    {
      id: 'order-accuracy-readiness',
      status: 'unknown',
      rationale: 'The pilot reported roughly 85% order accuracy, but the transfer commitment did not place a threshold for release across markets.',
      sourceRefs: ['mcd-aot-pre-transfer-accuracy', 'mcd-aot-scale-work'],
    },
    {
      id: 'capability-transfer-readiness',
      status: 'unknown',
      rationale: 'The in-house team and capability were moving to IBM, but the public packet did not establish how much of the restaurant-tested capability would transfer to IBM-run, cross-market delivery.',
      sourceRefs: ['mcd-apprente-origin', 'mcd-tech-labs-transfer', 'mcd-aot-scale-work'],
    },
    {
      id: 'operational-benefit',
      status: 'unknown',
      rationale: 'Employees still recorded about one in five pilot orders, and the joint statement supplied no speed, savings, intervention, or customer-experience gate.',
      sourceRefs: ['mcd-aot-pre-transfer-intervention', 'mcd-aot-benefit-claim'],
    },
  ],
  placements: {
    people: { kind: 'indeterminate', reason: 'The record does not size IBM engineering, field-support, or restaurant-crew capacity required to scale AOT.' },
    time: { kind: 'indeterminate', reason: 'No release deadline or evidenced cycle from restaurant testing to cross-market deployment was disclosed.' },
    finance: { kind: 'indeterminate', reason: 'No transaction value, AOT budget, program spend, or financial reserve was publicly disclosed.' },
  },
};

export const MCDONALDS_IBM_AOT_2021_REVIEW = evaluateCommitmentReview(
  MCDONALDS_IBM_AOT_2021_REVIEW_INPUT,
);
