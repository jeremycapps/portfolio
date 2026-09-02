import { SYSTEM_IDS, type SystemId } from '../cases/profile';

export const STRATOS_SCORING_RUBRIC = {
  id: 'stratos.scoring-rubric',
  version: '0.2.0',
  status: 'draft-next-hypothesis',
  positionScale: {
    minimum: -1,
    center: 0,
    maximum: 1,
    centerMeaning: 'Deliberate synthesis or no material position; never an automatic ideal or failure.',
  },
  decisionOutcomes: ['FLOOR', 'FOG', 'COLLISION', 'ABSORBABLE'],
  invariants: [
    'Position diagnostics do not decide viability.',
    'Risk floors are non-compensating.',
    'People, time, and finance fit independently; surplus in one cannot offset a deficit in another.',
    'A desk review cannot assert committed or actual figures.',
    'An estimate is a range, never a point.',
    'Uncertainty that crosses a viability boundary produces FOG.',
    'Tailwinds route attention but do not create unearned capacity.',
  ],
  tempoLineage: [
    'engine/v2/_metadata/Tension_Model.md@5.1',
    '10_Assessments/CommitmentReview/_metadata/Formal_Model.md@0.1',
    '10_Assessments/CommitmentReview/_metadata/Strain_Mapping.md@0.1',
    '10_Assessments/CommitmentReview/source_contract.md@0.1',
    '10_Assessments/CommitmentReview/profiles/target-2011.md',
  ],
} as const;

export const POSITION_SIGMA_MAX = 1 / Math.sqrt(3);
export const POSITION_INTERVAL_Z = 1.96;
export const EVIDENCE_HALF_SATURATION = 3;
export const LOW_COMMITMENT_THRESHOLD = 0.2;
export const LAYER_BALANCE_REPORT_BAND = 0.25;

export type StrategicPosture = 'insurgent' | 'challenger' | 'incumbent';
export type Layer = 'strategy' | 'business';
export type EvidenceTrack = 'desk' | 'evidenced';
export type SpendModel = 'people' | 'time' | 'finance';
export type CapacityModel = SpendModel | 'risk';
export type DecisionOutcome = typeof STRATOS_SCORING_RUBRIC.decisionOutcomes[number];

export interface NumericRange {
  readonly low: number;
  readonly high: number;
}

export type EvidenceBasis =
  | {
      readonly track: 'desk';
      /** Asserted limitation, not a count-derived measurement. */
      readonly confidence: number;
    }
  | {
      readonly track: 'evidenced';
      /** Count of known signals in the evidence catalogue for each pole. */
      readonly leftObserved: number;
      readonly rightObserved: number;
    };

export interface TensionPositionInput {
  readonly position: number;
  readonly rationale: string;
  readonly metricName: string;
  readonly sourceRefs: readonly string[];
  readonly evidence: EvidenceBasis;
  readonly attentionMultiplier?: number;
  readonly attentionRationale?: string;
}

export interface OrganizationPositionInput {
  readonly posture: StrategicPosture;
  readonly tensions: Readonly<Record<SystemId, TensionPositionInput>>;
}

export interface TensionPositionResult {
  readonly position: number;
  readonly confidence: number;
  readonly sigma: number;
  readonly interval: NumericRange;
  readonly attentionShare: number;
  readonly priority: number;
}

export interface LayerBalanceResult {
  readonly pair: 'economics' | 'commitment' | 'renewal';
  readonly strategyTension: SystemId;
  readonly businessTension: SystemId;
  readonly balance: number;
  readonly report: boolean;
}

export interface OrganizationPositionResult {
  readonly evidenceTrack: EvidenceTrack | 'mixed';
  readonly tensions: Readonly<Record<SystemId, TensionPositionResult>>;
  readonly commitmentIndex: number;
  readonly spread: number;
  readonly evidenceIndex: number;
  readonly lowCommitment: boolean;
  readonly layerBalances: readonly LayerBalanceResult[];
}

const TENSION_LAYER: Readonly<Record<SystemId, Layer>> = {
  advantage: 'strategy',
  discernment: 'strategy',
  invention: 'strategy',
  resource: 'business',
  execution: 'business',
  operations: 'business',
};

