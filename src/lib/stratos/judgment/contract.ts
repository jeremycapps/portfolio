export const CANONICAL_OPERATIONS = [
  'START',
  'END',
  'CONTINUE',
  'CHANGE',
  'EXCEPTION',
  'ESCALATE',
] as const;

export const EVIDENCE_STATUSES = ['OBSERVED', 'ESTIMATED', 'FOG', 'HINDSIGHT'] as const;
export const VERDICTS = ['FIT', 'FOG', 'COLLISION'] as const;

export type CanonicalOperation = typeof CANONICAL_OPERATIONS[number];
export type EvidenceStatus = typeof EVIDENCE_STATUSES[number];
export type Verdict = typeof VERDICTS[number];
export type RecommendationPlane = 'commitment' | 'path';
export type Irreversibility = 'low' | 'medium' | 'high';
export type PathState = 'missing' | 'improving' | 'ineffective' | 'exhausted' | 'complete';
export type FamiliarMacro =
  | 'ADVANCE'
  | 'STAGE'
  | 'HOLD'
  | 'EXIT'
  | 'LEARN'
  | 'ADD'
  | 'RESCOPE'
  | 'REDESIGN'
  | 'ROUTE_BACK';

export interface EvidenceItem {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly status: EvidenceStatus;
  readonly availableAt?: string;
  readonly sourceLabel: string;
  readonly sourceUrl?: string;
  readonly assumption?: string;
  readonly material: boolean;
}

export interface DimensionJudgment {
  readonly dimension: string;
  readonly verdict: Verdict;
  readonly cause: string;
  readonly evidenceRefs: readonly string[];
  /** A FOG dimension only binds when a plausible value could change the operation. */
  readonly material: boolean;
}

export interface OperationTemplate {
  readonly object: string;
  readonly parameters: Readonly<Record<string, string | number | boolean>>;
  readonly label: string;
  readonly authorization: string;
  readonly owner: string;
  readonly displayMacro?: FamiliarMacro;
}

export interface RecommendationPolicy {
  readonly hasAuthority: boolean;
  readonly options: Readonly<Partial<Record<CanonicalOperation, OperationTemplate>>>;
}

export interface Boundary {
  readonly time?: string;
  readonly finance?: string;
  readonly attempts?: string;
  readonly exposure?: string;
  readonly expiry?: string;
  readonly returnCondition?: string;
}

export interface ReleaseGate {
  readonly conditions: readonly string[];
  readonly sustainedFor?: string;
}

export interface ReassessmentRule {
  readonly trigger: string;
  readonly operation: CanonicalOperation;
  readonly object: string;
  readonly parameters?: Readonly<Record<string, string | number | boolean>>;
}

export interface OperationRecommendation extends OperationTemplate {
  readonly plane: RecommendationPlane;
  readonly operation: CanonicalOperation;
  readonly boundary: Boundary;
}

export interface CommitmentJudgmentInput {
  readonly caseId: string;
  readonly label: string;
  readonly decisionDate: string;
  readonly evidenceCutoff: string;
  readonly requestedCommitment: {
    readonly object: string;
    readonly increment: string;
    readonly active: boolean;
    readonly irreversibility: Irreversibility;
  };
  readonly value: {
    readonly verdict: Verdict;
    readonly cause: string;
  };
  readonly dimensions: readonly DimensionJudgment[];
  readonly evidence: readonly EvidenceItem[];
  readonly evidenceStandardMet: boolean;
  readonly collisionRepairable: boolean;
  readonly pathState: PathState;
  readonly commitmentPolicy: RecommendationPolicy;
  readonly pathPolicy: RecommendationPolicy;
  readonly nextSafeCommitment: string;
  readonly validatedScale?: string;
  readonly releaseGate: ReleaseGate;
  readonly boundary: Boundary;
  readonly reassessment: readonly ReassessmentRule[];
}

export interface CommitmentEvaluation {
  readonly caseId: string;
  readonly label: string;
  readonly decisionDate: string;
  readonly evidenceCutoff: string;
  readonly requestedCommitment: CommitmentJudgmentInput['requestedCommitment'];
  readonly verdict: {
    readonly overall: Verdict;
    readonly bindingDimensions: readonly string[];
    readonly cause: string;
  };
  readonly recommendations: {
    readonly commitment: OperationRecommendation;
    readonly path: OperationRecommendation;
  };
  readonly nextSafeCommitment: string;
  readonly validatedScale?: string;
  readonly releaseGate: ReleaseGate;
  readonly boundary: Boundary;
  readonly reassessment: readonly ReassessmentRule[];
  readonly evidence: readonly EvidenceItem[];
}

