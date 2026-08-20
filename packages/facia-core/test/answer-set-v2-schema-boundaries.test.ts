import { readFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";
import { describe, expect, it } from "vitest";

type JsonObject = Record<string, unknown>;

const packageRoot = new URL("../", import.meta.url);
const schema = JSON.parse(
  readFileSync(
    new URL("schemas/facia-answer-set.v2.schema.json", packageRoot),
    "utf8",
  ),
) as JsonObject;
const validate = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

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

function expectAccepted(value: unknown): void {
  expect(validate(value), JSON.stringify(validate.errors, null, 2)).toBe(true);
}

function expectRejected(value: unknown): void {
  expect(
    validate(value),
    "document unexpectedly matched the canonical schema",
  ).toBe(false);
}

describe("AnswerSet v2 schema contract boundaries", () => {
  it("requires and closes the complete envelope", () => {
    const base = fixture("value");
    for (const member of [
      "schema",
      "question",
      "answerType",
      "path",
      "inspection",
      "actionable",
      "items",
      "operations",
    ]) {
      const candidate = clone(base);
      delete candidate[member];
      expectRejected(candidate);
    }

    for (const member of ["fields", "depth", "audience", "extra"]) {
      const candidate = clone(base);
      candidate[member] = null;
      expectRejected(candidate);
    }
  });

  it("aligns every answerType with exactly its role-specific item branch", () => {
    const branches = [
      { answerType: "value", item: (fixture("value").items as JsonObject[])[0] },
      {
        answerType: "verdict",
        item: (fixture("legacy-verdict").items as JsonObject[])[0],
      },
      {
        answerType: "operation",
        item: (fixture("operation").items as JsonObject[])[0],
      },
      {
        answerType: "convergence",
        item: (fixture("convergence").items as JsonObject[])[0],
      },
    ] as const;

    for (const branch of branches) {
      const base = fixture("value");
      base.answerType = branch.answerType;
      base.items = [clone(branch.item)];
      expectAccepted(base);

      for (const other of branches) {
        if (other.answerType === branch.answerType) continue;
        const mismatch = clone(base);
        mismatch.items = [clone(other.item)];
        expectRejected(mismatch);
      }
    }

    const bounded = fixture("value");
    bounded.answerType = "verdict";
    bounded.items = [(fixture("bounded-verdict").items as JsonObject[])[0]];
    expectAccepted(bounded);
  });

  it("requires complete closed operation descriptors and exact actionability", () => {
    const descriptor = clone(
      (fixture("operation").operations as JsonObject[])[0],
    );
    const actionable = fixture("value");
    actionable.actionable = true;
    actionable.operations = [descriptor];
    expectAccepted(actionable);

    for (const member of ["id", "label", "invocation", "reference"]) {
      const candidate = clone(actionable);
      delete (candidate.operations as JsonObject[])[0][member];
      expectRejected(candidate);
    }

    for (const member of ["id", "label", "reference"]) {
      const candidate = clone(actionable);
      (candidate.operations as JsonObject[])[0][member] = "";
      expectRejected(candidate);
    }

    const invalidInvocation = clone(actionable);
    (invalidInvocation.operations as JsonObject[])[0].invocation = "callback";
    expectRejected(invalidInvocation);

    const openDescriptor = clone(actionable);
    (openDescriptor.operations as JsonObject[])[0].execute = "host.run";
    expectRejected(openDescriptor);

    const falseWithOperation = clone(actionable);
    falseWithOperation.actionable = false;
    expectRejected(falseWithOperation);

    const trueWithoutOperation = fixture("value");
    trueWithoutOperation.actionable = true;
    expectRejected(trueWithoutOperation);
  });

  it("enforces singular exclusion and exact sequenceKind coupling for every branch", () => {
    for (const structure of ["dimension", "group", "sequence"]) {
      const singular = fixture("value");
      singular.structure = structure;
      if (structure === "sequence") singular.sequenceKind = "temporal";
      expectRejected(singular);
    }

    const singularKind = fixture("value");
    singularKind.sequenceKind = "dependency";
    expectRejected(singularKind);

    const multi = fixture("value");
    multi.items = [
      clone((multi.items as JsonObject[])[0]),
      clone((multi.items as JsonObject[])[0]),
    ];
    expectAccepted(multi);

    for (const structure of ["dimension", "group"]) {
      const candidate = clone(multi);
      candidate.structure = structure;
      expectAccepted(candidate);

      candidate.sequenceKind = "temporal";
      expectRejected(candidate);
    }

    for (const sequenceKind of ["temporal", "dependency", "trace"]) {
      const candidate = clone(multi);
      candidate.structure = "sequence";
      candidate.sequenceKind = sequenceKind;
      expectAccepted(candidate);
    }

    const missingKind = clone(multi);
    missingKind.structure = "sequence";
    expectRejected(missingKind);
  });

  it("rejects retired vocabulary recursively in every arbitrary JSON slot", () => {
    const cases: Array<{
      base: JsonObject;
      addRetiredMember: (candidate: JsonObject, retired: string) => void;
    }> = [
      {
        base: fixture("value"),
        addRetiredMember(candidate, retired) {
          ((candidate.items as JsonObject[])[0].evidence as JsonObject)[retired] = true;
        },
      },
      {
        base: fixture("operation"),
        addRetiredMember(candidate, retired) {
          ((candidate.items as JsonObject[])[0].input as JsonObject)[retired] = true;
        },
      },
      {
        base: fixture("operation"),
        addRetiredMember(candidate, retired) {
          ((candidate.operations as JsonObject[])[0]
            .inputSchema as JsonObject)[retired] = true;
        },
      },
      {
        base: fixture("convergence"),
        addRetiredMember(candidate, retired) {
          (((candidate.trace as JsonObject).entries as JsonObject[])[0]
            .value as JsonObject)[retired] = true;
        },
      },
    ];

    for (const testCase of cases) {
      for (const retired of ["transform", "transition"]) {
        const candidate = clone(testCase.base);
        testCase.addRetiredMember(candidate, retired);
        expectRejected(candidate);
      }
    }
  });
});