const POSTURE_LAYER_ATTENTION: Readonly<Record<StrategicPosture, Readonly<Record<Layer, number>>>> = {
  insurgent: { strategy: 0.6, business: 0.4 },
  challenger: { strategy: 0.5, business: 0.5 },
  incumbent: { strategy: 0.4, business: 0.6 },
};

const LAYER_PAIRS = [
  ['economics', 'advantage', 'resource'],
  ['commitment', 'discernment', 'execution'],
  ['renewal', 'invention', 'operations'],
] as const;

function assertFinite(value: number, label: string): void {
  if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
}

function assertUnitInterval(value: number, label: string): void {
  assertFinite(value, label);
  if (value < 0 || value > 1) throw new Error(`${label} must be between 0 and 1.`);
}

function assertPosition(value: number, label: string): void {
  assertFinite(value, label);
  if (value < -1 || value > 1) throw new Error(`${label} must be between -1 and 1.`);
}

export function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

export function evidenceConfidence(leftObserved: number, rightObserved: number): number {
  if (!Number.isInteger(leftObserved) || leftObserved < 0 || !Number.isInteger(rightObserved) || rightObserved < 0) {
    throw new Error('Observed evidence counts must be non-negative integers.');
  }
  const saturation = (count: number) => count / (count + EVIDENCE_HALF_SATURATION);
  return Math.min(saturation(leftObserved), saturation(rightObserved));
}

export function positionInterval(position: number, confidence: number): NumericRange {
  assertPosition(position, 'position');
  assertUnitInterval(confidence, 'confidence');
  const sigma = POSITION_SIGMA_MAX * Math.sqrt(1 - confidence);
  return {
    low: clamp(position - POSITION_INTERVAL_Z * sigma, -1, 1),
    high: clamp(position + POSITION_INTERVAL_Z * sigma, -1, 1),
  };
}

function positionConfidence(input: TensionPositionInput): number {
  if (input.evidence.track === 'desk') {
    assertUnitInterval(input.evidence.confidence, 'desk confidence');
    return input.evidence.confidence;
  }
  return evidenceConfidence(input.evidence.leftObserved, input.evidence.rightObserved);
}

