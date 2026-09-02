import {
  ADOBE_CREATIVE_CLOUD,
  DOMINOS_2025_GROWTH,
  FORD_MODEL_E,
  TARGET_CANADA,
  VA_EHR_MODERNIZATION,
  WATSON_MD_ANDERSON,
  type CaseFact,
  type CaseProfile,
  type EvidenceRef,
} from '../../cases';
import {
  ADOBE_CREATIVE_CLOUD_COMMITMENT_SCORECARD,
  DOMINOS_GROWTH_COMMITMENT_SCORECARD,
  FORD_MODEL_E_COMMITMENT_SCORECARD,
  TARGET_CANADA_COMMITMENT_SCORECARD,
} from '../../scoring/commitment-scorecards';
import type { CommitmentReviewInput } from '../../scoring/rubric';
import type { CaseScorecard } from '../../scoring/scorecard';
import { TARGET_CANADA_2014_WARNING_REVIEW_INPUT } from '../../scoring/target-canada-2014-review';
import { TARGET_CANADA_2015_EXIT_REVIEW_INPUT } from '../../scoring/target-canada-2015-review';
import { VA_EHR_2018_REVIEW_INPUT } from '../../scoring/va-ehr-2018-review';
import { VA_EHR_2020_REVIEW_INPUT } from '../../scoring/va-ehr-2020-review';
import { VA_EHR_2022_REVIEW_INPUT } from '../../scoring/va-ehr-2022-review';
import { VA_EHR_2023_REVIEW_INPUT } from '../../scoring/va-ehr-2023-review';
import { WATSON_MD_ANDERSON_2013_REVIEW_INPUT } from '../../scoring/watson-md-anderson-2013-review';
import { WATSON_MD_ANDERSON_2014_REVIEW_INPUT } from '../../scoring/watson-md-anderson-2014-review';
import { WATSON_MD_ANDERSON_2017_REVIEW_INPUT } from '../../scoring/watson-md-anderson-2017-review';
import {
  EXPOSURE_CATEGORIES,
  defineDecisionPoint,
  type DecisionInput,
  type DecisionPoint,
  type ExposureCategory,
} from '../decision-point';
import type {
  DecisionComparison,
  ExposureComparisonCategory,
} from '../decision-comparison';
import { resolveDecisionPoint } from '../evidence-integrity';
import { assertValidJudgmentResult, type JudgmentResult } from '../judgment';
import { resolveCostFigure, type CostFigure, type CostFigureRef } from '../cost';
import {
  evaluateCommitmentReview,
  type CommitmentReviewResult,
} from '../../scoring/rubric';
import { generateRecommendations } from '../recommendation-policy';
import { adaptCommitmentReview } from '../verdict-adapter';

const ASSUMPTIONS = [
  { id: 'analytical-actor', statement: 'The aggregate decision actor is an analytical label; the public packet does not identify a single authorization owner.' },
  { id: 'analytical-boundary', statement: 'The bounded hold and reassessment date are StratOS controls, not reported company actions.' },
  { id: 'analytical-gates', statement: 'The proposed evidence gates are analytical and do not imply that the company used them.' },
  { id: 'analytical-sequence', statement: 'T0, T1, T3 and the rest are StratOS sequence labels for dated decision packets; the organization did not number its decisions.' },
] as const;

const SECONDARY_EXPOSURES = [
  'contracts',
  'capital',
  'inventory',
  'people',
  'cash',
] as const satisfies readonly Exclude<ExposureCategory, 'scopeActivation'>[];

interface ExperienceConfig {
  readonly profile: CaseProfile;
  /**
   * The commitment review this decision renders. Commitment-date packets pass
   * their scorecard's review; a case scored per release date passes the review
   * authored for that date, since no scorecard spans them.
   */
  readonly commitmentReview: CommitmentReviewInput;
  /** Supplies dated tension placements. A decision without one renders no poles. */
  readonly scorecard?: CaseScorecard;
  readonly snapshotId: string;
  readonly sequence: DecisionPoint['sequence'];
  /**
   * Money this decision placed, if the case has a fact for it.
   *
   * Optional because most decisions have none: the packet at a release date
   * reports readiness, not dollars. A decision without a figure contributes no
   * point to the cost view rather than a zero, since "nothing was on the books
   * yet" and "it cost nothing" are opposite claims.
   */
  readonly cost?: readonly CostFigureRef[];
  readonly id: string;
  readonly decisionDate: string;
  readonly reassessmentDate: string;
  readonly actor: string;
  readonly current: { readonly factRef: string; readonly label: string };
  readonly requested: { readonly factRef: string; readonly label: string };
  readonly cadence: { readonly factRef: string; readonly label: string };
  readonly requestedScale: string;
  readonly timelineLabel: string;
  readonly headline: string;
  readonly irreversibility: 'medium' | 'high';
  readonly unknowns: readonly string[];
  readonly secondaryExposureLabels: readonly [string, string, string, string, string];
  /**
   * Omitted when nothing in the case is published after this decision — a real
   * property of the last decision in a closed case, not a gap to fill.
   */
  readonly hindsightFactRef?: string;
}

