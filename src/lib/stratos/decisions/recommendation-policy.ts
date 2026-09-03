import type { EvidenceRef } from '../cases/profile';
import {
  compileMacroOperation,
  type FamiliarMacro,
  type MacroCompilationOptions,
} from '../judgment/contract';
import {
  validateRecommendationPair,
  type Operation,
  type OperationParameter,
  type OperationRecommendation,
  type RecommendationAuthorityStatus,
  type RecommendationBoundary,
  type RecommendationGate,
  type ReassessmentRule,
} from './judgment';
import { VALIDATED_SCALE_NOT_DETERMINED, type VerdictMappingResult } from './verdict-adapter';

export type Irreversibility = 'low' | 'medium' | 'high';
export type CommitmentState = 'not-started' | 'active';
export type PathState = 'missing' | 'converging' | 'ineffective' | 'exhausted' | 'complete';
export type TerminalCondition =
  | 'value-breach'
  | 'intolerable-risk'
  | 'unrepairable-collision'
  | 'exhausted-learning'
  | 'recovery-cost-exceeds-value';

export interface RecommendationAuthoring {
  readonly object: string;
  readonly owner: string;
  readonly authorityStatus: RecommendationAuthorityStatus;
  readonly authorizationReason: string;
  readonly parameters?: Readonly<Record<string, OperationParameter>>;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly assumptionRefs: readonly string[];
  readonly boundary: RecommendationBoundary;
  readonly gate: RecommendationGate;
  readonly reassessment: ReassessmentRule;
}

export interface AuthorityOverrun {
  readonly plane: 'commitment' | 'path';
  readonly unresolvedDecision: string;
  readonly authorityRequired: string;
}

export interface RecommendationPolicyInput {
  readonly assessment: VerdictMappingResult;
  readonly irreversibility: Irreversibility;
  readonly commitmentState: CommitmentState;
  readonly requestedScale: string;
  /** Required to authorize a bounded experiment under FOG. */
  readonly smallerScale?: string;
  readonly pathState: PathState;
  readonly terminalCondition?: TerminalCondition;
  readonly commitment: RecommendationAuthoring;
  readonly path: RecommendationAuthoring;
  readonly authorityOverrun?: AuthorityOverrun;
}

interface OperationChoice {
  readonly operation: Operation;
  readonly displayLabel: string;
  readonly parameters: Readonly<Record<string, OperationParameter>>;
}

function compiledChoice(
  macro: FamiliarMacro,
  parameters: Readonly<Record<string, OperationParameter>>,
  options?: MacroCompilationOptions,
): OperationChoice {
  return {
    operation: compileMacroOperation(macro, options),
    displayLabel: macro,
    parameters,
  };
}

function requireText(value: string, name: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error(`${name} is required.`);
  return normalized;
}

function commitmentChoice(input: RecommendationPolicyInput): OperationChoice {
  const common = input.commitment.parameters ?? {};
  if (input.terminalCondition) {
    return {
      operation: 'END',
      displayLabel: 'EXIT',
      parameters: { ...common, terminalCondition: input.terminalCondition },
    };
  }

  if (input.assessment.verdict === 'FIT') {
    if (input.assessment.validatedScale === VALIDATED_SCALE_NOT_DETERMINED) {
      throw new Error('FIT requires an evidenced validated scale.');
    }
    const parameters = { ...common, authorizedScale: input.assessment.validatedScale };
    return input.commitmentState === 'not-started'
      ? { operation: 'START', displayLabel: 'START', parameters }
      : compiledChoice('ADVANCE', parameters);
  }

  if (input.assessment.verdict === 'FOG') {
    const smallerScale = input.smallerScale?.trim();
    if (input.irreversibility !== 'high' && smallerScale) {
      return compiledChoice(
        'STAGE',
        { ...common, authorizedScale: smallerScale, experiment: true },
      );
    }
    return compiledChoice('HOLD', { ...common, releaseRate: 0 });
  }

  const smallerScale = input.smallerScale?.trim();
  return smallerScale
    ? compiledChoice('STAGE', { ...common, authorizedScale: smallerScale })
    : compiledChoice('HOLD', { ...common, releaseRate: 0 });
}

