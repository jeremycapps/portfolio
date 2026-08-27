import type {
  AnswerSetV2,
  ConvergenceAnswerSetV2,
  DirectTraceV2,
  FieldInfoV2,
  FieldKey,
  FieldPriority,
  FieldPriorityV2,
  HistoryRecordV2,
  HistoryTraceV2,
  NonEmptyArray,
  OperationAnswerSetV2,
  PromotionConditionV2,
  PromotionRuleV2,
  TraceEntryV2,
  ValueAnswerSetV2,
  VerdictAnswerSetV2,
} from "./answer-set-v2.js";

/**
 * Producer-side constructors for the normative AnswerSet v2 types.
 *
 * These are a typing convenience, not a second validator. They add no members,
 * accept no aliases, and check nothing beyond the cardinality rules the
 * contract's tuple types already encode. Producers still pass their output
 * through `validateAnswerSet` or `resolveAnswerSet`.
 *
 * This module imports types only, so `@facia/core/authoring` pulls neither the
 * resolver nor the AJV validator into a consumer's bundle.
 */

/** Thrown when producer input cannot satisfy a contract cardinality rule. */
export class FaciaAuthoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FaciaAuthoringError";
  }
}

/**
 * Narrow an ordinary array to the contract's non-empty tuple type.
 *
 * Throwing is correct here and does not contradict the contract's "validation
 * is total and never throws" rule: that rule governs `validateAnswerSet` and
 * the resolvers, which consume untrusted input. These constructors run
 * producer-side at authoring time, where a build should stop.
 */
export function nonEmpty<T>(values: readonly T[], subject = "array"): NonEmptyArray<T> {
  if (values.length === 0) {
    throw new FaciaAuthoringError(`A non-empty ${subject} is required.`);
  }
  return [...values] as NonEmptyArray<T>;
}

export function directTrace(id: string, entries: readonly TraceEntryV2[]): DirectTraceV2 {
  return { kind: "direct", id, entries: nonEmpty(entries, "trace entry list") };
}

export function historyTrace(records: readonly HistoryRecordV2[]): HistoryTraceV2 {
  return { kind: "history", records: nonEmpty(records, "history record list") };
}

/** Fill all four declared priority buckets from a partial declaration. */
export function priority(
  buckets: Partial<Record<FieldPriority, readonly FieldKey[]>>,
): FieldPriorityV2 {
  return {
    primary: [...(buckets.primary ?? [])],
    secondary: [...(buckets.secondary ?? [])],
    supporting: [...(buckets.supporting ?? [])],
    audit: [...(buckets.audit ?? [])],
  };
}

export function promotionRule(
  when: PromotionConditionV2,
  promote: readonly FieldKey[],
): PromotionRuleV2 {
  return { when, promote: nonEmpty(promote, "promotion target list") };
}

export function fields(
  buckets: Partial<Record<FieldPriority, readonly FieldKey[]>>,
  promotion?: readonly PromotionRuleV2[],
): FieldInfoV2 {
  return promotion === undefined
    ? { priority: priority(buckets) }
    : { priority: priority(buckets), promotion: [...promotion] };
}

/** An envelope minus the two members the constructor stamps, with a plain item array. */
export type AnswerSetInput<T extends AnswerSetV2> =
  Omit<T, "schema" | "answerType" | "items"> & { items: readonly T["items"][number][] };

// The single cast in this module, and the reason it exists: TypeScript cannot
// prove that `Omit<T, ...> & { items }` spread into an object literal
// reconstitutes `T`. Concentrating one cast here is what lets every producer
// have none. The envelope constructors below are covered by authoring.test.ts,
// which round-trips their output through validateAnswerSet.
function envelope<T extends AnswerSetV2>(
  answerType: T["answerType"],
  input: AnswerSetInput<T>,
): T {
  return {
    ...input,
    schema: "facia.answer-set/2",
    answerType,
    items: nonEmpty(input.items, "item list"),
  } as unknown as T;
}

export const valueAnswerSet = (input: AnswerSetInput<ValueAnswerSetV2>): ValueAnswerSetV2 =>
  envelope<ValueAnswerSetV2>("value", input);

export const verdictAnswerSet = (input: AnswerSetInput<VerdictAnswerSetV2>): VerdictAnswerSetV2 =>
  envelope<VerdictAnswerSetV2>("verdict", input);

export const operationAnswerSet = (input: AnswerSetInput<OperationAnswerSetV2>): OperationAnswerSetV2 =>
  envelope<OperationAnswerSetV2>("operation", input);

export const convergenceAnswerSet = (input: AnswerSetInput<ConvergenceAnswerSetV2>): ConvergenceAnswerSetV2 =>
  envelope<ConvergenceAnswerSetV2>("convergence", input);
