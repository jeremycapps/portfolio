import { describe, expect, it } from "vitest";

import {
  PATTERN_DECISION_MANIFEST,
  SHAPE_DECISION_MANIFEST,
  assertPatternDecisionManifest,
  auditPatternDecisionManifest,
  enumeratePatternDecisionInputs,
  selectPatternDecisionRule,
  selectShapeDecisionRule,
  type PatternDecisionInput,
  type PatternDecisionRule,
} from "../src/index.js";

function pattern(overrides: Partial<PatternDecisionInput>): PatternDecisionInput {
  return {
    shape: "collection",
    role: "value",
    actionable: false,
    density: 1,
    depth: "glance",
    path: "meaning",
    valueKind: "not-applicable",
    ...overrides,
  };
}

describe("normative shape decision manifest", () => {
  it("enumerates ten unique shapes, reasons, and precedence values", () => {
    expect(SHAPE_DECISION_MANIFEST).toHaveLength(10);
    expect(new Set(SHAPE_DECISION_MANIFEST.map(({ shape }) => shape)).size).toBe(10);
    expect(new Set(SHAPE_DECISION_MANIFEST.map(({ reasonCode }) => reasonCode)).size).toBe(10);
    expect(new Set(SHAPE_DECISION_MANIFEST.map(({ precedence }) => precedence)).size).toBe(10);
  });

  it("encodes singular, collection, sequence, then dimension/group branch order", () => {
    const selected = [
      selectShapeDecisionRule({
        cardinality: "single", role: "operation", structure: undefined, sequenceKind: undefined,
      }),
      selectShapeDecisionRule({
        cardinality: "many", role: "value", structure: undefined, sequenceKind: undefined,
      }),
      selectShapeDecisionRule({
        cardinality: "many", role: "value", structure: "sequence", sequenceKind: "trace",
      }),
      selectShapeDecisionRule({
        cardinality: "many", role: "value", structure: "dimension", sequenceKind: undefined,
      }),
    ];

    expect(selected.map((rule) => rule?.shape)).toEqual([
      "singular-operation", "collection", "trace-sequence", "dimension",
    ]);
    expect(selected.map((rule) => rule!.precedence)).toEqual([398, 300, 228, 120]);
  });
});

describe("normative pattern decision manifest", () => {
  it("covers the full valid Cartesian decision space with one reachable highest rule", () => {
    const inputs = enumeratePatternDecisionInputs();
    const audit = auditPatternDecisionManifest();

    expect(inputs).toHaveLength(1_856);
    expect(new Set(inputs.map(({ shape }) => shape)).size).toBe(10);
    expect(new Set(inputs.map(({ role }) => role)).size).toBe(4);
    expect(new Set(inputs.map(({ actionable }) => actionable)).size).toBe(2);
    expect(new Set(inputs.map(({ density }) => density)).size).toBe(4);
    expect(new Set(inputs.map(({ depth }) => depth)).size).toBe(4);
    expect(audit).toEqual({
      valid: true,
      inputCount: 1_856,
      winningRuleCount: PATTERN_DECISION_MANIFEST.length,
      errors: [],
    });
    expect(() => assertPatternDecisionManifest()).not.toThrow();
  });

  it("keeps every discriminator and stable reason explicit on every row", () => {
    const reasons = PATTERN_DECISION_MANIFEST.map(({ reasonCode }) => reasonCode);
    const precedences = PATTERN_DECISION_MANIFEST.map(({ precedence }) => precedence);
    expect(new Set(reasons).size).toBe(reasons.length);
    expect(new Set(precedences).size).toBe(precedences.length);

    for (const rule of PATTERN_DECISION_MANIFEST) {
      expect(Object.keys(rule.match).sort()).toEqual([
        "actionable", "densities", "depths", "paths", "roles", "shapes", "valueKinds",
      ]);
    }
  });

  it("makes reviewed mappings and absent-density fallbacks manifest data", () => {
    const cases: Array<[Partial<PatternDecisionInput>, string, string]> = [
      [{ shape: "singular-verdict", role: "verdict", actionable: true }, "review-panel", "PATTERN_ACTIONABLE_VERDICT"],
      [{ shape: "singular-operation", role: "operation", actionable: true }, "action-panel", "PATTERN_ACTIONABLE_OPERATION"],
      [{ shape: "singular-convergence", role: "convergence" }, "convergence-panel", "PATTERN_CONVERGENCE_PANEL"],
      [{ shape: "collection", density: 2 }, "list", "PATTERN_COLLECTION_LIST"],
      [{ shape: "collection", density: "absent" }, "grid", "PATTERN_COLLECTION_ABSENT_GRID"],
      [{ shape: "dimension", density: 2 }, "table", "PATTERN_DIMENSION_TABLE"],
      [{ shape: "dimension", density: "absent" }, "comparison-matrix", "PATTERN_DIMENSION_ABSENT_MATRIX"],
      [{ shape: "group", role: "operation" }, "board", "PATTERN_OPERATION_BOARD"],
      [{ shape: "temporal-sequence" }, "timeline", "PATTERN_TEMPORAL_TIMELINE"],
      [{ shape: "dependency-sequence", density: "absent" }, "dependency-tree", "PATTERN_DEPENDENCY_ABSENT_TREE"],
      [{ shape: "trace-sequence", role: "operation", actionable: true }, "replay-panel", "PATTERN_ACTIONABLE_REPLAY"],
      [{ shape: "trace-sequence" }, "audit-trail", "PATTERN_TRACE_AUDIT"],
    ];

    for (const [overrides, expectedPattern, expectedReason] of cases) {
      const rule = selectPatternDecisionRule(pattern(overrides));
      expect(rule?.pattern, JSON.stringify(overrides)).toBe(expectedPattern);
      expect(rule?.reasonCode, JSON.stringify(overrides)).toBe(expectedReason);
    }
  });

  it("makes focus/audit fuller than glance/inspect before compact density rules", () => {
    expect(selectPatternDecisionRule(pattern({
      shape: "singular-verdict", role: "verdict", density: 1, depth: "glance",
    }))?.pattern).toBe("badge");
    expect(selectPatternDecisionRule(pattern({
      shape: "singular-verdict", role: "verdict", density: 1, depth: "audit",
    }))?.pattern).toBe("detail");
  });

  it("reports uncovered inputs, highest ties, and unreachable or duplicate rows", () => {
    const withoutGroupFallback = PATTERN_DECISION_MANIFEST.filter(
      ({ reasonCode }) => reasonCode !== "PATTERN_GROUPED_LIST",
    );
    expect(auditPatternDecisionManifest(withoutGroupFallback).errors.map(({ code }) => code))
      .toContain("UNCOVERED_INPUT");

    const first = PATTERN_DECISION_MANIFEST[0];
    const duplicate = { ...first, match: { ...first.match } } satisfies PatternDecisionRule;
    const withDuplicate: PatternDecisionRule[] = [...PATTERN_DECISION_MANIFEST, duplicate];
    const codes = auditPatternDecisionManifest(withDuplicate).errors.map(({ code }) => code);
    expect(codes).toContain("DUPLICATE_REASON");
    expect(codes).toContain("DUPLICATE_RULE");
    expect(codes).toContain("HIGHEST_PRECEDENCE_TIE");
    expect(codes).toContain("UNREACHABLE_RULE");
  });
});
