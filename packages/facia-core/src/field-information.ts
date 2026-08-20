import type {
  AnswerItemV2,
  AnswerSetV2,
  DensityResolution,
  DisclosureDepth,
  FieldPriority,
  JsonObject,
  JsonValue,
  PromotionConditionV2,
  ResolvedFieldV2,
  ResolvedItemFieldsV2,
} from "./answer-set-v2.js";

export const FIELD_PRIORITY_ORDER = [
  "primary",
  "secondary",
  "supporting",
  "audit",
] as const satisfies readonly FieldPriority[];

export const DISCLOSURE_PRIORITIES: Readonly<
  Record<DisclosureDepth, readonly FieldPriority[]>
> = {
  glance: ["primary"],
  inspect: ["primary", "secondary"],
  focus: ["primary", "secondary", "supporting"],
  audit: ["primary", "secondary", "supporting", "audit"],
};

function jsonEquals(left: JsonValue, right: JsonValue): boolean {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left)
      && Array.isArray(right)
      && left.length === right.length
      && left.every((value, index) => jsonEquals(value, right[index]));
  }
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.hasOwn(right, key) && jsonEquals(left[key], right[key]));
}

function isNonEmpty(value: JsonValue): boolean {
  if (typeof value === "string" || Array.isArray(value)) return value.length > 0;
  return value !== null && typeof value === "object" && Object.keys(value).length > 0;
}

/** Evaluate one structurally validated promotion condition against one item payload. */
export function promotionConditionMatches(
  payload: JsonObject,
  condition: PromotionConditionV2,
): boolean {
  if (!Object.hasOwn(payload, condition.field)) return false;
  const value = payload[condition.field] as JsonValue;
  if ("equals" in condition) return jsonEquals(value, condition.equals as JsonValue);
  if ("isFalse" in condition) return value === false;
  return isNonEmpty(value);
}

function resolveAllItemFields(item: AnswerItemV2): ResolvedFieldV2[] {
  if (!item.fields) return [];

  const declaredPriority = new Map<string, FieldPriority>();
  for (const priority of FIELD_PRIORITY_ORDER) {
    for (const key of item.fields.priority[priority]) {
      if (!declaredPriority.has(key)) declaredPriority.set(key, priority);
    }
  }

  const matchingRules = new Map<string, number[]>();
  const promotedOrder: string[] = [];
  for (const [ruleIndex, rule] of (item.fields.promotion ?? []).entries()) {
    if (!promotionConditionMatches(item.payload, rule.when)) continue;
    for (const key of rule.promote) {
      const indices = matchingRules.get(key);
      if (indices) {
        indices.push(ruleIndex);
      } else {
        matchingRules.set(key, [ruleIndex]);
        promotedOrder.push(key);
      }
    }
  }

  const emitted = new Set<string>();
  const result: ResolvedFieldV2[] = [];
  const emit = (key: string): void => {
    if (emitted.has(key)) return;
    const declared = declaredPriority.get(key);
    if (!declared) return;
    emitted.add(key);
    const promotionRuleIndices = matchingRules.get(key) ?? [];
    result.push({
      key,
      value: item.payload[key],
      declaredPriority: declared,
      effectivePriority: promotionRuleIndices.length > 0 ? "primary" : declared,
      promotionRuleIndices: [...promotionRuleIndices],
    });
  };

  for (const key of item.fields.priority.primary) emit(key);
  for (const key of promotedOrder) emit(key);
  for (const priority of ["secondary", "supporting", "audit"] as const) {
    for (const key of item.fields.priority[priority]) emit(key);
  }
  return result;
}

/**
 * Resolve promotion and cumulative disclosure for one validated AnswerSet.
 * One entry is retained per item, including items that declare no field metadata.
 */
export function resolveVisibleFields(
  answerSet: AnswerSetV2,
  depth: DisclosureDepth,
): ResolvedItemFieldsV2[] {
  const visiblePriorities = new Set(DISCLOSURE_PRIORITIES[depth]);
  return answerSet.items.map((item, itemIndex) => ({
    itemIndex,
    fields: resolveAllItemFields(item).filter(
      ({ effectivePriority }) => visiblePriorities.has(effectivePriority),
    ),
  }));
}

/** Resolve authoritative, item-locally derived, or absent AnswerSet density. */
export function resolveDensity(answerSet: AnswerSetV2): DensityResolution {
  if (answerSet.density !== undefined) {
    return { density: answerSet.density, source: "declared" };
  }

  const primaryCounts = answerSet.items
    .filter((item) => item.fields !== undefined)
    .map((item) => item.fields!.priority.primary.length);
  if (primaryCounts.length === 0) return { density: "absent", source: "absent" };

  const primaryCount = Math.max(...primaryCounts);
  return {
    density: primaryCount <= 1 ? 1 : primaryCount <= 3 ? 2 : 3,
    source: "derived",
  };
}