export interface ContractIssue {
  readonly path: string;
  readonly message: string;
}

const parseDate = (value: string): number => Date.parse(`${value}T00:00:00Z`);

function decideVerdict(input: CommitmentJudgmentInput): CommitmentEvaluation['verdict'] {
  if (input.value.verdict === 'COLLISION') {
    return { overall: 'COLLISION', bindingDimensions: ['value'], cause: input.value.cause };
  }

  const collisions = input.dimensions.filter((dimension) => dimension.verdict === 'COLLISION');
  if (collisions.length > 0) {
    return {
      overall: 'COLLISION',
      bindingDimensions: collisions.map((dimension) => dimension.dimension),
      cause: collisions.map((dimension) => dimension.cause).join(' '),
    };
  }

  const materialFog = input.dimensions.filter(
    (dimension) => dimension.verdict === 'FOG' && dimension.material,
  );
  if (input.value.verdict === 'FOG' || materialFog.length > 0 || !input.evidenceStandardMet) {
    return {
      overall: 'FOG',
      bindingDimensions: input.value.verdict === 'FOG'
        ? ['value', ...materialFog.map((dimension) => dimension.dimension)]
        : materialFog.map((dimension) => dimension.dimension),
      cause: input.value.verdict === 'FOG'
        ? input.value.cause
        : materialFog.map((dimension) => dimension.cause).join(' ')
          || `The evidence standard for a ${input.requestedCommitment.irreversibility}-irreversibility increment is not met.`,
    };
  }

  return {
    overall: 'FIT',
    bindingDimensions: [],
    cause: 'The requested increment remains inside the evidenced capacity, value, risk, and authority envelope.',
  };
}

function commitmentOperation(input: CommitmentJudgmentInput, verdict: Verdict): CanonicalOperation {
  if (input.value.verdict === 'COLLISION' || (verdict === 'COLLISION' && !input.collisionRepairable)) return 'END';
  if (verdict !== 'FIT') return 'CHANGE';
  return input.requestedCommitment.active ? 'CONTINUE' : 'START';
}

function pathOperation(input: CommitmentJudgmentInput, verdict: Verdict): CanonicalOperation {
  if (input.value.verdict === 'COLLISION' || (verdict === 'COLLISION' && !input.collisionRepairable)) return 'END';
  switch (input.pathState) {
    case 'missing': return 'START';
    case 'improving': return 'CONTINUE';
    case 'ineffective': return 'CHANGE';
    case 'exhausted': return 'ESCALATE';
    case 'complete': return 'END';
  }
}

function recommendation(
  plane: RecommendationPlane,
  desiredOperation: CanonicalOperation,
  policy: RecommendationPolicy,
  boundary: Boundary,
): OperationRecommendation {
  const operation = policy.hasAuthority ? desiredOperation : 'ESCALATE';
  const template = policy.options[operation];
  if (!template) {
    throw new Error(`Missing ${plane} template for ${operation}.`);
  }
  return { plane, operation, boundary, ...template };
}

/**
 * Resolve the six decision gates into one verdict and exactly two operations.
 * Domain language remains in the operation templates; authorization stays deterministic.
 */
export function authorizeCommitment(input: CommitmentJudgmentInput): CommitmentEvaluation {
  const verdict = decideVerdict(input);
  return {
    caseId: input.caseId,
    label: input.label,
    decisionDate: input.decisionDate,
    evidenceCutoff: input.evidenceCutoff,
    requestedCommitment: input.requestedCommitment,
    verdict,
    recommendations: {
      commitment: recommendation(
        'commitment',
        commitmentOperation(input, verdict.overall),
        input.commitmentPolicy,
        input.boundary,
      ),
      path: recommendation(
        'path',
        pathOperation(input, verdict.overall),
        input.pathPolicy,
        input.boundary,
      ),
    },
    nextSafeCommitment: input.nextSafeCommitment,
    validatedScale: input.validatedScale,
    releaseGate: input.releaseGate,
    boundary: input.boundary,
    reassessment: input.reassessment,
    evidence: input.evidence,
  };
}

export interface MacroCompilationOptions {
  readonly existingPath?: boolean;
  readonly ownershipResolved?: boolean;
}