export interface AuthoredDecisionExperience {
  readonly profile: CaseProfile;
  readonly scorecard?: CaseScorecard;
  readonly cost: readonly CostFigure[];
  readonly reviewInput: CommitmentReviewInput;
  readonly review: CommitmentReviewResult;
  readonly decisionPoint: DecisionPoint;
  readonly judgment: JudgmentResult;
  readonly comparison: DecisionComparison;
  readonly companyName: string;
  readonly caseName: string;
  readonly timelineLabel: string;
  readonly headline: string;
  readonly primaryExposureCategory: ExposureCategory;
  readonly primaryExposureTitle: string;
}

function requireFact(profile: CaseProfile, factRef: string): CaseFact {
  const fact = profile.facts.find(({ id }) => id === factRef);
  if (!fact) throw new Error(`${profile.id} is missing authored fact ${factRef}.`);
  return fact;
}

function inputFromFact(
  profile: CaseProfile,
  factRef: string,
  id: string,
  label: string,
  materiality: DecisionInput['materiality'] = 'material',
): DecisionInput {
  const fact = requireFact(profile, factRef);
  const evidence = fact.evidence[0];
  const source = profile.sources.find(({ id: sourceId }) => sourceId === evidence.sourceId);
  if (!source) throw new Error(`${profile.id} is missing source ${evidence.sourceId}.`);
  return {
    id,
    label,
    // A reported fact is OBSERVED in itself. Whether it reads as HINDSIGHT here
    // follows from its publication date against this decision's cutoff.
    epistemicState: 'OBSERVED',
    materiality,
    metric: fact.metric,
    factRef,
    evidence,
    publishedAt: source.publishedAt,
    origin: fact.origin,
    calculation: fact.calculation,
    assumptionRefs: [],
  };
}

const fog = (id: string, label: string): DecisionInput => ({
  id,
  label,
  epistemicState: 'FOG',
  materiality: 'material',
  assumptionRefs: [],
});

