import type { CaseFact, CaseProfile } from '../cases/profile';
import {
  DECISION_POINT_SCHEMA,
  DECISION_SEQUENCES,
  EXPOSURE_CATEGORIES,
  type DecisionInput,
  type DecisionPacket,
  type DecisionPoint,
  type DecisionValidationIssue,
  type ResolvedDecisionInput,
} from './decision-point';

const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const nonEmpty = (value: string): boolean => value.trim().length > 0;

function allInputs(decisionPoint: DecisionPoint): DecisionInput[] {
  return [
    decisionPoint.currentCommitment,
    decisionPoint.requestedIncrement,
    decisionPoint.cadence,
    ...EXPOSURE_CATEGORIES.map((category) => decisionPoint.exposures[category]),
    ...decisionPoint.materialUnknowns,
    ...decisionPoint.hindsight,
  ];
}

function contemporaneousInputs(decisionPoint: DecisionPoint): DecisionInput[] {
  return allInputs(decisionPoint).filter((input) => input.displayState !== 'HINDSIGHT');
}

function resolveInput(
  input: DecisionInput,
  factById: ReadonlyMap<string, CaseFact>,
  sourceById: ReadonlyMap<string, CaseProfile['sources'][number]>,
): ResolvedDecisionInput {
  const fact = input.factRef ? factById.get(input.factRef) : undefined;
  const evidence = input.evidence ?? fact?.evidence[0];
  const source = evidence ? sourceById.get(evidence.sourceId) : undefined;
  return {
    ...input,
    evidence,
    publishedAt: input.publishedAt ?? source?.publishedAt,
    origin: input.origin ?? fact?.origin,
    calculation: input.calculation ?? fact?.calculation,
    sourceTitle: source?.title,
  };
}

