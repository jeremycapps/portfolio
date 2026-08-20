import {
  ANSWER_SET_SCHEMA_ID,
  ANSWER_SET_SCHEMA_PIN,
  COMPONENT_RECIPE_MANIFEST,
  INSPECTION_DECISION_MANIFEST,
  PATTERN_DECISION_MANIFEST,
  SHAPE_DECISION_MANIFEST,
  resolveAffordances,
  resolveAnswerSet,
  resolveDensity,
  resolvePattern,
  resolveShape,
  resolveVisibleFields,
  toComponentRecipe,
  validateAnswerSet,
  type AffordanceResult,
  type AnswerSetV2,
  type ComponentRecipe,
  type PatternResult,
  type RecipeResult,
  type ResolveContext,
  type ShapeResult,
  type ValidationResult,
} from "../../src/index.js";

declare const input: unknown;
declare const answer: AnswerSetV2;
declare const context: ResolveContext;

const validation: ValidationResult = validateAnswerSet(input);
const shape: ShapeResult = resolveShape(answer);
const pattern: PatternResult = resolvePattern(shape, answer, context);
const affordances: AffordanceResult = resolveAffordances(answer, shape, context);
const staged: RecipeResult = toComponentRecipe(pattern, affordances, answer, context);
const composed: RecipeResult = resolveAnswerSet(answer, context);
const fields = resolveVisibleFields(answer, context.depth);
const density = resolveDensity(answer);

if (composed.ok) {
  const recipe: ComponentRecipe = composed.recipe;
  void recipe;
}

void validation;
void staged;
void fields;
void density;
void ANSWER_SET_SCHEMA_ID;
void ANSWER_SET_SCHEMA_PIN;
void SHAPE_DECISION_MANIFEST;
void PATTERN_DECISION_MANIFEST;
void INSPECTION_DECISION_MANIFEST;
void COMPONENT_RECIPE_MANIFEST;

// @ts-expect-error resolveSurface is retired with the surface-contract prototype
import { resolveSurface } from "../../src/index.js";
// @ts-expect-error FaciaSurface is retired with the surface-contract prototype
import type { FaciaSurface } from "../../src/index.js";
// @ts-expect-error SurfaceBinder is retired with the surface-contract prototype
import type { SurfaceBinder } from "../../src/index.js";

void resolveSurface;
declare const retiredSurface: FaciaSurface;
declare const retiredBinder: SurfaceBinder;
void retiredSurface;
void retiredBinder;
