import { evaluateCommitmentReview, type CommitmentReviewInput } from './rubric';

// T3 — first full-year operating evidence, published 2014-02-26. Cutoff-safe
// to that date: the fiscal-2013 Canadian segment EBIT loss is observed and
// establishes a definite operating-economics collision, where the August (T2)
// packet could only place finance as indeterminate. Time and people remain
// unplaced at desk level; a single sourced collision is sufficient for the
// verdict, so they stay indeterminate rather than inventing a bound.
export const TARGET_CANADA_2014_WARNING_REVIEW_INPUT: CommitmentReviewInput = {
  accessTier: 'desk',
  value: 'worth-pursuing',
  valueRationale:
    'Canadian market entry retained a plausible long-run value case, and the parent continued operating the segment; the warning packet tests whether first-full-year economics cleared the operating floor.',
  valueSourceRefs: ['canada-sales-2013'],
  riskFloors: [
    {
      id: 'liquidity',
      status: 'pass',
      rationale:
        'The parent absorbed the fiscal-2013 Canadian segment loss and continued as an operating company; liquidity was not the binding boundary at this point.',
      sourceRefs: ['canada-ebit-2013'],
    },
    {
      id: 'legal-operability',
      status: 'pass',
      rationale:
        'Target operated its Canadian store footprint through the fiscal year; the packet shows no legal or regulatory prohibition preventing operation.',
      sourceRefs: ['canada-sales-2013'],
    },
  ],
  placements: {
    people: {
      kind: 'indeterminate',
      reason:
        'Full-year results place economics, not workforce readiness; critical-role and training capacity remain unquantified at desk level.',
    },
    time: {
      kind: 'indeterminate',
      reason:
        'A full operating year elapsed without stable economics, but the packet does not place a sourced readiness cycle time or gate cadence.',
    },
    finance: {
      kind: 'structural-upper-bound',
      fitAtMost: -941,
      unit: 'USD millions EBIT versus a nonnegative operating-economics floor',
      confidence: 0.5,
      rationale:
        'The Canadian segment reported a $941 million fiscal-2013 EBIT loss at a 14.9% gross margin. Against a nonnegative operating-economics floor, the observed fit is at most negative $941 million; this is a segment operating result, distinct from parent liquidity.',
      sources: [
        { ref: 'canada-ebit-2013', sourceClass: 'A' },
        { ref: 'canada-gross-margin-2013', sourceClass: 'A' },
      ],
    },
  },
};

export const TARGET_CANADA_2014_WARNING_REVIEW = evaluateCommitmentReview(
  TARGET_CANADA_2014_WARNING_REVIEW_INPUT,
);