export function assessOrganizationPosition(input: OrganizationPositionInput): OrganizationPositionResult {
  const rawAttention: Record<SystemId, number> = {} as Record<SystemId, number>;
  const confidences: Record<SystemId, number> = {} as Record<SystemId, number>;

  for (const tension of SYSTEM_IDS) {
    const position = input.tensions[tension];
    if (!position) throw new Error(`Missing position for ${tension}.`);
    assertPosition(position.position, `${tension}.position`);
    if (!position.rationale.trim()) throw new Error(`${tension}.rationale is required.`);
    if (!position.metricName.trim()) throw new Error(`${tension}.metricName is required.`);
    if (position.sourceRefs.length === 0) throw new Error(`${tension}.sourceRefs requires at least one source.`);
    if (position.attentionMultiplier !== undefined) {
      assertFinite(position.attentionMultiplier, `${tension}.attentionMultiplier`);
      if (position.attentionMultiplier <= 0) throw new Error(`${tension}.attentionMultiplier must be greater than zero.`);
      if (!position.attentionRationale?.trim()) {
        throw new Error(`${tension}.attentionRationale is required when attention is overridden.`);
      }
    }
    confidences[tension] = positionConfidence(position);
    rawAttention[tension] = (POSTURE_LAYER_ATTENTION[input.posture][TENSION_LAYER[tension]] / 3)
      * (position.attentionMultiplier ?? 1);
  }

  const attentionTotal = SYSTEM_IDS.reduce((sum, tension) => sum + rawAttention[tension], 0);
  const results: Record<SystemId, TensionPositionResult> = {} as Record<SystemId, TensionPositionResult>;
  for (const tension of SYSTEM_IDS) {
    const position = input.tensions[tension].position;
    const confidence = confidences[tension];
    const sigma = POSITION_SIGMA_MAX * Math.sqrt(1 - confidence);
    const attentionShare = rawAttention[tension] / attentionTotal;
    results[tension] = {
      position,
      confidence,
      sigma,
      interval: positionInterval(position, confidence),
      attentionShare,
      priority: attentionShare * sigma,
    };
  }

  const commitmentIndex = SYSTEM_IDS.reduce((sum, tension) => sum + Math.abs(results[tension].position), 0)
    / SYSTEM_IDS.length;
  const evidenceIndex = SYSTEM_IDS.reduce((sum, tension) => sum + results[tension].confidence, 0)
    / SYSTEM_IDS.length;
  const absoluteTotal = SYSTEM_IDS.reduce((sum, tension) => sum + Math.abs(results[tension].position), 0);
  const spread = absoluteTotal === 0
    ? 0
    : -SYSTEM_IDS.reduce((entropy, tension) => {
        const share = Math.abs(results[tension].position) / absoluteTotal;
        return share === 0 ? entropy : entropy + share * Math.log(share);
      }, 0) / Math.log(SYSTEM_IDS.length);

  const tracks = new Set(SYSTEM_IDS.map((tension) => input.tensions[tension].evidence.track));
  const evidenceTrack = tracks.size === 1 ? [...tracks][0] : 'mixed';

  return {
    evidenceTrack,
    tensions: results,
    commitmentIndex,
    spread,
    evidenceIndex,
    lowCommitment: commitmentIndex < LOW_COMMITMENT_THRESHOLD,
    layerBalances: LAYER_PAIRS.map(([pair, strategyTension, businessTension]) => {
      const balance = Math.abs(results[strategyTension].position) - Math.abs(results[businessTension].position);
      return {
        pair,
        strategyTension,
        businessTension,
        balance,
        report: Math.abs(balance) >= LAYER_BALANCE_REPORT_BAND,
      };
    }),
  };
}

export const TENSION_CAPACITY_ROUTING: Readonly<Record<SystemId, readonly CapacityModel[]>> = {
  advantage: ['finance', 'people'],
  resource: ['people', 'finance'],
  discernment: ['time'],
  execution: ['risk', 'time'],
  invention: ['people', 'time'],
  operations: ['time', 'finance'],
};

export interface TransferabilityInput {
  /** Share of installed capacity usable in the new context. */
  readonly portableShare: NumericRange;
  readonly confidence: number;
  readonly rationale: string;
  readonly sourceRefs: readonly string[];
}

export interface GoalStrainInput {
  readonly tension: SystemId;
  readonly companyPosition: number;
  readonly goalPull: number;
  readonly importance: number;
  readonly contextChange: boolean;
  readonly rationale: string;
  readonly sourceLens: string;
  readonly sourceRefs: readonly string[];
  readonly transferability: TransferabilityInput;
}

export interface GoalStrainResult {
  readonly poleRelationship: 'tailwind' | 'headwind' | 'neutral';
  readonly overallRelationship: 'tailwind' | 'headwind' | 'neutral' | 'uncertain';
  /** Attention-routing magnitude only. It is not a viability score. */
  readonly poleMismatchMagnitude: number;
  /** Added in v0.2 so aligned capabilities are not assumed portable. */
  readonly instantiationMagnitude: NumericRange;
  readonly headwindSources: readonly ('pole-mismatch' | 'instantiation-cost')[];
  readonly routesTo: readonly CapacityModel[];
}

function validateRange(range: NumericRange, label: string): void {
  assertFinite(range.low, `${label}.low`);
  assertFinite(range.high, `${label}.high`);
  if (range.low > range.high) throw new Error(`${label}.low cannot exceed ${label}.high.`);
}

