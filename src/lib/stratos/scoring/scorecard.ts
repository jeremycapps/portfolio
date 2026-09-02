import { SYSTEM_IDS, type CaseProfile, type SystemId } from '../cases/profile';
import { prepareCaseScoringPacket, type CaseScoringPacket } from './profile-adapter';
import {
  STRATOS_SCORING_RUBRIC,
  assessGoalStrain,
  assessOrganizationPosition,
  evaluateCommitmentReview,
  type CommitmentReviewInput,
  type CommitmentReviewResult,
  type GoalStrainInput,
  type GoalStrainResult,
  type NumericRange,
  type OrganizationPositionInput,
  type OrganizationPositionResult,
} from './rubric';

export const CASE_SCORECARD_SCHEMA = 'stratos.case-scorecard/1' as const;

export const DESK_AUTHORING_ANCHORS = {
  directionalMagnitude: {
    0: 'No material position or pull.',
    0.25: 'Lean: visible preference, readily reversible.',
    0.5: 'Material: shapes multiple disclosed choices.',
    0.75: 'Strong: central to the commitment or operating model.',
    1: 'Full: explicit, gating, and alternatives are substantially foreclosed.',
  },
  importance: {
    0.25: 'Peripheral contributor.',
    0.5: 'Material contributor.',
    0.75: 'Necessary to the stated goal.',
    1: 'Gating: the goal cannot be achieved without it.',
  },
  deskConfidence: {
    0.25: 'Low: one-sided or indirect public evidence.',
    0.5: 'Medium: multiple direct public signals, important counter-evidence missing.',
    0.75: 'High: direct, balanced, repeated public evidence.',
    1: 'Reserved for directly observed and effectively complete evidence; rarely available at desk tier.',
  },
  portabilityBands: {
    rebuild: { low: 0, high: 0.25 },
    limited: { low: 0.25, high: 0.5 },
    substantial: { low: 0.5, high: 0.75 },
    mostlyPortable: { low: 0.75, high: 1 },
  },
} as const;

export interface CaseScorecardAuthoring {
  readonly id: string;
  readonly profile: CaseProfile;
  readonly snapshotId: string;
  readonly scoredAt: string;
  readonly mode?: 'commitment-only' | 'outcome-calibrated-retrodiction' | 'latest-evidence-calibration';
  readonly position: OrganizationPositionInput;
  readonly strains: Readonly<Record<SystemId, GoalStrainInput>>;
  readonly commitmentReview: CommitmentReviewInput;
  readonly findings: readonly string[];
  readonly informationPurchase: readonly string[];
}

export interface StrainBand {
  readonly tension: SystemId;
  /** Attention band only; overlapping bands are deliberately not ranked. */
  readonly magnitude: NumericRange;
  readonly sources: GoalStrainResult['headwindSources'];
  readonly routesTo: GoalStrainResult['routesTo'];
}

