# Facia Authoring Surface and StratOS Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `@facia/core` typed authoring constructors so producers stop casting past `NonEmptyArray`, then re-author the StratOS builders and renderer under real typechecking.

**Architecture:** Add a types-only-importing `authoring.ts` to the Facia package upstream, published on its own `@facia/core/authoring` subpath so it can never drag the ajv validator into a bundle. Mirror it into the vendored copy. Then delete the four blanket casts in the StratOS builders and fix the three defects they were hiding: a trace that recorded a value which was never a resolution input, a pole stored only in the non-field-addressable `output` member, and an operation descriptor declared to steer the pattern then deleted by the renderer.

**Tech Stack:** TypeScript 7, Node 20+, vitest, React 19 rendered via `renderToStaticMarkup`, AJV (existing, unchanged).

**Spec:** `docs/superpowers/specs/2026-08-27-facia-authoring-and-stratos-reconciliation-design.md`

## Global Constraints

- Node.js 20 or newer. `@facia/core`'s only runtime dependency is AJV — add no others.
- The canonical schema must not change. `packages/facia-core/schemas/facia-answer-set.v2.schema.json` and both pin artifacts stay byte-identical, and SHA-256 stays `0fa2230a3db63be2684230c9e8b9da490b8705033974afd155856b28388dc45b`.
- `packages/facia-core/tsconfig.json` sets `"strict": true`. The app's `tsconfig.json` sets `"strict": true` and `"verbatimModuleSyntax": true` — every type-only import in app code must use `import type`.
- Authoring constructors add no fields, accept no aliases, and perform no validation beyond non-emptiness. Cross-bucket uniqueness, payload references, and every other semantic rule stay `validateAnswerSet`'s job.
- Tests in `packages/facia-core/test/` import from `"../src/index.js"` and run under `environment: "node"`.
- App component tests use `renderToStaticMarkup` from `react-dom/server`. There is no jsdom and no `@testing-library` in this repo — do not add them. Test interactive logic by extracting a pure exported helper and unit-testing it, the way `src/components/facia/semantic-surface.tsx` exports `nextElementDepth`.
- No `as unknown as` casts may remain in `src/lib/stratos/` or `api/_lib/` when the work is done.

## ⚠️ The vendored package is a fork, not a copy

`packages/facia-core/UPSTREAM.md` says the package "was imported from
`https://github.com/jeremycapps/facia.git` at commit `9074a67`" and mentions no
local changes. **That is incomplete.** Diffing `~/Dev/facia/packages/facia-core`
against `packages/facia-core` shows the portfolio has added a precompiled-AJV
pipeline that upstream does not have:

| Path | State |
|---|---|
| `src/answer-set-validator.generated.ts` | **portfolio only** — does not exist upstream |
| `src/validate-answer-set.ts` | **differs** — imports the generated validator instead of compiling AJV at runtime |
| `scripts/schema-pin.mjs` | **differs** — also emits the generated validator |
| `test/schema-pin-conformance.test.ts` | **differs** |
| `package.json` | **differs** — portfolio adds the `./schema-pin` export and a `pretest` hook |
| everything else (`src/*`, `schemas/`, `spec/`, `README.md`, `build.mjs`, `vitest.config.ts`, `tsconfig*.json`) | identical |

**Therefore: never re-vendor by copying `src/` over.** Doing so would delete the
generated validator and revert `validate-answer-set.ts`, breaking the build.
Task 2 copies exactly two files and hand-edits a third. Task 2 also corrects
`UPSTREAM.md` so the next person is not misled.

---

### Task 1: Authoring constructors, upstream in `~/Dev/facia`

**Files:**
- Create: `~/Dev/facia/packages/facia-core/src/authoring.ts`
- Create: `~/Dev/facia/packages/facia-core/test/authoring.test.ts`
- Modify: `~/Dev/facia/packages/facia-core/src/index.ts` (append exports)
- Modify: `~/Dev/facia/packages/facia-core/package.json` (add `./authoring` export)
- Modify: `~/Dev/facia/packages/facia-core/spec/answer-set-v2-contract.md` (one paragraph)
- Modify: `~/Dev/facia/packages/facia-core/README.md` (Public API section)

**Interfaces:**
- Consumes: the existing exported types in `src/answer-set-v2.ts` — `NonEmptyArray<T>`, `TraceEntryV2`, `DirectTraceV2`, `HistoryRecordV2`, `HistoryTraceV2`, `FieldPriority`, `FieldKey`, `FieldPriorityV2`, `FieldInfoV2`, `PromotionConditionV2`, `PromotionRuleV2`, `AnswerSetV2`, `ValueAnswerSetV2`, `VerdictAnswerSetV2`, `OperationAnswerSetV2`, `ConvergenceAnswerSetV2`.
- Produces: `FaciaAuthoringError`, `nonEmpty`, `directTrace`, `historyTrace`, `priority`, `promotionRule`, `fields`, `valueAnswerSet`, `verdictAnswerSet`, `operationAnswerSet`, `convergenceAnswerSet`, and the type `AnswerSetInput<T>`. Tasks 2 and 3 depend on these exact names.

**Note on the one internal cast:** `envelope()` below contains a single
`as unknown as T`. This is deliberate and is the entire point of the task —
TypeScript cannot prove that `Omit<T,...> & {items}` spread into an object
literal reconstitutes `T`, so one cast is unavoidable. Concentrating it in one
tested constructor inside the package is the trade: producers get none.

- [ ] **Step 1: Write the failing test**

Create `~/Dev/facia/packages/facia-core/test/authoring.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm --prefix ~/Dev/facia --workspace packages/facia-core run test
```

