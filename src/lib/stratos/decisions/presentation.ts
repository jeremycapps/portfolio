import type { CaseProfile, EvidenceRef, SystemId } from '../cases/profile';
import { SYSTEM_IDS, TARGET_CANADA } from '../cases';
import { TENSIONS, poleName, poleSideFor, type PoleSide } from '../ontology';
import type { CaseScorecard } from '../scoring/scorecard';
import type {
  CommitmentReviewInput,
  CommitmentReviewResult,
  SpendModel,
} from '../scoring/rubric';
import {
  TARGET_CANADA_AUGUST_2013_REVIEW,
  TARGET_CANADA_AUGUST_2013_REVIEW_INPUT,
} from '../scoring/target-canada-august-review';
import {
  EXPOSURE_CATEGORIES,
  type DecisionPacket,
  type DecisionPoint,
  type ExposureCategory,
  type ResolvedDecisionInput,
} from './decision-point';
import { resolveDecisionPoint } from './evidence-integrity';
import { resolveCostFigure, type CostFigure } from './cost';
import {
  CALIBRATED_COMMITMENT_EXPERIENCES,
  TARGET_CANADA_AUGUST_2013_DECISION_POINT,
} from './fixtures';
import type { DecisionComparison } from './decision-comparison';
import type { JudgmentCause, JudgmentResult, OperationRecommendation } from './judgment';
import {
  TARGET_CANADA_AUGUST_2013_COMPARISON,
  TARGET_CANADA_AUGUST_2013_JUDGMENT,
} from './target-canada-august-evaluation';

export const DEFAULT_DECISION_EXPERIENCE_ID = TARGET_CANADA_AUGUST_2013_DECISION_POINT.id;

export interface DecisionTimelineOption {
  readonly id: string;
  readonly sequence: DecisionPoint['sequence'];
  readonly label: string;
  readonly decisionDate: string;
  readonly knowledgeCutoff: string;
  readonly companyName: string;
  /** Carried on the option so a chart can plot a whole case without resolving
   *  every decision one at a time. Empty where the packet reports no dollars. */
  readonly cost: readonly CostFigure[];
}

export interface PresentationAssumption {
  readonly id: string;
  /** Kept on every assumption so a renderer cannot turn analysis into fact by omission. */
  readonly displayLabel: 'ASSUMPTION';
  readonly statement: string;
}

export type PresentationConstruct = DecisionPoint['constructs'][number] & {
  /** Analytical constructs retain this label even when their authored provenance is assumption. */
  readonly displayLabel: 'ANALYTICAL';
};

export interface PresentationEvidence extends ResolvedDecisionInput {
  readonly evidence: EvidenceRef;
  readonly sourceTitle: string;
  readonly publishedAt: string;
}

/**
 * One tension with its placement, ready to render as a pole split.
 *
 * `position` runs -1 to +1 across the two poles named by `leftLabel` and
 * `rightLabel`. `poleLabel` is the pole the placement actually selects, and is
 * absent when the placement is neutral — a renderer should show the tension as
 * unresolved rather than round it to a side.
 */
export interface PresentationTension {
  readonly id: SystemId;
  readonly name: string;
  readonly question: string;
  readonly position: number;
  readonly side: PoleSide;
  readonly poleLabel?: string;
  readonly leftLabel: string;
  readonly rightLabel: string;
  readonly confidence: number;
  /**
   * What the placed pole is proven by.
   *
   * The tension's own name is internal vocabulary — a reader has no reason to
   * know what "Discernment" means, and being told is not the same as being
   * shown. The proof is the part that carries meaning on its own.
   */
  readonly proof?: string;
}

/**
 * One condition the commitment has to clear, and whether it clears it.
 *
 * Floors and capacity models are different tests — a floor is a precondition,
 * a model is a reserve — but they answer the same reader question, so they are
 * presented together. `no-line` covers both an unknown floor and an
 * indeterminate placement: the evidence does not support pricing it either way,
 * which is a third answer rather than a soft pass.
 */
