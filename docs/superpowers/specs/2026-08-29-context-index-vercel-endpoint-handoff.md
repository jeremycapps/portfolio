# Context-index Vercel endpoint — handoff

**Date:** 2026-08-29
**Status:** production deployed with a persistent DuckDB FTS index, bearer-protected, and verified against live R2
**Worktree:** `/Users/jeremycapps/Dev/portfolio/worktrees/tidy-panda-20260829` (branch `tidy-panda-20260829`)
**Picks up from:** `docs/superpowers/specs/2026-08-29-local-context-retrieval-architecture-handoff.md` and `experiments/global-index-routing/local/FINAL_OUTCOME.md`

## Current production state

`POST https://www.jeremycapps.com/api/context-query` is live on Vercel deployment `dpl_9sVAoA6yYPFXoNZDc7UgrLArKMzS`.

- Production has the four required R2 variables and a sensitive `CONTEXT_QUERY_API_KEY`.
- Anonymous requests fail closed with `401 UNAUTHORIZED`.
- The production build created and uploaded `context-index/context-index.duckdb`: 31,469,568 bytes, 24,994 searchable rows, and 1,101 catalog rows.
- Retrieval uses persistent DuckDB FTS/BM25 indexes instead of scanning the Parquet corpus with `ILIKE` on every request.
- The bearer key must remain server-side. A future caller should be another server-side route or trusted agent, not browser JavaScript.

## Currently blocked

The deployed retrieval primitive is not blocked. An authenticated benchmark of this specific deployment still needs the existing bearer value; Vercel does not return sensitive environment-variable values, and the key was deliberately not rotated. Natural-language question routing and answer synthesis remain open.

## What's done and verified

- **Ported chunking pipeline**: `scripts/context-normalize.mjs` and `scripts/context-build-index.mjs`. The generated private corpus remains git-ignored: 1,022 transcripts, 3,583 exchanges, 14,595 topic rows, and 10,399 code rows.
- **Parquet source artifacts**: `scripts/context-convert-parquet.mjs` preserves exact row-count parity and JSON round trips. Parquet remains the rebuild/source format in R2.
- **Persistent search database**: `scripts/context-search-db-lib.mjs` and `scripts/context-build-search-db.mjs` materialize `search_rows` and `catalog_rows`, create DuckDB FTS indexes plus an `exchange_id` ART index, and checkpoint a self-contained `context-index.duckdb`.
- **One-time R2 rebuild/upload**: `scripts/context-reindex-r2.mjs` runs only when `CONTEXT_REINDEX_ON_BUILD=1`. It reads the existing R2 Parquet files, builds the database in Vercel's temporary filesystem, uploads the database, and removes the temporary copy. The flag was supplied with `vercel deploy --build-env`; it is not persistent, so ordinary builds do not mutate R2.
- **Query module**: `api/_lib/context-index.ts` attaches the R2 database read-only and uses persistent BM25 search. Expansion fetches all relevant exchanges in one parameterized `IN (...)` query and selects neighbors in memory, replacing one R2 query per match.
- **Reusable runtime**: `api/_lib/context-runtime.ts` caches one initialized DuckDB instance per warm Vercel process. Initialization installs/loads `httpfs` and `fts`, enables DuckDB's object cache, attaches the remote database once, and validates its protocol. Each request gets a short-lived connection on that shared instance.
- **API layer**: `api/_lib/context-core.ts` validates the constrained JSON contract. `api/context-query.ts` is a Node.js Vercel Function because `@duckdb/node-api` needs native bindings; it requires a timing-safe bearer-token match before querying the private corpus.
- **Vercel packaging**: `.vercelignore` excludes tests. Production contains the four intended functions; `api/context-query` packages at 22.93 MB in `iad1`.
- **Tests**: 36 focused context tests, including warm-runtime reuse/retry and batched expansion. Full suite: 320 app tests plus 113 Facia tests. `npm run typecheck` and `npm run build` are clean.

## Why SQL and what the model should do

SQL is the internal execution language because DuckDB is the embedded query engine and its FTS extension exposes BM25 ranking through SQL. Neither the browser nor a model should generate SQL. The caller submits only validated `ContextQuery` JSON: `term`, `kind`, `expansion`, and `limit`. Static backend statements bind the term and exchange ids.

The intended client/model flow is:

```text
browser -> POST /api/chat -> query-planning model -> validated ContextQuery JSON
        -> server-side DuckDB retrieval -> answer model -> readable streamed answer
```

The browser must not call `/api/context-query` directly because that would expose its bearer key. The existing same-origin chat/answer route should own both the constrained query-planning call and the final grounded answer call.

## Remaining live risks and next work

- **Cold initialization still installs extensions.** A new process installs/loads `httpfs` and `fts` into `/tmp/duckdb-extensions` before attaching the database. Warm requests reuse the initialized instance. Bundling the extensions is the next cold-start optimization if production measurements justify it.
- **Production retrieval latency needs one authenticated rerun.** Local direct-database checks were 3.91 ms for catalog, 8.17 ms for code, 11.22 ms for exchange expansion, and 28.32 ms for neighbor expansion. These do not include Vercel cold start or R2 network overhead. The deployed anonymous auth check was 401 in 0.415 seconds.
- **The endpoint has no app caller.** Nothing in the app invokes `/api/context-query` yet. Implement the server-side query planner and result synthesizer in the existing chat/answer flow; do not put the private bearer in the browser.

## Commits and production evidence

- `29bb282` — Noble Tide pipeline, Parquet, R2, query endpoint, tests, and docs.
- `fe9c9b2` — Vercel Node adapter, explicit ESM extensions, regression coverage, and deployment ignores.
- `2e87a47` — writable DuckDB home directory for Vercel.
- `98018dd` — server-side bearer protection.
- `d305a75` — persistent FTS pipeline, R2 reindex/upload, module-scoped DuckDB runtime, object caching, and batched expansion.
- Previous Parquet-backed production verification: `dpl_FXFypVXz3EAAvWQVRQT5qDVZGN3b`; authenticated catalog, prose, and code queries all returned 200.
- Current FTS production deployment: `dpl_9sVAoA6yYPFXoNZDc7UgrLArKMzS`, Ready and aliased to `www.jeremycapps.com`. Its build log confirms the R2 database upload; the live anonymous query fails closed with 401.