Expected: FAIL — every import from `../src/index.js` is unresolved, e.g. `"nonEmpty" is not exported`.

- [ ] **Step 3: Write the implementation**

Create `~/Dev/facia/packages/facia-core/src/authoring.ts`:

```ts
import type {
  AnswerSetV2,
  ConvergenceAnswerSetV2,
  DirectTraceV2,
  FieldInfoV2,
  FieldKey,
  FieldPriority,
  FieldPriorityV2,
  HistoryRecordV2,
  HistoryTraceV2,
  NonEmptyArray,
  OperationAnswerSetV2,
  PromotionConditionV2,
  PromotionRuleV2,
  TraceEntryV2,
  ValueAnswerSetV2,
  VerdictAnswerSetV2,
} from "./answer-set-v2.js";

/**
 * Producer-side constructors for the normative AnswerSet v2 types.
 *
 * These are a typing convenience, not a second validator. They add no members,
 * accept no aliases, and check nothing beyond the cardinality rules the
 * contract's tuple types already encode. Producers still pass their output
 * through `validateAnswerSet` or `resolveAnswerSet`.
 *
 * This module imports types only, so `@facia/core/authoring` pulls neither the
 * resolver nor the AJV validator into a consumer's bundle.
 */

/** Thrown when producer input cannot satisfy a contract cardinality rule. */
export class FaciaAuthoringError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FaciaAuthoringError";
  }
}

/**
 * Narrow an ordinary array to the contract's non-empty tuple type.
 *
 * Throwing is correct here and does not contradict the contract's "validation
 * is total and never throws" rule: that rule governs `validateAnswerSet` and
 * the resolvers, which consume untrusted input. These constructors run
 * producer-side at authoring time, where a build should stop.
 */
export function nonEmpty<T>(values: readonly T[], subject = "array"): NonEmptyArray<T> {
  if (values.length === 0) {
    throw new FaciaAuthoringError(`A non-empty ${subject} is required.`);
  }
  return [...values] as NonEmptyArray<T>;
}

export function directTrace(id: string, entries: readonly TraceEntryV2[]): DirectTraceV2 {
  return { kind: "direct", id, entries: nonEmpty(entries, "trace entry list") };
}

export function historyTrace(records: readonly HistoryRecordV2[]): HistoryTraceV2 {
  return { kind: "history", records: nonEmpty(records, "history record list") };
}

/** Fill all four declared priority buckets from a partial declaration. */
export function priority(
  buckets: Partial<Record<FieldPriority, readonly FieldKey[]>>,
): FieldPriorityV2 {
  return {
    primary: [...(buckets.primary ?? [])],
    secondary: [...(buckets.secondary ?? [])],
    supporting: [...(buckets.supporting ?? [])],
    audit: [...(buckets.audit ?? [])],
  };
}

export function promotionRule(
  when: PromotionConditionV2,
  promote: readonly FieldKey[],
): PromotionRuleV2 {
  return { when, promote: nonEmpty(promote, "promotion target list") };
}

export function fields(
  buckets: Partial<Record<FieldPriority, readonly FieldKey[]>>,
  promotion?: readonly PromotionRuleV2[],
): FieldInfoV2 {
  return promotion === undefined
    ? { priority: priority(buckets) }
    : { priority: priority(buckets), promotion: [...promotion] };
}

/** An envelope minus the two members the constructor stamps, with a plain item array. */
export type AnswerSetInput<T extends AnswerSetV2> =
  Omit<T, "schema" | "answerType" | "items"> & { items: readonly T["items"][number][] };

// The single cast in this module, and the reason it exists: TypeScript cannot
// prove that `Omit<T, ...> & { items }` spread into an object literal
// reconstitutes `T`. Concentrating one cast here is what lets every producer
// have none. The envelope constructors below are covered by authoring.test.ts,
// which round-trips their output through validateAnswerSet.
function envelope<T extends AnswerSetV2>(
  answerType: T["answerType"],
  input: AnswerSetInput<T>,
): T {
  return {
    ...input,
    schema: "facia.answer-set/2",
    answerType,
    items: nonEmpty(input.items, "item list"),
  } as unknown as T;
}

export const valueAnswerSet = (input: AnswerSetInput<ValueAnswerSetV2>): ValueAnswerSetV2 =>
  envelope<ValueAnswerSetV2>("value", input);

export const verdictAnswerSet = (input: AnswerSetInput<VerdictAnswerSetV2>): VerdictAnswerSetV2 =>
  envelope<VerdictAnswerSetV2>("verdict", input);

export const operationAnswerSet = (input: AnswerSetInput<OperationAnswerSetV2>): OperationAnswerSetV2 =>
  envelope<OperationAnswerSetV2>("operation", input);

export const convergenceAnswerSet = (input: AnswerSetInput<ConvergenceAnswerSetV2>): ConvergenceAnswerSetV2 =>
  envelope<ConvergenceAnswerSetV2>("convergence", input);
```

- [ ] **Step 4: Export from the package index**

Append to `~/Dev/facia/packages/facia-core/src/index.ts`:

```ts
export {
  FaciaAuthoringError,
  convergenceAnswerSet,
  directTrace,
  fields,
  historyTrace,
  nonEmpty,
  operationAnswerSet,
  priority,
  promotionRule,
  valueAnswerSet,
  verdictAnswerSet,
} from "./authoring.js";
export type { AnswerSetInput } from "./authoring.js";
```

- [ ] **Step 5: Add the `./authoring` subpath export**