export interface CaseScorecard {
  readonly schema: typeof CASE_SCORECARD_SCHEMA;
  readonly id: string;
  readonly rubricVersion: typeof STRATOS_SCORING_RUBRIC.version;
  readonly status: 'provisional-desk-hypothesis' | 'outcome-calibrated-retrodiction' | 'latest-evidence-calibration';
  readonly scoredAt: string;
  readonly evidencePacket: CaseScoringPacket;
  readonly positionInput: OrganizationPositionInput;
  readonly position: OrganizationPositionResult;
  readonly strainInputs: Readonly<Record<SystemId, GoalStrainInput>>;
  readonly strains: Readonly<Record<SystemId, GoalStrainResult>>;
  readonly strainBands: readonly StrainBand[];
  readonly commitmentReviewInput: CommitmentReviewInput;
  readonly commitmentReview: CommitmentReviewResult;
  readonly findings: readonly string[];
  readonly informationPurchase: readonly string[];
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

function collectScorecardRefs(authoring: CaseScorecardAuthoring): string[] {
  return [
    ...SYSTEM_IDS.flatMap((tension) => authoring.position.tensions[tension].sourceRefs),
    ...SYSTEM_IDS.flatMap((tension) => authoring.strains[tension].sourceRefs),
    ...SYSTEM_IDS.flatMap((tension) => authoring.strains[tension].transferability.sourceRefs),
    ...authoring.commitmentReview.valueSourceRefs,
    ...authoring.commitmentReview.riskFloors.flatMap((floor) => floor.sourceRefs),
    ...Object.values(authoring.commitmentReview.placements).flatMap((placement) => {
      if (placement.kind === 'computed') {
        return [
          placement.capacity.sourceRef,
          placement.committed.sourceRef,
          placement.load.sourceRef,
          ...placement.transferability.sourceRefs,
        ];
      }
      if (placement.kind === 'evidenced-shortfall') {
        return [placement.required.sourceRef, placement.available.sourceRef];
      }
      if (placement.kind === 'structural-bound' || placement.kind === 'structural-upper-bound'
        || placement.kind === 'structural-lower-bound') {
        return placement.sources.map((source) => source.ref);
      }
      return [];
    }),
  ];
}

function isQuarterStep(value: number): boolean {
  return Math.abs(value * 4 - Math.round(value * 4)) < Number.EPSILON * 16;
}

function validateAnchoredJudgments(authoring: CaseScorecardAuthoring): void {
  for (const tension of SYSTEM_IDS) {
    const position = authoring.position.tensions[tension];
    const importedTempoJudgment = position.sourceRefs.some((ref) => ref.startsWith('tempo:'));
    if (!importedTempoJudgment && !isQuarterStep(position.position)) {
      throw new Error(`${tension}.position must use a quarter-step authoring anchor.`);
    }
    if (position.evidence.track === 'desk' && !isQuarterStep(position.evidence.confidence)) {
      throw new Error(`${tension}.confidence must use a documented desk-confidence tier.`);
    }
    const strain = authoring.strains[tension];
    if (strain.companyPosition !== position.position) {
      throw new Error(`${tension} strain must use the organization position from the same scorecard.`);
    }
    if (!isQuarterStep(strain.goalPull) || !isQuarterStep(strain.importance)) {
      throw new Error(`${tension} goal pull and importance must use quarter-step authoring anchors.`);
    }
    if (!isQuarterStep(strain.transferability.portableShare.low)
      || !isQuarterStep(strain.transferability.portableShare.high)
      || !isQuarterStep(strain.transferability.confidence)) {
      throw new Error(`${tension} transferability must use documented bands and confidence tiers.`);
    }
  }
}

export function defineCaseScorecard(authoring: CaseScorecardAuthoring): CaseScorecard {
  if (!isIsoDate(authoring.scoredAt)) throw new Error('scoredAt must be an ISO calendar date.');
  if (!authoring.id.trim()) throw new Error('A scorecard id is required.');
  if (authoring.findings.length === 0 || authoring.informationPurchase.length === 0) {
    throw new Error('A desk scorecard requires findings and an information-purchase plan.');
  }
  validateAnchoredJudgments(authoring);

  const evidencePacket = prepareCaseScoringPacket(authoring.profile, authoring.snapshotId);
  const mode = authoring.mode ?? 'commitment-only';
  if (mode === 'commitment-only' && evidencePacket.snapshot.phase !== 'commitment') {
    throw new Error('Commitment-only scorecards must use a commitment-phase snapshot.');
  }
  if (mode === 'outcome-calibrated-retrodiction' && evidencePacket.snapshot.phase !== 'outcome') {
    throw new Error('Outcome-calibrated retrodictions must use an outcome-phase snapshot.');
  }
  if (mode === 'latest-evidence-calibration'
    && !['material-update', 'ongoing'].includes(evidencePacket.snapshot.phase)) {
    throw new Error('Latest-evidence calibrations must use a material-update or ongoing snapshot.');
  }
  const allowedRefs = new Set([
    ...evidencePacket.facts.map((fact) => fact.id),
    ...evidencePacket.sources.map((source) => source.id),
    ...evidencePacket.targets.map((target) => target.id),
  ]);
  const invalidRefs = [...new Set(collectScorecardRefs(authoring))]
    .filter((ref) => !allowedRefs.has(ref) && !ref.startsWith('tempo:'));
  if (invalidRefs.length > 0) {
    throw new Error(`Scorecard references evidence outside its cutoff-safe packet: ${invalidRefs.join(', ')}.`);
  }

  for (const tension of SYSTEM_IDS) {
    if (authoring.strains[tension].tension !== tension) {
      throw new Error(`Strain key ${tension} contains ${authoring.strains[tension].tension}.`);
    }
  }

  const position = assessOrganizationPosition(authoring.position);
  const strains = Object.fromEntries(SYSTEM_IDS.map((tension) => [
    tension,
    assessGoalStrain(authoring.strains[tension]),
  ])) as unknown as Record<SystemId, GoalStrainResult>;
  const strainBands = SYSTEM_IDS
    .map((tension) => ({
      tension,
      magnitude: {
        low: Math.max(strains[tension].poleMismatchMagnitude, strains[tension].instantiationMagnitude.low),
        high: Math.max(strains[tension].poleMismatchMagnitude, strains[tension].instantiationMagnitude.high),
      },
      sources: strains[tension].headwindSources,
      routesTo: strains[tension].routesTo,
    }))
    .filter((strain) => strain.magnitude.high > 0);

  return {
    schema: CASE_SCORECARD_SCHEMA,
    id: authoring.id,
    rubricVersion: STRATOS_SCORING_RUBRIC.version,
    status: mode === 'commitment-only' ? 'provisional-desk-hypothesis' : mode,
    scoredAt: authoring.scoredAt,
    evidencePacket,
    positionInput: authoring.position,
    position,
    strainInputs: authoring.strains,
    strains,
    strainBands,
    commitmentReviewInput: authoring.commitmentReview,
    commitmentReview: evaluateCommitmentReview(authoring.commitmentReview),
    findings: authoring.findings,
    informationPurchase: authoring.informationPurchase,
  };
}
