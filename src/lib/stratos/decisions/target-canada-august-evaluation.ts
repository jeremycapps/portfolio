import type { MetricRange, MetricValue } from '../cases/profile';
import { TARGET_CANADA_AUGUST_2013_REVIEW_INPUT } from '../scoring/target-canada-august-review';
import type { EvidenceDisplayState, ExposureCategory } from './decision-point';
import {
  TARGET_CANADA_AUGUST_2013_DECISION_POINT,
} from './fixtures/target-canada-august-2013';
import { assertValidJudgmentResult, type JudgmentResult } from './judgment';
import { generateRecommendations } from './recommendation-policy';
import { adaptCommitmentReview } from './verdict-adapter';

const pilotEvidence = {
  sourceId: 'target-canada-pilot-2013',
  locator: 'Pilot-store announcement, paragraphs 2–3',
} as const;
const q2OutlookEvidence = {
  sourceId: 'target-q2-results-2013',
  locator: 'Chief executive quotation, Canadian launch outlook',
} as const;
const q2ResultsEvidence = {
  sourceId: 'target-q2-results-2013',
  locator: 'Canadian Segment Results',
} as const;

const materialUnknowns = TARGET_CANADA_AUGUST_2013_DECISION_POINT.materialUnknowns
  .map(({ label }) => label);

export const TARGET_CANADA_AUGUST_2013_ASSESSMENT = adaptCommitmentReview({
  commitmentReview: TARGET_CANADA_AUGUST_2013_REVIEW_INPUT,
  materialUnknowns,
  causeEvidenceRefs: [pilotEvidence, q2OutlookEvidence, q2ResultsEvidence],
});

export const TARGET_CANADA_AUGUST_2013_RECOMMENDATIONS = generateRecommendations({
  assessment: TARGET_CANADA_AUGUST_2013_ASSESSMENT,
  irreversibility: TARGET_CANADA_AUGUST_2013_DECISION_POINT.irreversibility.level,
  commitmentState: 'active',
  requestedScale: '56-store requested increment',
  pathState: 'ineffective',
  commitment: {
    object: 'remaining 56-store Canadian rollout increment',
    owner: 'Decision authority not documented in the public packet',
    authorityStatus: 'unknown',
    authorizationReason: 'Material readiness, mature-store economics, loss tolerance, and authority remain unresolved at a highly irreversible boundary.',
    parameters: {
      requestedIncrement: 56,
      requestedIncrementUnit: 'stores',
      requestedIncrementProvenance: 'observed',
      holdBoundaryProvenance: 'analytical',
    },
    evidenceRefs: [q2OutlookEvidence, q2ResultsEvidence],
    assumptionRefs: ['analytical-release-gates', 'analytical-tranche-alternatives'],
    boundary: {
      time: 'Through 2013-12-31 at latest',
      exposure: 'No additional store activation before the analytical readiness gate',
      expiryOrReturnCondition: 'Return before any additional store activation, or at year-end if no release is proposed.',
    },
    gate: {
      conditions: [
        'Document inventory accuracy and in-stock performance.',
        'Document distribution readiness thresholds.',
        'Place mature-store economics, loss tolerance, and decision authority.',
      ],
      evidenceStatus: 'analytical',
    },
    reassessment: {
      trigger: 'Before any additional store activation, and no later than 2013-12-31',
      ifImproving: 'Return with evidence for an explicitly bounded staged tranche; do not infer its quantity.',
      ifIneffective: 'Continue the hold and change the validation or remediation path.',
      ifBoundaryExhausted: 'Return the unresolved scaling decision to the authorized owner.',
    },
  },
  path: {
    object: 'bounded rollout validation and remediation',
    owner: 'Target Canada operating lead; delegation boundary unknown',
    authorityStatus: 'unknown',
    authorizationReason: 'The path purchases the missing readiness and economic evidence before another release decision.',
    parameters: {
      purpose: 'cutoff-safe readiness validation',
      proposedGateProvenance: 'analytical',
      stagedTrancheQuantity: 'not-determined',
    },
    evidenceRefs: [pilotEvidence, q2OutlookEvidence, q2ResultsEvidence],
    assumptionRefs: ['analytical-reassessment-before-release', 'analytical-release-gates'],
    boundary: {
      time: 'Through 2013-12-31 at latest',
      exposure: 'Validation and remediation only; no sourced staged-tranche quantity',
      expiryOrReturnCondition: 'Return at the next release decision, or at year-end if no earlier decision occurs.',
    },
    gate: {
      conditions: [
        'Readiness evidence is cutoff-safe and traceable to a named threshold.',
        'Any proposed tranche quantity is labeled analytical unless independently sourced.',
        'The owner and authorization boundary are explicit.',
      ],
      evidenceStatus: 'analytical',
    },
    reassessment: {
      trigger: 'At the next release decision, or 2013-12-31 at latest',
      ifImproving: 'Propose a bounded tranche supported by the newly placed evidence.',
      ifIneffective: 'Change the remediation path without expanding store exposure.',
      ifBoundaryExhausted: 'Return the commitment decision; do not infer authorization to continue.',
    },
  },
});

