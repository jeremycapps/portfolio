import type { EvidenceRef } from '../cases/profile';
import type { NumericRange } from '../scoring/rubric';

export const JUDGMENT_VERDICTS = ['FIT', 'FOG', 'COLLISION'] as const;
export const RECOMMENDATION_PLANES = ['commitment', 'path'] as const;
export const CANONICAL_OPERATIONS = [
  'START',
  'END',
  'CONTINUE',
  'CHANGE',
  'EXCEPTION',
  'ESCALATE',
] as const;

/** Presentation aliases only. These values are never accepted as operations. */
export const DISPLAY_ACTION_MACROS = [
  'ADVANCE',
  'STAGE',
  'HOLD',
  'EXIT',
  'LEARN',
  'ADD',
  'RESCOPE',
  'REDESIGN',
  'ROUTE_BACK',
] as const;

export type JudgmentVerdict = typeof JUDGMENT_VERDICTS[number];
export type RecommendationPlane = typeof RECOMMENDATION_PLANES[number];
export type Operation = typeof CANONICAL_OPERATIONS[number];
export type DisplayActionMacro = typeof DISPLAY_ACTION_MACROS[number];
export type RecommendationAuthorityStatus = 'inside-boundary' | 'outside-boundary' | 'unknown';
export type GateEvidenceStatus = 'documented' | 'analytical' | 'mixed';
export type OperationParameter = string | number | boolean | NumericRange;

export interface RecommendationBoundary {
  readonly time?: string;
  readonly finance?: string;
  readonly exposure?: string;
  readonly attempts?: number;
  readonly expiryOrReturnCondition: string;
}

export interface RecommendationGate {
  readonly conditions: readonly string[];
  readonly evidenceStatus: GateEvidenceStatus;
}

export interface ReassessmentRule {
  readonly trigger: string;
  readonly ifImproving: string;
  readonly ifIneffective: string;
  readonly ifBoundaryExhausted: string;
}

export interface ExceptionRequirements {
  readonly violatedRule: string;
  readonly authorizer: string;
  readonly expiry: string;
  readonly returnCondition: string;
}

export interface EscalationRequirements {
  readonly unresolvedDecision: string;
  readonly authorityRequired: string;
}

export interface OperationRecommendation {
  readonly plane: RecommendationPlane;
  readonly operation: Operation;
  readonly object: string;
  readonly parameters: Readonly<Record<string, OperationParameter>>;
  readonly displayLabel: string;
  readonly authorizationReason: string;
  readonly owner: string;
  readonly authorityStatus: RecommendationAuthorityStatus;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly assumptionRefs: readonly string[];
  readonly boundary: RecommendationBoundary;
  readonly gate: RecommendationGate;
  readonly reassessment: ReassessmentRule;
  /** Required only when operation is EXCEPTION. */
  readonly exception?: ExceptionRequirements;
  /** Required only when operation is ESCALATE. */
  readonly escalation?: EscalationRequirements;
}

export type JudgmentCauseKind =
  | 'fit'
  | 'material-uncertainty'
  | 'capacity'
  | 'readiness'
  | 'transferability'
  | 'value-floor'
  | 'risk-floor'
  | 'authority';

export interface JudgmentCause {
  readonly kind: JudgmentCauseKind;
  readonly summary: string;
  readonly evidenceRefs: readonly EvidenceRef[];
}

export interface NextSafeCommitment {
  readonly status: 'bounded' | 'not-determined';
  readonly description: string;
  readonly unit?: string;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly assumptionRefs: readonly string[];
}

export interface JudgmentResult {
  readonly verdict: JudgmentVerdict;
  readonly validatedScale: string;
  readonly bindingDimensions: readonly string[];
  readonly materialUnknowns: readonly string[];
  readonly cause: JudgmentCause;
  readonly recommendations: readonly [OperationRecommendation, OperationRecommendation];
  readonly nextSafeCommitment: NextSafeCommitment;
  readonly evidenceRefs: readonly EvidenceRef[];
  readonly assumptionRefs: readonly string[];
}

export interface JudgmentValidationIssue {
  readonly path: string;
  readonly message: string;
}

const VERDICT_SET = new Set<string>(JUDGMENT_VERDICTS);
const PLANE_SET = new Set<string>(RECOMMENDATION_PLANES);
const OPERATION_SET = new Set<string>(CANONICAL_OPERATIONS);
const AUTHORITY_SET = new Set<string>(['inside-boundary', 'outside-boundary', 'unknown']);
const GATE_EVIDENCE_SET = new Set<string>(['documented', 'analytical', 'mixed']);
const CAUSE_SET = new Set<string>([
  'fit',
  'material-uncertainty',
  'capacity',
  'readiness',
  'transferability',
  'value-floor',
  'risk-floor',
  'authority',
]);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const nonEmpty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

