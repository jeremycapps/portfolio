---
title: "Facia v2 — Design"
slug: facia-v2-design
date: 2026-08-18
summary: Facia turns an answer into a UI recipe, deterministically — answer → shape → pattern → affordances → recipe. The ratified design of the contract that renders the structured answers on this very site.
kind: article
status: Ratified · August 2026
sourceUrl: https://github.com/jeremycapps/facia
---

## What Facia is

Facia turns an **answer** into a **UI recipe**, deterministically.

```text
answer  →  shape  →  pattern  →  affordances  →  component recipe
```

That is the whole of Facia. It does not evaluate domain truth, plan queries,
execute operations, or paint pixels. It receives an already-answered,
semantically-classified record and decides how that answer should be presented.

### The two concerns, and why only one is Facia

Every prior version of Facia tangled two different jobs. They are now cut apart:

```text
question ─▶ [ Concern B ] ─▶ query ─(execute)─▶ answer ─▶ [ Concern A ] ─▶ UI recipe
            questions→queries                              answers→recipes
            Libera / query planning                        FACIA
            NOT this project                               this project
```

- **Concern A — Facia.** Answers → UI recipes. Deterministic by construction,
  because its input is a *contract* (the AnswerSet), never a raw answer it must
  interpret. Classifying an answer into a shape is Facia's front door, not a
  separate layer.
- **Concern B — not Facia.** Compiling a question into a deterministic query is
  an upstream Libera concern (`modelir` / Domain / Strategy). Whether the
  AnswerSet's shape-bearing facts were declared or inferred lives entirely on
  the far side of the query→answer boundary. Facia never sees it.

This document specifies Concern A only.

## Lineage

Facia v2 keeps the working skeleton of `@facia/answer-runtime` and re-folds the
richer semantics of `@facia/core` into it.

| Kept from `@facia/answer-runtime` (the newer, tested spine) | Absorbed from `@facia/core` |
|---|---|
| AnswerSet input contract + pinned JSON Schema | Per-field information priority |
| `validate → resolveShape → resolvePattern → resolveAffordances → toComponentRecipe` | Conditional promotion |
| Affordances (inspection + operations) and component recipes | Cumulative disclosure depth |
| SHA-256 release pin and the Domain bridge | The `convergence` answer role |
| Golden fixtures and conformance tests | |

`@facia/core`'s `resolveSurface` and its `FaciaSurface` model are **superseded**;
their ideas survive as the field-information layer described below, not as a
second codebase.

## Answer roles

Four roles, forming a ladder of composition. Each rung answers a question of a
higher order than the last:

| Role | Composition | Answers | Example |
|---|---|---|---|
| **Value** | atomic — one fact | what is known | "Who owns this task?" |
| **Verdict** | composite — many facts → one judgment | what has been judged | "Is this task complete?" |
| **Operation** | directional — a judgment → a change | what change is enacted or offered | "What do we do once it's complete?" |
| **Convergence** | converging — a *sequence* of changes → a trajectory | whether repeated motion approaches the goal | "Did this move us closer or further?" |

Two deliberate decisions:

- **`Operation` replaces both `transform` and `transition`.** One role covers a
  change that was *enacted* (the record: operation id + input + output) and the
  affordances to *invoke* one. The record form and the affordance form are two
  faces of the same role, not two roles.
- **`Convergence` is restored.** It is the only role that judges a *history over
  time* rather than a single current state — which is exactly why it is carried
  over a sequence/`trace` and cannot be faked by the other three. Dropping it in
  `@facia/answer-runtime` was a regression, not a simplification.

## Input contract: AnswerSet v2

The AnswerSet is Facia's public boundary. Any producer that emits a conforming
AnswerSet can drive Facia to a recipe — a hand-written fixture, a mock, another
app, or the libera Domain bridge. Facia loads no producer code.

```ts
type AnswerRole = "value" | "verdict" | "operation" | "convergence";
type AnswerPath = "meaning" | "execution";
type Structure  = "dimension" | "group" | "sequence";
type SequenceKind = "temporal" | "dependency" | "trace";

type Priority = "primary" | "secondary" | "supporting" | "audit";

interface PromotionRule {
  when: { field: string; equals?: unknown; isFalse?: true; isNonEmpty?: true };
  promote: string[];   // field keys raised to `primary` when `when` holds
}

interface FieldInfo {
  priority: Record<Priority, string[]>;   // field keys by declared priority
  promotion?: PromotionRule[];
}

interface AnswerSetV2 {
  schema: "facia.answer-set/2";
  question: string;
  answerType: AnswerRole;
  path: AnswerPath;
  inspection: "none" | "available";
  actionable: boolean;              // === operations.length > 0
  items: [Item, ...Item[]];         // non-empty
  operations: OperationDescriptor[];
  structure?: Structure;            // forbidden when items.length === 1
  sequenceKind?: SequenceKind;      // required iff structure === "sequence"
  trace?: unknown;                  // provenance; the substrate for convergence
  fields?: FieldInfo;               // the absorbed field-information layer
  density?: 1 | 2 | 3;              // DERIVED summary; producers may omit
}
```

### The absorbed field-information layer

`@facia/core`'s crown jewel moves here, but it splits cleanly across the seam
because its three pieces are not the same *kind* of thing:

- **Priority + promotion are semantic** — they depend on what the answer means
  and its data. They are *producer* output, declared in `fields` and carried
  inside the AnswerSet, per field.
