import {
  resolveAnswerSet,
  toComponentRecipe,
  type AffordanceResult,
  type AnswerSetV2,
  type PatternResult,
  type RecipeResult,
  type ResolveContext,
} from "../../src/index.js";

declare const answer: AnswerSetV2;
declare const context: ResolveContext;
declare const pattern: PatternResult;
declare const affordances: AffordanceResult;

const pipelineResult: RecipeResult = resolveAnswerSet(answer, context);
const stageResult: RecipeResult = toComponentRecipe(pattern, affordances, answer, context);
void pipelineResult;
void stageResult;

// @ts-expect-error disclosure depth is closed
resolveAnswerSet(answer, { depth: "summary" });

// @ts-expect-error callbacks cannot enter renderer-neutral context
resolveAnswerSet(answer, { depth: "glance", onRender: () => undefined });
