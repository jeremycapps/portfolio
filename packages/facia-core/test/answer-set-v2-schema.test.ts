import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

type JsonObject = Record<string, unknown>;

const packageRoot = new URL("../", import.meta.url);
const schemaPath = new URL("schemas/facia-answer-set.v2.schema.json", packageRoot);
const schema = JSON.parse(readFileSync(schemaPath, "utf8")) as JsonObject;
const packageManifest = JSON.parse(
  readFileSync(new URL("package.json", packageRoot), "utf8"),
) as JsonObject;
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

function fixture(
  outcome: "accepted" | "rejected" | "semantic-only",
  name: string,
): unknown {
  return JSON.parse(
    readFileSync(
      new URL(`test/fixtures/schema/${outcome}/${name}.json`, packageRoot),
      "utf8",
    ),
  );
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function expectAccepted(value: unknown): void {
  expect(validate(value), JSON.stringify(validate.errors, null, 2)).toBe(true);
}

function expectRejected(value: unknown): void {
  expect(validate(value), "document unexpectedly matched the canonical schema").toBe(false);
}

describe("canonical AnswerSet v2 JSON Schema", () => {
  it("has the stable package-owned identity and compiles as Draft 2020-12", () => {
    expect(schema.$schema).toBe("https://json-schema.org/draft/2020-12/schema");
    expect(schema.$id).toBe("facia.answer-set/2");
    expect(validate.schema).toBe(schema);
    expect(packageManifest.files).toContain("schemas");
    expect((packageManifest.exports as JsonObject)["./schemas/facia-answer-set.v2.schema.json"])
      .toBe("./schemas/facia-answer-set.v2.schema.json");
  });

  it("accepts representative documents for every role and both verdict contracts", () => {
    for (const name of [
      "value",
      "legacy-verdict",
      "bounded-verdict",
      "operation",
      "convergence",
      "trace-sequence",
    ]) {
      expectAccepted(fixture("accepted", name));
    }
  });

  it("rejects empty items, role mismatch, incomplete descriptors, and unknown members", () => {
    for (const name of [
      "empty-items",
      "role-mismatch",
      "incomplete-operation-descriptor",
      "unknown-member",
      "invalid-promotion-condition",
    ]) {
      expectRejected(fixture("rejected", name));
    }
  });

  it("enforces field syntax, priority completeness, uniqueness, and condition exclusivity", () => {
    const base = fixture("accepted", "value") as JsonObject;
    const item = (base.items as JsonObject[])[0];
    const fields = item.fields as JsonObject;
    const priority = fields.priority as JsonObject;

    const missingBucket = clone(base);
    delete (((missingBucket.items as JsonObject[])[0].fields as JsonObject)
      .priority as JsonObject).audit;
    expectRejected(missingBucket);

    const duplicateWithinBucket = clone(base);
    const duplicatePriority = ((duplicateWithinBucket.items as JsonObject[])[0]
      .fields as JsonObject).priority as JsonObject;
    duplicatePriority.primary = ["name", "name"];
    expectRejected(duplicateWithinBucket);

    const dotted = clone(base);
    const dottedPriority = ((dotted.items as JsonObject[])[0].fields as JsonObject)
      .priority as JsonObject;
    dottedPriority.primary = ["owner.name"];
    expectRejected(dotted);

    const noOperator = clone(base);
    const promotion = (((noOperator.items as JsonObject[])[0].fields as JsonObject)
      .promotion as JsonObject[])[0];
    promotion.when = { field: "active" };
    expectRejected(noOperator);

    expect(priority.primary).toEqual(["name"]);
    expect(fields.promotion).toBeDefined();
  });

  it("enforces closed operation records and direct/history trace records", () => {
    const operation = fixture("accepted", "operation") as JsonObject;
    const incompleteRecord = clone(operation);
    delete (((incompleteRecord.items as JsonObject[])[0].operation as JsonObject).name);
    expectRejected(incompleteRecord);

    const convergence = fixture("accepted", "convergence") as JsonObject;
    const emptyDirectTrace = clone(convergence);
    (emptyDirectTrace.trace as JsonObject).entries = [];
    expectRejected(emptyDirectTrace);

    const history = fixture("accepted", "trace-sequence") as JsonObject;
    const negativeIndex = clone(history);
    ((((negativeIndex.trace as JsonObject).records as JsonObject[])[0]).itemIndex) = -1;
    expectRejected(negativeIndex);

    const openHistoryRecord = clone(history);
    (((openHistoryRecord.trace as JsonObject).records as JsonObject[])[0]).extra = true;
    expectRejected(openHistoryRecord);
  });

  it("owns singular structure and exact sequence/sequenceKind coupling", () => {
    for (const name of [
      "singular-structure",
      "sequence-kind-missing",
      "sequence-kind-forbidden",
    ]) {
      expectRejected(fixture("rejected", name));
    }

    const collection = clone(fixture("accepted", "trace-sequence")) as JsonObject;
    delete collection.structure;
    delete collection.sequenceKind;
    expectAccepted(collection);

    const grouped = clone(collection);
    grouped.structure = "group";
    expectAccepted(grouped);
  });

  it("owns actionability equivalence and all closed enums", () => {
    expectRejected(fixture("rejected", "actionability-mismatch"));

    const base = fixture("accepted", "value") as JsonObject;
    const invalidValues: Array<[string, unknown]> = [
      ["schema", "facia.answer-set/1"],
      ["answerType", "transform"],
      ["path", "other"],
      ["inspection", "sometimes"],
      ["density", 4],
    ];

    for (const [member, value] of invalidValues) {
      const candidate = clone(base);
      candidate[member] = value;
      expectRejected(candidate);
    }

    const sequence = fixture("accepted", "trace-sequence") as JsonObject;
    for (const value of ["ordered", "dimension"]) {
      const candidate = clone(sequence);
      candidate.sequenceKind = value;
      expectRejected(candidate);
    }
  });

  it("rejects retired transform and transition vocabulary at every data depth", () => {
    expectRejected(fixture("rejected", "retired-member"));

    const base = fixture("accepted", "value") as JsonObject;
    for (const retired of ["transform", "transition"] as const) {
      const envelope = clone(base);
      envelope[retired] = null;
      expectRejected(envelope);

      const item = clone(base);
      (item.items as JsonObject[])[0][retired] = null;
      expectRejected(item);

      const nestedJson = clone(base);
      const payload = (nestedJson.items as JsonObject[])[0].payload as JsonObject;
      payload.outer = { [retired]: "forbidden" };
      expectRejected(nestedJson);
    }

    const retiredType = clone(base);
    (retiredType.items as JsonObject[])[0].type = "Transform";
    expectRejected(retiredType);
  });

  it("closes every contract object while leaving only JSON objects key-extensible", () => {
    const defs = schema.$defs as Record<string, JsonObject>;
    for (const name of [
      "fieldPriority",
      "equalsCondition",
      "isFalseCondition",
      "isNonEmptyCondition",
      "promotionRule",
      "fieldInfo",
      "operationRecord",
      "operationDescriptor",
      "valueAnswer",
      "legacyBooleanVerdict",
      "boundedVerdict",
      "operationAnswer",
      "convergenceAnswer",
      "traceEntry",
      "directTrace",
      "historyRecord",
      "historyTrace",
    ]) {
      expect(defs[name]?.additionalProperties, `${name} must be closed`).toBe(false);
    }

    expect(defs.jsonObject.additionalProperties).toEqual({
      $ref: "#/$defs/jsonValue",
    });
    expect(defs.jsonObject.propertyNames).toEqual({
      not: { enum: ["transform", "transition"] },
    });
  });

  it("intentionally admits semantic-only invalid documents", () => {
    for (const name of [
      "duplicate-operation-id",
      "missing-field-reference",
      "convergence-provenance",
    ]) {
      expectAccepted(fixture("semantic-only", name));
    }

    expect(schema.$comment).toContain("Runtime semantic validation owns");
    for (const invariant of [
      "unique operation ids",
      "cross-bucket field uniqueness",
      "declared promotion targets",
      "item-local payload references",
      "history cardinality/order",
      "convergence provenance",
    ]) {
      expect(schema.$comment).toContain(invariant);
    }
  });
});
