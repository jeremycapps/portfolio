import {
  ADOBE_CREATIVE_CLOUD,
  DOMINOS_2025_GROWTH,
  FORD_MODEL_E,
  TARGET_CANADA,
  VA_EHR_MODERNIZATION,
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
import { VA_EHR_2020_REVIEW_INPUT } from '../../scoring/va-ehr-2020-review';
import { VA_EHR_2023_REVIEW_INPUT } from '../../scoring/va-ehr-2023-review';
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
  readonly snapshotId: string;
  readonly sequence: DecisionPoint['sequence'];
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
  readonly hindsightFactRef: string;
}

export interface AuthoredDecisionExperience {
  readonly profile: CaseProfile;
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
    hindsight: [inputFromFact(
      config.profile,
      config.hindsightFactRef,
      'outcome-hindsight',
      'Later outcome evidence',
      'context',
    )],
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
    snapshotId: TARGET_CANADA_COMMITMENT_SCORECARD.evidencePacket.snapshot.id,
    sequence: 'T0',
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
    commitmentReview: VA_EHR_2023_REVIEW_INPUT,
    snapshotId: 'reset-2023-04-21',
    sequence: 'T3',
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
] as const;
