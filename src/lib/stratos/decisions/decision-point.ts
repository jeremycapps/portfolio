import type { CaseProfile, EvidenceOrigin, EvidenceRef, MetricValue } from '../cases/profile';

export const DECISION_POINT_SCHEMA = 'stratos.decision-point/1' as const;
export const DECISION_SEQUENCES = ['T0', 'T1', 'T2', 'T3', 'T4'] as const;
export const EVIDENCE_DISPLAY_STATES = ['OBSERVED', 'ESTIMATED', 'FOG', 'HINDSIGHT'] as const;
export const EXPOSURE_CATEGORIES = [
  'storeActivation',
  'leases',
  'capitalRemodeling',
  'inventory',
  'people',
  'cash',
] as const;

export type DecisionSequence = typeof DECISION_SEQUENCES[number];
export type EvidenceDisplayState = typeof EVIDENCE_DISPLAY_STATES[number];
export type ExposureCategory = typeof EXPOSURE_CATEGORIES[number];
export type ConstructProvenance = 'documented' | 'inferred' | 'analytical' | 'assumption';

export interface DecisionInput {
  readonly id: string;
  readonly label: string;
  readonly displayState: EvidenceDisplayState;
  readonly materiality: 'material' | 'context';
  readonly metric?: MetricValue;
  readonly factRef?: string;
  readonly evidence?: EvidenceRef;
  readonly publishedAt?: string;
  readonly origin?: EvidenceOrigin;
  readonly calculation?: string;
  readonly assumptionRefs: readonly string[];
}

export interface DecisionActor {
  readonly label: string;
  readonly authorityStatus: 'documented' | 'inferred' | 'unknown';
  readonly provenance: ConstructProvenance;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly assumptionRefs: readonly string[];
}

export interface AnalyticalConstruct {
  readonly id: string;
  readonly label: string;
  readonly provenance: 'analytical' | 'assumption';
  readonly assumptionRefs: readonly string[];
}

export interface ActualOperation {
  readonly operation: 'CONTINUE' | 'PREPARE';
  readonly object: string;
  readonly provenance: 'documented' | 'inferred';
  readonly evidenceRefs: readonly EvidenceRef[];
}

export interface DecisionPoint {
  readonly schema: typeof DECISION_POINT_SCHEMA;
  readonly id: string;
  readonly caseId: string;
  readonly evidenceSnapshotId: string;
  readonly sequence: DecisionSequence;
  readonly decisionDate: string;
  readonly knowledgeCutoff: string;
  readonly actor: DecisionActor;
  readonly currentCommitment: DecisionInput;
  readonly requestedIncrement: DecisionInput;
  readonly cadence: DecisionInput;
  readonly irreversibility: {
    readonly level: 'low' | 'medium' | 'high';
    readonly rationale: string;
    readonly provenance: ConstructProvenance;
    readonly evidenceRefs: readonly EvidenceRef[];
    readonly assumptionRefs: readonly string[];
  };
  readonly reassessment: {
    readonly nextFeasibleAt: string;
    readonly rationale: string;
    readonly provenance: ConstructProvenance;
    readonly evidenceRefs: readonly EvidenceRef[];
    readonly assumptionRefs: readonly string[];
  };
  readonly constructs: readonly AnalyticalConstruct[];
  readonly actualOperations: readonly [ActualOperation, ActualOperation];
  readonly exposures: Readonly<Record<ExposureCategory, DecisionInput>>;
  readonly materialUnknowns: readonly DecisionInput[];
  readonly assumptions: readonly { readonly id: string; readonly statement: string }[];
  readonly hindsight: readonly DecisionInput[];
}

export interface DecisionValidationIssue {
  readonly code: 'FND-02';
  readonly path: string;
  readonly message: string;
}

export interface ResolvedDecisionInput extends DecisionInput {
  readonly sourceTitle?: string;
}

export interface DecisionPacket {
  readonly decisionPoint: DecisionPoint;
  readonly profile: CaseProfile;
  readonly snapshot: CaseProfile['snapshots'][number];
  readonly contemporaneousInputs: readonly ResolvedDecisionInput[];
  readonly hindsightInputs: readonly ResolvedDecisionInput[];
  readonly materialUnknowns: readonly ResolvedDecisionInput[];
}

export function defineDecisionPoint<const T extends DecisionPoint>(decisionPoint: T): T {
  return decisionPoint;
}