export interface PresentationLeg {
  readonly id: string;
  readonly label: string;
  readonly kind: 'floor' | 'capacity';
  readonly status: 'pass' | 'fail' | 'no-line';
  readonly detail: string;
}

/**
 * Why the verdict landed where it did.
 *
 * The display vocabulary has three verdicts while the commitment review has
 * four outcomes, so a breached floor arrives as COLLISION alongside a genuine
 * capacity collision. The cause is what keeps them apart: a precondition that
 * did not hold is a different finding from an increment that was too large for
 * the reserve, and a renderer showing only the verdict loses that.
 */
export interface PresentationCause {
  readonly kind: JudgmentCause['kind'];
  /** Fixed label so a renderer names the cause without re-deriving it. */
  readonly displayLabel: string;
  readonly summary: string;
  readonly evidence: readonly PresentationCauseEvidence[];
}

export interface PresentationCauseEvidence extends EvidenceRef {
  readonly sourceTitle: string;
  readonly publishedAt: string;
}

const CAUSE_LABELS: Readonly<Record<JudgmentCause['kind'], string>> = {
  fit: 'ABSORBABLE',
  'material-uncertainty': 'MATERIAL UNCERTAINTY',
  capacity: 'CAPACITY',
  readiness: 'READINESS',
  transferability: 'TRANSFERABILITY',
  'value-floor': 'VALUE FLOOR',
  'risk-floor': 'RISK FLOOR',
  authority: 'AUTHORITY',
};

export interface DecisionExperienceViewModel {
  readonly id: string;
  readonly companyName: string;
  readonly caseName: string;
  readonly headline: string;
  readonly sequence: DecisionPoint['sequence'];
  readonly actor: DecisionPoint['actor'];
  readonly currentCohort: ResolvedDecisionInput;
  readonly requestedIncrement: ResolvedDecisionInput;
  readonly cutoff: string;
  readonly verdict: JudgmentResult['verdict'];
  readonly cause: PresentationCause;
  readonly validatedScale: {
    readonly status: JudgmentResult['nextSafeCommitment']['status'];
    readonly value: string;
    readonly description: string;
  };
  readonly bindingDimensions: readonly string[];
  readonly materialUnknowns: readonly string[];
  readonly recommendations: readonly [OperationRecommendation, OperationRecommendation];
  readonly actualComparison: DecisionComparison;
  readonly exposures: readonly DecisionComparison['exposures'][ExposureCategory][];
  readonly primaryExposure: DecisionComparison['exposures'][ExposureCategory];
  readonly primaryExposureTitle: string;
  readonly evidence: readonly PresentationEvidence[];
  readonly inspectionInputs: readonly ResolvedDecisionInput[];
  readonly constructs: readonly PresentationConstruct[];
  readonly assumptions: readonly PresentationAssumption[];
  readonly hindsight: readonly ResolvedDecisionInput[];
  /**
   * What this decision placed in money, where the case has a fact for it.
   *
   * Empty for most decisions, and the emptiness is load-bearing: a release date
   * that reports readiness rather than dollars contributes no point to a cost
   * view, which is not the same as contributing a zero.
   */
  readonly cost: readonly CostFigure[];
  /** Every condition the commitment has to clear, and how each one reads. */
  readonly legs: readonly PresentationLeg[];
  /**
   * Present only when the case carries a scorecard placing its tensions.
   *
   * Placements are dated, so a decision may only show the placement made at its
   * own evidence date. A case scored per release date has no scorecard spanning
   * those dates, and a later decision must not borrow the commitment date's
   * poles — so those decisions render without them rather than with borrowed
   * ones.
   */
  readonly tensions?: readonly PresentationTension[];
  readonly cards: {
    readonly currentCohort: ResolvedDecisionInput;
    readonly requestedIncrement: ResolvedDecisionInput;
    readonly cadence: ResolvedDecisionInput;
    readonly irreversibility: DecisionPoint['irreversibility'];
    readonly reassessment: DecisionPoint['reassessment'];
  };
  readonly timeline: {
    readonly options: readonly DecisionTimelineOption[];
    readonly selectedId: string;
  };
}

