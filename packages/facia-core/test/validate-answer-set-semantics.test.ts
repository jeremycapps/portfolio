import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

import { validateAnswerSet } from "../src/index.js";

type JsonObject = Record<string, unknown>;

const packageRoot = new URL("../", import.meta.url);
const schema = JSON.parse(
  readFileSync(new URL("schemas/facia-answer-set.v2.schema.json", packageRoot), "utf8"),
) as JsonObject;
const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

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

function errors(value: unknown): Array<{ code: string; path: string; context?: unknown }> {
  const result = validateAnswerSet(value);
  expect(result.valid).toBe(false);
  if (result.valid) throw new Error("expected validation failure");
  return result.errors;
}

function codesAndPaths(value: unknown): Array<{ code: string; path: string }> {
  return errors(value).map(({ code, path }) => ({ code, path }));
}

describe("validateAnswerSet runtime semantics", () => {
  it("distinguishes incomplete operation descriptors from both actionability mismatches", () => {
    const incompleteDescriptor = fixture("rejected", "incomplete-operation-descriptor");
    const missingOperation = fixture("accepted", "value");
    missingOperation.actionable = true;

    const unexpectedOperation = fixture("accepted", "value");
    unexpectedOperation.operations = [{
      id: "run",
      label: "Run",
      invocation: "host-callback",
      reference: "host.run",
    }];

    for (const candidate of [incompleteDescriptor, missingOperation, unexpectedOperation]) {
      expect(validateSchema(candidate)).toBe(false);
    }

    expect(codesAndPaths(incompleteDescriptor))
      .toEqual([
        { code: "INVALID_OPERATION_DESCRIPTOR", path: "$.operations[0].reference" },
      ]);
    expect(codesAndPaths(missingOperation)).toEqual([
      { code: "ACTIONABILITY_MISMATCH", path: "$.actionable" },
    ]);
    expect(codesAndPaths(unexpectedOperation)).toEqual([
      { code: "ACTIONABILITY_MISMATCH", path: "$.actionable" },
    ]);
  });

  it("normalizes role, singular, and sequence coupling failures to their stable locations", () => {
    const invalidSequenceKind = fixture("accepted", "trace-sequence");
    invalidSequenceKind.sequenceKind = "ordered";

    const singularSequenceKind = fixture("accepted", "value");
    singularSequenceKind.sequenceKind = "temporal";

    const cases: Array<[string, JsonObject, { code: string; path: string }]> = [
      [
        "role mismatch",
        fixture("rejected", "role-mismatch"),
        { code: "ANSWER_KIND_MISMATCH", path: "$.items[0]" },
      ],
      [
        "singular structure",
        fixture("rejected", "singular-structure"),
        { code: "SINGULAR_STRUCTURE_FORBIDDEN", path: "$.structure" },
      ],
      [
        "singular sequence kind",
        singularSequenceKind,
        { code: "SINGULAR_STRUCTURE_FORBIDDEN", path: "$.sequenceKind" },
      ],
      [
        "missing sequence kind",
        fixture("rejected", "sequence-kind-missing"),
        { code: "SEQUENCE_KIND_REQUIRED", path: "$.sequenceKind" },
      ],
      [
        "forbidden sequence kind",
        fixture("rejected", "sequence-kind-forbidden"),
        { code: "SEQUENCE_KIND_FORBIDDEN", path: "$.sequenceKind" },
      ],
      [
        "invalid sequence kind",
        invalidSequenceKind,
        { code: "INVALID_ENUM_VALUE", path: "$.sequenceKind" },
      ],
    ];

    for (const [label, candidate, expected] of cases) {
      expect(validateSchema(candidate), `${label} must remain schema-owned`).toBe(false);
      expect(codesAndPaths(candidate), label).toEqual([expected]);
    }
  });

  it("rejects every later duplicate operation id in input order", () => {
    const candidate = fixture("semantic-only", "duplicate-operation-id");
    (candidate.operations as JsonObject[]).push({
      id: "same",
      label: "Third",
      invocation: "host-callback",
      reference: "third",
    });

    expect(validateSchema(candidate)).toBe(true);
    expect(errors(candidate)).toEqual([
      {
        code: "DUPLICATE_OPERATION_ID",
        path: "$.operations[1].id",
        message: "Operation descriptor ids must be unique.",
        context: { id: "same" },
      },
      {
        code: "DUPLICATE_OPERATION_ID",
        path: "$.operations[2].id",
        message: "Operation descriptor ids must be unique.",
        context: { id: "same" },
      },
    ]);
  });

  it("accepts both ratified convergence provenance forms", () => {
    for (const name of ["convergence", "convergence-history"]) {
      const candidate = fixture("accepted", name);
      expect(validateSchema(candidate), name).toBe(true);
      expect(validateAnswerSet(candidate), name).toMatchObject({ valid: true });
    }
  });

  it("requires convergence provenance at the stable trace location", () => {
    const candidate = fixture("semantic-only", "convergence-provenance");
    expect(validateSchema(candidate)).toBe(true);
    expect(errors(candidate)).toEqual([
      {
        code: "CONVERGENCE_PROVENANCE_REQUIRED",
        path: "$.trace",
        message:
          "Convergence requires a singular direct trace or qualifying trace-sequence history.",
      },
    ]);
  });

  it("rejects structurally valid convergence with the wrong trace form", () => {
    const singularHistory = fixture("accepted", "convergence");
    singularHistory.trace = {
      kind: "history",
      records: [{
        itemIndex: 0,
        trace: clone(singularHistory.trace),
      }],
    };

    const sequenceDirect = fixture("accepted", "convergence-history");
    sequenceDirect.trace = clone(fixture("accepted", "convergence").trace);

    for (const candidate of [singularHistory, sequenceDirect]) {
      expect(validateSchema(candidate)).toBe(true);
      expect(errors(candidate).map(({ code, path }) => ({ code, path }))).toEqual([
        { code: "CONVERGENCE_PROVENANCE_REQUIRED", path: "$.trace" },
      ]);
    }
  });

  it("checks history cardinality and exact item-index order for every answer role", () => {
    const cardinality = fixture("semantic-only", "history-cardinality");
    const index = fixture("semantic-only", "history-index");
    expect(validateSchema(cardinality)).toBe(true);
    expect(validateSchema(index)).toBe(true);

    expect(errors(cardinality)).toEqual([
      {
        code: "TRACE_HISTORY_CARDINALITY",
        path: "$.trace.records",
        message: "History must contain exactly one record for every item.",
        context: { actual: 1, expected: 2 },
      },
    ]);
    expect(errors(index).map(({ code, path }) => ({ code, path }))).toEqual([
      { code: "TRACE_HISTORY_INDEX", path: "$.trace.records[0].itemIndex" },
      { code: "TRACE_HISTORY_INDEX", path: "$.trace.records[1].itemIndex" },
    ]);
  });

  it("reports specific history failures before convergence provenance", () => {
    const candidate = fixture("accepted", "convergence-history");
    (candidate.trace as JsonObject).records = [
      ((candidate.trace as JsonObject).records as JsonObject[])[0],
    ];

    expect(validateSchema(candidate)).toBe(true);
    expect(errors(candidate).map(({ code, path }) => ({ code, path }))).toEqual([
      { code: "TRACE_HISTORY_CARDINALITY", path: "$.trace.records" },
      { code: "CONVERGENCE_PROVENANCE_REQUIRED", path: "$.trace" },
    ]);
  });

  it("reports mixed semantic failures in the documented invariant order", () => {
    const candidate = fixture("accepted", "convergence-history");
    candidate.actionable = true;
    candidate.operations = [
      {
        id: "retry",
        label: "Retry first",
        invocation: "model-operation",
        reference: "retry.first",
      },
      {
        id: "retry",
        label: "Retry second",
        invocation: "model-operation",
        reference: "retry.second",
      },
    ];
    const firstRecord = ((candidate.trace as JsonObject).records as JsonObject[])[0];
    firstRecord.itemIndex = 1;
    (candidate.trace as JsonObject).records = [firstRecord];

    expect(validateSchema(candidate)).toBe(true);
    expect(codesAndPaths(candidate)).toEqual([
      { code: "DUPLICATE_OPERATION_ID", path: "$.operations[1].id" },
      { code: "TRACE_HISTORY_CARDINALITY", path: "$.trace.records" },
      { code: "TRACE_HISTORY_INDEX", path: "$.trace.records[0].itemIndex" },
      { code: "CONVERGENCE_PROVENANCE_REQUIRED", path: "$.trace" },
    ]);
  });

  it("is deterministic and does not mutate semantically invalid input", () => {
    const candidate = fixture("accepted", "convergence-history");
    const snapshot = clone(candidate);
    (((candidate.trace as JsonObject).records as JsonObject[])[0]).itemIndex = 1;
    const invalidSnapshot = clone(candidate);

    expect(validateAnswerSet(candidate)).toEqual(validateAnswerSet(candidate));
    expect(candidate).toEqual(invalidSnapshot);
    expect(snapshot).not.toEqual(candidate);
  });
});