export const TARGET_CANADA_AUGUST_2013_JUDGMENT: JudgmentResult = {
  ...TARGET_CANADA_AUGUST_2013_ASSESSMENT,
  recommendations: TARGET_CANADA_AUGUST_2013_RECOMMENDATIONS,
  nextSafeCommitment: {
    status: 'not-determined',
    description: 'A hold is bounded now; any smaller staged tranche remains analytical until readiness, economics, loss tolerance, and authority are placed.',
    evidenceRefs: [q2OutlookEvidence, q2ResultsEvidence],
    assumptionRefs: ['analytical-release-gates', 'analytical-tranche-alternatives'],
  },
  evidenceRefs: [pilotEvidence, q2OutlookEvidence, q2ResultsEvidence],
  assumptionRefs: [
    'analytical-high-irreversibility',
    'analytical-reassessment-before-release',
    'analytical-release-gates',
    'analytical-tranche-alternatives',
  ],
};

assertValidJudgmentResult(TARGET_CANADA_AUGUST_2013_JUDGMENT);

export interface ExposureComparisonValue {
  readonly status: EvidenceDisplayState;
  readonly label: string;
  readonly metric?: MetricValue | MetricRange;
  readonly calculation?: string;
  readonly assumption?: string;
}

export interface ExposureComparisonCategory {
  readonly category: ExposureCategory;
  readonly actualIntent: ExposureComparisonValue;
  readonly stratosScenario: ExposureComparisonValue;
  readonly limitation: string;
}

const fogComparison = (
  category: ExposureCategory,
  label: string,
  limitation: string,
): ExposureComparisonCategory => ({
  category,
  actualIntent: { status: 'FOG', label },
  stratosScenario: { status: 'FOG', label: `Change in ${label.toLowerCase()} under the StratOS hold` },
  limitation,
});

export const TARGET_CANADA_AUGUST_2013_EXPOSURE_COMPARISON: Readonly<
Record<ExposureCategory, ExposureComparisonCategory>
> = {
  storeActivation: {
    category: 'storeActivation',
    actualIntent: {
      status: 'OBSERVED',
      label: 'Target stated it was preparing to open another 56 stores by year-end.',
      metric: { value: 56, unit: 'stores planned to open' },
    },
    stratosScenario: {
      status: 'ESTIMATED',
      label: 'Maximum unreleased store activations under the analytical hold scenario',
      metric: { low: 0, high: 56, unit: 'store activations not released before reassessment' },
      calculation: '56 requested store activations − 0 store activations authorized by the analytical hold = a maximum scenario bound of 56; the lower bound remains 0 because later release could still be authorized.',
      assumption: 'The hold is a StratOS analytical counterfactual, not a documented Target action or proof that 56 activations were avoidable.',
    },
    limitation: 'This compares store activation only; it does not establish that leases, remodeling, inventory, employment, or cash obligations could be avoided.',
  },
  leases: fogComparison('leases', 'Lease exposure through the comparison interval', 'The August packet does not place cancellation rights, sunk lease obligations, or avoidable lease exposure.'),
  capitalRemodeling: fogComparison('capitalRemodeling', 'Capital and remodeling exposure through the comparison interval', 'The August packet does not separate already-spent, committed, or avoidable capital for the remaining cohort.'),
  inventory: fogComparison('inventory', 'Inventory exposure through the comparison interval', 'The August packet does not quantify inventory purchased, cancellable, transferable, or avoidable for the remaining cohort.'),
  people: fogComparison('people', 'Employment exposure through the comparison interval', 'The August packet does not quantify hiring commitments, redeployment options, or employment avoided by a hold.'),
  cash: fogComparison('cash', 'Cash exposure through the comparison interval', 'The August packet does not place cash outflows, loss tolerance, or the counterfactual cash effect of a hold.'),
};

export const TARGET_CANADA_AUGUST_2013_COMPARISON = {
  decisionPointId: TARGET_CANADA_AUGUST_2013_DECISION_POINT.id,
  period: {
    startsAt: '2013-08-21',
    endsAt: '2013-12-31',
    endBasis: 'The public statement supplied a year-end horizon; an earlier release decision would end the comparison sooner.',
  },
  actualOperations: TARGET_CANADA_AUGUST_2013_DECISION_POINT.actualOperations,
  stratosOperations: TARGET_CANADA_AUGUST_2013_RECOMMENDATIONS,
  exposures: TARGET_CANADA_AUGUST_2013_EXPOSURE_COMPARISON,
  caveats: [
    'T1, T2, HOLD, LEARN, proposed gates, and any staged-tranche alternative are StratOS analytical terminology.',
    'The comparison does not claim that the alternative would have made Target Canada succeed.',
    'The comparison does not claim that every unreleased obligation was avoidable.',
    'The dated verdict and recommendations use no evidence published after 2013-08-21.',
  ],
} as const;
