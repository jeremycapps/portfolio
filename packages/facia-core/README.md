# `@facia/core`

`@facia/core` validates `facia.answer-set/2` data and deterministically resolves
it into renderer-neutral component recipes.

```text
validateAnswerSet
  → resolveShape
  → resolvePattern
  → resolveAffordances
  → toComponentRecipe
```

`resolveAnswerSet` composes that complete pipeline and stops at the validation
boundary when input is invalid.

## Requirements

- Node.js 20 or newer
- Plain JSON AnswerSet input
- A closed resolve context with required `depth`

The package's only runtime dependency is AJV. It loads no Libera, Domain,
Strategy, kernel, renderer, framework, or application modules.

## Usage

```ts
import {
  resolveAnswerSet,
  validateAnswerSet,
  type AnswerSetV2,
} from "@facia/core";

const answer = {
  schema: "facia.answer-set/2",
  question: "Who owns this task?",
  answerType: "value",
  path: "meaning",
  inspection: "available",
  actionable: false,
  items: [
    {
      type: "Value",
      payload: { owner: "Ada", blocked: false },
      value: "Ada",
      fields: {
        priority: {
          primary: ["owner"],
          secondary: ["blocked"],
          supporting: [],
          audit: [],
        },
      },
    },
  ],
  operations: [],
} satisfies AnswerSetV2;

const validation = validateAnswerSet(answer);
if (!validation.valid) {
  console.error(validation.errors);
} else {
  const result = resolveAnswerSet(validation.value, {
    depth: "inspect",
    audience: "human",
  });
  if (result.ok) console.log(result.recipe);
}
```

`depth` is one of `glance`, `inspect`, `focus`, or `audit`. `audience` is an
optional non-empty semantic identifier and defaults to `"human"`. Audience is
carried into the recipe but does not change v2 decisions. Extra context members,
callbacks, renderer objects, and styling are rejected.

## Public API

The package entry point exports:

- `validateAnswerSet`
- `resolveShape`
- `resolvePattern` and `resolvePatternDecision`
- `resolveAffordances`
- `toComponentRecipe`
- `resolveAnswerSet`, the composed public pipeline
- field promotion, disclosure, and density helpers
- normative shape, pattern, inspection, and component manifests plus audits
- the reviewed v2 TypeScript types
- the schema identity, package path, and SHA-256 pin constants

Every shape, pattern, and inspection decision carries a stable reason code and
explanation. Actions contain operation descriptors exactly as supplied and in
the same order. They are semantic affordances only: Facia never invokes them.

Recipes contain plain JSON data, semantic component identifiers, visible-field
priority metadata, inspection controls, and operation descriptors. They do not
contain framework widgets, CSS, callbacks, executable operations, Domain
objects, or kernel objects.

## Canonical schema and pin

| Property | Value |
|---|---|
| Schema identifier / `$id` | `facia.answer-set/2` |
| Public schema path | `@facia/core/schemas/facia-answer-set.v2.schema.json` |
| Machine-readable pin | `@facia/core/schemas/facia-answer-set.v2.pin.json` |
| SHA-256 | `0fa2230a3db63be2684230c9e8b9da490b8705033974afd155856b28388dc45b` |

The hash is computed from the exact committed schema bytes:

```bash
npm run schema:pin:check --workspace packages/facia-core
```

For an intentional schema change, regenerate both checked-in pin artifacts and
review them with the schema change:

```bash
npm run schema:pin --workspace packages/facia-core
```

## Verification

From the repository root:

```bash
npm test
npm run build
npm run test:types --workspace packages/facia-core
npm run schema:pin:check --workspace packages/facia-core
```

See [`../../docs/facia-v2-migration.md`](../../docs/facia-v2-migration.md) for
the intentionally breaking migration from the retired surface and v1 runtime
contracts.
