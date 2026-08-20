import { describe, expect, it } from "vitest";

import {
  COMPONENT_RECIPE_MANIFEST,
  INSPECTION_DECISION_MANIFEST,
  PATTERN_DECISION_MANIFEST,
  assertPresentationManifests,
  auditComponentRecipeManifest,
  auditInspectionDecisionManifest,
  enumerateInspectionDecisionInputs,
  selectComponentRecipeRow,
  selectInspectionDecisionRule,
  type ComponentRecipeManifestRow,
  type InspectionDecisionRule,
} from "../src/index.js";

describe("inspection decision manifest", () => {
  it("covers every inspection/capability/depth combination with reachable decisions", () => {
    expect(enumerateInspectionDecisionInputs()).toHaveLength(96);
    expect(auditInspectionDecisionManifest()).toEqual({ valid: true, errors: [] });
    expect(() => assertPresentationManifests()).not.toThrow();
  });

  it("makes inspection-none and cumulative depth controls explicit", () => {
    for (const input of enumerateInspectionDecisionInputs()) {
      const rule = selectInspectionDecisionRule(input);
      expect(rule, JSON.stringify(input)).toBeDefined();
      if (input.inspection === "none") expect(rule?.controls).toEqual([]);
    }

    const dimensionTraceEvidence = {
      inspection: "available",
      capability: "dimension-trace-evidence",
    } as const;
    expect(selectInspectionDecisionRule({ ...dimensionTraceEvidence, depth: "glance" })?.controls)
      .toEqual(["inspect"]);
    expect(selectInspectionDecisionRule({ ...dimensionTraceEvidence, depth: "inspect" })?.controls)
      .toEqual(["inspect", "expand"]);
    expect(selectInspectionDecisionRule({ ...dimensionTraceEvidence, depth: "focus" })?.controls)
      .toEqual(["inspect", "expand", "filter", "sort", "compare", "drill-down"]);
    expect(selectInspectionDecisionRule({ ...dimensionTraceEvidence, depth: "audit" })?.controls)
      .toEqual([
        "inspect", "expand", "filter", "sort", "compare", "drill-down",
        "view-evidence", "view-trace",
      ]);
  });

  it("detects missing, ambiguous, duplicate, and unreachable inspection rows", () => {
    const withoutFocusSingular = INSPECTION_DECISION_MANIFEST.filter(
      ({ reasonCode }) => reasonCode !== "INSPECTION_FOCUS_SINGULAR",
    );
    expect(auditInspectionDecisionManifest(withoutFocusSingular).errors.map(({ code }) => code))
      .toContain("MISSING_MAPPING");

    const duplicate = {
      ...INSPECTION_DECISION_MANIFEST[0],
      match: { ...INSPECTION_DECISION_MANIFEST[0].match },
    } satisfies InspectionDecisionRule;
    const errors = auditInspectionDecisionManifest([
      ...INSPECTION_DECISION_MANIFEST,
      duplicate,
    ]).errors.map(({ code }) => code);
    expect(errors).toContain("DUPLICATE_MAPPING");
    expect(errors).toContain("AMBIGUOUS_MAPPING");
    expect(errors).toContain("UNREACHABLE_MAPPING");
  });
});

describe("component recipe manifest", () => {
  it("maps every emitted pattern to exactly one ordered semantic sequence", () => {
    expect(COMPONENT_RECIPE_MANIFEST).toHaveLength(21);
    expect(auditComponentRecipeManifest()).toEqual({ valid: true, errors: [] });
    for (const { pattern } of PATTERN_DECISION_MANIFEST) {
      const row = selectComponentRecipeRow(pattern);
      expect(row, pattern).toBeDefined();
      for (const component of row!.components) {
        expect(Object.keys(component)).toEqual(["id"]);
        expect(component.id).toMatch(/^[A-Z][A-Za-z]+$/);
      }
    }
  });

  it("detects missing, ambiguous, duplicate, and unreachable component mappings", () => {
    const withoutStat = COMPONENT_RECIPE_MANIFEST.filter(({ pattern }) => pattern !== "stat");
    expect(auditComponentRecipeManifest(withoutStat).errors.map(({ code }) => code))
      .toContain("MISSING_MAPPING");

    const stat = COMPONENT_RECIPE_MANIFEST.find(({ pattern }) => pattern === "stat")!;
    const duplicate: ComponentRecipeManifestRow = {
      pattern: stat.pattern,
      components: [...stat.components],
    };
    const duplicateErrors = auditComponentRecipeManifest([
      ...COMPONENT_RECIPE_MANIFEST,
      duplicate,
    ]).errors.map(({ code }) => code);
    expect(duplicateErrors).toContain("AMBIGUOUS_MAPPING");
    expect(duplicateErrors).toContain("DUPLICATE_MAPPING");

    const withoutStatPattern = PATTERN_DECISION_MANIFEST.filter(({ pattern }) => pattern !== "stat");
    expect(auditComponentRecipeManifest(COMPONENT_RECIPE_MANIFEST, withoutStatPattern)
      .errors.map(({ code }) => code)).toContain("UNREACHABLE_MAPPING");
  });
});