export function assessGoalStrain(input: GoalStrainInput): GoalStrainResult {
  assertPosition(input.companyPosition, 'companyPosition');
  assertPosition(input.goalPull, 'goalPull');
  assertUnitInterval(input.importance, 'importance');
  assertUnitInterval(input.transferability.confidence, 'transferability.confidence');
  validateRange(input.transferability.portableShare, 'transferability.portableShare');
  assertUnitInterval(input.transferability.portableShare.low, 'transferability.portableShare.low');
  assertUnitInterval(input.transferability.portableShare.high, 'transferability.portableShare.high');
  if (!input.rationale.trim() || !input.sourceLens.trim() || input.sourceRefs.length === 0) {
    throw new Error('Strain rationale, source lens, and source references are required.');
  }
  if (!input.transferability.rationale.trim() || input.transferability.sourceRefs.length === 0) {
    throw new Error('Transferability requires a rationale and at least one source reference.');
  }

  const poleRelationship = input.goalPull === 0 || input.companyPosition === 0
    ? 'neutral'
    : Math.sign(input.goalPull) === Math.sign(input.companyPosition)
      ? 'tailwind'
      : 'headwind';
  const poleMismatchMagnitude = poleRelationship === 'headwind'
    ? (Math.abs(input.goalPull - input.companyPosition) / 2) * input.importance
    : 0;
  const demand = Math.abs(input.goalPull) * input.importance;
  const instantiationMagnitude = input.contextChange
    ? {
        low: (1 - input.transferability.portableShare.high) * demand,
        high: (1 - input.transferability.portableShare.low) * demand,
      }
    : { low: 0, high: 0 };
  const headwindSources: Array<'pole-mismatch' | 'instantiation-cost'> = [];
  if (poleMismatchMagnitude > 0) headwindSources.push('pole-mismatch');
  if (instantiationMagnitude.high > 0) headwindSources.push('instantiation-cost');
  const overallRelationship = poleMismatchMagnitude > 0 || instantiationMagnitude.low > 0
    ? 'headwind'
    : instantiationMagnitude.high > 0
      ? 'uncertain'
      : poleRelationship;

  return {
    poleRelationship,
    overallRelationship,
    poleMismatchMagnitude,
    instantiationMagnitude,
    headwindSources,
    routesTo: TENSION_CAPACITY_ROUTING[input.tension],
  };
}

export type EpistemicState = 'observed' | 'estimated' | 'committed' | 'actual' | 'decision';
export type SourceClass = 'A' | 'B' | 'C' | 'D' | 'inside';

export interface CapacityFigure {
  readonly value: NumericRange;
  readonly unit: string;
  readonly state: EpistemicState;
  readonly confidence: number;
  readonly asOf: string;
  readonly sourceRef: string;
  readonly sourceClass: SourceClass;
}

export interface TransferabilityFactor {
  readonly value: NumericRange;
  readonly confidence: number;
  readonly asOf: string;
  readonly rationale: string;
  readonly sourceRefs: readonly string[];
}

export type CapacityPlacement =
  | {
      readonly kind: 'computed';
      readonly capacity: CapacityFigure;
      readonly committed: CapacityFigure;
      readonly load: CapacityFigure;
      readonly transferability: TransferabilityFactor;
    }
  | {
      /** Use only when the plan itself bounds fit without pretending committed load is known. */
      readonly kind: 'structural-bound';
      readonly fit: NumericRange;
      readonly unit: string;
      readonly confidence: number;
      readonly rationale: string;
      readonly sources: readonly {
        readonly ref: string;
        readonly sourceClass: 'A' | 'B' | 'C';
      }[];
    }
  | {
      /** A sourced one-sided bound; negative is sufficient to establish collision. */
      readonly kind: 'structural-upper-bound';
      readonly fitAtMost: number;
      readonly unit: string;
      readonly confidence: number;
      readonly rationale: string;
      readonly sources: readonly {
        readonly ref: string;
        readonly sourceClass: 'A' | 'B' | 'C';
      }[];
    }
  | {
      /** A sourced one-sided bound; nonnegative is sufficient to establish fit. */
      readonly kind: 'structural-lower-bound';
      readonly fitAtLeast: number;
      readonly unit: string;
      readonly confidence: number;
      readonly rationale: string;
      readonly sources: readonly {
        readonly ref: string;
        readonly sourceClass: 'A' | 'B' | 'C';
      }[];
    }
  | {
      /**
       * A locally scoped shortfall: an evidenced requirement against an evidenced
       * supply, both bounded to one named scope. Public evidence can establish a
       * local collision — VA's 48 of 108 filled rollout-support positions — without
       * claiming to know the organization's hidden reserve, so this kind is
       * admissible at desk tier where `computed` is not. Both sides keep their own
       * source, as-of date, and confidence rather than collapsing into one scalar.
       */
      readonly kind: 'evidenced-shortfall';
      readonly scope: string;
      readonly required: CapacityFigure;
      readonly available: CapacityFigure;
    }
  | {
      readonly kind: 'indeterminate';
      readonly reason: string;
    };

