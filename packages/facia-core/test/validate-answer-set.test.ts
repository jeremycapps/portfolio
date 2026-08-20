import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { validateAnswerSet } from "../src/index.js";

type JsonObject = Record<string, unknown>;

const packageRoot = new URL("../", import.meta.url);
const schema = JSON.parse(
  readFileSync(new URL("schemas/facia-answer-set.v2.schema.json", packageRoot), "utf8"),
) as JsonObject;
const directValidate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

function fixture(outcome: "accepted" | "rejected" | "semantic-only", name: string): JsonObject {
  return JSON.parse(
    readFileSync(
      new URL(`test/fixtures/schema/${outcome}/${name}.json`, packageRoot),
      "utf8",
    ),
  ) as JsonObject;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function firstError(value: unknown): { code: string; path: string } {
  const result = validateAnswerSet(value);
  expect(result.valid).toBe(false);
  if (result.valid) throw new Error("expected validation failure");
  return result.errors[0];
}

describe("validateAnswerSet", () => {
  it("accepts every canonical structural fixture with typed v2 data", () => {
    for (const name of [
      "value",
      "legacy-verdict",
      "bounded-verdict",
      "operation",
      "convergence",
      "trace-sequence",
    ]) {
      const input = fixture("accepted", name);
      const result = validateAnswerSet(input);
      expect(result.valid, name).toBe(true);
      if (result.valid) {
        expect(result.value.schema).toBe("facia.answer-set/2");
        expect(JSON.parse(JSON.stringify(result.value))).toEqual(input);
      }
    }
  });

  it("has exact accept/reject parity for schema-owned fixtures", () => {
    const cases = [
      ...["value", "legacy-verdict", "bounded-verdict", "operation", "convergence", "trace-sequence"]
        .map((name) => fixture("accepted", name)),
      ...[
        "empty-items",
        "role-mismatch",
        "incomplete-operation-descriptor",
        "unknown-member",
        "invalid-promotion-condition",
        "singular-structure",
        "sequence-kind-missing",
        "sequence-kind-forbidden",
        "actionability-mismatch",
        "retired-member",
      ].map((name) => fixture("rejected", name)),
    ];

    for (const candidate of cases) {
      expect(validateAnswerSet(candidate).valid).toBe(directValidate(candidate));
    }
  });

  it("is total over primitives, arrays, malformed roots, and unsupported JSON values", () => {
    for (const value of [null, true, 1, "answer", [], undefined, 1n, Symbol("x"), () => 1]) {
      expect(() => validateAnswerSet(value)).not.toThrow();
      expect(validateAnswerSet(value).valid).toBe(false);
    }
    expect(firstError(null)).toEqual({
      code: "INVALID_ANSWER_SET",
      path: "$",
      message: "AnswerSet must be a non-array object.",
    });
    expect(firstError(Number.NaN)).toMatchObject({ code: "JSON_NUMBER_NON_FINITE", path: "$" });
  });

  it("guards accessors, symbols, holes, cycles, non-plain objects, and hostile proxies", () => {
    let getterCalls = 0;
    const accessor = Object.defineProperty({}, "schema", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return "facia.answer-set/2";
      },
    });
    expect(firstError(accessor)).toMatchObject({ code: "JSON_ACCESSOR_FORBIDDEN", path: "$.schema" });
    expect(getterCalls).toBe(0);

    const symbolKey = { schema: "facia.answer-set/2", [Symbol("secret")]: true };
    expect(firstError(symbolKey)).toMatchObject({ code: "JSON_SYMBOL_KEY_FORBIDDEN", path: "$" });

    const hole = new Array(1);
    expect(firstError(hole)).toMatchObject({ code: "JSON_ARRAY_HOLE", path: "$[0]" });

    const cycle: JsonObject = {};
    cycle.self = cycle;
    expect(firstError(cycle)).toMatchObject({ code: "JSON_CYCLE", path: "$.self" });
    expect(firstError(new Date())).toMatchObject({ code: "JSON_NON_PLAIN_OBJECT", path: "$" });

    const hostile = new Proxy({}, { ownKeys() { throw new Error("no inspection"); } });
    expect(() => validateAnswerSet(hostile)).not.toThrow();
    expect(firstError(hostile)).toMatchObject({ code: "JSON_INSPECTION_FAILED", path: "$" });

    const nestedHostile = fixture("accepted", "value");
    ((nestedHostile.items as JsonObject[])[0].payload as JsonObject).hostile = hostile;
    expect(() => validateAnswerSet(nestedHostile)).not.toThrow();
    expect(firstError(nestedHostile)).toMatchObject({
      code: "JSON_INSPECTION_FAILED",
      path: "$.items[0].payload.hostile",
    });
  });

  it("normalizes representative envelope and cross-field failures to stable locations", () => {
    const missingSchema = fixture("accepted", "value");
    delete missingSchema.schema;
    expect(firstError(missingSchema)).toMatchObject({
      code: "ANSWER_SET_SCHEMA_UNSUPPORTED",
      path: "$.schema",
    });

    expect(firstError({ ...fixture("accepted", "value"), fields: null })).toMatchObject({
      code: "FIELDS_SCOPE_INVALID",
      path: "$.fields",
    });
    expect(firstError(fixture("rejected", "unknown-member"))).toMatchObject({
      code: "UNKNOWN_MEMBER",
      path: "$.items[0].extra",
    });
    expect(firstError(fixture("rejected", "role-mismatch"))).toMatchObject({
      code: "ANSWER_KIND_MISMATCH",
      path: "$.items[0]",
    });
    expect(firstError(fixture("rejected", "singular-structure"))).toMatchObject({
      code: "SINGULAR_STRUCTURE_FORBIDDEN",
      path: "$.structure",
    });
    expect(firstError(fixture("rejected", "actionability-mismatch"))).toMatchObject({
      code: "ACTIONABILITY_MISMATCH",
      path: "$.actionable",
    });

    const wrongSchema = { ...fixture("accepted", "value"), schema: "facia.answer-set/1" };
    expect(firstError(wrongSchema)).toMatchObject({
      code: "ANSWER_SET_SCHEMA_UNSUPPORTED",
      path: "$.schema",
    });
    expect(firstError(fixture("rejected", "empty-items"))).toMatchObject({
      code: "ANSWER_SET_EMPTY_ITEMS",
      path: "$.items",
    });

    const invalidPath = { ...fixture("accepted", "value"), path: "other" };
    expect(firstError(invalidPath)).toMatchObject({
      code: "INVALID_ENUM_VALUE",
      path: "$.path",
    });
  });

  it("normalizes malformed operation, trace, fields, and promotion levels", () => {
    expect(firstError(fixture("rejected", "incomplete-operation-descriptor"))).toMatchObject({
      code: "INVALID_OPERATION_DESCRIPTOR",
      path: "$.operations[0].reference",
    });
    expect(firstError(fixture("rejected", "invalid-promotion-condition"))).toMatchObject({
      code: "INVALID_PROMOTION_CONDITION",
      path: "$.items[0].fields.promotion[0].when",
    });

    const malformedFields = clone(fixture("accepted", "value"));
    delete ((((malformedFields.items as JsonObject[])[0].fields as JsonObject)
      .priority as JsonObject).audit);
    expect(firstError(malformedFields)).toMatchObject({
      code: "INVALID_FIELD_INFO",
      path: "$.items[0].fields.priority.audit",
    });

    const malformedTrace = clone(fixture("accepted", "convergence"));
    ((malformedTrace.trace as JsonObject).entries as unknown[]) = [];
    expect(firstError(malformedTrace)).toMatchObject({
      code: "INVALID_TRACE",
      path: "$.trace.entries",
    });

    const malformedOperationRecord = clone(fixture("accepted", "operation"));
    delete (((malformedOperationRecord.items as JsonObject[])[0].operation as JsonObject).name);
    expect(firstError(malformedOperationRecord)).toMatchObject({
      code: "INVALID_OPERATION_DESCRIPTOR",
      path: "$.items[0].operation.name",
    });
  });

  it("is deterministic, duplicates shared references safely, and never mutates input", () => {
    const input = fixture("accepted", "value");
    const snapshot = clone(input);
    const first = validateAnswerSet(input);
    const second = validateAnswerSet(input);
    expect(first).toEqual(second);
    expect(input).toEqual(snapshot);

    const shared = { label: "shared" };
    const sharedInput = clone(input);
    const payload = (sharedInput.items as JsonObject[])[0].payload as JsonObject;
    payload.first = shared;
    payload.second = shared;
    const sharedResult = validateAnswerSet(sharedInput);
    expect(sharedResult.valid).toBe(true);
    if (sharedResult.valid) {
      const validatedPayload = sharedResult.value.items[0].payload;
      expect(validatedPayload.first).toEqual(validatedPayload.second);
      expect(validatedPayload.first).not.toBe(validatedPayload.second);
    }
  });
});
