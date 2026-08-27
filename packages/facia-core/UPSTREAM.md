# Vendored Facia provenance

This package was imported from `https://github.com/jeremycapps/facia.git` at
commit `77914c146c29776cb2cf179bec9b0b52fa954656`.

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