export interface CapacityPlacementResult {
  readonly status: 'fits' | 'collides' | 'uncertain' | 'indeterminate';
  readonly fit?: NumericRange;
  readonly fitUpperBound?: number;
  readonly fitLowerBound?: number;
  readonly unit?: string;
  readonly confidenceFloor?: number;
  readonly method: CapacityPlacement['kind'];
  readonly reason?: string;
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function validateCapacityFigure(figure: CapacityFigure, accessTier: 'desk' | 'inside-access'): string[] {
  const issues: string[] = [];
  try {
    validateRange(figure.value, 'value');
    assertUnitInterval(figure.confidence, 'confidence');
  } catch (error) {
    issues.push(error instanceof Error ? error.message : String(error));
  }
  if (!figure.unit.trim()) issues.push('unit is required.');
  if (!isIsoDate(figure.asOf)) issues.push('asOf must be an ISO calendar date.');
  if (!figure.sourceRef.trim()) issues.push('sourceRef is required.');
  if (figure.state === 'estimated' && figure.value.low === figure.value.high) {
    issues.push('An estimated figure must be a range, not a point.');
  }
  if (figure.sourceClass === 'D') issues.push('Class D framing cannot supply a capacity figure.');
  if (accessTier === 'desk' && (figure.state === 'committed' || figure.state === 'actual')) {
    issues.push(`A desk review cannot assert a ${figure.state} figure.`);
  }
  if ((figure.state === 'committed' || figure.state === 'actual') && figure.sourceClass !== 'inside') {
    issues.push(`${figure.state} figures require an inside source.`);
  }
  return issues;
}

function multiplyNonNegativeRanges(left: NumericRange, right: NumericRange): NumericRange {
  if (left.low < 0 || right.low < 0) throw new Error('Capacity and transferability ranges cannot be negative.');
  return { low: left.low * right.low, high: left.high * right.high };
}

function classifyFit(fit: NumericRange): CapacityPlacementResult['status'] {
  if (fit.low >= 0) return 'fits';
  if (fit.high < 0) return 'collides';
  return 'uncertain';
}

export function evaluateCapacityPlacement(
  placement: CapacityPlacement,
  accessTier: 'desk' | 'inside-access',
): CapacityPlacementResult {
  if (placement.kind === 'indeterminate') {
    if (!placement.reason.trim()) throw new Error('An indeterminate placement requires a reason.');
    return { status: 'indeterminate', method: placement.kind, reason: placement.reason };
  }
  if (placement.kind === 'structural-bound') {
    validateRange(placement.fit, 'fit');
    assertUnitInterval(placement.confidence, 'confidence');
    if (!placement.unit.trim() || !placement.rationale.trim() || placement.sources.length === 0
      || placement.sources.some((source) => !source.ref.trim())) {
      throw new Error('A structural bound requires unit, rationale, and source references.');
    }
    return {
      status: classifyFit(placement.fit),
      fit: placement.fit,
      unit: placement.unit,
      confidenceFloor: placement.confidence,
      method: placement.kind,
    };
  }
  if (placement.kind === 'structural-upper-bound') {
    assertFinite(placement.fitAtMost, 'fitAtMost');
    assertUnitInterval(placement.confidence, 'confidence');
    if (!placement.unit.trim() || !placement.rationale.trim() || placement.sources.length === 0
      || placement.sources.some((source) => !source.ref.trim())) {
      throw new Error('A structural upper bound requires unit, rationale, and source references.');
    }
    return {
      status: placement.fitAtMost < 0 ? 'collides' : 'uncertain',
      fitUpperBound: placement.fitAtMost,
      unit: placement.unit,
      confidenceFloor: placement.confidence,
      method: placement.kind,
    };
  }
  if (placement.kind === 'structural-lower-bound') {
    assertFinite(placement.fitAtLeast, 'fitAtLeast');
    assertUnitInterval(placement.confidence, 'confidence');
    if (!placement.unit.trim() || !placement.rationale.trim() || placement.sources.length === 0
      || placement.sources.some((source) => !source.ref.trim())) {
      throw new Error('A structural lower bound requires unit, rationale, and source references.');
    }
    return {
      status: placement.fitAtLeast >= 0 ? 'fits' : 'uncertain',
      fitLowerBound: placement.fitAtLeast,
      unit: placement.unit,
      confidenceFloor: placement.confidence,
      method: placement.kind,
    };
  }

  if (placement.kind === 'evidenced-shortfall') {
    if (!placement.scope.trim()) {
      throw new Error('An evidenced shortfall requires a scope naming the local boundary it measures.');
    }
    for (const [name, figure] of [
      ['required', placement.required],
      ['available', placement.available],
    ] as const) {
      const issues = validateCapacityFigure(figure, accessTier);
      if (issues.length > 0) throw new Error(`${name}: ${issues.join(' ')}`);
      if (figure.state === 'committed' || figure.state === 'actual') {
        throw new Error(
          `${name}: an evidenced shortfall models a local position, not organizational reserve; `
          + 'use a computed placement for committed or actual figures.',
        );
      }
    }
    if (placement.required.unit !== placement.available.unit) {
      throw new Error('Required and available figures must use the same unit.');
    }
    const fit = {
      low: placement.available.value.low - placement.required.value.high,
      high: placement.available.value.high - placement.required.value.low,
    };
    return {
      status: classifyFit(fit),
      fit,
      unit: placement.required.unit,
      confidenceFloor: Math.min(placement.required.confidence, placement.available.confidence),
      method: placement.kind,
    };
  }

  for (const [name, figure] of [
    ['capacity', placement.capacity],
    ['committed', placement.committed],
    ['load', placement.load],
  ] as const) {
    const issues = validateCapacityFigure(figure, accessTier);
    if (issues.length > 0) throw new Error(`${name}: ${issues.join(' ')}`);
  }
  if (placement.committed.state !== 'committed') {
    throw new Error('Computed reserve requires a committed figure; a proxy does not qualify.');
  }
  if (placement.capacity.unit !== placement.committed.unit || placement.capacity.unit !== placement.load.unit) {
    throw new Error('Capacity, committed, and load figures must use the same unit.');
  }
  validateRange(placement.transferability.value, 'transferability.value');
  assertUnitInterval(placement.transferability.value.low, 'transferability.value.low');
  assertUnitInterval(placement.transferability.value.high, 'transferability.value.high');
  assertUnitInterval(placement.transferability.confidence, 'transferability.confidence');
  if (!isIsoDate(placement.transferability.asOf) || !placement.transferability.rationale.trim()
    || placement.transferability.sourceRefs.length === 0) {
    throw new Error('Transferability requires asOf, rationale, and source references.');
  }

  const effectiveCapacity = multiplyNonNegativeRanges(placement.capacity.value, placement.transferability.value);
  const reserve = {
    low: effectiveCapacity.low - placement.committed.value.high,
    high: effectiveCapacity.high - placement.committed.value.low,
  };
  const fit = {
    low: reserve.low - placement.load.value.high,
    high: reserve.high - placement.load.value.low,
  };
  return {
    status: classifyFit(fit),
    fit,
    unit: placement.capacity.unit,
    confidenceFloor: Math.min(
      placement.capacity.confidence,
      placement.committed.confidence,
      placement.load.confidence,
      placement.transferability.confidence,
    ),
    method: placement.kind,
  };
}

export interface RiskFloorInput {
  readonly id: string;
  readonly status: 'pass' | 'trip' | 'unknown';
  readonly rationale: string;
  readonly sourceRefs: readonly string[];
}

export interface CommitmentReviewInput {
  readonly accessTier: 'desk' | 'inside-access';
  readonly value: 'worth-pursuing' | 'not-worth-pursuing' | 'unknown';
  readonly valueRationale: string;
  readonly valueSourceRefs: readonly string[];
  readonly riskFloors: readonly RiskFloorInput[];
  readonly placements: Readonly<Record<SpendModel, CapacityPlacement>>;
}

export interface CommitmentReviewResult {
  readonly outcome: DecisionOutcome;
  readonly should: 'yes' | 'no' | 'unknown';
  readonly can: 'yes' | 'no' | 'unknown';
  readonly placements: Readonly<Record<SpendModel, CapacityPlacementResult>>;
  readonly breakingModels: readonly SpendModel[];
  readonly reasons: readonly string[];
}

const SPEND_MODELS: readonly SpendModel[] = ['people', 'time', 'finance'];

export function evaluateCommitmentReview(input: CommitmentReviewInput): CommitmentReviewResult {
  if (!input.valueRationale.trim() || input.valueSourceRefs.length === 0) {
    throw new Error('A value rationale and source references are required.');
  }
  for (const floor of input.riskFloors) {
    if (!floor.id.trim() || !floor.rationale.trim() || floor.sourceRefs.length === 0) {
      throw new Error('Every risk floor requires an id, rationale, and source references.');
    }
  }

  const placements = Object.fromEntries(SPEND_MODELS.map((model) => [
    model,
    evaluateCapacityPlacement(input.placements[model], input.accessTier),
  ])) as unknown as Record<SpendModel, CapacityPlacementResult>;
  const trippedFloors = input.riskFloors.filter((floor) => floor.status === 'trip');
  const unknownFloors = input.riskFloors.filter((floor) => floor.status === 'unknown');
  const uncertainModels = SPEND_MODELS.filter((model) => ['uncertain', 'indeterminate'].includes(placements[model].status));
  // Models have incompatible units, so their raw deficits must never be ranked numerically.
  const collidingModels = SPEND_MODELS.filter((model) => placements[model].status === 'collides');

  if (input.value === 'not-worth-pursuing' || trippedFloors.length > 0) {
    return {
      outcome: 'FLOOR',
      should: 'no',
      can: collidingModels.length > 0 ? 'no' : uncertainModels.length > 0 ? 'unknown' : 'yes',
      placements,
      breakingModels: collidingModels,
      reasons: [
        ...(input.value === 'not-worth-pursuing' ? ['The goal does not clear the value floor.'] : []),
        ...trippedFloors.map((floor) => `Risk floor tripped: ${floor.id}.`),
      ],
    };
  }
  if (input.value === 'unknown' || unknownFloors.length > 0) {
    return {
      outcome: 'FOG',
      should: input.value === 'unknown' || unknownFloors.length > 0 ? 'unknown' : 'yes',
      can: collidingModels.length > 0 ? 'no' : uncertainModels.length > 0 ? 'unknown' : 'yes',
      placements,
      breakingModels: collidingModels,
      reasons: [
        ...(input.value === 'unknown' ? ['The value case is not yet placeable.'] : []),
        ...unknownFloors.map((floor) => `Risk floor is unresolved: ${floor.id}.`),
      ],
    };
  }
  if (collidingModels.length > 0) {
    return {
      outcome: 'COLLISION',
      should: 'yes',
      can: 'no',
      placements,
      breakingModels: collidingModels,
      reasons: collidingModels.map((model) => `${model} load exceeds its independently available reserve.`),
    };
  }
  if (uncertainModels.length > 0) {
    return {
      outcome: 'FOG',
      should: 'yes',
      can: 'unknown',
      placements,
      breakingModels: [],
      reasons: uncertainModels.map((model) => `${model} fit is ${placements[model].status}.`),
    };
  }
  return {
    outcome: 'ABSORBABLE',
    should: 'yes',
    can: 'yes',
    placements,
    breakingModels: [],
    reasons: ['All risk floors pass and every spend model has non-negative fit.'],
  };
}
