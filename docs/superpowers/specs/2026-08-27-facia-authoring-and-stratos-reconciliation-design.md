# Facia authoring surface and StratOS reconciliation — design

- Date: 2026-08-27
- Status: proposed
- Scope: `~/Dev/facia` (upstream), `packages/facia-core` (vendored), `src/lib/stratos/`, `src/pages/stratos.tsx`
- Out of scope: the Facia UI layer (see "Deferred" below)

## Problem

Three defects were found while auditing the StratOS instrument against the
`facia.answer-set/2` contract. They share one root cause.

### 1. A blanket cast disables typechecking on every StratOS builder

All four builders in `src/lib/stratos/answer-sets.ts` end in
`as unknown as AnswerSetV2`. Removing the casts and compiling produces exactly
two errors, both the same one:

```
Type '{ kind: "direct"; id: string; entries: (...)[] }' is not assignable to
type 'DirectTraceV2'. Types of property 'entries' are incompatible.
  Type '(...)[]' is not assignable to type 'NonEmptyArray<TraceEntryV2>'.
```

`NonEmptyArray<T>` is `[T, ...T[]]`. TypeScript contextually types an array
*literal* into a tuple target, but a value returned from a helper function has
already widened to `T[]` and no longer fits. StratOS builds its trace in the
helper `tensionTrace()`; `api/_lib/portfolio-answer-source.ts` writes the same
structure as an inline literal and needs no cast at all. The difference is
factoring, not correctness.

So a whole-object cast — which suppresses *every* check on the object — was
adopted to work around one tuple type. It then hid the next two defects.

### 2. Answer content lives in members that cannot be projected

A placed tension's payload is `{ growthLens }`. The pole the user actually
selected is carried in `output`, which the contract states plainly is not
field-addressable:

> Role members such as `value`, `finding`, `input`, `output`, `state`, and
> `evidence` retain answer semantics but are not field-addressable.

`ComponentRecipe.visibleFields` is derived from `payload` alone, so the pole
name can never reach the field list. It is visible only inside the trace.

Related: the officer builder stores `questions` as a `' · '`-joined string and
`src/pages/stratos.tsx` splits it back apart at render time. Payload values are
`JsonValue`, so an array was always legal; the encode/decode pair works around
nothing.

### 3. Two members are declared to steer presentation, then suppressed

- `buildTensionAnswerSet` declares one operation descriptor per placed tension
  (`stratos.agenda.<id>`, label `Carried to the board agenda`). That descriptor
  is what makes `actionable: true`, which is what selects the `action-panel`
  pattern. `AnswerPanel` in `src/pages/stratos.tsx` then filters actions by
  `label !== 'Carried to the board agenda'` — which removes the only action
  there is. No action ever renders. The descriptor exists to move the pattern.
- The trace entry `position.declared` records a representative `±0.5`, because
  recipes are pre-resolved per `(kind, tension, side, depth)` and only the
  *sign* of the position affects resolution. The renderer's `traceValue()` then
  overwrites that entry with the live slider value. Provenance a renderer
  rewrites is not provenance. `src/lib/stratos/answer-sets.test.ts` already
  asserts `payload.because` does not contain `'0.50'`, so the representative
  value leaking into user-visible text was caught once before.

## Decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | Add typed authoring constructors to `@facia/core` upstream, re-vendor | Fixes the ergonomics for every producer on the site at once, not just the one that happened to factor a helper out |
| D2 | The trace records only what actually resolved | The raw position is not a resolution input — only its sign is — so `position.declared` was always a fiction. The live number belongs on the knob |
| D3 | Make the agenda affordance real | The operation is truthful: the placement genuinely is carried to the board agenda further down the page. Rendering it stops the descriptor being pattern-bait |
| D4 | The UI layer is a separate spec | Building a renderer against producer data we already know is lying would bake the lies in |

## Section 1 — The authoring module

### Location and shape

A new `src/authoring.ts` in `~/Dev/facia`, re-exported from `src/index.ts`.
`packages/facia-core/scripts/build.mjs` is a plain `tsc -p tsconfig.json` over
`src/`, so no entry list needs updating.

### API

