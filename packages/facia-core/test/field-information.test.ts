import { describe, expect, it } from "vitest";

import {
  promotionConditionMatches,
  resolveDensity,
  resolveVisibleFields,
  validateAnswerSet,
  type AnswerSetV2,
  type JsonObject,
  type JsonValue,
} from "../src/index.js";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function answer(items: AnswerSetV2["items"], density?: 1 | 2 | 3): AnswerSetV2 {
  return {
    schema: "facia.answer-set/2",
    question: "Which fields are visible?",
    answerType: "value",
    path: "meaning",
    inspection: "available",
    actionable: false,
    items,
    operations: [],
    ...(density === undefined ? {} : { density }),
  } as AnswerSetV2;
}

function item(
  payload: JsonObject,
  primary: string[] = [],
  secondary: string[] = [],
  supporting: string[] = [],
  audit: string[] = [],
): AnswerSetV2["items"][number] {
  return {
    type: "Value",
    payload,
    value: null,
    fields: {
      priority: { primary, secondary, supporting, audit },
    },
  };
}

function validationErrors(value: unknown): Array<{ code: string; path: string }> {
  const result = validateAnswerSet(value);
  expect(result.valid).toBe(false);
  if (result.valid) throw new Error("expected invalid AnswerSet");
  return result.errors.map(({ code, path }) => ({ code, path }));
}

describe("field-information validation", () => {
  it("reports cross-bucket duplicates before undeclared promotion targets and references", () => {
    const candidate = answer([
      {
        ...item({ name: "Ada" }, ["name"], ["name"]),
        fields: {
          priority: {
            primary: ["name"],
            secondary: ["name"],
            supporting: [],
            audit: [],
          },
          promotion: [{ when: { field: "missing", isNonEmpty: true }, promote: ["ghost"] }],
        },
      },
    ]);

    expect(validationErrors(candidate)).toEqual([
      {
        code: "FIELD_PRIORITY_DUPLICATE",
        path: "$.items[0].fields.priority.secondary[0]",
      },
      {
        code: "PROMOTION_TARGET_UNDECLARED",
        path: "$.items[0].fields.promotion[0].promote[0]",
      },
      {
        code: "FIELD_REFERENCE_MISSING",
        path: "$.items[0].fields.promotion[0].when.field",
      },
      {
        code: "FIELD_REFERENCE_MISSING",
        path: "$.items[0].fields.promotion[0].promote[0]",
      },
    ]);
  });

  it("classifies dotted, envelope, nested, wrong-item, and missing references", () => {
    const base = answer([
      item({ local: true, nested: { deep: 1 } }, ["local"]),
      item({ remote: true }, ["remote"]),
    ] as AnswerSetV2["items"]);

    const cases: Array<[string, string, string]> = [
      ["nested.deep", "INVALID_FIELD_INFO", "$.items[0].fields.priority.primary[0]"],
      ["question", "FIELD_REFERENCE_ENVELOPE", "$.items[0].fields.priority.primary[0]"],
      ["deep", "FIELD_REFERENCE_NESTED", "$.items[0].fields.priority.primary[0]"],
      ["remote", "FIELD_REFERENCE_WRONG_ITEM", "$.items[0].fields.priority.primary[0]"],
      ["unknown", "FIELD_REFERENCE_MISSING", "$.items[0].fields.priority.primary[0]"],
    ];

    for (const [key, code, path] of cases) {
      const candidate = clone(base);
      candidate.items[0].fields!.priority.primary = [key];
      expect(validationErrors(candidate), key).toContainEqual({ code, path });
    }
  });

  it("checks item-local condition and promoted references at their exact paths", () => {
    const candidate = answer([
      {
        ...item({ local: true }, ["local"]),
        fields: {
          priority: { primary: ["local"], secondary: [], supporting: [], audit: [] },
          promotion: [{ when: { field: "remote", isFalse: true }, promote: ["remote"] }],
        },
      },
      item({ remote: false }, ["remote"]),
    ] as AnswerSetV2["items"]);

    expect(validationErrors(candidate)).toEqual([
      {
        code: "PROMOTION_TARGET_UNDECLARED",
        path: "$.items[0].fields.promotion[0].promote[0]",
      },
      {
        code: "FIELD_REFERENCE_WRONG_ITEM",
        path: "$.items[0].fields.promotion[0].when.field",
      },
      {
        code: "FIELD_REFERENCE_WRONG_ITEM",
        path: "$.items[0].fields.promotion[0].promote[0]",
      },
    ]);
  });
});

