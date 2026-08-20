import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const contract = readFileSync(
  new URL("../spec/answer-set-v2-contract.md", import.meta.url),
  "utf8",
);

function section(heading: string): string {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = contract.match(
    new RegExp(`^#{2,3} ${escaped}\\n([\\s\\S]*?)(?=^#{2,3} |(?![\\s\\S]))`, "m"),
  );

  expect(match, `missing contract section: ${heading}`).not.toBeNull();
  return match![1];
}

describe("AnswerSet v2 normative contract gate", () => {
  it("pins the imported runtime and local design to immutable revisions", () => {
    const imported = section("Imported source and review boundary");

    expect(imported).toMatch(
      /@facia\/answer-runtime[\s\S]*`[0-9a-f]{40}`/,
    );
    expect(imported).toContain("c73a0fce1379f9231fb88461aac5947096aa32b2");
    expect(imported).toContain(
      "`487a337642d6c149377102561cc2fadb5bf0a353`",
    );
    expect(imported).toContain("A branch name is not the pin");
  });

  it("records every ratified v1-to-v2 change needed by downstream work", () => {
    const ledger = section("Closed v1-to-v2 delta ledger");
    const requiredDeltas = [
      "`facia.answer-set/2`; density optional",
      "`value`, `verdict`, `operation`, `convergence`",
      "Both `transform` and `transition` are forbidden",
      "`OperationV2`",
      "`ConvergenceV2`",
      "exactly one required `payload` object",
      "Optional item-local `fields`",
      "Consumer-owned `ResolveContext.depth`",
      "otherwise derived from item-local fields; otherwise absent",
      "Closed `DirectTraceV2` / `HistoryTraceV2` union",
      "Recursive JSON values only",
      "Every contract object is closed",
      "Ten explicit v2 outcomes",
      "Canonical schema owns structure",
      "AnswerSet-to-recipe is the only supported package contract",
    ];

    for (const delta of requiredDeltas) {
      expect(ledger, `missing v2 delta: ${delta}`).toContain(delta);
    }
  });

  it("closes all role, operation, trace, history, and JSON object contracts", () => {
    const closedContracts = [
      "ValueAnswerV2",
      "LegacyBooleanVerdictV0",
      "BoundedVerdictV1",
      "OperationV2",
      "ConvergenceV2",
      "OperationDescriptorV2",
      "DirectTraceV2",
      "TraceEntryV2",
      "HistoryTraceV2",
      "HistoryRecordV2",
    ];

    for (const name of closedContracts) {
      const body = section(name);
      expect(body, `${name} must list required members`).toContain("Required members");
      expect(body, `${name} must list optional members`).toContain("Optional members");
      expect(body, `${name} must list forbidden members`).toContain("Forbidden members");
      expect(body, `${name} must forbid additional properties`).toMatch(
        /Additional properties[\s\S]*\| false \|/,
      );
    }

    const jsonValues = section("JSON values");
    expect(jsonValues).toContain(
      "`JsonValue = null | boolean | JsonNumber | string | JsonValue[] | JsonObject`",
    );
    expect(jsonValues).toMatch(
      /`JsonObject`[\s\S]*keys `transform` and `transition`[\s\S]*allowed except the two forbidden property names/,
    );
  });

  it("defines one item-local payload and only top-level non-dotted field references", () => {
    const scope = section("The one-payload and field-scoping rule").replace(/\s+/g, " ");

    expect(scope).toContain("exactly one required top-level member named `payload`");
    expect(scope).toContain("sole domain-payload object for field information");
    expect(scope).toContain("evaluated only against `items[i].payload`");
    expect(scope).toContain("cannot reference another item's payload");
    expect(scope).toContain("non-empty top-level property name");
    expect(scope).toContain("It may not contain `.`");
    expect(scope).toContain("an envelope key such as `question`");
    expect(scope).toContain("a key present only on a different item are invalid");
  });

  it("assigns every cross-field invariant to schema or runtime semantics", () => {
    const structural = section("JSON Schema structural ownership");
    const semantic = section("Runtime semantic ownership and stable order");

    for (const invariant of [
      "`answerType` selects the matching item branch",
      "Singular answers forbid both `structure` and `sequenceKind`",
      "`sequenceKind` is required exactly when `structure` is `sequence`",
      "`actionable: true` requires at least one operation; `false` requires none",
      "exactly one well-formed condition operator",
    ]) {
      expect(structural, `missing structural owner: ${invariant}`).toContain(invariant);
    }

    for (const code of [
      "DUPLICATE_OPERATION_ID",
      "FIELD_PRIORITY_DUPLICATE",
      "PROMOTION_TARGET_UNDECLARED",
      "FIELD_REFERENCE_DOTTED",
      "FIELD_REFERENCE_ENVELOPE",
      "FIELD_REFERENCE_NESTED",
      "FIELD_REFERENCE_WRONG_ITEM",
      "FIELD_REFERENCE_MISSING",
      "TRACE_HISTORY_CARDINALITY",
      "TRACE_HISTORY_INDEX",
      "CONVERGENCE_PROVENANCE_REQUIRED",
    ]) {
      expect(semantic, `missing semantic owner: ${code}`).toContain(`\`${code}\``);
    }

    expect(semantic).toContain(
      "Actionability/operation count, role alignment, singular structure, and exact",
    );
    expect(semantic).toContain(
      "Operation id uniqueness, payload references,",
    );
  });

  it("resolves the design ambiguity to exactly ten precedence-ordered shapes", () => {
    const shapes = section("Normative ten-shape resolution");
    const enumerated = [...shapes.matchAll(/^\d+\. `([^`]+)`$/gm)].map(
      ([, shape]) => shape,
    );

    expect(shapes).toContain("phrase “nine shapes” is a counting error");
    expect(enumerated).toEqual([
      "singular-value",
      "singular-verdict",
      "singular-operation",
      "singular-convergence",
      "collection",
      "dimension",
      "group",
      "temporal-sequence",
      "dependency-sequence",
      "trace-sequence",
    ]);
    expect(shapes).toContain("Branch precedence is normative");
    expect(shapes).toContain("No ninth-shape compatibility interpretation is permitted");
  });

  it("leaves no downstream contract decision deferred", () => {
    const constraints = section("Downstream implementation constraints").replace(/\s+/g, " ");

    expect(contract).toContain("This gate contains no deferred contract decision");
    expect(constraints).toContain(
      "The TypeScript union, canonical schema, fixtures, and validator must encode",
    );
    expect(constraints).toContain(
      "Resolver manifests must explicitly cover density 1/2/3/absent",
    );
    expect(constraints).toContain(
      "The package has no runtime dependency on Libera, Domain, Strategy, kernel,",
    );
  });
});
