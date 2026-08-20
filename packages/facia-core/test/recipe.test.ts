import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  resolveAffordances,
  resolveAnswerSet,
  resolvePattern,
  resolveShape,
  selectComponentRecipeRow,
  toComponentRecipe,
  type JsonObject,
  type ResolveContext,
} from "../src/index.js";

const packageRoot = new URL("../", import.meta.url);

function fixture(name: string): JsonObject {
  return JSON.parse(
    readFileSync(new URL(`test/fixtures/schema/accepted/${name}.json`, packageRoot), "utf8"),
  ) as JsonObject;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function functionsIn(value: unknown, path = "$", seen = new Set<object>()): string[] {
  if (typeof value === "function") return [path];
  if (value === null || typeof value !== "object" || seen.has(value)) return [];
  seen.add(value);
  const found = Object.entries(value).flatMap(([key, child]) => functionsIn(child, `${path}.${key}`, seen));
  seen.delete(value);
  return found;
}

describe("public AnswerSet-to-recipe pipeline", () => {
  it("produces a recipe for every canonical fixture at every disclosure depth", () => {
    const names = [
      "value", "legacy-verdict", "bounded-verdict", "operation",
      "convergence", "convergence-history", "trace-sequence",
    ];
    for (const name of names) {
      for (const depth of ["glance", "inspect", "focus", "audit"] as const) {
        const result = resolveAnswerSet(fixture(name), { depth });
        expect(result.ok, `${name}/${depth}`).toBe(true);
        if (!result.ok) throw new Error(`${name}/${depth}: ${result.explanation}`);
        expect(result.recipe.context).toEqual({ depth, audience: "human" });
      }
    }
  });

  it("uses exact manifest component order and carries consistent semantic decisions", () => {
    const answer = fixture("operation");
    const result = resolveAnswerSet(answer, { depth: "audit", audience: "agent" });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected recipe success");

    const row = selectComponentRecipeRow(result.recipe.pattern)!;
    expect(result.recipe.components).toEqual(row.components);
    expect(result.recipe).toMatchObject({
      pattern: "action-panel",
      patternReasonCode: "PATTERN_ACTIONABLE_OPERATION",
      inspectionControls: ["inspect", "expand", "view-evidence"],
      context: { depth: "audit", audience: "agent" },
      boundary: "Renderer consumes semantic specs; it does not evaluate Domain truth.",
    });
    expect(result.recipe.actionControls.map(({ operation }) => operation))
      .toEqual(answer.operations);
    expect(result.recipe.answer).toEqual(answer);
  });

  it("includes visible field order, declared priority, promotion, and effective priority", () => {
    const result = resolveAnswerSet(fixture("value"), { depth: "glance" });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected recipe success");

    expect(result.recipe.visibleFields).toEqual([{
      itemIndex: 0,
      fields: [
        {
          key: "name",
          value: "Ada",
          declaredPriority: "primary",
          effectivePriority: "primary",
          promotionRuleIndices: [2],
        },
        {
          key: "active",
          value: false,
          declaredPriority: "secondary",
          effectivePriority: "primary",
          promotionRuleIndices: [0],
        },
        {
          key: "details",
          value: ["mathematician"],
          declaredPriority: "supporting",
          effectivePriority: "primary",
          promotionRuleIndices: [1],
        },
      ],
    }]);
  });

  it("round-trips as JSON without functions or semantic loss", () => {
    const result = resolveAnswerSet(fixture("convergence-history"), { depth: "audit" });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected recipe success");

    expect(functionsIn(result.recipe)).toEqual([]);
    expect(JSON.parse(JSON.stringify(result.recipe))).toEqual(result.recipe);
    for (const component of result.recipe.components) {
      expect(component.id).toMatch(/^[A-Z][A-Za-z]+$/);
      expect(Object.keys(component).every((key) => key === "id" || key === "semantics")).toBe(true);
    }
  });

  it("is deterministic and leaves both AnswerSet and context unchanged", () => {
    const answer = fixture("value");
    const context = { depth: "audit", audience: "human" } as const;
    const answerSnapshot = clone(answer);
    const contextSnapshot = clone(context);
    const first = resolveAnswerSet(answer, context);

    expect(first).toEqual(resolveAnswerSet(answer, context));
    expect(answer).toEqual(answerSnapshot);
    expect(context).toEqual(contextSnapshot);
  });

  it("stops invalid input at validation and rejects unresolved recipe prerequisites", () => {
    expect(resolveAnswerSet(null, { depth: "glance" })).toMatchObject({
      ok: false, code: "VALIDATION_REQUIRED",
    });
    expect(resolveAnswerSet(fixture("value"), {
      depth: "glance",
      renderer: "react",
    } as ResolveContext)).toMatchObject({ ok: false, code: "SEMANTIC_SPEC_REQUIRED" });

    const answer = fixture("value");
    const shape = resolveShape(answer);
    const pattern = resolvePattern(shape, answer, { depth: "glance" });
    const affordances = resolveAffordances(answer, shape, { depth: "glance" });
    expect(toComponentRecipe(pattern, affordances, answer, { depth: "glance" })).toEqual(
      resolveAnswerSet(answer, { depth: "glance" }),
    );

    const failedPattern = resolvePattern(resolveShape(null), null, { depth: "glance" });
    expect(toComponentRecipe(failedPattern, affordances, answer, { depth: "glance" }))
      .toMatchObject({ ok: false, code: "SEMANTIC_SPEC_REQUIRED" });
  });
});