```ts
export class FaciaAuthoringError extends Error {}

/** Narrow an ordinary array to the contract's tuple type. Throws when empty. */
export function nonEmpty<T>(values: readonly T[], subject?: string): NonEmptyArray<T>;

export function directTrace(id: string, entries: readonly TraceEntryV2[]): DirectTraceV2;
export function historyTrace(records: readonly HistoryRecordV2[]): HistoryTraceV2;

/** Fill all four priority buckets from a partial declaration. */
export function priority(
  buckets: Partial<Record<FieldPriority, readonly FieldKey[]>>,
): FieldPriorityV2;

export function fields(
  buckets: Partial<Record<FieldPriority, readonly FieldKey[]>>,
  promotion?: readonly PromotionRuleV2[],
): FieldInfoV2;

export function promotionRule(
  when: PromotionConditionV2,
  promote: readonly FieldKey[],
): PromotionRuleV2;

type AnswerSetInput<T extends AnswerSetV2> =
  Omit<T, 'schema' | 'answerType' | 'items'> & { items: readonly T['items'][number][] };

export function valueAnswerSet(input: AnswerSetInput<ValueAnswerSetV2>): ValueAnswerSetV2;
export function verdictAnswerSet(input: AnswerSetInput<VerdictAnswerSetV2>): VerdictAnswerSetV2;
export function operationAnswerSet(input: AnswerSetInput<OperationAnswerSetV2>): OperationAnswerSetV2;
export function convergenceAnswerSet(input: AnswerSetInput<ConvergenceAnswerSetV2>): ConvergenceAnswerSetV2;
```

Four role-named envelope constructors rather than one generic, because
`AnswerSetEnvelopeV2` is deliberately not exported from `answer-set-v2.ts` and
this design does not widen that. Each constructor stamps `schema` and
`answerType` itself, so those two literals stop being hand-typed.

### Semantics

- Constructors are pure and non-mutating. They copy the members handed to them
  and add nothing the contract does not state.
- `nonEmpty`, and every constructor that delegates to it, throws
  `FaciaAuthoringError` on an empty array. Throwing is correct here and does not
  contradict the contract's "validation is total and never throws" rule: that
  rule governs `validateAnswerSet` and the resolvers, which consume untrusted
  input. Authoring constructors run producer-side at build time, where
  `scripts/gen-stratos-recipes.ts` already aborts the build on failure.
- `priority` fills omitted buckets with `[]`. It does not deduplicate, reorder,
  or cross-check keys — cross-bucket uniqueness and payload references remain
  `validateAnswerSet`'s semantic checks, exactly as the contract assigns them.
- Constructors perform no validation beyond non-emptiness. They are a typing
  convenience, not a second validator. Producers still pass their output
  through `validateAnswerSet`/`resolveAnswerSet`.

### Contract conformance

The canonical schema is untouched, so the SHA-256 pin
`0fa2230a3db63be2684230c9e8b9da490b8705033974afd155856b28388dc45b` does not
move and `npm run schema:pin:check` keeps passing unchanged. That passing check
is the proof, and it is part of the verification set in Section 3.

The contract permits this addition explicitly. `spec/answer-set-v2-contract.md`
states that governed artifacts "may refine types or diagnostics, but may not add
fields, accept aliases, or choose behavior not stated here." Constructors for
already-stated types add no fields, accept no aliases, and choose no behavior.

One documentation change is required: that contract's opening paragraph
enumerates the artifacts it is normative for (TypeScript model, JSON Schema,
validator, fixtures, resolvers, affordances, recipes, schema pin). An authoring
module is a new artifact class. Add one paragraph declaring authoring helpers
non-normative constructors over the normative types, so a later reader does not
mistake them for contract surface.

### Re-vendoring

Vendoring is manual — there is no vendor script. The steps are: commit upstream
in `~/Dev/facia`, copy `src/` and `schemas/` into `packages/facia-core/`, update
the commit SHA in `packages/facia-core/UPSTREAM.md`, and document the new
exports in `packages/facia-core/README.md` under "Public API".

Writing a vendor script is a reasonable follow-up but is not in this scope.

## Section 2 — Re-authoring StratOS

Delete the four `as unknown as AnswerSetV2` casts first, then fix what the
compiler and the audit surface. All six changes are one commit's worth of work
and are verified together.