function requireRecord(
  value: unknown,
  path: string,
  issues: JudgmentValidationIssue[],
): Record<string, unknown> | undefined {
  if (!isRecord(value)) {
    issues.push({ path, message: 'An object is required.' });
    return undefined;
  }
  return value;
}

function requireText(
  value: unknown,
  path: string,
  issues: JudgmentValidationIssue[],
): void {
  if (!nonEmpty(value)) issues.push({ path, message: 'A non-empty string is required.' });
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: JudgmentValidationIssue[],
  requireItem = false,
): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'An array is required.' });
    return;
  }
  if (requireItem && value.length === 0) {
    issues.push({ path, message: 'At least one item is required.' });
  }
  value.forEach((item, index) => requireText(item, `${path}.${index}`, issues));
}

function validateEvidenceRefs(
  value: unknown,
  path: string,
  issues: JudgmentValidationIssue[],
): void {
  if (!Array.isArray(value)) {
    issues.push({ path, message: 'An evidence reference array is required.' });
    return;
  }
  value.forEach((item, index) => {
    const ref = requireRecord(item, `${path}.${index}`, issues);
    if (!ref) return;
    requireText(ref.sourceId, `${path}.${index}.sourceId`, issues);
    requireText(ref.locator, `${path}.${index}.locator`, issues);
  });
}

function validateBoundary(
  value: unknown,
  path: string,
  issues: JudgmentValidationIssue[],
): void {
  const boundary = requireRecord(value, path, issues);
  if (!boundary) return;

  requireText(boundary.expiryOrReturnCondition, `${path}.expiryOrReturnCondition`, issues);
  for (const key of ['time', 'finance', 'exposure'] as const) {
    if (boundary[key] !== undefined) requireText(boundary[key], `${path}.${key}`, issues);
  }
  if (boundary.attempts !== undefined
    && (!Number.isInteger(boundary.attempts) || (boundary.attempts as number) <= 0)) {
    issues.push({ path: `${path}.attempts`, message: 'Attempts must be a positive integer.' });
  }

  const hasLimit = ['time', 'finance', 'exposure'].some((key) => nonEmpty(boundary[key]))
    || (Number.isInteger(boundary.attempts) && (boundary.attempts as number) > 0);
  if (!hasLimit) {
    issues.push({
      path,
      message: 'A time, finance, exposure, or attempts limit is required.',
    });
  }
}

function validateRecommendation(
  value: unknown,
  index: number,
  issues: JudgmentValidationIssue[],
): void {
  const path = `recommendations.${index}`;
  const recommendation = requireRecord(value, path, issues);
  if (!recommendation) return;

  if (!PLANE_SET.has(String(recommendation.plane))) {
    issues.push({ path: `${path}.plane`, message: 'Expected commitment or path.' });
  }
  if (!OPERATION_SET.has(String(recommendation.operation))) {
    issues.push({
      path: `${path}.operation`,
      message: `Expected one of ${CANONICAL_OPERATIONS.join(', ')}. Display macros are not operations.`,
    });
  }
  requireText(recommendation.object, `${path}.object`, issues);
  requireText(recommendation.displayLabel, `${path}.displayLabel`, issues);
  requireText(recommendation.authorizationReason, `${path}.authorizationReason`, issues);
  requireText(recommendation.owner, `${path}.owner`, issues);
  if (!AUTHORITY_SET.has(String(recommendation.authorityStatus))) {
    issues.push({ path: `${path}.authorityStatus`, message: 'Invalid authority status.' });
  }
  if (!isRecord(recommendation.parameters)) {
    issues.push({ path: `${path}.parameters`, message: 'An operation parameter object is required.' });
  }
  validateEvidenceRefs(recommendation.evidenceRefs, `${path}.evidenceRefs`, issues);
  validateStringArray(recommendation.assumptionRefs, `${path}.assumptionRefs`, issues);
  validateBoundary(recommendation.boundary, `${path}.boundary`, issues);

  const gate = requireRecord(recommendation.gate, `${path}.gate`, issues);
  if (gate) {
    validateStringArray(gate.conditions, `${path}.gate.conditions`, issues, true);
    if (!GATE_EVIDENCE_SET.has(String(gate.evidenceStatus))) {
      issues.push({ path: `${path}.gate.evidenceStatus`, message: 'Invalid gate evidence status.' });
    }
  }

  const reassessment = requireRecord(recommendation.reassessment, `${path}.reassessment`, issues);
  if (reassessment) {
    for (const key of ['trigger', 'ifImproving', 'ifIneffective', 'ifBoundaryExhausted'] as const) {
      requireText(reassessment[key], `${path}.reassessment.${key}`, issues);
    }
  }

  if (recommendation.operation === 'EXCEPTION') {
    const exception = requireRecord(recommendation.exception, `${path}.exception`, issues);
    if (exception) {
      for (const key of ['violatedRule', 'authorizer', 'expiry', 'returnCondition'] as const) {
        requireText(exception[key], `${path}.exception.${key}`, issues);
      }
    }
  }
  if (recommendation.operation === 'ESCALATE') {
    const escalation = requireRecord(recommendation.escalation, `${path}.escalation`, issues);
    if (escalation) {
      requireText(escalation.unresolvedDecision, `${path}.escalation.unresolvedDecision`, issues);
      requireText(escalation.authorityRequired, `${path}.escalation.authorityRequired`, issues);
    }
  }
}

