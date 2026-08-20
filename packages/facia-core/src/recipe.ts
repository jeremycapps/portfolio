import type {
  AffordanceResult,
  ComponentRecipe,
  PatternResult,
  RecipeResult,
  ResolveContext,
  SemanticComponentDescriptor,
} from "./answer-set-v2.js";
import { resolveVisibleFields } from "./field-information.js";
import { selectComponentRecipeRow } from "./presentation-manifests.js";
import { resolveAffordances } from "./resolve-affordances.js";
import { isResolveContext } from "./resolve-context.js";
import { resolvePattern } from "./resolve-pattern.js";
import { resolveShape } from "./resolve-shape.js";
import { validateAnswerSet } from "./validate-answer-set.js";

const RENDERER_BOUNDARY =
  "Renderer consumes semantic specs; it does not evaluate Domain truth." as const;

function cloneComponent(component: SemanticComponentDescriptor): SemanticComponentDescriptor {
  return component.semantics === undefined
    ? { id: component.id }
    : { id: component.id, semantics: structuredClone(component.semantics) };
}

/** Convert successful semantic decisions into one renderer-neutral JSON recipe. */
export function toComponentRecipe(
  patternResult: PatternResult,
  affordanceResult: AffordanceResult,
  input: unknown,
  context: ResolveContext,
): RecipeResult {
  const validation = validateAnswerSet(input);
  if (!validation.valid) {
    return {
      ok: false,
      code: "VALIDATION_REQUIRED",
      explanation: "Recipe composition requires a valid AnswerSet v2 value.",
      errors: validation.errors,
    };
  }
  if (!isResolveContext(context)) {
    return {
      ok: false,
      code: "SEMANTIC_SPEC_REQUIRED",
      explanation: "Recipe composition requires a closed ResolveContext with a valid depth.",
    };
  }
  if (!patternResult.ok || !affordanceResult.ok) {
    return {
      ok: false,
      code: "SEMANTIC_SPEC_REQUIRED",
      explanation: "Recipe composition requires successful pattern and affordance decisions.",
    };
  }

  const componentRow = selectComponentRecipeRow(patternResult.pattern);
  if (componentRow === undefined) {
    return {
      ok: false,
      code: "SEMANTIC_SPEC_REQUIRED",
      explanation: "The selected pattern has no normative component recipe.",
    };
  }

  const recipe: ComponentRecipe = {
    pattern: patternResult.pattern,
    patternReasonCode: patternResult.reasonCode,
    components: componentRow.components.map(cloneComponent),
    inspectionControls: [...affordanceResult.inspection.controls],
    actionControls: affordanceResult.actions.map(({ operation, reasonCode }) => ({
      operation: structuredClone(operation),
      reasonCode,
    })),
    answer: validation.value,
    context: { depth: context.depth, audience: context.audience ?? "human" },
    density: { ...patternResult.density },
    visibleFields: resolveVisibleFields(validation.value, context.depth),
    boundary: RENDERER_BOUNDARY,
  };
  return { ok: true, recipe };
}

/** Public validation-to-recipe pipeline. Invalid input never enters a later stage. */
export function resolveAnswerSet(
  input: unknown,
  context: ResolveContext,
): RecipeResult {
  const validation = validateAnswerSet(input);
  if (!validation.valid) {
    return {
      ok: false,
      code: "VALIDATION_REQUIRED",
      explanation: "Recipe resolution requires a valid AnswerSet v2 value.",
      errors: validation.errors,
    };
  }
  if (!isResolveContext(context)) {
    return {
      ok: false,
      code: "SEMANTIC_SPEC_REQUIRED",
      explanation: "Recipe resolution requires a closed ResolveContext with a valid depth.",
    };
  }

  const shape = resolveShape(validation.value);
  if (!shape.ok) return shape;
  const pattern = resolvePattern(shape, validation.value, context);
  if (!pattern.ok) return pattern;
  const affordances = resolveAffordances(validation.value, shape, context);
  if (!affordances.ok) return affordances;
  return toComponentRecipe(pattern, affordances, validation.value, context);
}