describe("promotion and cumulative disclosure", () => {
  it("implements all condition forms without truthiness shortcuts", () => {
    const payload = {
      off: false,
      on: true,
      text: "Ada",
      emptyText: "",
      list: [1],
      emptyList: [],
      record: { b: [2], a: 1 },
      emptyRecord: {},
      zero: 0,
    } satisfies JsonObject;

    expect(promotionConditionMatches(payload, { field: "record", equals: { a: 1, b: [2] } }))
      .toBe(true);
    expect(promotionConditionMatches(payload, { field: "record", equals: { a: 1 } })).toBe(false);
    expect(promotionConditionMatches(payload, { field: "off", isFalse: true })).toBe(true);
    expect(promotionConditionMatches(payload, { field: "on", isFalse: true })).toBe(false);
    for (const field of ["text", "list", "record"] as const) {
      expect(promotionConditionMatches(payload, { field, isNonEmpty: true })).toBe(true);
    }
    for (const field of ["emptyText", "emptyList", "emptyRecord", "zero", "off"] as const) {
      expect(promotionConditionMatches(payload, { field, isNonEmpty: true })).toBe(false);
    }
  });

  it("promotes per item, preserves stable order, and retains declared/effective metadata", () => {
    const fields = {
      priority: {
        primary: ["name"],
        secondary: ["status", "later"],
        supporting: ["detail"],
        audit: ["log"],
      },
      promotion: [
        { when: { field: "flag", isFalse: true as const }, promote: ["status", "detail"] as [string, ...string[]] },
        { when: { field: "tag", isNonEmpty: true as const }, promote: ["detail", "log"] as [string, ...string[]] },
      ],
    };
    const first = {
      ...item({ name: "one", status: "blocked", later: 2, detail: "why", log: 1, flag: false, tag: "x" }),
      fields,
    };
    const second = {
      ...item({ name: "two", status: "ok", later: 2, detail: "why", log: 1, flag: true, tag: "" }),
      fields: clone(fields),
    };
    const candidate = answer([first, second] as AnswerSetV2["items"]);
    const snapshot = clone(candidate);

    const glance = resolveVisibleFields(candidate, "glance");
    expect(glance[0].fields.map(({ key }) => key)).toEqual(["name", "status", "detail", "log"]);
    expect(glance[0].fields).toMatchObject([
      { key: "name", declaredPriority: "primary", effectivePriority: "primary", promotionRuleIndices: [] },
      { key: "status", declaredPriority: "secondary", effectivePriority: "primary", promotionRuleIndices: [0] },
      { key: "detail", declaredPriority: "supporting", effectivePriority: "primary", promotionRuleIndices: [0, 1] },
      { key: "log", declaredPriority: "audit", effectivePriority: "primary", promotionRuleIndices: [1] },
    ]);
    expect(glance[1].fields.map(({ key }) => key)).toEqual(["name"]);

    expect(resolveVisibleFields(candidate, "inspect")[0].fields.map(({ key }) => key))
      .toEqual(["name", "status", "detail", "log", "later"]);
    expect(resolveVisibleFields(candidate, "focus")[1].fields.map(({ key }) => key))
      .toEqual(["name", "status", "later", "detail"]);
    expect(resolveVisibleFields(candidate, "audit")[1].fields.map(({ key }) => key))
      .toEqual(["name", "status", "later", "detail", "log"]);

    expect(resolveVisibleFields(candidate, "glance")).toEqual(glance);
    expect(candidate).toEqual(snapshot);
  });
});

describe("density resolution", () => {
  it("uses declared density authoritatively and derives from the largest item-local primary count", () => {
    expect(resolveDensity(answer([item({}, [])], 3))).toEqual({ density: 3, source: "declared" });
    expect(resolveDensity(answer([item({}, [])]))).toEqual({ density: 1, source: "derived" });
    expect(resolveDensity(answer([item({ a: 1, b: 2 }, ["a", "b"])])))
      .toEqual({ density: 2, source: "derived" });
    expect(resolveDensity(answer([
      item({ a: 1 }, ["a"]),
      item({ a: 1, b: 2, c: 3, d: 4 }, ["a", "b", "c", "d"]),
    ] as AnswerSetV2["items"]))).toEqual({ density: 3, source: "derived" });
  });

  it("preserves absence when no item declares fields", () => {
    const withoutFields = answer([{
      type: "Value",
      payload: {},
      value: null,
    }]);
    const snapshot = clone(withoutFields);

    expect(resolveDensity(withoutFields)).toEqual({ density: "absent", source: "absent" });
    expect(resolveDensity(withoutFields)).toEqual(resolveDensity(withoutFields));
    expect(withoutFields).toEqual(snapshot);
  });
});
