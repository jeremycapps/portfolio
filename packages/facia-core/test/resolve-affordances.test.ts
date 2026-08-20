import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  resolveAffordances,
  resolveShape,
  type JsonObject,
  type ResolveContext,
  type ShapeResult,
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

function resolve(answer: JsonObject, depth: ResolveContext["depth"]) {
  return resolveAffordances(answer, resolveShape(answer), { depth });
}

function dimensionWithTraceAndEvidence(): JsonObject {
  const answer = fixture("trace-sequence");
  answer.structure = "dimension";
  delete answer.sequenceKind;
  for (const item of answer.items as JsonObject[]) item.evidence = { source: "fixture" };
  return answer;
}

describe("resolveAffordances", () => {
  it("always emits zero inspection controls when inspection is none", () => {
    const answer = fixture("trace-sequence");
    answer.inspection = "none";
    expect(resolve(answer, "audit")).toMatchObject({
      ok: true,
      inspection: { controls: [], reasonCode: "INSPECTION_NONE" },
    });
  });

  it("resolves cumulative shape, evidence, and trace controls exactly by depth", () => {
    const answer = dimensionWithTraceAndEvidence();
    const expected = {
      glance: ["inspect"],
      inspect: ["inspect", "expand"],
      focus: ["inspect", "expand", "filter", "sort", "compare", "drill-down"],
      audit: [
        "inspect", "expand", "filter", "sort", "compare", "drill-down",
        "view-evidence", "view-trace",
      ],
    } as const;

    for (const depth of ["glance", "inspect", "focus", "audit"] as const) {
      const result = resolve(answer, depth);
      expect(result.ok, depth).toBe(true);
      if (result.ok) expect(result.inspection.controls, depth).toEqual(expected[depth]);
    }
  });

  it("separates singular evidence/trace controls from collection topology controls", () => {
    expect(resolve(fixture("value"), "audit")).toMatchObject({
      ok: true,
      inspection: { controls: ["inspect", "expand", "view-evidence"] },
    });
    expect(resolve(fixture("convergence"), "audit")).toMatchObject({
      ok: true,
      inspection: { controls: ["inspect", "expand", "view-trace"] },
    });
    expect(resolve(fixture("trace-sequence"), "focus")).toMatchObject({
      ok: true,
      inspection: { controls: ["inspect", "expand", "filter", "sort"] },
    });
  });

  it("maps operations one-to-one in stable order with descriptor data preserved", () => {
    const answer = fixture("operation");
    (answer.operations as JsonObject[]).push({
      id: "cancel",
      label: "Cancel publish",
      invocation: "host-callback",
      reference: "publish.cancel",
      confirmation: "Cancel?",
    });
    const snapshot = clone(answer);
    const result = resolve(answer, "inspect");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected affordance success");
    expect(result.actions).toEqual((answer.operations as JsonObject[]).map((operation) => ({
      operation,
      reasonCode: "ACTION_OPERATION_DESCRIPTOR",
    })));
    expect(result.actions.map(({ operation }) => operation.id)).toEqual(["retry", "cancel"]);
    expect(answer).toEqual(snapshot);
    expect(result).toEqual(resolve(answer, "inspect"));
  });

  it("emits no actions for non-actionable answers and rejects invalid prerequisites", () => {
    expect(resolve(fixture("value"), "audit")).toMatchObject({ ok: true, actions: [] });

    const answer = fixture("value");
    const wrongShape = {
      ok: true,
      shape: "group",
      reasonCode: "SHAPE_GROUP",
      explanation: "wrong",
    } satisfies ShapeResult;
    expect(resolveAffordances(answer, wrongShape, { depth: "glance" })).toMatchObject({
      ok: false, code: "SHAPE_REQUIRED",
    });
    expect(resolveAffordances(answer, resolveShape(answer), {
      depth: "glance",
      style: "compact",
    } as ResolveContext)).toMatchObject({ ok: false, code: "SEMANTIC_SPEC_REQUIRED" });
    expect(resolveAffordances(null, resolveShape(null), { depth: "glance" })).toMatchObject({
      ok: false, code: "VALIDATION_REQUIRED",
    });
  });
});
