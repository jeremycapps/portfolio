import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { resolveShape, type JsonObject } from "../src/index.js";

const packageRoot = new URL("../", import.meta.url);

function fixture(name: string): JsonObject {
  return JSON.parse(
    readFileSync(new URL(`test/fixtures/schema/accepted/${name}.json`, packageRoot), "utf8"),
  ) as JsonObject;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function valueMany(structure?: "dimension" | "group" | "sequence", sequenceKind?: string): JsonObject {
  const answer = fixture("value");
  answer.items = [clone((answer.items as JsonObject[])[0]), clone((answer.items as JsonObject[])[0])];
  if (structure !== undefined) answer.structure = structure;
  if (sequenceKind !== undefined) answer.sequenceKind = sequenceKind;
  return answer;
}

describe("resolveShape", () => {
  it("resolves all ten shapes with exact stable reasons", () => {
    const cases: Array<[string, string, JsonObject]> = [
      ["singular-value", "SHAPE_SINGULAR_VALUE", fixture("value")],
      ["singular-verdict", "SHAPE_SINGULAR_VERDICT", fixture("bounded-verdict")],
      ["singular-operation", "SHAPE_SINGULAR_OPERATION", fixture("operation")],
      ["singular-convergence", "SHAPE_SINGULAR_CONVERGENCE", fixture("convergence")],
      ["collection", "SHAPE_COLLECTION", valueMany()],
      ["dimension", "SHAPE_DIMENSION", valueMany("dimension")],
      ["group", "SHAPE_GROUP", valueMany("group")],
      ["temporal-sequence", "SHAPE_TEMPORAL_SEQUENCE", valueMany("sequence", "temporal")],
      ["dependency-sequence", "SHAPE_DEPENDENCY_SEQUENCE", valueMany("sequence", "dependency")],
      ["trace-sequence", "SHAPE_TRACE_SEQUENCE", valueMany("sequence", "trace")],
    ];

    for (const [shape, reasonCode, answer] of cases) {
      expect(resolveShape(answer), shape).toMatchObject({ ok: true, shape, reasonCode });
    }
  });

  it("lets singular role outrank optional density, actionability, and path discriminators", () => {
    const answer = fixture("value");
    answer.density = 3;
    answer.path = "execution";
    answer.actionable = true;
    answer.operations = [{
      id: "edit",
      label: "Edit",
      invocation: "host-callback",
      reference: "value.edit",
    }];

    expect(resolveShape(answer)).toMatchObject({
      ok: true,
      shape: "singular-value",
      reasonCode: "SHAPE_SINGULAR_VALUE",
    });
  });

  it("requires validation, remains deterministic, and does not mutate input", () => {
    const invalid = valueMany("sequence");
    const failure = resolveShape(invalid);
    expect(failure).toMatchObject({ ok: false, code: "VALIDATION_REQUIRED" });

    const answer = valueMany("group");
    const snapshot = clone(answer);
    expect(resolveShape(answer)).toEqual(resolveShape(answer));
    expect(answer).toEqual(snapshot);
  });
});