interface DecisionExperienceSource {
  readonly profile: CaseProfile;
  /** Supplies tension placements. Omitted for decisions scored per release date. */
  readonly scorecard?: CaseScorecard;
  /** Money this decision placed. Empty where the packet reports no dollars. */
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

const SOURCES: readonly DecisionExperienceSource[] = [
  CALIBRATED_COMMITMENT_EXPERIENCES[0],
  {
    profile: TARGET_CANADA,
    cost: [resolveCostFigure(TARGET_CANADA, {
      kind: 'realized',
      factRef: 'canada-ebit-q2-2013',
      basis: 'second-quarter segment operating loss',
      accrual: 'adds',
    })],
    reviewInput: TARGET_CANADA_AUGUST_2013_REVIEW_INPUT,
    review: TARGET_CANADA_AUGUST_2013_REVIEW,
    decisionPoint: TARGET_CANADA_AUGUST_2013_DECISION_POINT,
    judgment: TARGET_CANADA_AUGUST_2013_JUDGMENT,
    comparison: TARGET_CANADA_AUGUST_2013_COMPARISON,
    companyName: 'Target Corporation',
    caseName: 'Target Canada market entry',
    timelineLabel: 'Scaling decision after 68 stores',
    headline: 'Scaling decision after 68 stores',
    primaryExposureCategory: 'scopeActivation',
    primaryExposureTitle: 'Store-activation exposure only',
  },
  ...CALIBRATED_COMMITMENT_EXPERIENCES.slice(1),
];

const TIMELINE_OPTIONS: readonly DecisionTimelineOption[] = SOURCES.map((source) => ({
  id: source.decisionPoint.id,
  sequence: source.decisionPoint.sequence,
  label: source.timelineLabel,
  decisionDate: source.decisionPoint.decisionDate,
  knowledgeCutoff: source.decisionPoint.knowledgeCutoff,
  companyName: source.companyName,
  cost: source.cost,
}));

function presentationCause(cause: JudgmentCause, profile: CaseProfile): PresentationCause {
  const sourceById = new Map(profile.sources.map((source) => [source.id, source]));
  return {
    kind: cause.kind,
    displayLabel: CAUSE_LABELS[cause.kind],
    summary: cause.summary,
    evidence: cause.evidenceRefs.flatMap((ref) => {
      const source = sourceById.get(ref.sourceId);
      return source ? [{ ...ref, sourceTitle: source.title, publishedAt: source.publishedAt }] : [];
    }),
  };
}

const CAPACITY_LABEL: Record<SpendModel, string> = {
  people: 'People',
  time: 'Time',
  finance: 'Budget',
};

function presentationLegs(
  input: CommitmentReviewInput,
  review: CommitmentReviewResult,
): PresentationLeg[] {
  const floors = input.riskFloors.map((floor): PresentationLeg => ({
    id: floor.id,
    // Floor ids are authored as slugs; the reader gets words.
    label: floor.id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase()),
    kind: 'floor',
    status: floor.status === 'trip' ? 'fail' : floor.status === 'pass' ? 'pass' : 'no-line',
    detail: floor.rationale,
  }));

  const capacity = (Object.keys(CAPACITY_LABEL) as SpendModel[]).map((model): PresentationLeg => {
    const placed = review.placements[model];
    const authored = input.placements[model];
    return {
      id: model,
      label: CAPACITY_LABEL[model],
      kind: 'capacity',
      status: placed.status === 'collides' ? 'fail' : placed.status === 'fits' ? 'pass' : 'no-line',
      detail: authored.kind === 'indeterminate'
        ? authored.reason
        : 'rationale' in authored ? authored.rationale : (placed.reason ?? ''),
    };
  });

  return [...floors, ...capacity];
}