In `~/Dev/facia/packages/facia-core/package.json`, add this entry to `"exports"` immediately after the `"."` entry:

```json
    "./authoring": {
      "types": "./dist/authoring.d.ts",
      "import": "./dist/authoring.js"
    },
```

This is what makes the "no validator in the bundle" guarantee structural rather
than incidental. `src/lib/stratos/answer-sets.ts` will import from this subpath
in Task 3.

- [ ] **Step 6: Run the tests to verify they pass**

```bash
npm --prefix ~/Dev/facia --workspace packages/facia-core run test
```

Expected: PASS, all suites including the pre-existing ones.

- [ ] **Step 7: Document the new artifact class in the contract**

In `~/Dev/facia/packages/facia-core/spec/answer-set-v2-contract.md`, immediately after the paragraph beginning "This document is normative for the TypeScript model, JSON Schema, validator, fixtures, resolvers, affordances, recipes, and schema pin", insert:

```markdown
Authoring constructors (`src/authoring.ts`, published as
`@facia/core/authoring`) are explicitly **not** normative contract surface. They
are producer-side convenience constructors over the normative types above: they
add no members, accept no aliases, and check nothing beyond the cardinality
rules the tuple types already encode. Every semantic invariant remains owned by
`validateAnswerSet` as specified below. A change to a constructor is not a
contract change and does not move the schema pin.
```

- [ ] **Step 8: Document the new exports in the README**

In `~/Dev/facia/packages/facia-core/README.md`, in the "Public API" bullet list, add after the existing entries:

```markdown
- authoring constructors on the `@facia/core/authoring` subpath —
  `valueAnswerSet`, `verdictAnswerSet`, `operationAnswerSet`,
  `convergenceAnswerSet`, `directTrace`, `historyTrace`, `fields`, `priority`,
  `promotionRule`, `nonEmpty`, and `FaciaAuthoringError`. They construct the
  normative types and are not contract surface; the subpath imports types only,
  so it pulls in neither the resolver nor AJV.
```

- [ ] **Step 9: Verify the schema pin did not move**

```bash
npm --prefix ~/Dev/facia --workspace packages/facia-core run schema:pin:check
```

Expected: PASS. Then confirm no schema or pin file is dirty:

```bash
git -C ~/Dev/facia status --short packages/facia-core/schemas
```

Expected: empty output.

- [ ] **Step 10: Commit upstream**

```bash
git -C ~/Dev/facia add packages/facia-core/src/authoring.ts packages/facia-core/test/authoring.test.ts packages/facia-core/src/index.ts packages/facia-core/package.json packages/facia-core/spec/answer-set-v2-contract.md packages/facia-core/README.md
git -C ~/Dev/facia commit -m "feat: add producer-side AnswerSet authoring constructors

Concentrates the one unavoidable NonEmptyArray cast in a tested
constructor so producers need none. Published on the @facia/core/authoring
subpath, which imports types only and so pulls in neither the resolver
nor AJV. The canonical schema and its pin are unchanged."
```

Record the resulting commit SHA — Task 2 writes it into `UPSTREAM.md`.

---

### Task 2: Mirror the authoring module into the vendored package

**Files:**
- Create: `packages/facia-core/src/authoring.ts` (copied from upstream)
- Create: `packages/facia-core/test/authoring.test.ts` (copied from upstream)
- Modify: `packages/facia-core/src/index.ts` (same appended block as Task 1 Step 4)
- Modify: `packages/facia-core/package.json` (same `./authoring` entry as Task 1 Step 5)
- Modify: `packages/facia-core/spec/answer-set-v2-contract.md` (same paragraph as Task 1 Step 7)
- Modify: `packages/facia-core/README.md` (same bullet as Task 1 Step 8)
- Modify: `packages/facia-core/UPSTREAM.md` (new SHA + document the fork)

**Interfaces:**
- Consumes: the files committed in Task 1.
- Produces: `@facia/core/authoring` resolvable from app code. Task 3 imports from it. Resolution works because the app's `tsconfig.json` uses `"moduleResolution": "bundler"`, which honors exports maps — `src/lib/answer.ts` already imports `@facia/core/schema-pin` the same way.

- [ ] **Step 1: Copy the two new files verbatim**

```bash
cp ~/Dev/facia/packages/facia-core/src/authoring.ts packages/facia-core/src/authoring.ts
cp ~/Dev/facia/packages/facia-core/test/authoring.test.ts packages/facia-core/test/authoring.test.ts
```

**Copy only these two files.** Do not `cp -r` the `src/` or `scripts/`
directories — see the fork warning at the top of this plan. The portfolio's
`validate-answer-set.ts`, `answer-set-validator.generated.ts`, and
`schema-pin.mjs` must be left exactly as they are.

- [ ] **Step 2: Apply the same four hand-edits**

`packages/facia-core/src/index.ts` — append the export block from Task 1 Step 4.
`packages/facia-core/package.json` — add the `./authoring` entry from Task 1 Step 5, after the `"."` entry and before the existing `"./schema-pin"` entry.
`packages/facia-core/spec/answer-set-v2-contract.md` — insert the paragraph from Task 1 Step 7.
`packages/facia-core/README.md` — add the bullet from Task 1 Step 8.

Verify the index files now agree:

```bash
diff ~/Dev/facia/packages/facia-core/src/index.ts packages/facia-core/src/index.ts
```

Expected: no output.

- [ ] **Step 3: Correct UPSTREAM.md**

Replace the whole body of `packages/facia-core/UPSTREAM.md` with the following, substituting the SHA recorded in Task 1 Step 10 for `<TASK-1-SHA>`:

```markdown
# Vendored Facia provenance

This package was imported from `https://github.com/jeremycapps/facia.git` at
commit `<TASK-1-SHA>`.

The canonical contract is `facia.answer-set/2`, pinned to schema SHA-256
`0fa2230a3db63be2684230c9e8b9da490b8705033974afd155856b28388dc45b`.

Application code must consume the `@facia/core` public API. Changes to Facia's
schema or resolution behavior should be made upstream, verified there, and then
re-vendored here with this commit and the checked-in schema pin updated together.

## This copy is a fork, not a mirror

The portfolio precompiles the AJV validator so no schema compilation happens at
runtime. That work exists only here. **Do not re-vendor by copying `src/` over
this directory** — it would delete the generated validator and revert
`validate-answer-set.ts`. Re-vendor file by file, leaving these alone:

| Path | Local divergence |
|---|---|
| `src/answer-set-validator.generated.ts` | Exists only here; emitted by `scripts/schema-pin.mjs` |
| `src/validate-answer-set.ts` | Imports the generated validator instead of compiling AJV at runtime |
| `scripts/schema-pin.mjs` | Also emits the generated validator |
| `test/schema-pin-conformance.test.ts` | Covers the generated validator |
| `package.json` | Adds the `./schema-pin` export and a `pretest` hook |

Every other file matches upstream and may be copied directly.
```

- [ ] **Step 4: Build, then run the full Facia suite**

```bash
npm run build:facia && npm run test:facia
```

Expected: build succeeds and `dist/authoring.js` plus `dist/authoring.d.ts` exist; all tests pass, including the copied `authoring.test.ts` and the untouched `schema-pin-conformance.test.ts`.

- [ ] **Step 5: Verify the pin and the fork are both intact**

```bash
npm run schema:pin:check --workspace packages/facia-core
git status --short packages/facia-core
```

Expected: the check passes, and `git status` lists only the six files this task touched. `src/validate-answer-set.ts`, `src/answer-set-validator.generated.ts`, `scripts/schema-pin.mjs`, and the `schemas/` directory must NOT appear.

- [ ] **Step 7: Commit**

```bash
git add packages/facia-core/src/authoring.ts packages/facia-core/test/authoring.test.ts packages/facia-core/src/index.ts packages/facia-core/package.json packages/facia-core/spec/answer-set-v2-contract.md packages/facia-core/README.md packages/facia-core/UPSTREAM.md
git commit -m "chore: vendor Facia authoring constructors

Mirrors the upstream authoring module and documents that this copy is a
fork carrying a precompiled AJV validator, so nobody re-vendors it by
copying src/ over the top."
```

---

### Task 3: Re-author the StratOS builders without casts

**Files:**
- Modify: `src/lib/stratos/answer-sets.ts` (whole file)
- Test: `src/lib/stratos/answer-sets.test.ts` (append three describes)
- Regenerate: `src/lib/stratos/recipes.generated.ts`

**Interfaces:**
- Consumes: `valueAnswerSet`, `verdictAnswerSet`, `operationAnswerSet`, `directTrace`, `fields` from `@facia/core/authoring`; `validateAnswerSet` from `@facia/core`.
- Produces: `buildTensionAnswerSet(t: Tension, side: PoleSide): AnswerSetV2`, `buildOfficerAnswerSet(t: Tension, side: PlacedSide): AnswerSetV2`, `buildVerdictAnswerSet(): AnswerSetV2` — same three names and signatures as today, so `scripts/gen-stratos-recipes.ts` needs no change. The placed-tension payload gains a `pole` key and the officer payload's `questions` becomes `string[]`; Task 4 depends on both.

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/stratos/answer-sets.test.ts`.

**First, edit the file's three existing import lines in place** — do not add
duplicates. They become:

```ts
import { describe, expect, it } from 'vitest';
import { validateAnswerSet } from '@facia/core';
import { buildOfficerAnswerSet, buildTensionAnswerSet, buildVerdictAnswerSet } from './answer-sets';
import { ownerOf, TENSIONS, type PlacedSide, type PoleSide } from './ontology';
```

Then append the new describes:

```ts

describe('StratOS answer sets are contract-valid', () => {
  it('validates every tension placement, officer, and the verdict', () => {
    const built = [buildVerdictAnswerSet()];
    for (const tension of TENSIONS) {
      for (const side of ['l', 'neutral', 'r'] as PoleSide[]) {
        built.push(buildTensionAnswerSet(tension, side));
      }
      for (const side of ['l', 'r'] as PlacedSide[]) {
        built.push(buildOfficerAnswerSet(tension, side));
      }
    }

    const failures = built
      .map((answer) => validateAnswerSet(answer))
      .filter((result) => !result.valid);

    expect(failures).toEqual([]);
  });
});

describe('the tension trace records only what resolved', () => {
  it('omits the declared position, which is not a resolution input', () => {
    const answer = buildTensionAnswerSet(TENSIONS[0], 'l');
    const steps = answer.trace?.kind === 'direct'
      ? answer.trace.entries.map((entry) => entry.step)
      : [];

    expect(steps).toEqual(['pole.resolved', 'owner.resolved']);
    expect(steps).not.toContain('position.declared');
  });
});

describe('the placed pole is field-addressable', () => {
  it('carries the pole in payload, not only in the non-projectable output member', () => {
    const answer = buildTensionAnswerSet(TENSIONS[0], 'l');
    const payload = answer.items[0].payload as Record<string, unknown>;

    expect(payload.pole).toBe('Controlled value chain');
    expect(payload.growthLens).toBeDefined();
  });

  it('declares pole primary and growthLens secondary', () => {
    const answer = buildTensionAnswerSet(TENSIONS[0], 'l');
    expect(answer.items[0].fields?.priority.primary).toEqual(['pole']);
    expect(answer.items[0].fields?.priority.secondary).toEqual(['growthLens']);
  });
});

describe('officer questions are structured data', () => {
  it('carries questions as an array rather than a delimited string', () => {
    const answer = buildOfficerAnswerSet(TENSIONS[0], 'l');
    const payload = answer.items[0].payload as Record<string, unknown>;

    expect(Array.isArray(payload.questions)).toBe(true);
    expect(payload.questions).toEqual(ownerOf(TENSIONS[0], 'l').questions);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/lib/stratos/answer-sets.test.ts
```