function pathChoice(input: RecommendationPolicyInput): OperationChoice {
  const common = input.path.parameters ?? {};
  if (input.pathState === 'exhausted' && input.terminalCondition === 'exhausted-learning') {
    return {
      operation: 'END',
      displayLabel: 'END',
      parameters: { ...common, terminalCondition: input.terminalCondition },
    };
  }

  if (input.assessment.verdict === 'FIT') {
    const start = input.pathState === 'missing' || input.pathState === 'complete';
    const parameters = { ...common, purpose: 'assurance' };
    if (start) return { operation: 'START', displayLabel: 'START', parameters };
    if (input.pathState === 'converging') {
      return { operation: 'CONTINUE', displayLabel: 'CONTINUE', parameters };
    }
    return compiledChoice('REDESIGN', parameters, { existingPath: true });
  }

  if (input.assessment.verdict === 'FOG') {
    const start = input.pathState === 'missing' || input.pathState === 'complete';
    return compiledChoice(
      'LEARN',
      { ...common, purpose: 'uncertainty-resolution' },
      { existingPath: !start },
    );
  }

  const start = input.pathState === 'missing' || input.pathState === 'complete';
  return compiledChoice(
    start ? 'ADD' : 'REDESIGN',
    { ...common, purpose: 'remediation' },
    { existingPath: !start },
  );
}

function materialize(
  plane: 'commitment' | 'path',
  authoring: RecommendationAuthoring,
  choice: OperationChoice,
): OperationRecommendation {
  return {
    plane,
    operation: choice.operation,
    object: authoring.object,
    parameters: choice.parameters,
    displayLabel: choice.displayLabel,
    authorizationReason: authoring.authorizationReason,
    owner: authoring.owner,
    authorityStatus: authoring.authorityStatus,
    evidenceRefs: [...authoring.evidenceRefs],
    assumptionRefs: [...authoring.assumptionRefs],
    boundary: { ...authoring.boundary },
    gate: { ...authoring.gate, conditions: [...authoring.gate.conditions] },
    reassessment: { ...authoring.reassessment },
  };
}

function applyAuthorityOverrun(
  recommendation: OperationRecommendation,
  overrun: AuthorityOverrun | undefined,
): OperationRecommendation {
  if (!overrun || recommendation.plane !== overrun.plane) return recommendation;
  return {
    ...recommendation,
    operation: compileMacroOperation('ROUTE_BACK', { ownershipResolved: false }),
    displayLabel: 'ROUTE_BACK',
    escalation: {
      unresolvedDecision: requireText(overrun.unresolvedDecision, 'authorityOverrun.unresolvedDecision'),
      authorityRequired: requireText(overrun.authorityRequired, 'authorityOverrun.authorityRequired'),
    },
  };
}

/** Generate exactly one commitment operation followed by exactly one path operation. */
export function generateRecommendations(
  input: RecommendationPolicyInput,
): readonly [OperationRecommendation, OperationRecommendation] {
  requireText(input.requestedScale, 'requestedScale');
  if (input.smallerScale !== undefined
    && input.smallerScale.trim() === input.requestedScale.trim()) {
    throw new Error('A bounded experiment must be smaller than the unresolved requested scale.');
  }

  const recommendations = [
    applyAuthorityOverrun(
      materialize('commitment', input.commitment, commitmentChoice(input)),
      input.authorityOverrun,
    ),
    applyAuthorityOverrun(
      materialize('path', input.path, pathChoice(input)),
      input.authorityOverrun,
    ),
  ] as const;

  const issues = validateRecommendationPair(recommendations);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
  }
  return recommendations;
}