function presentationTensions(scorecard: CaseScorecard): PresentationTension[] {
  return SYSTEM_IDS.map((id: SystemId) => {
    const tension = TENSIONS.find((candidate) => candidate.id === id);
    if (!tension) throw new Error(`Ontology is missing tension ${id}.`);
    const placed = scorecard.position.tensions[id];
    const side = poleSideFor(placed.position);
    return {
      id,
      name: tension.name,
      question: tension.question,
      position: placed.position,
      side,
      poleLabel: side === 'neutral' ? undefined : poleName(tension, side),
      ...(side === 'neutral' ? {} : { proof: side === 'r' ? tension.proofRight : tension.proofLeft }),
      leftLabel: tension.left,
      rightLabel: tension.right,
      confidence: placed.confidence,
    };
  });
}

function requireResolvedInput(packet: DecisionPacket, id: string): ResolvedDecisionInput {
  const input = packet.contemporaneousInputs.find((candidate) => candidate.id === id);
  if (!input) throw new Error(`Decision packet is missing presentation input: ${id}.`);
  return input;
}

function presentationEvidence(packet: DecisionPacket): PresentationEvidence[] {
  return packet.contemporaneousInputs.flatMap((input) => (
    input.evidence && input.sourceTitle && input.publishedAt
      ? [{ ...input, evidence: input.evidence, sourceTitle: input.sourceTitle, publishedAt: input.publishedAt }]
      : []
  ));
}

/**
 * Resolve the selected dated decision into renderer-ready data.
 *
 * A new validated packet is built on every call. Renderers never filter facts
 * by date themselves and hindsight remains a separate collection.
 */
export function createDecisionExperienceViewModel(
  selectedId: string = DEFAULT_DECISION_EXPERIENCE_ID,
): DecisionExperienceViewModel {
  const source = SOURCES.find(({ decisionPoint }) => decisionPoint.id === selectedId);
  if (!source) throw new Error(`Unknown decision experience selection: ${selectedId}.`);

  const packet = resolveDecisionPoint(source.decisionPoint, source.profile);
  const currentCohort = requireResolvedInput(packet, source.decisionPoint.currentCommitment.id);
  const requestedIncrement = requireResolvedInput(packet, source.decisionPoint.requestedIncrement.id);
  const cadence = requireResolvedInput(packet, source.decisionPoint.cadence.id);

  return {
    id: source.decisionPoint.id,
    companyName: source.companyName,
    caseName: source.caseName,
    headline: source.headline,
    sequence: source.decisionPoint.sequence,
    actor: source.decisionPoint.actor,
    currentCohort,
    requestedIncrement,
    cutoff: source.decisionPoint.knowledgeCutoff,
    verdict: source.judgment.verdict,
    cause: presentationCause(source.judgment.cause, source.profile),
    validatedScale: {
      status: source.judgment.nextSafeCommitment.status,
      value: source.judgment.validatedScale,
      description: source.judgment.nextSafeCommitment.description,
    },
    bindingDimensions: [...source.judgment.bindingDimensions],
    materialUnknowns: [...source.judgment.materialUnknowns],
    recommendations: source.judgment.recommendations,
    actualComparison: source.comparison,
    exposures: EXPOSURE_CATEGORIES.map((category: ExposureCategory) => source.comparison.exposures[category]),
    primaryExposure: source.comparison.exposures[source.primaryExposureCategory],
    primaryExposureTitle: source.primaryExposureTitle,
    evidence: presentationEvidence(packet),
    inspectionInputs: [...packet.contemporaneousInputs],
    constructs: source.decisionPoint.constructs.map((construct) => ({
      ...construct,
      displayLabel: 'ANALYTICAL',
    })),
    assumptions: source.decisionPoint.assumptions.map((assumption) => ({
      ...assumption,
      displayLabel: 'ASSUMPTION',
    })),
    hindsight: [...packet.hindsightInputs],
    cost: source.cost,
    legs: presentationLegs(source.reviewInput, source.review),
    ...(source.scorecard ? { tensions: presentationTensions(source.scorecard) } : {}),
    cards: {
      currentCohort,
      requestedIncrement,
      cadence,
      irreversibility: source.decisionPoint.irreversibility,
      reassessment: source.decisionPoint.reassessment,
    },
    timeline: {
      options: TIMELINE_OPTIONS.map((option) => ({ ...option })),
      selectedId: source.decisionPoint.id,
    },
  };
}