function buildExperience(config: ExperienceConfig): AuthoredDecisionExperience {
  const snapshot = config.profile.snapshots.find(({ id }) => id === config.snapshotId);
  if (!snapshot) throw new Error(`${config.profile.id} is missing snapshot ${config.snapshotId}.`);
  const current = inputFromFact(config.profile, config.current.factRef, 'current-commitment', config.current.label);
  const requested = inputFromFact(config.profile, config.requested.factRef, 'requested-increment', config.requested.label);
  const cadence = inputFromFact(config.profile, config.cadence.factRef, 'commitment-cadence', config.cadence.label);
  const primaryEvidence = requested.evidence as EvidenceRef;
  const materialUnknowns = config.unknowns.map((label, index) => fog(`material-unknown-${index + 1}`, label));
  const secondaryExposures = Object.fromEntries(SECONDARY_EXPOSURES.map((category, index) => [
    category,
    fog(`${category}-exposure`, config.secondaryExposureLabels[index]),
  ])) as Record<Exclude<ExposureCategory, 'scopeActivation'>, DecisionInput>;

  const decisionPoint = defineDecisionPoint({
    schema: 'stratos.decision-point/1',
    id: config.id,
    caseId: config.profile.id,
    evidenceSnapshotId: snapshot.id,
    sequence: config.sequence,
    decisionDate: config.decisionDate,
    knowledgeCutoff: snapshot.knowledgeCutoff,
    actor: {
      label: config.actor,
      authorityStatus: 'unknown',
      provenance: 'inferred',
      evidenceRefs: [primaryEvidence],
      assumptionRefs: ['analytical-actor'],
    },
    currentCommitment: current,
    requestedIncrement: requested,
    cadence,
    irreversibility: {
      level: config.irreversibility,
      rationale: 'The commitment expands exposure before the public packet places all decision-material capacity and downside boundaries.',
      provenance: 'analytical',
      evidenceRefs: [primaryEvidence],
      assumptionRefs: ['analytical-boundary'],
    },
    reassessment: {
      nextFeasibleAt: config.reassessmentDate,
      rationale: 'Return at the next authored evidence gate before expanding the commitment.',
      provenance: 'assumption',
      evidenceRefs: [primaryEvidence],
      assumptionRefs: ['analytical-boundary'],
    },
    constructs: [
      { id: `${config.id}-sequence`, label: `${config.sequence}: decision boundary`, provenance: 'analytical', assumptionRefs: ['analytical-sequence'] },
      { id: `${config.id}-gates`, label: 'Proposed evidence release gates', provenance: 'assumption', assumptionRefs: ['analytical-gates'] },
    ],
    actualOperations: [
      { operation: 'CONTINUE', object: config.current.label, provenance: 'documented', evidenceRefs: [current.evidence as EvidenceRef] },
      { operation: 'PREPARE', object: config.requested.label, provenance: 'documented', evidenceRefs: [primaryEvidence] },
    ],
    exposures: {
      scopeActivation: { ...requested, id: 'primary-exposure' },
      ...secondaryExposures,
    },
    materialUnknowns,
    assumptions: ASSUMPTIONS,
    hindsight: config.hindsightFactRef
      ? [inputFromFact(config.profile, config.hindsightFactRef, 'outcome-hindsight', 'Later outcome evidence', 'context')]
      : [],
  });
  resolveDecisionPoint(decisionPoint, config.profile);

  const unknownLabels = materialUnknowns.map(({ label }) => label);
  const assessment = adaptCommitmentReview({
    commitmentReview: config.commitmentReview,
    materialUnknowns: unknownLabels,
    causeEvidenceRefs: [primaryEvidence],
  });
  const recommendations = generateRecommendations({
    assessment,
    irreversibility: config.irreversibility,
    commitmentState: 'active',
    requestedScale: config.requestedScale,
    pathState: 'ineffective',
    commitment: {
      object: config.requested.label,
      owner: `${config.profile.company.name} decision authority; delegation boundary not public`,
      authorityStatus: 'unknown',
      authorizationReason: 'Decision-material capacity, evidence gates, and downside limits remain unresolved in the cutoff-safe packet.',
      evidenceRefs: [primaryEvidence],
      assumptionRefs: ['analytical-boundary', 'analytical-gates'],
      boundary: {
        time: `Through ${config.reassessmentDate}`,
        exposure: 'No expansion beyond the evidenced commitment boundary before reassessment',
        expiryOrReturnCondition: `Return on ${config.reassessmentDate}, or earlier if a release decision is proposed.`,
      },
      gate: {
        conditions: config.unknowns.slice(0, 3).map((unknown) => `Place ${unknown.toLowerCase()}.`),
        evidenceStatus: 'analytical',
      },
      reassessment: {
        trigger: `At the next evidence gate, no later than ${config.reassessmentDate}`,
        ifImproving: 'Return with an explicitly bounded scale supported by cutoff-safe evidence.',
        ifIneffective: 'Continue the hold and change the validation path.',
        ifBoundaryExhausted: 'Return the unresolved commitment to the authorized owner.',
      },
    },
    path: {
      object: 'bounded validation of the commitment thesis',
      owner: `${config.profile.company.name} operating lead; delegation boundary not public`,
      authorityStatus: 'unknown',
      authorizationReason: 'A bounded learning path purchases the missing evidence without assuming authorization to expand.',
      evidenceRefs: [primaryEvidence],
      assumptionRefs: ['analytical-boundary', 'analytical-gates'],
      boundary: {
        time: `Through ${config.reassessmentDate}`,
        attempts: 1,
        expiryOrReturnCondition: `Return on ${config.reassessmentDate}, or when the evidence gate is reached.`,
      },
      gate: {
        conditions: ['Use cutoff-safe, traceable evidence.', 'Name the owner and authorization boundary.', 'Place the requested scale before release.'],
        evidenceStatus: 'analytical',
      },
      reassessment: {
        trigger: `At the next evidence gate, no later than ${config.reassessmentDate}`,
        ifImproving: 'Propose a bounded next commitment supported by the newly placed evidence.',
        ifIneffective: 'Redesign the validation path without expanding exposure.',
        ifBoundaryExhausted: 'Return the commitment decision; do not infer permission to continue.',
      },
    },
  });
  const judgment: JudgmentResult = {
    ...assessment,
    recommendations,
    nextSafeCommitment: {
      status: 'not-determined',
      description: 'No next scale is authorized until the packet places the material unknowns and decision authority.',
      evidenceRefs: [primaryEvidence],
      assumptionRefs: ['analytical-boundary', 'analytical-gates'],
    },
    evidenceRefs: [primaryEvidence],
    assumptionRefs: ['analytical-boundary', 'analytical-gates'],
  };
  assertValidJudgmentResult(judgment);

  const fogComparison = (category: ExposureCategory, label: string): ExposureComparisonCategory => ({
    category,
    actualIntent: { status: 'FOG', label },
    stratosScenario: { status: 'FOG', label: `Change in ${label.toLowerCase()} under the bounded hold` },
    limitation: 'The cutoff-safe packet does not quantify avoidable exposure in this category.',
  });
  const exposures = Object.fromEntries(EXPOSURE_CATEGORIES.map((category) => [
    category,
    category === 'scopeActivation'
      ? {
          category,
          actualIntent: { status: 'OBSERVED', label: config.requested.label, metric: requested.metric },
          stratosScenario: { status: 'FOG', label: 'Exposure change under the analytical hold is not quantified.' },
          limitation: 'The analytical hold does not establish that the observed commitment or its obligations were avoidable.',
        }
      : fogComparison(category, config.secondaryExposureLabels[SECONDARY_EXPOSURES.indexOf(category as (typeof SECONDARY_EXPOSURES)[number])]),
  ])) as unknown as Record<ExposureCategory, ExposureComparisonCategory>;
  const comparison: DecisionComparison = {
    decisionPointId: decisionPoint.id,
    period: {
      startsAt: config.decisionDate,
      endsAt: config.reassessmentDate,
      endBasis: 'The comparison ends at the next authored reassessment boundary.',
    },
    actualOperations: decisionPoint.actualOperations,
    stratosOperations: recommendations,
    exposures,
    caveats: [
      'The bounded hold and evidence gates are StratOS analytical operations, not documented company actions.',
      'The comparison does not predict whether the strategy or an alternative would succeed.',
      'Hindsight is excluded from the dated verdict and recommendations.',
    ],
  };

  return {
    profile: config.profile,
    scorecard: config.scorecard,
    cost: (config.cost ?? []).map((ref) => resolveCostFigure(config.profile, ref)),
    reviewInput: config.commitmentReview,
    review: evaluateCommitmentReview(config.commitmentReview),
    decisionPoint,
    judgment,
    comparison,
    companyName: config.profile.company.name,
    caseName: config.profile.case.name,
    timelineLabel: config.timelineLabel,
    headline: config.headline,
    primaryExposureCategory: 'scopeActivation',
    primaryExposureTitle: 'Primary commitment exposure',
  };
}

