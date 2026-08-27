import { describe, expect, it } from "vitest";

import {
  FaciaAuthoringError,
  directTrace,
  fields,
  historyTrace,
  nonEmpty,
  operationAnswerSet,
  priority,
  promotionRule,
  validateAnswerSet,
  valueAnswerSet,
} from "../src/index.js";

describe("nonEmpty", () => {
  it("returns a copy that satisfies the tuple type", () => {
    const source = [1, 2, 3];
    const result = nonEmpty(source);
    expect(result).toEqual([1, 2, 3]);
    expect(result).not.toBe(source);
  });

  it("throws FaciaAuthoringError on an empty array", () => {
    expect(() => nonEmpty([], "item list")).toThrow(FaciaAuthoringError);
    expect(() => nonEmpty([], "item list")).toThrow("A non-empty item list is required.");
  });
});

describe("priority", () => {
  it("fills omitted buckets with empty arrays", () => {
    expect(priority({ primary: ["owner"] })).toEqual({
      primary: ["owner"], secondary: [], supporting: [], audit: [],
    });
  });

  it("does not mutate the buckets it was handed", () => {
    const primary = ["owner"];
    const result = priority({ primary });
    result.primary.push("blocked");
    expect(primary).toEqual(["owner"]);
  });
});

describe("fields", () => {
  it("omits promotion when none is supplied", () => {
    expect(fields({ primary: ["owner"] })).not.toHaveProperty("promotion");
  });

  it("carries promotion rules when supplied", () => {
    const rule = promotionRule({ field: "blocked", isFalse: true }, ["owner"]);
    expect(fields({ primary: ["owner"] }, [rule]).promotion).toEqual([rule]);
  });
});

describe("promotionRule", () => {
  it("rejects an empty promote list", () => {
    expect(() => promotionRule({ field: "blocked", isFalse: true }, []))
      .toThrow(FaciaAuthoringError);
  });
});

describe("directTrace", () => {
  it("builds a direct trace from an ordinary array", () => {
    expect(directTrace("t.1", [{ step: "loaded", value: 1 }])).toEqual({
      kind: "direct", id: "t.1", entries: [{ step: "loaded", value: 1 }],
    });
  });

  it("rejects an empty entry list", () => {
    expect(() => directTrace("t.1", [])).toThrow(FaciaAuthoringError);
  });
});

describe("historyTrace", () => {
  it("rejects an empty record list", () => {
    expect(() => historyTrace([])).toThrow(FaciaAuthoringError);
  });
});

describe("envelope constructors", () => {
  it("stamps schema and answerType and produces a valid AnswerSet", () => {
    const answer = valueAnswerSet({
      question: "Who owns this task?",
      path: "meaning",
      inspection: "available",
      actionable: false,
      items: [{
        type: "Value",
        payload: { owner: "Ada" },
        value: "Ada",
        fields: fields({ primary: ["owner"] }),
      }],
      operations: [],
    });

    expect(answer.schema).toBe("facia.answer-set/2");
    expect(answer.answerType).toBe("value");
    expect(validateAnswerSet(answer).valid).toBe(true);
  });

  it("accepts a trace built by a helper function, which is what the tuple type used to refuse", () => {
    const trace = directTrace("stratos.place.advantage", [
      { step: "pole.resolved", value: "Controlled value chain" },
    ]);

    const answer = operationAnswerSet({
      question: "Where does the company stand?",
      path: "meaning",
      inspection: "available",
      actionable: false,
      items: [{
        type: "Operation",
        payload: { status: "no position taken" },
        operation: { id: "stratos.place.advantage", name: "Place position" },
        input: 0,
        output: "no position taken",
      }],
      operations: [],
      trace,
    });

    expect(validateAnswerSet(answer).valid).toBe(true);
  });

  it("rejects an empty item list", () => {
    expect(() => valueAnswerSet({
      question: "Who owns this task?",
      path: "meaning",
      inspection: "available",
      actionable: false,
      items: [],
      operations: [],
    })).toThrow(FaciaAuthoringError);
  });
});