/** Compile a familiar display macro to the canonical operation grammar. */
export function compileMacroOperation(
  macro: FamiliarMacro,
  options: MacroCompilationOptions = {},
): CanonicalOperation {
  if (macro === 'ADVANCE') return 'CONTINUE';
  if (macro === 'EXIT') return 'END';
  if (macro === 'LEARN' || macro === 'ADD') {
    return options.existingPath ? 'CHANGE' : 'START';
  }
  if (macro === 'ROUTE_BACK') {
    return options.ownershipResolved === false ? 'ESCALATE' : 'CHANGE';
  }
  return 'CHANGE';
}

export function compileMacro(
  macro: FamiliarMacro,
  options: MacroCompilationOptions = {},
): Pick<OperationRecommendation, 'plane' | 'operation' | 'object' | 'parameters' | 'displayMacro'> {
  type CompiledMacro = Pick<OperationRecommendation, 'plane' | 'object' | 'parameters'>;
  const compiled: Record<FamiliarMacro, CompiledMacro> = {
    ADVANCE: { plane: 'commitment', object: 'commitment', parameters: { rate: 'planned_rate' } },
    STAGE: { plane: 'commitment', object: 'commitment', parameters: { tranche: 'smaller_tranche' } },
    HOLD: { plane: 'commitment', object: 'commitment', parameters: { release_rate: 0 } },
    EXIT: { plane: 'commitment', object: 'commitment', parameters: {} },
    LEARN: { plane: 'path', object: 'validation', parameters: {} },
    ADD: { plane: 'path', object: 'capacity', parameters: {} },
    RESCOPE: { plane: 'commitment', object: 'commitment_scope', parameters: {} },
    REDESIGN: { plane: 'path', object: 'configuration', parameters: {} },
    ROUTE_BACK: options.ownershipResolved === false
      ? { plane: 'path', object: 'ownership', parameters: {} }
      : { plane: 'path', object: 'owner_or_prerequisite', parameters: {} },
  };

  return {
    ...compiled[macro],
    operation: compileMacroOperation(macro, options),
    displayMacro: macro,
  };
}

export function validateEvaluation(evaluation: CommitmentEvaluation): ContractIssue[] {
  const issues: ContractIssue[] = [];
  const evidenceById = new Map(evaluation.evidence.map((item) => [item.id, item]));

  if (evaluation.recommendations.commitment.plane !== 'commitment') {
    issues.push({ path: 'recommendations.commitment.plane', message: 'Expected commitment plane.' });
  }
  if (evaluation.recommendations.path.plane !== 'path') {
    issues.push({ path: 'recommendations.path.plane', message: 'Expected path plane.' });
  }
  if (evaluation.verdict.overall === 'FIT' && !evaluation.validatedScale) {
    issues.push({ path: 'validatedScale', message: 'FIT must name the scale at which fit was demonstrated.' });
  }
  if (evaluation.releaseGate.conditions.length === 0) {
    issues.push({ path: 'releaseGate.conditions', message: 'At least one release condition is required.' });
  }
  if (evaluation.reassessment.length === 0) {
    issues.push({ path: 'reassessment', message: 'At least one reassessment rule is required.' });
  }
  if (Object.values(evaluation.boundary).every((value) => !value)) {
    issues.push({ path: 'boundary', message: 'A time, cost, attempt, exposure, or expiry boundary is required.' });
  }

  for (const [plane, item] of Object.entries(evaluation.recommendations) as Array<
    [RecommendationPlane, OperationRecommendation]
  >) {
    if (item.operation === 'EXCEPTION') {
      for (const field of ['violated_rule', 'authorizing_actor', 'expiry', 'return_condition']) {
        if (!(field in item.parameters)) {
          issues.push({ path: `recommendations.${plane}.parameters.${field}`, message: 'Required for EXCEPTION.' });
        }
      }
    }
    if (item.operation === 'ESCALATE') {
      for (const field of ['decision', 'authority']) {
        if (!(field in item.parameters)) {
          issues.push({ path: `recommendations.${plane}.parameters.${field}`, message: 'Required for ESCALATE.' });
        }
      }
    }
  }

  for (const item of evaluation.evidence) {
    if (item.availableAt && item.status !== 'HINDSIGHT' && parseDate(item.availableAt) > parseDate(evaluation.evidenceCutoff)) {
      issues.push({ path: `evidence.${item.id}.availableAt`, message: 'Decision evidence cannot postdate the evidence cutoff.' });
    }
  }

  for (const dimension of evaluation.verdict.bindingDimensions) {
    if (dimension === 'value') continue;
    if (!evaluation.evidence.some((item) => item.material && evidenceById.has(item.id))) {
      issues.push({ path: `verdict.bindingDimensions.${dimension}`, message: 'A binding dimension needs material evidence.' });
    }
  }

  return issues;
}