| # | File | Change |
|---|---|---|
| 1 | `src/lib/stratos/answer-sets.ts` | `tensionTrace()` drops the `position.declared` entry and keeps `pole.resolved` and `owner.resolved`. Both traces are built with `directTrace()` |
| 2 | `src/pages/stratos.tsx` | `traceValue()` and the `live` prop are deleted. `live` has no other consumer — it is read only by `traceValue` — so both call sites (`TensionRow` and `Agenda`) drop it. The live position stays on the knob, where it already is |
| 3 | `src/lib/stratos/answer-sets.ts` | Placed-tension payload becomes `{ pole, growthLens }` with `priority({ primary: ['pole'], secondary: ['growthLens'] })`. `output` keeps the pole as legitimate operation output; it is simply no longer its only home |
| 4 | `src/pages/stratos.tsx` | The `label !== 'Carried to the board agenda'` filter is deleted. The agenda action renders as a live control that calls `toggleFocus('officer:<tension id>')` and scrolls that officer's panel into view. Both hooks already exist: `Agenda` builds its panels with `elId = 'officer:' + t.id` and `AnswerPanel` stamps it as `data-el`, so the target is `[data-el="officer:<id>"]` and focusing it lifts that card to `focus` depth |
| 5 | `src/lib/stratos/answer-sets.ts` | Officer `questions` becomes a real array. `AnswerPanel` branches on `Array.isArray(field.value)` instead of `String(...).split(' · ')` |
| 6 | `src/lib/stratos/answer-sets.ts` | Comments corrected: `repr()` is described as a sign carrier rather than a position; the officer density note is restated as an information claim rather than as pattern steering |

### What does and does not move

Change 3 adds a second payload key to placed tensions but keeps exactly one
declared `primary` key, so the derived density stays 1. Density is irrelevant
here regardless: `PATTERN_ACTIONABLE_OPERATION` matches `densities: "any"`, so
placed tensions stay on `action-panel` at every depth. What does change is the
projection — at `glance` the single visible field becomes `pole` instead of
`growthLens`, and at `inspect` both appear. Neutral tensions stay on
`operation-detail`. Officer and verdict answers are untouched by 3 and keep
their `stat → stat → detail → detail` and `badge → badge → detail → detail`
progressions.

The officer and verdict field declarations (`primary: ['function']`,
`secondary: ['because']`, `supporting: ['mandate', 'questions']`) are a
defensible information model and are kept as-is. Only the comment that
describes them as chosen to hit a pattern is rewritten — change 6.

Change 1 removes one trace entry from every tension answer, which changes
`recipes.generated.ts` but no pattern, control, or component decision, since
`resolveAffordances` keys on the *presence* of a trace, not its contents.

## Section 3 — Verification

Every item is a command whose output is checked, not an assertion:

1. `npm run schema:pin:check --workspace packages/facia-core` — passes with the
   pin file unmodified in `git status`, proving the schema did not move.
2. `npm run test --workspace packages/facia-core` — including new unit tests for
   each authoring constructor: correct output shape, `FaciaAuthoringError` on
   empty input, omitted priority buckets filled with `[]`, and inputs not
   mutated.
3. `npm run typecheck` — app and facia type tests, with `grep -rn 'as unknown as'
   src/lib/stratos api/_lib` returning nothing.
4. `npm run gen:stratos` — regenerates cleanly; the generator already aborts on
   any resolution failure, so a green run is proof all 31 keys × 4 depths still
   resolve.
5. `git diff src/lib/stratos/recipes.generated.ts` — reviewed to confirm the only
   changes are the removed `position.declared` trace entry, the `pole` payload
   key replacing `growthLens` as the primary projection, and `questions` becoming
   an array. No `pattern`, `density`, or `inspectionControls` value changes.
6. `npm run test:app` — including a new test in
   `src/lib/stratos/answer-sets.test.ts` asserting every builder's output passes
   `validateAnswerSet` directly. Nothing checks this outside the generator today.
7. Browser check via `preview_start`: place a tension, confirm the agenda action
   is clickable and reveals the officer card, confirm the trace no longer shows a
   position, and confirm no console errors.

## Deferred — the Facia UI layer

`AnswerPanel` never reads `recipe.components`. `SemanticSurface` honors three of
the twenty-two rows in `COMPONENT_RECIPE_MANIFEST`. Facia emits inspection
control *names* but no transition semantics, so the two renderers invented their
own independently: `nextElementDepth()` makes `inspect` a glance↔inspect toggle,
while StratOS discards `inspect`/`expand` entirely and drives depth from
hover/focus/audit page state.

The intent is one portfolio-side Facia UI layer, wired uniformly across the
site, owning both the component vocabulary and the interaction semantics — with
Facia itself staying renderer-neutral. That is its own brainstorm and its own
spec, to be started after this work lands.
