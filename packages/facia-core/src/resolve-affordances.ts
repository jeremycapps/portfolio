import type {
  AffordanceResult,
  AnswerSetV2,
  ResolveContext,
  ShapeResult,
} from "./answer-set-v2.js";
import {
  selectInspectionDecisionRule,
  type InspectionCapability,
} from "./presentation-manifests.js";
import { isResolveContext } from "./resolve-context.js";
import { resolveShape } from "./resolve-shape.js";
import { validateAnswerSet } from "./validate-answer-set.js";

function inspectionCapability(
  answerSet: AnswerSetV2,
  shape: string,
): InspectionCapability {
  const base = shape === "dimension"
    ? "dimension"
    : answerSet.items.length > 1 ? "collection" : "singular";
  const hasTrace = shape === "trace-sequence" || answerSet.trace !== undefined;
  const hasEvidence = answerSet.items.some((item) => Object.hasOwn(item, "evidence"));
  if (hasTrace && hasEvidence) return `${base}-trace-evidence`;
  if (hasTrace) return `${base}-trace`;
  if (hasEvidence) return `${base}-evidence`;
  return base;
}

/**
 * Resolve inspection controls from manifest data and map operation descriptors
 * one-to-one, in order, without executing or interpreting them.
 */
export function resolveAffordances(
  input: unknown,
  shapeResult: ShapeResult,
  context: ResolveContext,
): AffordanceResult {
  const validation = validateAnswerSet(input);
  if (!validation.valid) {
    return {
      ok: false,
      code: "VALIDATION_REQUIRED",
      explanation: "Affordance resolution requires a valid AnswerSet v2 value.",
      errors: validation.errors,
    };
  }
  if (!shapeResult.ok) {
    return {
      ok: false,
      code: "SHAPE_REQUIRED",
      explanation: "Affordance resolution requires a successful shape resolution.",
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
      explanation: "Affordance resolution requires a closed ResolveContext with a valid depth.",
    };
  }

  const rule = selectInspectionDecisionRule({
    inspection: validation.value.inspection,
    capability: inspectionCapability(validation.value, shapeResult.shape),
    depth: context.depth,
  });
  if (rule === undefined) {
    return {
      ok: false,
      code: "SEMANTIC_SPEC_REQUIRED",
      explanation: "No normative inspection decision matches the resolved AnswerSet.",
    };
  }

  return {
    ok: true,
    inspection: {
      controls: [...rule.controls],
      reasonCode: rule.reasonCode,
      explanation: rule.explanation,
    },
    actions: validation.value.operations.map((operation) => ({
      operation,
      reasonCode: "ACTION_OPERATION_DESCRIPTOR",
    })),
  };
}