Expected: FAIL — `steps` is `['position.declared', 'pole.resolved', 'owner.resolved']`, `payload.pole` is `undefined`, and `payload.questions` is a string.

- [ ] **Step 3: Rewrite the builders**

Replace the whole contents of `src/lib/stratos/answer-sets.ts`:

```ts
// Builders that turn an ontology placement into a facia.answer-set/2 document.
//
// The `@facia/core` import here is a type-only import and the authoring
// constructors come from `@facia/core/authoring`, which imports types only.
// Neither pulls the Facia resolver or its ajv validator into any bundle. The
// build-time generator runs the real resolver in Node.

import {
  directTrace, fields, operationAnswerSet, valueAnswerSet, verdictAnswerSet,
} from '@facia/core/authoring';
import type { AnswerSetV2, DirectTraceV2, JsonObject } from '@facia/core';
import {
  CSUITE_SOURCE, ONTOLOGY_SOURCES, ownerOf, poleName,
  type PlacedSide, type PoleSide, type Tension,
} from './ontology';

// A sign carrier, not a position. Only the sign of the placement reaches
// resolution, so recipes are generated per side and the live value never needs
// to enter the answer. The number on the knob is UI state and stays there.
const repr = (side: PoleSide): number => (side === 'l' ? -0.5 : side === 'r' ? 0.5 : 0);

function tensionEvidence(t: Tension): JsonObject {
  const lensRefs = `${t.lensLeft} ◀ · ▶ ${t.lensRight}`
    .split(' · ').map((x) => x.split(' ')[0]);
  return { status: 'user-declared', sourceRefs: [...ONTOLOGY_SOURCES, ...lensRefs] };
}

// Provenance records what determined the answer. The declared position is not a
// determinant — only its sign is — so it is not a trace entry.
function tensionTrace(t: Tension, side: PoleSide): DirectTraceV2 {
  return directTrace(`stratos.place.${t.id}`, [
    { step: 'pole.resolved', value: side === 'neutral' ? 'none — inside the ±0.05 dead zone' : poleName(t, side) },
    { step: 'owner.resolved', value: side === 'neutral' ? 'unresolved — both advocates stand' : ownerOf(t, side).fn },
  ]);
}

/** A placement on one tension. Neutral = an operation with nothing to act on;
 *  a real placement surfaces the selected pole and its recommendation. The
 *  owner's full mandate is reserved for the board-agenda answer. */
export function buildTensionAnswerSet(t: Tension, side: PoleSide): AnswerSetV2 {
  const evidence = tensionEvidence(t);
  const trace = tensionTrace(t, side);

  if (side === 'neutral') {
    return operationAnswerSet({
      question: t.question,
      path: 'meaning', inspection: 'available', actionable: false,
      items: [{
        type: 'Operation',
        payload: { status: 'no position taken' },
        operation: { id: `stratos.place.${t.id}`, name: `Place position on ${t.name}` },
        input: 0, output: 'no position taken', evidence,
        fields: fields({ primary: ['status'] }),
      }],
      operations: [], trace,
    });
  }

  const own = ownerOf(t, side);
  const pole = poleName(t, side);
  return operationAnswerSet({
    question: t.question,
    path: 'meaning', inspection: 'available', actionable: true,
    items: [{
      type: 'Operation',
      payload: { pole, growthLens: own.lens },
      operation: { id: `stratos.place.${t.id}`, name: `Place position on ${t.name}` },
      input: repr(side), output: pole, evidence,
      fields: fields({ primary: ['pole'], secondary: ['growthLens'] }),
    }],
    operations: [{
      id: `stratos.agenda.${t.id}`,
      label: 'Carried to the board agenda',
      invocation: 'host-callback',
      reference: 'agenda.add',
    }],
    trace,
  });
}

/** One officer on the board agenda — its own answer, at its own depth. The
 *  function is the one thing this answer asserts, so it is the single primary
 *  field; the reason, mandate, and questions elaborate it in that order. */
export function buildOfficerAnswerSet(t: Tension, side: PlacedSide): AnswerSetV2 {
  const own = ownerOf(t, side);
  return valueAnswerSet({
    question: `What must ${own.fn} answer?`,
    path: 'meaning', inspection: 'available', actionable: false,
    items: [{
      type: 'Value',
      payload: {
        function: own.fn,
        because: `${t.name} · ${poleName(t, side)}`,
        mandate: own.mandate,
        questions: [...own.questions],
      },
      value: own.fn,
      evidence: { status: 'user-declared', sourceRefs: [...ONTOLOGY_SOURCES, CSUITE_SOURCE] },
      fields: fields({
        primary: ['function'],
        secondary: ['because'],
        supporting: ['mandate', 'questions'],
      }),
    }],
    operations: [],
    trace: directTrace(`stratos.agenda.${t.id}`, [
      { step: 'pole.resolved', value: poleName(t, side) },
      { step: 'owner.resolved', value: own.fn },
      { step: 'questions.compiled', value: own.questions.length },
    ]),
  });
}

/** The aggregate verdict shown when Commitment falls below 0.20. */
export function buildVerdictAnswerSet(): AnswerSetV2 {
  return verdictAnswerSet({
    question: 'Has the company declared a material position?',
    path: 'meaning', inspection: 'available', actionable: false,
    items: [{
      type: 'Verdict', contract: 'BoundedVerdictV1',
      payload: {
        state: 'no material position declared',
        threshold: 'Commitment Index is below 0.20',
        owner: 'Executive, with Board oversight',
      },
      state: 'no material position declared', conforms: false,
      evidence: { status: 'user-declared', sourceRefs: [...ONTOLOGY_SOURCES] },
      fields: fields({
        primary: ['state'],
        secondary: ['threshold'],
        supporting: ['owner'],
      }),
    }],
    operations: [],
  });
}
```

