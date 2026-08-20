import type {
  AnswerSetV2,
  DensityResolution,
  PatternResolution,
  PatternResult,
  ResolveContext,
  ShapeResult,
  ValueAnswerV2,
} from "./answer-set-v2.js";
import {
  selectPatternDecisionRule,
  type PatternDecisionInput,
  type PatternValueKind,
} from "./decision-manifests.js";
import { resolveDensity } from "./field-information.js";
import { isResolveContext } from "./resolve-context.js";
import { resolveShape } from "./resolve-shape.js";
import { validateAnswerSet } from "./validate-answer-set.js";

function valueKind(answerSet: AnswerSetV2): PatternValueKind {
  if (answerSet.items.length !== 1 || answerSet.answerType !== "value") {
    return "not-applicable";
  }
  const value = (answerSet.items[0] as ValueAnswerV2).value;
  return value !== null && ["string", "number", "boolean"].includes(typeof value)
    ? "scalar"
    : "structured";
}

/** Resolve an already-normalized input directly through the normative manifest. */
export function resolvePatternDecision(
  input: PatternDecisionInput,
  density: DensityResolution,
): PatternResult {
  const rule = selectPatternDecisionRule(input);
  if (rule === undefined) {
    return {
      ok: false,
      code: "PATTERN_UNSUPPORTED",
      explanation: "No normative pattern decision matches the normalized input.",
    };
  }
  const resolution: PatternResolution = {
    ok: true,
    pattern: rule.pattern,
    reasonCode: rule.reasonCode,
    explanation: rule.explanation,
    density,
  };
  return resolution;
}

/**
 * Validate and normalize one AnswerSet, require its matching shape result, and
 * select the unique highest-precedence presentation rule.
 */
export function resolvePattern(
  shapeResult: ShapeResult,
  input: unknown,
  context: ResolveContext,
): PatternResult {
  const validation = validateAnswerSet(input);
  if (!validation.valid) {
    return {
      ok: false,
      code: "VALIDATION_REQUIRED",
      explanation: "Pattern resolution requires a valid AnswerSet v2 value.",
      errors: validation.errors,
    };
  }
  if (!shapeResult.ok) {
    return {
      ok: false,
      code: "SHAPE_REQUIRED",
      explanation: "Pattern resolution requires a successful shape resolution.",
    };
  }
  const canonicalShape = resolveShape(validation.value);
  if (!canonicalShape.ok || canonicalShape.shape !== shapeResult.shape) {
    return {
      ok: false,
      code: "SHAPE_REQUIRED",
      explanation: "The supplied shape does not match the validated AnswerSet.",
    };
  }
  if (!isResolveContext(context)) {
    return {
      ok: false,
      code: "SEMANTIC_SPEC_REQUIRED",
      explanation: "Pattern resolution requires a closed ResolveContext with a valid depth.",
    };
  }

  const density = resolveDensity(validation.value);
  return resolvePatternDecision({
    shape: shapeResult.shape,
    role: validation.value.answerType,
    actionable: validation.value.actionable,
    density: density.density,
    depth: context.depth,
    path: validation.value.path,
    valueKind: valueKind(validation.value),
  }, density);
}
