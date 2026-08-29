# Context-index Vercel endpoint — handoff

**Date:** 2026-08-29
**Status:** production deployed, bearer-protected, and verified against live R2
**Worktree:** `/Users/jeremycapps/Dev/portfolio/worktrees/tidy-panda-20260829` (branch `tidy-panda-20260829`)
**Picks up from:** `docs/superpowers/specs/2026-08-29-local-context-retrieval-architecture-handoff.md` and `experiments/global-index-routing/local/FINAL_OUTCOME.md` (the ivory-stream session — see that doc for why this chunking strategy was chosen)

## Current production state

`POST https://www.jeremycapps.com/api/context-query` is live on Vercel deployment `dpl_FXFypVXz3EAAvWQVRQT5qDVZGN3b`.

- Production has the four required R2 variables and a generated sensitive `CONTEXT_QUERY_API_KEY`.
- Anonymous requests fail closed with `401 UNAUTHORIZED`.
- Authenticated `catalog`, `prose`, and `code` queries return `portfolio.context-query/1` results from R2.
- The bearer key must remain server-side. A future caller should be another server-side route or trusted agent, not browser JavaScript.

## Currently blocked

Nothing blocks the deployed retrieval primitive. Wiring it into natural-language question routing remains intentionally out of scope.

## What's done and verified

The pipeline and retrieval behavior are unit-tested and syntax/type-checked. The Vercel Node entrypoint has been built and invoked in production against real R2 data.

- **Ported chunking pipeline** (from `experiments/global-index-routing/`, unchanged logic):
  - `scripts/context-normalize.mjs`, `scripts/context-build-index.mjs` — the two builders, ported byte-for-byte except filenames in usage strings. (Caught and fixed one mangled `<NUL>` → raw-NUL-byte bug during the port; verified clean with `perl -ne 'print if /\x00/'` and `node --check`.)
  - `.context-index/normalized/`, `.context-index/topic-index/` (git-ignored) — the actual already-built output copied in from the experiment's `/private/tmp` run. Verified against `FINAL_OUTCOME.md`'s selected index structure: 1,022 transcripts, 3,583 exchanges, 14,595 topic rows, 10,399 code rows.
- **Parquet conversion**: `scripts/context-convert-parquet.mjs`. Run and verified — exact row-count parity with the TSVs, `chunk_text_json` round-trips through Parquet and re-`JSON.parse`s correctly. Output sits in `.context-index/parquet/` (git-ignored).
- **R2 upload**: `scripts/context-upload.mjs`. Written and syntax-checked; the user confirmed the five files were successfully uploaded after the Noble Tide session. Takes `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET`, optional `R2_PREFIX` (default `context-index`) and `R2_ENDPOINT` (default `<account-id>.r2.cloudflarestorage.com`; override only if R2 gave a jurisdiction-specific host).
- **Query module**: `api/_lib/context-index.ts`. Implements the FINAL_OUTCOME policy (catalog → topic/code ILIKE match → neighbor/exchange expansion) as SQL over `read_parquet()`. The `read_parquet()` path is always inlined as a quoted literal (table-function args must be bind-time constants in DuckDB); only the search term / exchange id is ever a bound parameter. Local and production R2 queries are verified, including catalog, topic/code search, neighbor expansion, and whole-exchange expansion.
- **API layer**: `api/_lib/context-core.ts` (validation + Fetch handler, DI'd `runQuery` for testability) and `api/context-query.ts` (the actual Vercel entrypoint). **This is the one non-Edge route in `api/`** — no `config = { runtime: 'edge' }` export, because `@duckdb/node-api` needs native bindings Edge's V8 isolate can't load. The entrypoint uses explicit `.js` ESM specifiers, adapts Vercel's Node request/response objects to the tested Fetch contract, and requires a timing-safe bearer-token match before querying the private corpus. Every other route (`chat`, `answer`, `resume`) is still Edge.
- **Vercel packaging**: `.vercelignore` excludes `*.test.ts(x)` so test files are not exposed as API functions. The production build contains four intended functions; `api/context-query` packages at 22.93 MB.
- **Tests**: 34 context-index tests across `context-index.test.ts`, `context-core.test.ts`, `context-query.test.ts`. Full suite: 318 app tests + 113 facia-core tests, all passing. `npm run typecheck` and `npm run build` are clean.
- **Docs**: `docs/context-index.md` has the full pipeline writeup (commands, schema, "not yet done" section) — read that for the mechanical how-to; this file is the session handoff.

## Remaining live risks

- **`INSTALL httpfs` at cold start.** This downloads the extension into `/tmp/duckdb-extensions`. A missing DuckDB home directory caused the first production failure; `home_directory='/tmp'` now fixes it. Successful authenticated queries took 0.88–4.19 seconds end to end in the smoke run. If cold latency matters, consider bundling the extension at build time or reusing a process-level DuckDB instance.
- **The endpoint has no caller.** Nothing in the app invokes `/api/context-query` yet — it is a bearer-protected queryable primitive, not wired into `question-grammar.ts` or the chat/answer flow. That's explicitly out of scope for this handoff (see `docs/context-index.md`'s "Not yet done").

## Commits and production evidence

- `29bb282` — cherry-pick of the Noble Tide pipeline, Parquet, R2, query, endpoint, tests, and docs implementation.
- `fe9c9b2` — Vercel Node adapter, explicit ESM extensions, regression coverage, and deployment-ignore rules.
- `2e87a47` — configure DuckDB's writable Vercel home directory before installing `httpfs`.
- `98018dd` — require a server-side bearer key before exposing private transcript results.
- Verified production: `dpl_FXFypVXz3EAAvWQVRQT5qDVZGN3b`, Ready and aliased to `www.jeremycapps.com`. Anonymous query: 401. Authenticated prose-neighbor query: 200, two results. Authenticated prose-exchange query: 200, 17 results. Catalog and code queries: 200, two results each. Final runtime logs contain successful 200 invocations with no errors.
