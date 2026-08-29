# Context index pipeline

Deterministic normalize/chunk pipeline for the private AI-chat-history corpus, ported
from `experiments/global-index-routing/` after that experiment settled the chunking
strategy. See `docs/superpowers/specs/2026-08-29-local-context-retrieval-architecture-handoff.md`
and the experiment's `local/FINAL_OUTCOME.md` for the full evidence and rationale.

## Selected strategy (unchanged from the experiment)

- Exchange-parented, heading-aware prose rows (`topic-rows.tsv`), with fenced
  code/config split into a separate index (`code-rows.tsv`).
- 100 lines is a hard ceiling, not a target chunk size.
- Corpus-wide TF-IDF-style keywords per row, not local raw frequency.
- Every row carries file/exchange/source-line provenance for later expansion
  (matched row → adjacent topics → whole exchange).

## Scripts

- `scripts/context-normalize.mjs` — reads the raw ChatGPT/Claude/Gemini/Drive
  exports from a read-only source root and writes a normalized UTF-8 corpus plus
  `manifest.json`/`inventory.tsv`. Ported unchanged from
  `experiments/global-index-routing/scripts/normalize.mjs`.
- `scripts/context-build-index.mjs` — reads that normalized snapshot and writes
  `topic-rows.tsv`, `code-rows.tsv`, `all-rows.tsv`, `exchanges.tsv`, `stats.json`.
  Ported unchanged from `experiments/global-index-routing/local/build-topic-chunks.mjs`.

Both scripts create their output directory exclusively (`{ recursive: false }` /
`flag: 'wx'`) so a run never silently overwrites prior output.

```sh
npm run context:normalize -- --source-root="/path/to/AI Chat History" --output-dir=.context-index/normalized
npm run context:build -- --snapshot-dir=.context-index/normalized --output-dir=.context-index/topic-index
```

## Generated data

`.context-index/` is git-ignored. It currently holds the already-built output from
the experiment's proven run (1,022 transcripts, 3,583 exchanges, 14,595 topic rows,
10,399 code rows — matches `local/FINAL_OUTCOME.md`'s selected index structure):

```text
.context-index/normalized/corpus/       normalized transcripts/documents/artifacts
.context-index/normalized/manifest.json per-record provenance + content hashes
.context-index/normalized/inventory.tsv small all-file catalog
.context-index/topic-index/topic-rows.tsv
.context-index/topic-index/code-rows.tsv
.context-index/topic-index/all-rows.tsv
.context-index/topic-index/exchanges.tsv
.context-index/topic-index/stats.json
```

## Parquet conversion and R2 upload

```sh
node scripts/context-convert-parquet.mjs \
  --topic-index-dir=.context-index/topic-index \
  --normalized-dir=.context-index/normalized \
  --output-dir=.context-index/parquet

R2_ACCOUNT_ID=... R2_ACCESS_KEY_ID=... R2_SECRET_ACCESS_KEY=... R2_BUCKET=... \
  node scripts/context-upload.mjs --input-dir=.context-index/parquet
```

`context-convert-parquet.mjs` reads all TSV columns as `VARCHAR` (no type
auto-detection — a `date` column full of mostly-dates and one `undated` would
otherwise trip DuckDB's CSV sniffer) and casts only the known integer columns
(`*_ordinal`, `start_line`, `end_line`). `chunk_text_json` is carried through as
the same JSON-encoded string produced by `context-build-index.mjs`; callers
`JSON.parse` it after querying.

`context-upload.mjs` uploads every `*.parquet` file in the input directory to
`s3://$R2_BUCKET/$R2_PREFIX/<file>` via R2's S3-compatible API.

## Query module and endpoint

`api/_lib/context-index.ts` implements the FINAL_OUTCOME retrieval policy as SQL
over the R2-hosted Parquet files, queried in place via DuckDB's `httpfs`
extension (no local download):

```text
kind: catalog        -> inventory.parquet (file_path / summary ILIKE term)
kind: prose          -> topic-rows.parquet (preview/headings/keywords/text ILIKE term)
kind: code           -> code-rows.parquet  (same)
expansion: neighbors -> for each match's exchange, matched TOPIC row +/- 1 in all-rows.parquet
expansion: exchange  -> every row in the match's exchange, from all-rows.parquet
```

The `read_parquet()` path is always a config-derived constant, quoted inline
(DuckDB table functions need a bind-time-constant path); only the caller's
search term or an exchange id is ever a bound parameter.

`POST /api/context-query` (`api/context-query.ts`) wires this into a Vercel
**Node.js** function — deliberately not Edge, since `@duckdb/node-api` needs
native bindings that Edge's V8 isolate can't load. It's the only non-Edge route
in `api/`. Because the index contains private transcript material, callers must
authenticate with the server-side `CONTEXT_QUERY_API_KEY`; do not expose this
key to browser code.

```sh
curl -X POST http://localhost:3000/api/context-query \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $CONTEXT_QUERY_API_KEY" \
  -d '{"term": "trustable change model", "kind": "prose", "expansion": "neighbors"}'
```

Response: `{ "protocol": "portfolio.context-query/1", "trace": [...], "results": [...] }`.

## Not yet done

Converting a natural-language question into a `context-query` call — i.e.
extending Portfolio's existing deterministic question grammar
(`api/_lib/question-grammar.ts`) or adding a constrained compiler in front of
this endpoint — is still open, along with the harder ownership questions in the
architecture handoff (public vs. local-agent authority over this corpus,
Libera/Facia boundary). This port only makes the proven retrieval mechanism
queryable; nothing calls it yet.