Note what is gone: all four `as unknown as AnswerSetV2` casts, and the
`position.declared` entry from both traces. Note what is unchanged: the officer
and verdict priority declarations, which were always a defensible information
model — only the comment describing them as pattern-steering is rewritten.

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run src/lib/stratos/answer-sets.test.ts
```

Expected: PASS, including the two pre-existing tests in that file.

- [ ] **Step 5: Verify no casts remain and the app typechecks**

```bash
grep -rn 'as unknown as' src/lib/stratos api/_lib
```

Expected: no output (exit code 1 from grep is the success signal here).

```bash
npm run typecheck:app
```

Expected: exit 0, no diagnostics. This is the step that proves the casts were load-bearing for nothing but the tuple type.

- [ ] **Step 6: Regenerate the recipes**

```bash
npm run gen:stratos
```

Expected: `gen-stratos-recipes: wrote 124 recipes across 31 keys`. The generator aborts on any resolution failure, so a clean run proves all 31 keys × 4 depths still resolve.

- [ ] **Step 7: Review the recipe diff**

```bash
git diff --stat src/lib/stratos/recipes.generated.ts
git diff src/lib/stratos/recipes.generated.ts | grep -E '^[-+].*"(pattern|density|inspectionControls)"' | sort -u
```

Expected: the second command produces no output — no pattern, density, or inspection-control value changed. Confirm by eye that the diff contains only: removed `position.declared` trace entries, the `pole` payload key, `growthLens` moving from primary to secondary in `visibleFields`, and `questions` becoming an array.

- [ ] **Step 8: Commit**

```bash
git add src/lib/stratos/answer-sets.ts src/lib/stratos/answer-sets.test.ts src/lib/stratos/recipes.generated.ts
git commit -m "fix: re-author StratOS answer sets without blanket casts

Drops the four as-unknown-as casts now that authoring constructors exist,
and fixes the two defects they were hiding: the pole lived only in the
non-field-addressable output member, and the trace recorded a declared
position that was never a resolution input. Officer questions become a
real array. No pattern or affordance decision changes."
```

---

### Task 4: Stop the renderer rewriting the trace

**Files:**
- Modify: `src/pages/stratos.tsx` — `AnswerPanel` (lines ~24–115), `TensionRow` call site (~line 219), `Agenda` call site (~line 410)
- Create: `src/pages/stratos.test.tsx`

**Interfaces:**
- Consumes: `buildTensionAnswerSet` and `buildOfficerAnswerSet` from Task 3, and `STRATOS_RECIPES` regenerated in Task 3 Step 6.
- Produces: an `AnswerPanel` whose props no longer include `live`. Task 5 modifies the same component and must not reintroduce it.

- [ ] **Step 1: Export `AnswerPanel` so it can be tested directly**

The trace reveal is closed by default, so rendering the whole page would assert
against markup that is not on screen and the test would pass green from the
start. Render the panel directly with the reveal forced open instead.

In `src/pages/stratos.tsx`, change the declaration to:

```tsx
export function AnswerPanel({ elId, recipe, depth, sideClass, reveal, live, onToggleReveal,
  showAffordances = true }: PanelProps) {
```

(Task 5 modifies this same signature further; leave `live` in place for now — Step 3 removes it.)

- [ ] **Step 2: Write the failing test**

Create `src/pages/stratos.test.tsx`:

```tsx
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AnswerPanel } from './stratos';
import { STRATOS_RECIPES } from '../lib/stratos/recipes.generated';

const openTrace = { evidence: false, trace: true };

describe('the StratOS trace reveal', () => {
  it('shows only the steps that actually resolved', () => {
    const html = renderToStaticMarkup(
      <AnswerPanel elId="advantage" recipe={STRATOS_RECIPES['tension:advantage:l'].audit}
        depth="audit" sideClass="l" reveal={openTrace}
        onToggleReveal={() => {}} />,
    );

    expect(html).toContain('pole.resolved');
    expect(html).toContain('owner.resolved');
    expect(html).not.toContain('position.declared');
  });
});