export function validateRecommendationPair(value: unknown): JudgmentValidationIssue[] {
  const issues: JudgmentValidationIssue[] = [];
  if (!Array.isArray(value)) {
    return [{ path: 'recommendations', message: 'Exactly two recommendations are required.' }];
  }
  if (value.length !== 2) {
    issues.push({ path: 'recommendations', message: 'Exactly two recommendations are required.' });
  }
  value.forEach((recommendation, index) => validateRecommendation(recommendation, index, issues));
  if (isRecord(value[0]) && value[0].plane !== 'commitment') {
    issues.push({ path: 'recommendations.0.plane', message: 'The commitment recommendation must be first.' });
  }
  if (isRecord(value[1]) && value[1].plane !== 'path') {
    issues.push({ path: 'recommendations.1.plane', message: 'The path recommendation must be second.' });
  }
  return issues;
}

/** Validate untrusted judgment content at the public contract boundary. */
export function validateJudgmentResult(value: unknown): JudgmentValidationIssue[] {
  const issues: JudgmentValidationIssue[] = [];
  const result = requireRecord(value, 'result', issues);
  if (!result) return issues;

  if (!VERDICT_SET.has(String(result.verdict))) {
    issues.push({ path: 'verdict', message: `Expected one of ${JUDGMENT_VERDICTS.join(', ')}.` });
  }
  requireText(result.validatedScale, 'validatedScale', issues);
  validateStringArray(result.bindingDimensions, 'bindingDimensions', issues);
  validateStringArray(result.materialUnknowns, 'materialUnknowns', issues);
  validateEvidenceRefs(result.evidenceRefs, 'evidenceRefs', issues);
  validateStringArray(result.assumptionRefs, 'assumptionRefs', issues);

  if (result.verdict === 'FOG' && (!Array.isArray(result.materialUnknowns) || result.materialUnknowns.length === 0)) {
    issues.push({ path: 'materialUnknowns', message: 'FOG requires at least one material unknown.' });
  }

  const cause = requireRecord(result.cause, 'cause', issues);
  if (cause) {
    if (!CAUSE_SET.has(String(cause.kind))) {
      issues.push({ path: 'cause.kind', message: 'Invalid judgment cause.' });
    }
    requireText(cause.summary, 'cause.summary', issues);
    validateEvidenceRefs(cause.evidenceRefs, 'cause.evidenceRefs', issues);
  }

  issues.push(...validateRecommendationPair(result.recommendations));

  const next = requireRecord(result.nextSafeCommitment, 'nextSafeCommitment', issues);
  if (next) {
    if (next.status !== 'bounded' && next.status !== 'not-determined') {
      issues.push({ path: 'nextSafeCommitment.status', message: 'Invalid next-safe-commitment status.' });
    }
    requireText(next.description, 'nextSafeCommitment.description', issues);
    if (next.unit !== undefined) requireText(next.unit, 'nextSafeCommitment.unit', issues);
    validateEvidenceRefs(next.evidenceRefs, 'nextSafeCommitment.evidenceRefs', issues);
    validateStringArray(next.assumptionRefs, 'nextSafeCommitment.assumptionRefs', issues);
  }

  return issues;
}

export function assertValidJudgmentResult(value: unknown): asserts value is JudgmentResult {
  const issues = validateJudgmentResult(value);
  if (issues.length > 0) {
    throw new Error(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
  }
}

/** Serialize only a validated result, preserving commitment then path order. */
export function serializeJudgmentResult(value: unknown): string {
  assertValidJudgmentResult(value);
  return JSON.stringify(value);
}