- **Disclosure depth is a viewing choice** — `glance` / `inspect` / `focus` /
  `audit`. It is a *consumer* parameter, supplied to the pipeline at resolve
  time, not stored on the answer.

`density` is demoted from a hand-stamped scalar to a **derived** summary of the
priority distribution. It remains available as a cheap first-pass input to
shape/pattern selection, but it is no longer the information model — it is a
projection of it.

### Validation

`validateAnswerSet` is total and returns typed error codes (no throws). It
enforces every closed enum and every cross-field invariant:

```text
schema === "facia.answer-set/2"
items non-empty; every item matches answerType and its versioned contract
actionable === (operations.length > 0)
operations: complete descriptors, unique ids
structure forbidden when singular; sequenceKind iff structure === "sequence"
fields (if present): every referenced key exists on the items it scopes
answerType === "convergence" requires trace, either directly
  (items.length === 1 && trace is present) or carried by history
  (items.length > 1 && structure === "sequence" && sequenceKind === "trace")
```

The `fields` reference check is Facia's analogue of `@facia/core`'s loud
field-drift error: a priority or promotion naming an absent key is a validation
failure, not a silent presentation loss.

## The pipeline

All four stages are pure, total functions over the validated AnswerSet plus a
`ResolveContext`. Same inputs → same recipe, always.

```ts
interface ResolveContext {
  depth: "glance" | "inspect" | "focus" | "audit";   // consumer viewing choice
  audience?: string;                                   // default "human" | "agent"
}
```

### 1. `resolveShape(answerSet) → Shape`

Item count and declared structure resolve deterministically to one of nine
shapes:

```text
items.length === 1            → singular-{answerType}
!structure                    → collection
structure === "sequence"      → {sequenceKind}-sequence
else                          → structure           (dimension | group)
```

### 2. `resolvePattern(shape, answerSet, context) → Pattern`

The decision table, with one addition: **disclosure depth participates**, so a
singular answer inspected at `audit` depth resolves to a fuller pattern than the
same answer at `glance`. Each rule emits a `reasonCode`. Examples (not
exhaustive):

```text
singular-verdict + actionable          → review-panel
singular-operation + actionable        → action-panel
singular-verdict + depth ∈ {focus,audit} → detail
singular-verdict + density 1           → badge
singular-convergence (+ trace)         → convergence-panel
collection + density ≤ 2               → list           else → grid
dimension + density ≤ 2                → table          else → comparison-matrix
group + operation                      → board
temporal-sequence                      → timeline
dependency-sequence                    → dependency-tree
trace-sequence                         → audit-trail
trace-sequence + operation + actionable → replay-panel
```

### 3. `resolveAffordances(answerSet, shape, context) → Affordances`

Inspection controls and actions are separate. Inspection is gated by
`inspection === "available"` and by shape (collections gain `filter`/`sort`,
dimensions gain `compare`, traces gain `view-trace`). Disclosure depth bounds
how much inspection is offered. Actions map one-to-one from `operations` with no
inference — Facia never invents an operation.

### 4. `toComponentRecipe(pattern, affordances, answerSet) → Recipe`

A pattern variant maps to an ordered component list, plus inspection and action
controls, plus the answer itself. The recipe is renderer-neutral: it names
components (`DataTable`, `Timeline`, `OperationControls`, …), not framework
widgets. The boundary line travels with it: *renderers consume semantic specs;
they do not evaluate Domain truth.*

## The seam and the standalone guarantee

Facia's boundary is the **AnswerSet data contract**, so Facia runs on its own.

```text
   kernel · modelir · address · strategy      libera runtime — Facia-agnostic
                    │
                 domain/     holds the bridge; emits AnswerSet (pinned)
                    │
                    ▼   facia.answer-set/2  +  SHA-256 pin
   Facia (/Dev/facia)    validate → shape → pattern → affordances → recipe
```

- **Facia is standalone.** It consumes any conforming AnswerSet with zero libera
  code loaded; its tests run on static JSON fixtures. The dependency arrow is
  `Domain → Facia's schema + pin`, never `Facia → Domain`.
- **Domain owns the bridge.** The Domain-answer → AnswerSet normalizer lives in
  Domain, because only Domain — the layer with coordination semantics — can
  classify an answer's role, structure, and priority. The rest of the runtime
  never learns Facia's contract. Aspiration: the bridge dissolves as Domain
  emits AnswerSets natively.
- **Kernel compile-down is conformance, not coupling.** The AnswerSet reduces to
  the kernel `Value` type (RECORD of scalar/list/record Values); a conformance
  check proves it. Facia's runtime operates on plain JSON and never imports the
  kernel. The SHA-256 pin (`facia.answer-set/2` + content hash) keeps the two
  repos honest across releases.

## Boundaries

```text
Facia does not plan queries or interpret questions (Concern B).
Facia does not evaluate Domain truth or infer a verdict.
Facia does not execute operations; it surfaces the affordance to.
Facia does not render; it emits a renderer-neutral recipe.
Facia does not infer shape-bearing facts; it trusts its input contract.
Facia does not import Domain, Strategy, or the kernel at runtime.
```

## Keeper

```text
Facia turns an answer into a UI recipe. Nothing more.

Concern B maps questions to queries.  That is Libera's.
Domain maps its answer to the AnswerSet. That is the bridge.
Facia maps the AnswerSet to a recipe.   That is Facia.
Renderers decide how it looks.          That is theirs.

The AnswerSet is the seam. Facia trusts it, and so runs on its own.
```