describe('array-valued fields', () => {
  it('renders officer questions as list items rather than a delimited string', () => {
    const html = renderToStaticMarkup(
      <AnswerPanel elId="officer:advantage" recipe={STRATOS_RECIPES['officer:advantage:l'].focus}
        depth="focus" sideClass="l" reveal={{ evidence: false, trace: false }}
        onToggleReveal={() => {}} />,
    );

    expect(html).toContain('<ul class="qs">');
    expect(html).not.toContain(' · What');
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run src/pages/stratos.test.tsx
```

Expected: FAIL on the first case — the recipe still carries a `position.declared` entry if Task 3 has not been run, and in either case TypeScript rejects the call because `PanelProps` still requires nothing of `live` but the component still reads it. If Task 3 is already committed, the first case fails only on the `<ul class="qs">` assertion; that is still a red test.

- [ ] **Step 4: Delete `traceValue` and the `live` prop**

In `src/pages/stratos.tsx`, remove `live` from the `PanelProps` interface:

```ts
interface PanelProps {
  elId: string;
  recipe: ComponentRecipe;
  depth: DisclosureDepth;
  sideClass: '' | 'l' | 'r';
  reveal: { evidence: boolean; trace: boolean };
  onToggleReveal: (which: 'evidence' | 'trace') => void;
  showAffordances?: boolean;
}
```

Update the destructuring to drop `live`:

```tsx
function AnswerPanel({ elId, recipe, depth, sideClass, reveal, onToggleReveal,
  showAffordances = true }: PanelProps) {
```

Delete the whole `traceValue` function, and render trace entries directly:

```tsx
      {hasTrace && reveal.trace && trace && (
        <p className="reveal"><b>trace</b> {trace.id}<br />
          {trace.entries.map((e, i) => (
            <span key={i}>{e.step} = {String(e.value)}{i < trace.entries.length - 1 ? <br /> : null}</span>
          ))}</p>
      )}
```

- [ ] **Step 5: Drop `live` from both call sites**

In `TensionRow`, the `AnswerPanel` call becomes:

```tsx
          <AnswerPanel elId={tension.id} recipe={recipe} depth={depth} sideClass={sideClass}
            reveal={reveal}
            onToggleReveal={onToggleReveal} />
```

In `Agenda`, it becomes:

```tsx
              <AnswerPanel elId={elId} recipe={recipe} depth={depth}
                sideClass={side} reveal={revealOf(elId)}
                onToggleReveal={(which) => toggleReveal(elId, which)}
                showAffordances={false} />
```

`Agenda` still destructures `p` from each placement for nothing once `live` is
gone. Change its map to `placements.map(({ t, side }) => {` and drop `p` from
the destructure. If TypeScript then reports `p` unused in the `placements`
type, leave the type alone — it is built elsewhere and still carries the
position for the axis.

- [ ] **Step 6: Render array field values as a list**

In `AnswerPanel`, the `questions` special case currently splits a string. Replace it with an array branch that works for any array-valued field:

```tsx
              <dd>
                {Array.isArray(f.value) ? (
                  <ul className="qs">
                    {f.value.map((q, i) => <li key={i}>{String(q)}</li>)}
                  </ul>
                ) : String(f.value)}
              </dd>
```

- [ ] **Step 7: Run the tests and typecheck**

```bash
npx vitest run src/pages/stratos.test.tsx && npm run typecheck:app
```

Expected: PASS and exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/pages/stratos.tsx src/pages/stratos.test.tsx
git commit -m "fix: stop the StratOS renderer rewriting resolved traces

traceValue overwrote resolved trace entries with live slider values, so
the displayed provenance was not the resolved provenance. The trace now
renders as resolved and array-valued fields render as lists."
```

---

### Task 5: Make the board-agenda affordance real

**Files:**
- Modify: `src/pages/stratos.tsx` — add `agendaTargetId`, render the action as a button, thread a handler through `TensionRow`
- Modify: `src/pages/stratos.css` — one rule after line 578
- Test: `src/pages/stratos.test.tsx` (append)

**Interfaces:**
- Consumes: `AnswerPanel` as left by Task 4, and `toggleFocus(id: string)` which already exists in `StratosPage` and is already passed to `Agenda`.
- Produces: `export function agendaTargetId(operationId: string): string | null` — a pure helper, exported for unit testing, matching how `src/components/facia/semantic-surface.tsx` exports `nextElementDepth`.

**Why a helper keyed on the operation id:** the bug being fixed is that the
renderer string-matched the operation's *label*. Keying the new behaviour on the
descriptor `id` instead is the whole point — labels are display copy and may
change; ids are contract data.

- [ ] **Step 1: Write the failing test**

Append to `src/pages/stratos.test.tsx`:

Extend the existing `./stratos` import line rather than adding a second one:

```tsx
import { AnswerPanel, agendaTargetId } from './stratos';
```

```tsx
describe('agendaTargetId', () => {
  it('maps an agenda operation id to that tension officer element id', () => {
    expect(agendaTargetId('stratos.agenda.advantage')).toBe('officer:advantage');
  });

  it('ignores operation ids that are not agenda operations', () => {
    expect(agendaTargetId('stratos.place.advantage')).toBeNull();
    expect(agendaTargetId('')).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/pages/stratos.test.tsx
```

Expected: FAIL — `agendaTargetId` is not exported from `./stratos`.

- [ ] **Step 3: Add the pure helper**

In `src/pages/stratos.tsx`, below the existing `recipeFor` declaration:

```ts
const AGENDA_OPERATION_PREFIX = 'stratos.agenda.';

/** Map an agenda operation descriptor id to the officer panel it carries to.
 *  Keyed on the contract id, never on the display label. */
export function agendaTargetId(operationId: string): string | null {
  if (!operationId.startsWith(AGENDA_OPERATION_PREFIX)) return null;
  const tensionId = operationId.slice(AGENDA_OPERATION_PREFIX.length);
  return tensionId === '' ? null : `officer:${tensionId}`;
}
```

- [ ] **Step 4: Run the helper test to verify it passes**

```bash
npx vitest run src/pages/stratos.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Render the action as a live control**

In `AnswerPanel`, delete the label filter. The line currently reading:

```tsx
  const actions = recipe.actionControls.filter((action) =>
    action.operation?.label !== 'Carried to the board agenda');
```

becomes:

```tsx
  const actions = recipe.actionControls;
```

Add an `onAction` prop to `PanelProps`:

```ts
  onAction?: (operationId: string) => void;
```

and to the destructure:

```tsx
function AnswerPanel({ elId, recipe, depth, sideClass, reveal, onToggleReveal,
  onAction, showAffordances = true }: PanelProps) {
```

Replace the inert action chips:

```tsx
          {actions.map((a) => {
            const target = agendaTargetId(a.operation.id);
            if (!target || !onAction) {
              return <span key={a.operation.id} className="aff act">{a.operation.label}</span>;
            }
            return (
              <button key={a.operation.id} type="button" className="aff act live"
                data-aff="action" data-operation={a.operation.id}
                onClick={(e) => { e.stopPropagation(); onAction(a.operation.id); }}>
                {a.operation.label}
              </button>
            );
          })}
```

- [ ] **Step 6: Thread the handler from the page**

In `StratosPage`, add the handler beside `toggleFocus`:

```ts
  const carryToAgenda = useCallback((operationId: string) => {
    const target = agendaTargetId(operationId);
    if (!target) return;
    setFocused(target);
    document.querySelector(`[data-el="${target}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);
```

`Agenda` already builds its panels with `elId = 'officer:' + t.id` and
`AnswerPanel` already stamps `data-el={elId}`, so the selector resolves with no
new markup. Setting `focused` to that id also lifts the card to `focus` depth
via the existing `depthFor`.

Add `onCarryToAgenda` to `TensionRow`'s props type and destructure:

```ts
  onCarryToAgenda: (operationId: string) => void;
```

Pass it into the panel inside `TensionRow`:

```tsx
          <AnswerPanel elId={tension.id} recipe={recipe} depth={depth} sideClass={sideClass}
            reveal={reveal}
            onAction={onCarryToAgenda}
            onToggleReveal={onToggleReveal} />
```

And supply it where `TensionRow` is rendered (~line 307):

```tsx
              <TensionRow key={t.id} tension={t} position={positions[t.id]} depth={depthFor(t.id)}
                onCarryToAgenda={carryToAgenda}
```

Leave the `Agenda` call site alone — officer panels pass `showAffordances={false}` and render no controls.

- [ ] **Step 7: Add the CSS rule**

In `src/pages/stratos.css`, immediately after the existing
`.stratos .aff.act { color: var(--st-ink-2); border-style: dashed; }` rule
(line 578), add:

```css
.stratos .aff.act.live {
  color: var(--st-accent);
  border-style: solid;
  border-color: rgba(49, 95, 128, 0.34);
  cursor: pointer;
}

.stratos .aff.act.live:hover { background: #fff; }
```

This is needed because `.aff.act` is declared after `.aff.live` in the file, so
without it the muted `color` and dashed border would win over the live styling.

- [ ] **Step 8: Add a markup assertion**

Append to `src/pages/stratos.test.tsx`. `renderToStaticMarkup`, `AnswerPanel`,
and `STRATOS_RECIPES` are already imported by Task 4 — extend the existing
import line to add `agendaTargetId`, and do not repeat the others:

```tsx
import { AnswerPanel, agendaTargetId } from './stratos';
```

```tsx
describe('the board-agenda affordance', () => {
  it('renders the declared operation as a live control rather than hiding it', () => {
    const recipe = STRATOS_RECIPES['tension:advantage:l'].inspect;
    const html = renderToStaticMarkup(
      <AnswerPanel elId="advantage" recipe={recipe} depth="inspect" sideClass="l"
        reveal={{ evidence: false, trace: false }}
        onAction={() => {}}
        onToggleReveal={() => {}} />,
    );

    expect(html).toContain('data-operation="stratos.agenda.advantage"');
    expect(html).toContain('Carried to the board agenda');
    expect(html).toContain('aff act live');
  });
});
```

- [ ] **Step 9: Run the full verification set**

```bash
npm run typecheck && npm test && npm run schema:pin:check --workspace packages/facia-core
```

Expected: all exit 0. `schema:pin:check` passing here is the proof that none of this work moved the contract.

- [ ] **Step 10: Verify in the browser**

Start the dev server with `preview_start` using the `.claude/launch.json` entry, then:
- drag the Advantage tension left; confirm a "Carried to the board agenda" button appears on the panel
- click it; confirm the page scrolls to that officer's card and the card lifts to focus depth
- switch on audit mode and open a trace; confirm it shows `pole.resolved` and `owner.resolved` and no position line
- check `read_console_messages` for errors
- screenshot the placed tension and the focused officer card

- [ ] **Step 11: Commit**

```bash
git add src/pages/stratos.tsx src/pages/stratos.test.tsx src/pages/stratos.css
git commit -m "feat: make the StratOS board-agenda affordance real

The one declared operation set actionable:true, which selected the
action-panel pattern, and was then removed by a renderer filter matching
its display label. It now renders as a control keyed on the contract
operation id that focuses and scrolls to the officer it carries to."
```

---

## Done when

- `npm run typecheck`, `npm test`, and `npm run schema:pin:check --workspace packages/facia-core` all pass.
- `grep -rn 'as unknown as' src/lib/stratos api/_lib` returns nothing.
- `git status --short packages/facia-core/schemas` is empty — the contract never moved.
- The StratOS trace shows only what resolved, the placed pole is a projected field, and the agenda action is clickable.
