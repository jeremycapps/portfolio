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
export interface EvidenceLink {
  readonly title: string;
  readonly url: string;
}

export interface PresentationLeg {
  readonly id: string;
  readonly label: string;
  readonly kind: 'floor' | 'capacity';
  readonly status: 'pass' | 'fail' | 'no-line';
  readonly detail: string;
  /**
   * The overage as a figure, where one is placeable — "50% short", "$941M
   * over". Capacity legs carry it; floors are qualitative and do not.
   */
  readonly figure?: string;
  /** The bar signal: over capacity, within it, or no line to draw. */
  readonly bar: { readonly state: 'over' | 'within' | 'none'; readonly fill: number };
  /** The sources behind this leg, resolved to title and URL. */
  readonly evidence: readonly EvidenceLink[];
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

export type RecommendationVerb = 'PROCEED' | 'TRIM' | 'HOLD' | 'EXIT' | 'WAIT';

export interface DecisionRecommendation {
  /**
   * The engine's call, kept as a quiet tag rather than the headline. The
   * headline is the situated verdict the page composes; the verb is machinery.
   */
  readonly verb: RecommendationVerb;
  /**
   * The second half of the verdict sentence — what the spend has and hasn't
   * bought. Paired in the page with the spend figure it is set against.
   */
  readonly gap: string;
  readonly breaking: readonly string[];
  readonly open: readonly string[];
  /** Where the uncertainty concentrates — the one place to point attention. */
  readonly focus?: { readonly label: string; readonly detail: string };
  /** Who owns that focus, translated from the leg to a natural role. */
  readonly owner?: string;
  /** The concrete next step, usually social: get the owner's read before X. */
  readonly move: string;
}

/**
 * The role that owns a leg, in the words an operator would use.
 *
 * Derived rather than authored, so it survives the case data being rewritten.
 * Capacity legs map by model; floor legs by the concept in their label. Kept
 * central here rather than on the review inputs for the same reason — the whole
 * point of screen two is that it reads from whatever cases exist.
 */
function ownerFor(leg: PresentationLeg): string {
  if (leg.kind === 'capacity') {
    return leg.id === 'finance' ? 'the CFO' : leg.id === 'people' ? 'the staffing lead' : 'the delivery lead';
  }
  const key = `${leg.id} ${leg.label}`.toLowerCase();
  const rules: readonly [RegExp, string][] = [
    [/liquid|econom|budget|financ|capital/, 'the CFO'],
    [/staff|people|workforce|hiring/, 'the staffing lead'],
    [/safety|exposure|risk|toler/, 'the risk owner'],
    [/authority|legitimacy|governance|sponsor/, 'the sponsor'],
    [/infrastruc|readiness|conversion|remediat|release|capabil|operab|deploy/, 'the delivery lead'],
  ];
  return rules.find(([re]) => re.test(key))?.[1] ?? 'the owner';
}

const MOVE_TEMPLATE: Record<RecommendationVerb, (owner: string, focus: string) => string> = {
  PROCEED: () => 'Clear to proceed at the placed scale.',
  TRIM: (owner, focus) => `Get ${owner}'s read on ${focus} before the next increment.`,
  HOLD: (owner, focus) => `Get ${owner}'s read on ${focus} before the next release.`,
  WAIT: (owner, focus) => `Get ${owner}'s read on ${focus} before committing further.`,
  EXIT: () => 'No read left to get — this is the wind-down call.',
};

function verbFor(view: DecisionExperienceViewModel): RecommendationVerb {
  if (view.cause.kind === 'value-floor') return 'EXIT';
  if (view.cause.kind === 'risk-floor') return 'HOLD';
  if (view.verdict === 'COLLISION') return 'TRIM';
  if (view.verdict === 'FIT') return 'PROCEED';
  return 'WAIT';
}

/**
 * The recommendation as three plain-language parts: where the money went, where
 * the uncertainty is, and whose read closes it.
 *
 * Pure over the view model, so a browser never runs it and a test can. The
 * spend half of the verdict is composed in the page, where the running total
 * lives; everything that comes from the decision itself is here.
 */
export function decisionRecommendation(view: DecisionExperienceViewModel): DecisionRecommendation {
  const verb = verbFor(view);
  const breaking = view.legs.filter(({ status }) => status === 'fail').map(({ label }) => label);
  const open = view.legs.filter(({ status }) => status === 'no-line').map(({ label }) => label);
  const cleared = view.legs.filter(({ status }) => status === 'pass');

  // The focus is the single item most worth attention: what breaks first, then
  // what cannot be priced. A commitment that clears everything has none.
  const focusLeg = view.legs.find(({ status }) => status === 'fail')
    ?? view.legs.find(({ status }) => status === 'no-line');

  const gap = breaking.length > 0
    ? `${listLabels(breaking)} ${breaking.length === 1 ? 'falls' : 'fall'} short`
    : open.length === view.legs.length
      ? 'nothing is proven yet'
      : cleared.length === view.legs.length
        ? 'every condition clears'
        : `every condition clears; only ${listLabels(open).toLowerCase()} ${open.length === 1 ? 'is' : 'are'} unpriced`;

  const owner = verb === 'EXIT' || verb === 'PROCEED' || !focusLeg ? undefined : ownerFor(focusLeg);
  const move = MOVE_TEMPLATE[verb](owner ?? 'the owner', focusLeg?.label.toLowerCase() ?? 'the open question');

  return {
    verb,
    gap,
    breaking,
    open,
    ...(focusLeg ? { focus: { label: focusLeg.label, detail: focusLeg.detail } } : {}),
    ...(owner ? { owner } : {}),
    move,
  };
}

/** "A, B and C" — the verdict reads as a sentence, not a slug list. */
function listLabels(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? '';
  return `${labels.slice(0, -1).join(', ')} and ${labels[labels.length - 1]}`;
}

/** A capacity placement, read for the short overage figure and bar signal. */
function readCapacityFigure(
  placement: CommitmentReviewInput['placements'][SpendModel],
): { figure?: string; bar: PresentationLeg['bar'] } {
  const mid = (r: { low: number; high: number }) => (r.low + r.high) / 2;
  const money = (unit: string, n: number) => /usd|\$|dollar|billion|million/i.test(unit)
    ? (Math.abs(n) >= 1000 ? `$${(Math.abs(n) / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B` : `$${Math.round(Math.abs(n)).toLocaleString('en-US')}M`)
    : Math.round(Math.abs(n)).toLocaleString('en-US');

  switch (placement.kind) {
    case 'evidenced-shortfall': {
      const req = mid(placement.required.value);
      const avail = mid(placement.available.value);
      const shortFrac = req > 0 ? Math.max(0, (req - avail) / req) : 0;
      return {
        figure: `${Math.round(shortFrac * 100)}% short`,
        bar: { state: avail < req ? 'over' : 'within', fill: Math.min(1, shortFrac) },
      };
    }
    case 'structural-upper-bound':
      // A negative bound is a collision by the amount of the shortfall.
      return placement.fitAtMost < 0
        ? { figure: `${money(placement.unit, placement.fitAtMost)} over`, bar: { state: 'over', fill: 0.8 } }
        : { bar: { state: 'within', fill: 0.35 } };
    case 'structural-lower-bound':
      return { figure: 'within', bar: { state: 'within', fill: 0.35 } };
    case 'structural-bound': {
      if (placement.fit.high < 0) return { figure: `${money(placement.unit, placement.fit.high)} over`, bar: { state: 'over', fill: 0.8 } };
      if (placement.fit.low >= 0) return { figure: 'within', bar: { state: 'within', fill: 0.35 } };
      return { bar: { state: 'none', fill: 0 } };
    }
    default:
      return { bar: { state: 'none', fill: 0 } };
  }
}

/** Fact refs resolved to their sources, deduped by URL. */
function resolveEvidence(profile: CaseProfile, factRefs: readonly string[]): EvidenceLink[] {
  const links = new Map<string, string>();
  for (const ref of factRefs) {
    const fact = profile.facts.find(({ id }) => id === ref);
    for (const { sourceId } of fact?.evidence ?? []) {
      const source = profile.sources.find(({ id }) => id === sourceId);
      if (source) links.set(source.url, source.title);
    }
  }
  return [...links].map(([url, title]) => ({ title, url }));
}

function capacityFactRefs(placement: CommitmentReviewInput['placements'][SpendModel]): string[] {
  switch (placement.kind) {
    case 'evidenced-shortfall': return [placement.required.sourceRef, placement.available.sourceRef];
    case 'structural-upper-bound':
    case 'structural-lower-bound':
    case 'structural-bound': return placement.sources.map(({ ref }) => ref);
    default: return [];
  }
}

const CAPACITY_LABEL: Record<SpendModel, string> = {
  people: 'People',
  time: 'Time',
  finance: 'Budget',
};

/** Floor ids read as slugs; give the reader words, and fold legitimacy into
 *  a plain "Stakeholders". */
function floorLabel(id: string): string {
  if (/stakeholder|legitimacy/i.test(id)) return 'Stakeholders';
  return id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/** A readable explanation for a capacity leg, composed from figures where the
 *  placement carries no rationale of its own (as evidenced-shortfall does not). */
function capacityDetail(
  authored: CommitmentReviewInput['placements'][SpendModel],
  placed: CommitmentReviewResult['placements'][SpendModel],
): string {
  if (authored.kind === 'indeterminate') return authored.reason;
  if ('rationale' in authored) return authored.rationale;
  if (authored.kind === 'evidenced-shortfall') {
    const range = (r: { low: number; high: number }) =>
      r.low === r.high ? `${r.low}` : `${r.low}–${r.high}`;
    return `${range(authored.required.value)} ${authored.required.unit} required against `
      + `${range(authored.available.value)} available — ${authored.scope}.`;
  }
  return placed.reason ?? '';
}

function presentationLegs(
  input: CommitmentReviewInput,
  review: CommitmentReviewResult,
  profile: CaseProfile,
): PresentationLeg[] {
  const floors = input.riskFloors.map((floor): PresentationLeg => ({
    id: floor.id,
    label: floorLabel(floor.id),
    kind: 'floor',
    status: floor.status === 'trip' ? 'fail' : floor.status === 'pass' ? 'pass' : 'no-line',
    detail: floor.rationale,
    bar: { state: floor.status === 'trip' ? 'over' : floor.status === 'pass' ? 'within' : 'none', fill: floor.status === 'unknown' ? 0 : floor.status === 'trip' ? 0.85 : 0.35 },
    evidence: resolveEvidence(profile, floor.sourceRefs),
  }));

  const capacity = (Object.keys(CAPACITY_LABEL) as SpendModel[]).map((model): PresentationLeg => {
    const placed = review.placements[model];
    const authored = input.placements[model];
    const { figure, bar } = readCapacityFigure(authored);
    return {
      id: model,
      label: CAPACITY_LABEL[model],
      kind: 'capacity',
      status: placed.status === 'collides' ? 'fail' : placed.status === 'fits' ? 'pass' : 'no-line',
      detail: capacityDetail(authored, placed),
      ...(figure ? { figure } : {}),
      bar,
      evidence: resolveEvidence(profile, capacityFactRefs(authored)),
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
    legs: presentationLegs(source.reviewInput, source.review, source.profile),
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
