import type { CaseProfile, EvidenceRef } from '../cases/profile';
import { TARGET_CANADA } from '../cases';
import {
  EXPOSURE_CATEGORIES,
  type DecisionPacket,
  type DecisionPoint,
  type ExposureCategory,
  type ResolvedDecisionInput,
} from './decision-point';
import { resolveDecisionPoint } from './evidence-integrity';
import {
  TARGET_CANADA_AUGUST_2013_DECISION_POINT,
} from './fixtures/target-canada-august-2013';
import type { JudgmentResult, OperationRecommendation } from './judgment';
import {
  TARGET_CANADA_AUGUST_2013_COMPARISON,
  TARGET_CANADA_AUGUST_2013_JUDGMENT,
  type ExposureComparisonCategory,
} from './target-canada-august-evaluation';

export const DEFAULT_DECISION_EXPERIENCE_ID = TARGET_CANADA_AUGUST_2013_DECISION_POINT.id;

export interface DecisionTimelineOption {
  readonly id: string;
  readonly sequence: DecisionPoint['sequence'];
  readonly label: string;
  readonly decisionDate: string;
  readonly knowledgeCutoff: string;
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

export interface DecisionExperienceViewModel {
  readonly id: string;
  readonly sequence: DecisionPoint['sequence'];
  readonly actor: DecisionPoint['actor'];
  readonly currentCohort: ResolvedDecisionInput;
  readonly requestedIncrement: ResolvedDecisionInput;
  readonly cutoff: string;
  readonly verdict: JudgmentResult['verdict'];
  readonly validatedScale: {
    readonly status: JudgmentResult['nextSafeCommitment']['status'];
    readonly value: string;
    readonly description: string;
  };
  readonly bindingDimensions: readonly string[];
  readonly materialUnknowns: readonly string[];
  readonly recommendations: readonly [OperationRecommendation, OperationRecommendation];
  readonly actualComparison: typeof TARGET_CANADA_AUGUST_2013_COMPARISON;
  readonly exposures: readonly ExposureComparisonCategory[];
  readonly evidence: readonly PresentationEvidence[];
  readonly inspectionInputs: readonly ResolvedDecisionInput[];
  readonly constructs: readonly PresentationConstruct[];
  readonly assumptions: readonly PresentationAssumption[];
  readonly hindsight: readonly ResolvedDecisionInput[];
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
  readonly decisionPoint: DecisionPoint;
  readonly judgment: JudgmentResult;
  readonly comparison: typeof TARGET_CANADA_AUGUST_2013_COMPARISON;
  readonly timelineLabel: string;
}

const SOURCES: readonly DecisionExperienceSource[] = [
  {
    profile: TARGET_CANADA,
    decisionPoint: TARGET_CANADA_AUGUST_2013_DECISION_POINT,
    judgment: TARGET_CANADA_AUGUST_2013_JUDGMENT,
    comparison: TARGET_CANADA_AUGUST_2013_COMPARISON,
    timelineLabel: 'Scaling decision after 68 stores',
  },
];

const TIMELINE_OPTIONS: readonly DecisionTimelineOption[] = SOURCES.map((source) => ({
  id: source.decisionPoint.id,
  sequence: source.decisionPoint.sequence,
  label: source.timelineLabel,
  decisionDate: source.decisionPoint.decisionDate,
  knowledgeCutoff: source.decisionPoint.knowledgeCutoff,
}));

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
    sequence: source.decisionPoint.sequence,
    actor: source.decisionPoint.actor,
    currentCohort,
    requestedIncrement,
    cutoff: source.decisionPoint.knowledgeCutoff,
    verdict: source.judgment.verdict,
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