/** FND-02: validate structure, snapshot linkage, provenance, and cutoff integrity. */
export function validateDecisionPoint(
  decisionPoint: DecisionPoint,
  profile: CaseProfile,
): DecisionValidationIssue[] {
  const issues: DecisionValidationIssue[] = [];
  const issue = (path: string, message: string) => issues.push({ code: 'FND-02', path, message });
  const sourceById = new Map(profile.sources.map((source) => [source.id, source]));
  const factById = new Map(profile.facts.map((fact) => [fact.id, fact]));
  const assumptionIds = new Set(decisionPoint.assumptions.map((assumption) => assumption.id));
  const snapshot = profile.snapshots.find(({ id }) => id === decisionPoint.evidenceSnapshotId);
  const validateEvidence = (
    evidence: { sourceId: string; locator: string },
    path: string,
    allowHindsight = false,
  ) => {
    const source = sourceById.get(evidence.sourceId);
    if (!source) {
      issue(`${path}.sourceId`, `Unknown source reference: ${evidence.sourceId}.`);
      return;
    }
    if (!nonEmpty(evidence.locator)) issue(`${path}.locator`, 'A non-empty source locator is required.');
    if (!allowHindsight && source.publishedAt > decisionPoint.knowledgeCutoff) {
      issue(path, `Temporal leakage: ${source.id} was published after ${decisionPoint.knowledgeCutoff}.`);
    }
  };

  if (decisionPoint.schema !== DECISION_POINT_SCHEMA) issue('schema', `Expected ${DECISION_POINT_SCHEMA}.`);
  for (const [path, value] of [
    ['id', decisionPoint.id],
    ['caseId', decisionPoint.caseId],
    ['evidenceSnapshotId', decisionPoint.evidenceSnapshotId],
  ] as const) if (!nonEmpty(value)) issue(path, 'A non-empty identifier is required.');
  if (!DECISION_SEQUENCES.includes(decisionPoint.sequence)) issue('sequence', 'Expected T0, T1, T2, T3, or T4.');
  if (!isIsoDate(decisionPoint.decisionDate)) issue('decisionDate', 'Expected an ISO calendar date.');
  if (!isIsoDate(decisionPoint.knowledgeCutoff)) issue('knowledgeCutoff', 'Expected an ISO calendar date.');
  if (isIsoDate(decisionPoint.decisionDate) && isIsoDate(decisionPoint.knowledgeCutoff)
    && decisionPoint.knowledgeCutoff > decisionPoint.decisionDate) {
    issue('knowledgeCutoff', 'Knowledge cutoff cannot be later than the decision date.');
  }
  if (decisionPoint.caseId !== profile.id) issue('caseId', `Decision point does not belong to profile ${profile.id}.`);
  if (!snapshot) issue('evidenceSnapshotId', 'Unknown snapshot for the declared case.');
  if (snapshot && snapshot.knowledgeCutoff > decisionPoint.knowledgeCutoff) {
    issue('evidenceSnapshotId', 'Snapshot cutoff is later than the decision cutoff.');
  }
  if (!isIsoDate(decisionPoint.reassessment.nextFeasibleAt)) {
    issue('reassessment.nextFeasibleAt', 'Expected an ISO calendar date.');
  }
  if (decisionPoint.actualOperations.length !== 2) issue('actualOperations', 'Exactly two reconstructed operations are required.');
  if (!['documented', 'inferred', 'unknown'].includes(decisionPoint.actor.authorityStatus)) {
    issue('actor.authorityStatus', 'Authority must be documented, inferred, or unknown.');
  }

  const ids = new Set<string>();
  decisionPoint.assumptions.forEach((assumption, index) => {
    if (!nonEmpty(assumption.id) || !nonEmpty(assumption.statement)) {
      issue(`assumptions.${index}`, 'Assumptions require a non-empty id and statement.');
    }
    if (ids.has(assumption.id)) issue(`assumptions.${index}.id`, 'Duplicate assumption id.');
    ids.add(assumption.id);
  });

  allInputs(decisionPoint).forEach((input, index) => {
    const path = `inputs.${input.id || index}`;
    if (!nonEmpty(input.id) || !nonEmpty(input.label)) issue(path, 'Inputs require a non-empty id and label.');
    if (input.displayState === 'FOG' && (input.metric || input.factRef || input.evidence)) {
      issue(path, 'FOG inputs must remain unplaced and cannot carry a metric or evidence claim.');
    }
    if (input.displayState === 'ESTIMATED' && !nonEmpty(input.calculation ?? '')) {
      issue(`${path}.calculation`, 'ESTIMATED inputs require a visible calculation.');
    }
    input.assumptionRefs.forEach((ref) => {
      if (!assumptionIds.has(ref)) issue(`${path}.assumptionRefs`, `Unknown assumption reference: ${ref}.`);
    });
    if (input.factRef && !factById.has(input.factRef)) issue(`${path}.factRef`, `Unknown fact reference: ${input.factRef}.`);
    const fact = input.factRef ? factById.get(input.factRef) : undefined;
    const evidence = input.evidence ?? fact?.evidence[0];
    if (evidence) validateEvidence(evidence, `${path}.evidence`, input.displayState === 'HINDSIGHT');
    if (fact && input.evidence && !fact.evidence.some((ref) => (
      ref.sourceId === input.evidence!.sourceId && ref.locator === input.evidence!.locator
    ))) {
      issue(`${path}.evidence`, `Evidence does not match the provenance recorded by fact ${fact.id}.`);
    }
    const source = evidence ? sourceById.get(evidence.sourceId) : undefined;
    if (source && input.publishedAt && input.publishedAt !== source.publishedAt) {
      issue(`${path}.publishedAt`, `Expected source publication date ${source.publishedAt}.`);
    }
    if (fact && input.origin && input.origin !== fact.origin) {
      issue(`${path}.origin`, `Expected fact provenance ${fact.origin}.`);
    }
  });

  decisionPoint.materialUnknowns.forEach((input, index) => {
    if (input.displayState !== 'FOG' || input.materiality !== 'material') {
      issue(`materialUnknowns.${index}`, 'Material unknowns must remain material FOG inputs.');
    }
  });

  for (const [path, refs] of [
    ['actor.evidenceRefs', decisionPoint.actor.evidenceRefs],
    ['irreversibility.evidenceRefs', decisionPoint.irreversibility.evidenceRefs],
    ['reassessment.evidenceRefs', decisionPoint.reassessment.evidenceRefs],
    ...decisionPoint.actualOperations.map((operation, index) => [
      `actualOperations.${index}.evidenceRefs`,
      operation.evidenceRefs,
    ] as const),
  ] as const) refs.forEach((ref, index) => validateEvidence(ref, `${path}.${index}`));

  for (const [path, refs] of [
    ['actor.assumptionRefs', decisionPoint.actor.assumptionRefs],
    ['irreversibility.assumptionRefs', decisionPoint.irreversibility.assumptionRefs],
    ['reassessment.assumptionRefs', decisionPoint.reassessment.assumptionRefs],
    ...decisionPoint.constructs.map((construct) => [`constructs.${construct.id}.assumptionRefs`, construct.assumptionRefs] as const),
  ] as const) {
    refs.forEach((ref) => {
      if (!assumptionIds.has(ref)) issue(path, `Unknown assumption reference: ${ref}.`);
    });
  }

  return issues;
}

export function resolveDecisionPoint(
  decisionPoint: DecisionPoint,
  profile: CaseProfile,
): DecisionPacket {
  const issues = validateDecisionPoint(decisionPoint, profile);
  if (issues.length > 0) throw new Error(issues.map(({ path, message }) => `${path}: ${message}`).join('\n'));
  const sourceById = new Map(profile.sources.map((source) => [source.id, source]));
  const factById = new Map(profile.facts.map((fact) => [fact.id, fact]));
  const resolve = (input: DecisionInput) => resolveInput(input, factById, sourceById);
  return {
    decisionPoint,
    profile,
    snapshot: profile.snapshots.find(({ id }) => id === decisionPoint.evidenceSnapshotId)!,
    contemporaneousInputs: contemporaneousInputs(decisionPoint).map(resolve),
    hindsightInputs: decisionPoint.hindsight.map(resolve),
    materialUnknowns: decisionPoint.materialUnknowns.map(resolve),
  };
}