export const CALIBRATED_COMMITMENT_EXPERIENCES = [
  buildExperience({
    profile: TARGET_CANADA,
    commitmentReview: TARGET_CANADA_COMMITMENT_SCORECARD.commitmentReviewInput,
    scorecard: TARGET_CANADA_COMMITMENT_SCORECARD,
    snapshotId: TARGET_CANADA_COMMITMENT_SCORECARD.evidencePacket.snapshot.id,
    sequence: 'T0',
    cost: [{
      kind: 'committed',
      factRef: 'canada-capital-committed-by-2012',
      basis: 'capital placed by the opening announcement',
      accrual: 'adds',
    }],
    id: 'target-canada-t0-2012-07-12',
    decisionDate: '2012-07-12',
    reassessmentDate: '2013-03-05',
    actor: 'Target management responsible for the Canadian market-entry commitment',
    current: { factRef: 'planned-opening-window-months', label: 'Nine-to-ten-month opening window' },
    requested: { factRef: 'planned-stores-2013', label: 'Open the first 125 Canadian stores in 2013' },
    cadence: { factRef: 'required-store-opening-rate', label: 'Required opening cadence' },
    requestedScale: '125-store market-entry commitment',
    timelineLabel: 'Initial 125-store commitment',
    headline: 'Market-entry commitment before operating evidence',
    irreversibility: 'high',
    unknowns: ['Canadian readiness gates', 'Critical-role and training capacity', 'Investment and loss tolerance', 'Decision authority'],
    secondaryExposureLabels: ['Lease exposure for the initial footprint', 'Capital and remodeling exposure', 'Inventory exposure', 'People capacity and exposure', 'Cash and operating-loss exposure'],
    hindsightFactRef: 'canada-stores-operating-q2',
  }),
  buildExperience({
    profile: ADOBE_CREATIVE_CLOUD,
    commitmentReview: ADOBE_CREATIVE_CLOUD_COMMITMENT_SCORECARD.commitmentReviewInput,
    scorecard: ADOBE_CREATIVE_CLOUD_COMMITMENT_SCORECARD,
    snapshotId: ADOBE_CREATIVE_CLOUD_COMMITMENT_SCORECARD.evidencePacket.snapshot.id,
    sequence: 'T0',
    id: 'adobe-creative-cloud-t0-2013-01-22',
    decisionDate: '2013-01-22',
    reassessmentDate: '2014-01-21',
    actor: 'Adobe leadership responsible for the Creative Cloud transition',
    current: { factRef: 'creative-cloud-launched', label: 'Creative Cloud subscription offering launched' },
    requested: { factRef: 'transition-risks-disclosed', label: 'Scale the creative business-model transition' },
    cadence: { factRef: 'renewal-data-not-yet-available', label: 'First-year renewal evidence not yet available' },
    requestedScale: 'creative-products subscription transition',
    timelineLabel: 'Creative Cloud commitment',
    headline: 'Subscription transition before renewal evidence',
    irreversibility: 'medium',
    unknowns: ['Renewal and adoption thresholds', 'Transition cash trough', 'Cloud-operations capacity', 'Completion horizon'],
    secondaryExposureLabels: ['Customer-contract migration exposure', 'Cloud investment exposure', 'Perpetual-product transition exposure', 'Cloud, support, and sales capacity', 'Revenue-deferral and cash exposure'],
    hindsightFactRef: 'paid-subscribers-2013',
  }),
  buildExperience({
    profile: DOMINOS_2025_GROWTH,
    commitmentReview: DOMINOS_GROWTH_COMMITMENT_SCORECARD.commitmentReviewInput,
    scorecard: DOMINOS_GROWTH_COMMITMENT_SCORECARD,
    snapshotId: DOMINOS_GROWTH_COMMITMENT_SCORECARD.evidencePacket.snapshot.id,
    sequence: 'T0',
    id: 'dominos-growth-t0-2019-02-21',
    decisionDate: '2019-02-21',
    reassessmentDate: '2020-02-20',
    actor: 'Domino’s leadership and franchise-system decision owners',
    current: { factRef: 'digital-sales-us-2018', label: 'More than 65% of U.S. sales through digital channels' },
    requested: { factRef: 'target-stores-2025', label: 'Grow to 25,000 stores by 2025' },
    cadence: { factRef: 'target-sales-2025', label: 'Reach $25 billion in global retail sales by 2025' },
    requestedScale: '25,000-store global system',
    timelineLabel: '2025 global growth commitment',
    headline: 'Global growth on an adopted franchise system',
    irreversibility: 'medium',
    unknowns: ['Market-level franchisee capacity', 'Annual milestone gates', 'Store-level return dispersion', 'Quality and cyber thresholds'],
    secondaryExposureLabels: ['Franchise and market contract exposure', 'Store and technology capital exposure', 'Supply-chain exposure', 'Franchisee, store-leadership, and delivery capacity', 'Market-level funding exposure'],
    hindsightFactRef: 'actual-stores-2025',
  }),
  buildExperience({
    profile: FORD_MODEL_E,
    commitmentReview: FORD_MODEL_E_COMMITMENT_SCORECARD.commitmentReviewInput,
    scorecard: FORD_MODEL_E_COMMITMENT_SCORECARD,
    snapshotId: FORD_MODEL_E_COMMITMENT_SCORECARD.evidencePacket.snapshot.id,
    sequence: 'T0',
    id: 'ford-model-e-t0-2022-07-21',
    decisionDate: '2022-07-21',
    reassessmentDate: '2023-07-28',
    actor: 'Ford leadership responsible for Model e scale and capital allocation',
    current: { factRef: 'battery-capacity-sourced-2022', label: '70% of required battery capacity sourced' },
    requested: { factRef: 'target-run-rate-2026', label: 'Scale beyond two million annual EV units by late 2026' },
    cadence: { factRef: 'target-run-rate-2023', label: 'Reach a 600,000-unit annualized run rate by late 2023' },
    requestedScale: 'more than two million annual EV units',
    timelineLabel: 'Model e scale commitment',
    headline: 'Industrial conversion before full capacity placement',
    irreversibility: 'high',
    unknowns: ['Demand-linked release gates', 'Battery and critical-role capacity', 'Plant ramp and quality thresholds', 'Capital loss tolerance'],
    secondaryExposureLabels: ['Supplier and battery-contract exposure', 'Manufacturing and platform capital exposure', 'Battery and vehicle inventory exposure', 'Engineering, software, and skilled-trades capacity', 'Investment and Model e loss exposure'],
    hindsightFactRef: 'run-rate-retimed-2023',
  }),
  buildExperience({
    profile: TARGET_CANADA,
    commitmentReview: TARGET_CANADA_2014_WARNING_REVIEW_INPUT,
    snapshotId: 'warning-2014-02-26',
    sequence: 'T3',
    cost: [{ kind: 'realized', factRef: 'canada-ebit-2013', basis: 'first full-year segment operating loss', accrual: 'supersedes' }],
    id: 'target-canada-t3-2014-02-26',
    decisionDate: '2014-02-26',
    reassessmentDate: '2014-08-20',
    actor: 'Target management and board responsible for continuing the Canadian commitment',
    current: { factRef: 'canada-sales-2013', label: 'Canadian segment operating at $1.3B annual sales' },
    requested: { factRef: 'canada-ebit-2013', label: 'Absorb another operating year at the fiscal-2013 loss rate' },
    cadence: { factRef: 'canada-q4-margin-2013', label: 'Clear excess inventory at a 4.4% fourth-quarter margin' },
    requestedScale: 'another full operating year of the Canadian segment',
    timelineLabel: 'First full-year operating evidence',
    headline: 'A full year of economics against the operating floor',
    irreversibility: 'high',
    unknowns: ['Mature-store economics', 'Recovery investment authorization', 'Critical-role and training capacity', 'Board loss tolerance'],
    secondaryExposureLabels: [
      'Remaining lease obligations across the footprint',
      'Capital already sunk in stores and distribution',
      'Excess inventory still being cleared',
      'Workforce carried against unrecovered economics',
      'Cash consumed by continued operating losses',
    ],
    hindsightFactRef: 'stores-at-exit',
  }),
  buildExperience({
    profile: TARGET_CANADA,
    commitmentReview: TARGET_CANADA_2015_EXIT_REVIEW_INPUT,
    snapshotId: 'outcome-2015-02-25',
    sequence: 'T4',
    cost: [{ kind: 'realized', factRef: 'exit-charge-2014', basis: 'pretax impairment and exit charge', accrual: 'adds' }],
    id: 'target-canada-t4-2015-02-25',
    decisionDate: '2015-02-25',
    reassessmentDate: '2015-08-19',
    actor: 'Target board responsible for discontinuing the Canadian commitment',
    current: { factRef: 'stores-at-exit', label: '133 Canadian stores operating at the exit decision' },
    requested: { factRef: 'board-approved-exit', label: 'Discontinue Canadian operations' },
    cadence: { factRef: 'employees-at-exit', label: 'Wind down a 17,600-person workforce' },
    requestedScale: 'discontinuation of the whole Canadian segment',
    timelineLabel: 'Exit and loss recognition',
    headline: 'The commitment leaves its own value floor',
    irreversibility: 'high',
    unknowns: ['Recoverable value of the disposed assets', 'Redeployment of released capacity', 'Supplier and landlord settlement terms', 'Reputational carry into the home market'],
    secondaryExposureLabels: [
      'Lease obligations settled on exit',
      'Impaired store and distribution capital',
      'Inventory liquidated in wind-down',
      'Workforce released with the commitment',
      'Cash cost of the exit charge',
    ],
  }),
  buildExperience({
    profile: VA_EHR_MODERNIZATION,
    commitmentReview: VA_EHR_2018_REVIEW_INPUT,
    snapshotId: 'authorization-2018-05-17',
    sequence: 'T0',
    cost: [{ kind: 'committed', factRef: 'va-contract-ceiling-2018', basis: 'ten-year contract ceiling authorized at award', accrual: 'adds' }],
    id: 'va-ehr-t0-2018-05-17',
    decisionDate: '2018-05-17',
    reassessmentDate: '2019-05-17',
    actor: 'VA leadership responsible for authorizing the electronic health record replacement',
    current: { factRef: 'va-fy2018-appropriation', label: '$782 million appropriated for fiscal 2018' },
    requested: { factRef: 'va-contract-ceiling-2018', label: 'Authorize a ten-year record replacement at a $10 billion ceiling' },
    cadence: { factRef: 'va-specific-capability-additions-2018', label: 'Add Veteran, clinician, and community-care capabilities to the DoD platform' },
    requestedScale: 'enterprise-wide record replacement',
    timelineLabel: 'Contract authorization',
    headline: 'Authorizing the commitment before any reserve is placed',
    irreversibility: 'high',
    unknowns: ['Implementation staffing requirement', 'Site conversion cycle time', 'Total lifecycle cost', 'Release gates and stopping conditions'],
    secondaryExposureLabels: [
      'Ten-year contract ceiling committed at award',
      'Enterprise configuration and integration scope',
      'Conversion load across every VA medical center',
      'Clinical and implementation staffing not yet placed',
      'Sustainment cost beyond the appropriated year',
    ],
    hindsightFactRef: 'va-lifecycle-estimate-2022',
  }),
  buildExperience({
    profile: VA_EHR_MODERNIZATION,
    commitmentReview: VA_EHR_2020_REVIEW_INPUT,
    snapshotId: 'first-release-2020-10-24',
    sequence: 'T1',
    id: 'va-ehr-t1-2020-10-24',
    decisionDate: '2020-10-24',
    reassessmentDate: '2021-04-24',
    actor: 'VA leadership responsible for authorizing the first production deployment',
    current: { factRef: 'va-rollout-support-required-2020', label: '108 rollout-support positions identified as necessary' },
    requested: { factRef: 'va-initial-population-2020', label: 'Move more than 24,000 primary-care Veterans onto the new record' },
    cadence: { factRef: 'va-rollout-support-filled-2020', label: 'Release with a little more than 48 of those positions filled' },
    requestedScale: 'first full production site',
    timelineLabel: 'First production release',
    headline: 'Release before readiness conditions held',
    irreversibility: 'high',
    unknowns: ['Quantified patient-safety tolerance', 'Verification cycle completion', 'Site-level financial capacity', 'Release gate criteria'],
    secondaryExposureLabels: [
      'Cerner contract and sustainment exposure',
      'Infrastructure and hardware capital exposure',
      'Clinical configuration and mitigation backlog',
      'Clinical and rollout-support staffing exposure',
      'Site deployment and remediation spend exposure',
    ],
    hindsightFactRef: 'va-support-tickets-2021',
  }),
  buildExperience({
    profile: VA_EHR_MODERNIZATION,
    commitmentReview: VA_EHR_2022_REVIEW_INPUT,
    snapshotId: 'expansion-2022-03-26',
    sequence: 'T2',
    id: 'va-ehr-t2-2022-03-26',
    decisionDate: '2022-03-26',
    reassessmentDate: '2022-09-26',
    actor: 'VA leadership responsible for the deployment schedule beyond the first site',
    current: { factRef: 'va-support-tickets-2021', label: 'More than 38,700 support tickets raised at the first site' },
    requested: { factRef: 'va-second-site-live-2022', label: 'Bring a second medical center onto the new record' },
    cadence: { factRef: 'va-unresolved-medication-tickets-2021', label: 'Deploy with a third of reviewed medication tickets closed unresolved' },
    requestedScale: 'one additional medical center',
    timelineLabel: 'Expansion beyond the first site',
    headline: 'Adding a site nine days after the findings on the first',
    irreversibility: 'high',
    unknowns: ['Support staffing required per site', 'Remediation cycle time for the open findings', 'Gate criteria for the second site', 'Quantified patient-safety tolerance'],
    secondaryExposureLabels: [
      'Contract and sustainment exposure carried forward',
      'Configuration gaps replicated at a second site',
      'Open ticket backlog inherited by the expansion',
      'Support staffing spread across two live sites',
      'Deployment and remediation spend drawn from one budget',
    ],
    hindsightFactRef: 'va-user-experience-2023',
  }),
  buildExperience({
    profile: VA_EHR_MODERNIZATION,
    commitmentReview: VA_EHR_2023_REVIEW_INPUT,
    snapshotId: 'reset-2023-04-21',
    sequence: 'T3',
    cost: [{ kind: 'hindsight', factRef: 'va-lifecycle-estimate-2022', basis: 'independent lifecycle estimate, public a month after this decision', accrual: 'supersedes' }],
    id: 'va-ehr-t3-2023-04-21',
    decisionDate: '2023-04-21',
    reassessmentDate: '2024-04-21',
    actor: 'VA leadership responsible for the deployment schedule and the reset',
    current: { factRef: 'va-sites-live-at-reset-2023', label: 'Five VA medical-center systems operating on the new record' },
    requested: { factRef: 'va-deployment-halt-2023', label: 'Halt further deployments and redirect resources to the operating sites' },
    cadence: { factRef: 'va-user-experience-2023', label: 'Remediate against user-reported training, morale, and burnout evidence' },
    requestedScale: 'no additional sites',
    timelineLabel: 'Deployment reset',
    headline: 'Stopping the release cadence to restore verification',
    irreversibility: 'medium',
    unknowns: ['Remediation cost against remaining funding', 'Criteria for resuming deployment', 'Announced pause duration', 'Thresholds the live sites must meet'],
    secondaryExposureLabels: [
      'Continuing Cerner contract and sustainment exposure',
      'Capital already committed at the five live systems',
      'Open configuration-change backlog',
      'Support and remediation staffing at the live systems',
      'Remediation spend against unplaced remaining funding',
    ],
    hindsightFactRef: 'va-lifecycle-estimate-2022',
  }),
  buildExperience({
    profile: WATSON_MD_ANDERSON,
    commitmentReview: WATSON_MD_ANDERSON_2013_REVIEW_INPUT,
    snapshotId: 'commitment-2013-10-18',
    sequence: 'T0',
    id: 'watson-md-anderson-t0-2013-10-18',
    decisionDate: '2013-10-18',
    reassessmentDate: '2014-02-06',
    actor: 'MD Anderson clinical sponsor responsible for the Oncology Expert Advisor commitment',
    current: { factRef: 'oea-prototype-after-year', label: 'Prototype produced after a year-long collaboration' },
    requested: { factRef: 'oea-routine-care-goal', label: 'Move the advisor toward routine oncology care' },
    cadence: { factRef: 'oea-leukemia-first', label: 'Begin with leukemia before extending across cancers' },
    requestedScale: 'routine-care clinical advisor beginning in leukemia',
    timelineLabel: 'Public clinical-AI commitment',
    headline: 'Clinical ambition without a deployment gate',
    irreversibility: 'high',
    unknowns: ['Clinical acceptance gate', 'EHR integration plan', 'Project funding envelope', 'Critical clinical and technical capacity'],
    secondaryExposureLabels: [
      'IBM and implementation-partner contract exposure',
      'Data, model, and integration capital exposure',
      'Clinical knowledge and data curation backlog',
      'Clinical expert and engineering capacity',
      'Undisclosed project funding exposure',
    ],
    hindsightFactRef: 'oea-phase-1a-authorization',
  }),
  buildExperience({
    profile: WATSON_MD_ANDERSON,
    commitmentReview: WATSON_MD_ANDERSON_2014_REVIEW_INPUT,
    snapshotId: 'phase-1a-2014-02-06',
    sequence: 'T1',
    cost: [{ kind: 'committed', factRef: 'oea-phase-1a-authorization', basis: 'Phase 1A authorization from restricted gift funds', accrual: 'adds' }],
    id: 'watson-md-anderson-t1-2014-02-06',
    decisionDate: '2014-02-06',
    reassessmentDate: '2015-02-06',
    actor: 'MD Anderson clinical sponsor and Regents responsible for the Phase 1A commitment',
    current: { factRef: 'oea-live-testing-2013', label: 'Leukemia advisor in live-system testing with initially positive results' },
    requested: { factRef: 'oea-phase-1a-authorization', label: 'Authorize $15 million for an external transformation phase' },
    cadence: { factRef: 'oea-community-integration-next', label: 'Integrate and test the advisor in network delivery systems' },
    requestedScale: '$15 million external transformation phase',
    timelineLabel: 'Phase 1A authorization',
    headline: 'Another funded phase before adoption was proven',
    irreversibility: 'high',
    unknowns: ['Everyday physician adoption threshold', 'Delivery-system integration readiness', 'Total lifecycle cost', 'Stop condition'],
    secondaryExposureLabels: [
      'IBM and transformation-team contract exposure',
      'Network integration and clinical data capital',
      'Clinical validation and integration backlog',
      'Clinical, technical, and adoption-support capacity',
      'Restricted gift-fund exposure beyond Phase 1A',
    ],
    hindsightFactRef: 'oea-total-spend',
  }),
  buildExperience({
    profile: WATSON_MD_ANDERSON,
    commitmentReview: WATSON_MD_ANDERSON_2017_REVIEW_INPUT,
    snapshotId: 'audit-and-halt-2017-02-19',
    sequence: 'T2',
    cost: [
      { kind: 'realized', factRef: 'oea-total-spend', basis: 'total project spend reported by the audit', accrual: 'supersedes' },
      { kind: 'committed', factRef: 'oea-noncompetitive-awards', basis: 'six noncompetitive vendor awards reviewed by the audit', accrual: 'supersedes' },
    ],
    id: 'watson-md-anderson-t2-2017-02-19',
    decisionDate: '2017-02-19',
    reassessmentDate: '2017-08-19',
    actor: 'MD Anderson clinical sponsor and executive leadership responsible for any renewal',
    current: { factRef: 'oea-total-spend', label: '$62.1 million spent without routine clinical use' },
    requested: { factRef: 'oea-benched-2017', label: 'Bench the advisor after the IBM contract expired' },
    cadence: { factRef: 'oea-contract-extensions', label: 'End a sequence of twelve IBM contract extensions' },
    requestedScale: 'no further IBM-funded development',
    timelineLabel: 'Audit and halt',
    headline: 'The commitment reaches its value and readiness floors',
    irreversibility: 'high',
    unknowns: ['Recoverable technical assets', 'Staff redeployment', 'Contract recovery rights', 'Conditions for any successor procurement'],
    secondaryExposureLabels: [
      'Expired IBM contract and successor-procurement exposure',
      'Stranded model, data, and integration capital',
      'Incomplete clinical and technical work',
      'Clinical and engineering staff redeployment',
      '$62.1 million of realized project spending',
    ],
  }),
] as const;
