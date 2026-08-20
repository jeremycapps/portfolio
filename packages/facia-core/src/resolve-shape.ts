import type { AnswerSetV2, ShapeResult } from "./answer-set-v2.js";
import {
  selectShapeDecisionRule,
  type ShapeDecisionInput,
} from "./decision-manifests.js";
import { validateAnswerSet } from "./validate-answer-set.js";

function normalizeShapeInput(answerSet: AnswerSetV2): ShapeDecisionInput {
  return {
    cardinality: answerSet.items.length === 1 ? "single" : "many",
    role: answerSet.answerType,
    structure: answerSet.structure,
    sequenceKind: answerSet.sequenceKind,
  };
}

/**
 * Resolve arbitrary input through validation and the normative ten-shape
 * manifest. Validated input always has exactly one matching manifest rule.
 */
export function resolveShape(input: unknown): ShapeResult {
  const validation = validateAnswerSet(input);
  if (!validation.valid) {
    return {
      ok: false,
      code: "VALIDATION_REQUIRED",
      explanation: "Shape resolution requires a valid AnswerSet v2 value.",
      errors: validation.errors,
    };
  }

  const rule = selectShapeDecisionRule(normalizeShapeInput(validation.value));
  if (rule === undefined) {
    return {
      ok: false,
      code: "SEMANTIC_SPEC_REQUIRED",
      explanation: "No normative shape decision matches the validated AnswerSet.",
    };
  }

  return {
    ok: true,
    shape: rule.shape,
    reasonCode: rule.reasonCode,
    explanation: rule.explanation,
  };
}
