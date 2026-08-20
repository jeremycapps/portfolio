import { readFileSync, readdirSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import {
  resolveAnswerSet,
  resolveShape,
  selectComponentRecipeRow,
  validateAnswerSet,
  type JsonObject,
  type ResolveContext,
} from "../src/index.js";

const packageRoot = new URL("../", import.meta.url);
const acceptedRoot = new URL("test/fixtures/schema/accepted/", packageRoot);
const schema = JSON.parse(
  readFileSync(new URL("schemas/facia-answer-set.v2.schema.json", packageRoot), "utf8"),
) as JsonObject;
const directValidate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

interface GoldenRow {
  fixture: string;
  shape: string;
  pattern: string;
  reason: string;
}

function fixture(name: string): JsonObject {
  return JSON.parse(readFileSync(new URL(`${name}.json`, acceptedRoot), "utf8")) as JsonObject;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function operation(index: number): JsonObject {
  return {
    id: `operation-${index}`,
    label: `Operation ${index}`,
    invocation: index % 2 === 0 ? "host-callback" : "model-operation",
    reference: `fixture.operation.${index}`,
  };
}

describe("static v2 conformance spine", () => {
  it("keeps every accepted static fixture in schema/runtime parity and plain JSON", () => {
    const names = readdirSync(acceptedRoot)
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.slice(0, -5))
      .sort();
    expect(names).toEqual(expect.arrayContaining([
      "value", "legacy-verdict", "bounded-verdict", "actionable-verdict", "operation",
      "convergence", "convergence-history", "collection", "dimension", "group",
      "temporal-sequence", "dependency-sequence", "trace-sequence", "structured-value",
    ]));

    for (const name of names) {
      const answer = fixture(name);
      expect(directValidate(answer), name).toBe(true);
      expect(validateAnswerSet(answer).valid, name).toBe(true);
      expect(JSON.parse(JSON.stringify(answer)), name).toEqual(answer);
    }
  });

  it("matches static golden shape, pattern reason, and exact component order", () => {
    const rows = JSON.parse(
      readFileSync(new URL("test/fixtures/conformance/golden-matrix.json", packageRoot), "utf8"),
    ) as GoldenRow[];
    for (const row of rows) {
      const answer = fixture(row.fixture);
      expect(resolveShape(answer), row.fixture).toMatchObject({ ok: true, shape: row.shape });
      const result = resolveAnswerSet(answer, { depth: "glance" });
      expect(result.ok, row.fixture).toBe(true);
      if (!result.ok) throw new Error(`${row.fixture}: ${result.explanation}`);
      expect(result.recipe.pattern, row.fixture).toBe(row.pattern);
      expect(result.recipe.patternReasonCode, row.fixture).toBe(row.reason);
      expect(result.recipe.components, row.fixture)
        .toEqual(selectComponentRecipeRow(result.recipe.pattern)?.components);
    }
  });

  it("crosses every depth, density source, inspection state, and operation count", () => {
    const densityCases: Array<[string, (answer: JsonObject) => void]> = [
      ["declared-1", (answer) => { answer.density = 1; }],
      ["declared-2", (answer) => { answer.density = 2; }],
      ["declared-3", (answer) => { answer.density = 3; }],
      ["derived", (answer) => { delete answer.density; }],
      ["absent", (answer) => {
        delete answer.density;
        delete (answer.items as JsonObject[])[0].fields;
      }],
    ];
    const depths: ResolveContext["depth"][] = ["glance", "inspect", "focus", "audit"];
    let combinations = 0;

    for (const [densityName, applyDensity] of densityCases) {
      for (const inspection of ["none", "available"] as const) {
        for (const operationCount of [0, 1, 2]) {
          for (const depth of depths) {
            const answer = fixture("value");
            applyDensity(answer);
            answer.inspection = inspection;
            answer.operations = Array.from({ length: operationCount }, (_, index) => operation(index));
            answer.actionable = operationCount > 0;
            const snapshot = clone(answer);
            const result = resolveAnswerSet(answer, { depth });
            const label = `${densityName}/${inspection}/${operationCount}/${depth}`;

            expect(result.ok, label).toBe(true);
            if (!result.ok) throw new Error(`${label}: ${result.explanation}`);
            expect(result.recipe.actionControls, label).toHaveLength(operationCount);
            if (inspection === "none") {
              expect(result.recipe.inspectionControls, label).toEqual([]);
            } else {
              expect(result.recipe.inspectionControls.length, label).toBeGreaterThan(0);
            }
            expect(JSON.parse(JSON.stringify(result.recipe)), label).toEqual(result.recipe);
            expect(answer, label).toEqual(snapshot);
            combinations += 1;
          }
        }
      }
    }
    expect(combinations).toBe(120);
  });

  it("contains no retired v1 role or surface-contract members", () => {
    const retiredKeys = new Set(["transform", "surface", "anchor", "lens", "chain"]);
    const visit = (value: unknown): string[] => {
      if (value === null || typeof value !== "object") return [];
      if (Array.isArray(value)) return value.flatMap(visit);
      const record = value as Record<string, unknown>;
      return Object.entries(record).flatMap(([key, child]) => [
        ...(retiredKeys.has(key) ? [key] : []),
        ...visit(child),
      ]);
    };

    for (const name of readdirSync(acceptedRoot).filter((entry) => entry.endsWith(".json"))) {
      expect(visit(fixture(name.slice(0, -5))), name).toEqual([]);
    }
  });
});
