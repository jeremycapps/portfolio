import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { validateAnswerSet } from "../src/index.js";

type JsonObject = Record<string, unknown>;

const packageRoot = new URL("../", import.meta.url);
const schema = JSON.parse(
  readFileSync(
    new URL("schemas/facia-answer-set.v2.schema.json", packageRoot),
    "utf8",
  ),
) as JsonObject;
const directValidate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

function fixture(name: string): JsonObject {
  return JSON.parse(
    readFileSync(
      new URL(`test/fixtures/schema/accepted/${name}.json`, packageRoot),
      "utf8",
    ),
  ) as JsonObject;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function failure(value: unknown) {
  const result = validateAnswerSet(value);
  expect(result.valid).toBe(false);
  if (result.valid) throw new Error("expected validation failure");
  return result;
}

describe("validateAnswerSet adversarial boundary matrix", () => {
  it("returns a failure instead of throwing for diverse non-JSON and hostile inputs", () => {
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();

    for (const candidate of [
      null,
      undefined,
      true,
      0,
      "answer",
      1n,
      Symbol("answer"),
      () => undefined,
      [],
      new Date(0),
      /answer/,
      new Map(),
      new Set(),
      new Uint8Array(),
      revoked.proxy,
    ]) {
      expect(() => validateAnswerSet(candidate)).not.toThrow();
      expect(validateAnswerSet(candidate).valid).toBe(false);
    }
  });

  it("reports deterministic codes and exact locations at every structural level", () => {
    const cases: Array<{
      name: string;
      candidate: JsonObject;
      code: string;
      path: string;
    }> = [];

    const envelope = fixture("value");
    envelope.inspection = "sometimes";
    cases.push({
      name: "envelope enum",
      candidate: envelope,
      code: "INVALID_ENUM_VALUE",
      path: "$.inspection",
    });

    const item = fixture("value");
    (item.items as JsonObject[])[0].type = "Verdict";
    cases.push({
      name: "role item",
      candidate: item,
      code: "ANSWER_KIND_MISMATCH",
      path: "$.items[0]",
    });

    const operation = fixture("operation");
    (operation.operations as JsonObject[])[0].invocation = "shell";
    cases.push({
      name: "operation descriptor",
      candidate: operation,
      code: "INVALID_ENUM_VALUE",
      path: "$.operations[0].invocation",
    });

    const operationRecord = fixture("operation");
    ((operationRecord.items as JsonObject[])[0].operation as JsonObject).name = "";
    cases.push({
      name: "operation item record",
      candidate: operationRecord,
      code: "INVALID_OPERATION_DESCRIPTOR",
      path: "$.items[0].operation.name",
    });

    const trace = fixture("convergence");
    ((trace.trace as JsonObject).entries as JsonObject[])[0].step = "";
    cases.push({
      name: "trace entry",
      candidate: trace,
      code: "INVALID_TRACE",
      path: "$.trace.entries[0].step",
    });

    const fields = fixture("value");
    const priority = ((fields.items as JsonObject[])[0].fields as JsonObject)
      .priority as JsonObject;
    priority.primary = ["owner.name"];
    cases.push({
      name: "field priority",
      candidate: fields,
      code: "INVALID_FIELD_INFO",
      path: "$.items[0].fields.priority.primary[0]",
    });

    const promotion = fixture("value");
    const when = ((((promotion.items as JsonObject[])[0].fields as JsonObject)
      .promotion as JsonObject[])[0].when) as JsonObject;
    when.isFalse = false;
    delete when.equals;
    cases.push({
      name: "promotion condition",
      candidate: promotion,
      code: "INVALID_PROMOTION_CONDITION",
      path: "$.items[0].fields.promotion[0].when",
    });

    for (const testCase of cases) {
      const first = failure(testCase.candidate);
      const second = failure(testCase.candidate);
      expect(first, testCase.name).toEqual(second);
      expect(first.errors[0], testCase.name).toMatchObject({
        code: testCase.code,
        path: testCase.path,
      });
    }
  });

  it("preserves direct-schema parity for constructed schema-expressible failures", () => {
    const candidates: JsonObject[] = [];

    const wrongVersion = fixture("value");
    wrongVersion.schema = "facia.answer-set/1";
    candidates.push(wrongVersion);

    const unknownMember = fixture("value");
    (unknownMember.items as JsonObject[])[0].extra = true;
    candidates.push(unknownMember);

    const emptyItems = fixture("value");
    emptyItems.items = [];
    candidates.push(emptyItems);

    const malformedFields = fixture("value");
    delete (((malformedFields.items as JsonObject[])[0].fields as JsonObject)
      .priority as JsonObject).supporting;
    candidates.push(malformedFields);

    const malformedHistory = fixture("trace-sequence");
    (((malformedHistory.trace as JsonObject).records as JsonObject[])[0]).itemIndex = -1;
    candidates.push(malformedHistory);

    for (const candidate of candidates) {
      const snapshot = clone(candidate);
      expect(directValidate(candidate)).toBe(false);
      expect(validateAnswerSet(candidate).valid).toBe(false);
      expect(candidate).toEqual(snapshot);
    }
  });

  it("preflights unsupported nested values at item, operation, trace, fields, and promotion paths", () => {
    const cases: Array<[JsonObject, string, string]> = [];

    const item = fixture("value");
    (item.items as JsonObject[])[0].value = undefined;
    cases.push([item, "JSON_VALUE_UNSUPPORTED", "$.items[0].value"]);

    const operation = fixture("operation");
    ((operation.operations as JsonObject[])[0].inputSchema as JsonObject).limit = 1n;
    cases.push([
      operation,
      "JSON_VALUE_UNSUPPORTED",
      "$.operations[0].inputSchema.limit",
    ]);

    const trace = fixture("convergence");
    ((trace.trace as JsonObject).entries as JsonObject[])[0].value = Infinity;
    cases.push([trace, "JSON_NUMBER_NON_FINITE", "$.trace.entries[0].value"]);

    const fields = fixture("value");
    const primary = (((fields.items as JsonObject[])[0].fields as JsonObject)
      .priority as JsonObject).primary as unknown[];
    primary.push(Symbol("field"));
    cases.push([
      fields,
      "JSON_VALUE_UNSUPPORTED",
      "$.items[0].fields.priority.primary[1]",
    ]);

    const promotion = fixture("value");
    const when = ((((promotion.items as JsonObject[])[0].fields as JsonObject)
      .promotion as JsonObject[])[0].when) as JsonObject;
    when.equals = Number.NaN;
    cases.push([
      promotion,
      "JSON_NUMBER_NON_FINITE",
      "$.items[0].fields.promotion[0].when.equals",
    ]);

    for (const [candidate, code, path] of cases) {
      const result = failure(candidate);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatchObject({ code, path });
    }
  });

  it("is deterministic and non-mutating for multi-error failures", () => {
    const candidate = fixture("value");
    candidate.schema = "facia.answer-set/1";
    candidate.question = "";
    candidate.path = "other";
    (candidate.items as JsonObject[])[0].extra = true;
    const snapshot = clone(candidate);

    const first = failure(candidate);
    const second = failure(candidate);

    expect(first).toEqual(second);
    expect(candidate).toEqual(snapshot);
    expect(first.errors.map(({ code, path }) => ({ code, path }))).toEqual([
      { code: "ANSWER_SET_SCHEMA_UNSUPPORTED", path: "$.schema" },
      { code: "UNKNOWN_MEMBER", path: "$.items[0].extra" },
      { code: "INVALID_ENUM_VALUE", path: "$.path" },
      { code: "INVALID_STRING_VALUE", path: "$.question" },
    ]);
  });
});

/**
 * Depth-bound regression coverage.
 *
 * Preflight recurses per nesting level, so unbounded input once escaped the
 * total boundary as a RangeError. These cases pin both halves of the fix: the
 * hostile side (deep input fails as data, never as a throw) and the floor
 * (legitimate nesting well under the cap is still accepted normally).
 */
describe("validateAnswerSet nesting depth bound", () => {
  const HOSTILE_DEPTH = 20_000;
  const LEGAL_DEPTH = 500;

  function nestObjects(depth: number, leaf: unknown = "leaf"): unknown {
    let current = leaf;
    for (let level = 0; level < depth; level += 1) current = { nested: current };
    return current;
  }

  function nestArrays(depth: number, leaf: unknown = "leaf"): unknown {
    let current = leaf;
    for (let level = 0; level < depth; level += 1) current = [current];
    return current;
  }

  function deepPayloadEnvelope(depth: number): JsonObject {
    const envelope = fixture("value");
    const payload = (envelope.items as JsonObject[])[0].payload as JsonObject;
    payload.deep = nestObjects(depth);
    return envelope;
  }

  it("does not throw and reports JSON_DEPTH_EXCEEDED for hostile bare nesting", () => {
    const candidates: Array<[string, unknown]> = [
      ["object", nestObjects(HOSTILE_DEPTH)],
      ["array", nestArrays(HOSTILE_DEPTH)],
    ];

    for (const [name, candidate] of candidates) {
      expect(() => validateAnswerSet(candidate), name).not.toThrow();
      const result = failure(candidate);
      expect(result.errors, name).toHaveLength(1);
      expect(result.errors[0].code, name).toBe("JSON_DEPTH_EXCEEDED");
      expect(result.errors[0].path.startsWith("$"), name).toBe(true);
    }
  });

  it("does not throw and reports JSON_DEPTH_EXCEEDED for hostile nesting inside a valid envelope", () => {
    const candidate = deepPayloadEnvelope(HOSTILE_DEPTH);

    expect(() => validateAnswerSet(candidate)).not.toThrow();
    const result = failure(candidate);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("JSON_DEPTH_EXCEEDED");
    expect(result.errors[0].path.startsWith("$.items[0].payload.deep")).toBe(true);
  });

  it("is deterministic for hostile nesting", () => {
    const candidate = deepPayloadEnvelope(HOSTILE_DEPTH);
    expect(failure(candidate)).toEqual(failure(candidate));
  });

  it("does not throw for a hostile array nested inside an item payload", () => {
    const envelope = fixture("value");
    const payload = (envelope.items as JsonObject[])[0].payload as JsonObject;
    payload.details = nestArrays(HOSTILE_DEPTH);

    expect(() => validateAnswerSet(envelope)).not.toThrow();
    const result = failure(envelope);
    expect(result.errors[0].code).toBe("JSON_DEPTH_EXCEEDED");
  });

  it("still accepts legitimate deep nesting well under the bound", () => {
    const candidate = deepPayloadEnvelope(LEGAL_DEPTH);
    const result = validateAnswerSet(candidate);

    expect(result.valid).toBe(true);
    if (!result.valid) {
      throw new Error(`expected acceptance, got ${result.errors[0].code}`);
    }
  });

  it("reports normal structural codes, not the depth code, for deep non-AnswerSet input under the bound", () => {
    const result = failure(nestObjects(LEGAL_DEPTH));
    const codes = result.errors.map((item) => item.code);

    expect(codes).not.toContain("JSON_DEPTH_EXCEEDED");
    expect(codes).toContain("ANSWER_SET_SCHEMA_UNSUPPORTED");
    expect(codes.some((code) =>
      code === "REQUIRED_MEMBER_MISSING" || code === "UNKNOWN_MEMBER"
    )).toBe(true);
  });

  it("reports JSON_CYCLE rather than JSON_DEPTH_EXCEEDED for cyclic input", () => {
    const selfCycle: JsonObject = {};
    selfCycle.self = selfCycle;
    expect(() => validateAnswerSet(selfCycle)).not.toThrow();
    expect(failure(selfCycle).errors[0]).toMatchObject({
      code: "JSON_CYCLE",
      path: "$.self",
    });

    const envelope = fixture("value");
    const payload = (envelope.items as JsonObject[])[0].payload as JsonObject;
    const branch: JsonObject = {};
    branch.loop = branch;
    payload.deep = branch;
    expect(() => validateAnswerSet(envelope)).not.toThrow();
    expect(failure(envelope).errors[0]).toMatchObject({
      code: "JSON_CYCLE",
      path: "$.items[0].payload.deep.loop",
    });
  });
});
