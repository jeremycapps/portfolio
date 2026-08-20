import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  enumeratePatternDecisionInputs,
  resolvePattern,
  resolvePatternDecision,
  resolveShape,
  selectPatternDecisionRule,
  type JsonObject,
  type PatternDecisionInput,
  type ResolveContext,
  type ShapeResult,
} from "../src/index.js";

const packageRoot = new URL("../", import.meta.url);
const glance = { depth: "glance" } as const;

function fixture(name: string): JsonObject {
  return JSON.parse(
    readFileSync(new URL(`test/fixtures/schema/accepted/${name}.json`, packageRoot), "utf8"),
  ) as JsonObject;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function resolved(answer: JsonObject, context: ResolveContext = glance) {
  return resolvePattern(resolveShape(answer), answer, context);
}

function valueMany(
  structure?: "dimension" | "group" | "sequence",
  sequenceKind?: "temporal" | "dependency" | "trace",
): JsonObject {
  const answer = fixture("value");
  answer.items = [clone((answer.items as JsonObject[])[0]), clone((answer.items as JsonObject[])[0])];
  if (structure !== undefined) answer.structure = structure;
  if (sequenceKind !== undefined) answer.sequenceKind = sequenceKind;
  return answer;
}

describe("resolvePatternDecision", () => {
  it("matches manifest-derived golden expectations over the full Cartesian enumeration", () => {
    const mismatches: Array<{ input: PatternDecisionInput; expected: string; actual: unknown }> = [];
    for (const input of enumeratePatternDecisionInputs()) {
      const rule = selectPatternDecisionRule(input);
      if (rule === undefined) throw new Error("audited manifest unexpectedly has no rule");
      const source = input.density === "absent" ? "absent" : "declared";
      const result = resolvePatternDecision(input, { density: input.density, source });
      if (!result.ok || result.pattern !== rule.pattern || result.reasonCode !== rule.reasonCode) {
        mismatches.push({ input, expected: rule.reasonCode, actual: result });
      }
    }
    expect(mismatches).toEqual([]);
  });
});

describe("resolvePattern", () => {
  it("selects actionable singular and convergence panels before generic rules", () => {
    const verdict = fixture("bounded-verdict");
    verdict.actionable = true;
    verdict.operations = [{
      id: "approve",
      label: "Approve",
      invocation: "host-callback",
      reference: "review.approve",
    }];

    expect(resolved(verdict, { depth: "audit" })).toMatchObject({
      ok: true, pattern: "review-panel", reasonCode: "PATTERN_ACTIONABLE_VERDICT",
    });
    expect(resolved(fixture("operation"))).toMatchObject({
      ok: true, pattern: "action-panel", reasonCode: "PATTERN_ACTIONABLE_OPERATION",
    });
    expect(resolved(fixture("convergence"))).toMatchObject({
      ok: true, pattern: "convergence-panel", reasonCode: "PATTERN_CONVERGENCE_PANEL",
    });
  });

  it("uses declared, derived, and absent density with exact fallback reasons", () => {
    const declared = fixture("value");
    const declaredCases: Array<[number, string, string]> = [
      [1, "stat", "PATTERN_COMPACT_SCALAR"],
      [2, "detail", "PATTERN_DENSE_VALUE"],
      [3, "detail", "PATTERN_DENSE_VALUE"],
    ];
    for (const [density, pattern, reasonCode] of declaredCases) {
      declared.density = density;
      expect(resolved(declared)).toMatchObject({
        ok: true,
        pattern,
        reasonCode,
        density: { density, source: "declared" },
      });
    }

    const derived = fixture("value");
    delete derived.density;
    expect(resolved(derived)).toMatchObject({
      ok: true,
      pattern: "stat",
      reasonCode: "PATTERN_COMPACT_SCALAR",
      density: { density: 1, source: "derived" },
    });

    const absent = fixture("value");
    delete absent.density;
    delete (absent.items as JsonObject[])[0].fields;
    expect(resolved(absent)).toMatchObject({
      ok: true,
      pattern: "detail",
      reasonCode: "PATTERN_ABSENT_VALUE",
      density: { density: "absent", source: "absent" },
    });
  });

  it("uses focus and audit fullness only where the manifest specifies it", () => {
    const verdict = fixture("bounded-verdict");
    verdict.density = 1;
    expect(resolved(verdict, { depth: "inspect" })).toMatchObject({
      ok: true, pattern: "badge", reasonCode: "PATTERN_COMPACT_VERDICT",
    });
    expect(resolved(verdict, { depth: "focus" })).toMatchObject({
      ok: true, pattern: "detail", reasonCode: "PATTERN_DEEP_VERDICT",
    });

    const collection = valueMany();
    collection.density = 1;
    expect(resolved(collection, { depth: "glance" })).toEqual(
      resolved(collection, { depth: "audit" }),
    );
  });

  it("selects collection, dimension, grouped operation, and sequence mappings", () => {
    const collection = valueMany();
    collection.density = 2;
    const denseCollection = clone(collection);
    denseCollection.density = 3;
    const absentDimension = valueMany("dimension");
    delete absentDimension.density;
    for (const item of absentDimension.items as JsonObject[]) delete item.fields;

    const operationGroup = fixture("operation");
    operationGroup.items = [
      clone((operationGroup.items as JsonObject[])[0]),
      clone((operationGroup.items as JsonObject[])[0]),
    ];
    operationGroup.structure = "group";

    const cases: Array<[JsonObject, string, string]> = [
      [collection, "list", "PATTERN_COLLECTION_LIST"],
      [denseCollection, "grid", "PATTERN_COLLECTION_GRID"],
      [absentDimension, "comparison-matrix", "PATTERN_DIMENSION_ABSENT_MATRIX"],
      [operationGroup, "board", "PATTERN_OPERATION_BOARD"],
      [valueMany("sequence", "temporal"), "timeline", "PATTERN_TEMPORAL_TIMELINE"],
      [valueMany("sequence", "dependency"), "dependency-tree", "PATTERN_DEPENDENCY_TREE"],
      [fixture("trace-sequence"), "audit-trail", "PATTERN_TRACE_AUDIT"],
    ];
    for (const [answer, pattern, reasonCode] of cases) {
      expect(resolved(answer), reasonCode).toMatchObject({ ok: true, pattern, reasonCode });
    }
  });

  it("is total, deterministic, non-mutating, and rejects mismatched shape/context data", () => {
    const answer = fixture("value");
    const snapshot = clone(answer);
    const first = resolved(answer);
    expect(first).toEqual(resolved(answer));
    expect(answer).toEqual(snapshot);

    const wrongShape = {
      ok: true,
      shape: "dimension",
      reasonCode: "SHAPE_DIMENSION",
      explanation: "wrong",
    } satisfies ShapeResult;
    expect(resolvePattern(wrongShape, answer, glance)).toMatchObject({
      ok: false, code: "SHAPE_REQUIRED",
    });
    expect(resolvePattern(resolveShape(answer), answer, {
      depth: "glance",
      extra: true,
    } as ResolveContext)).toMatchObject({
      ok: false, code: "SEMANTIC_SPEC_REQUIRED",
    });
    expect(resolvePattern(resolveShape(null), null, glance)).toMatchObject({
      ok: false, code: "VALIDATION_REQUIRED",
    });
  });
});
