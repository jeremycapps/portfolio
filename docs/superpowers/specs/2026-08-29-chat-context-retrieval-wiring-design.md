# Chat context-retrieval wiring — design

**Date:** 2026-08-29
**Status:** approved design, pending implementation plan
**Worktree:** `/Users/jeremycapps/Dev/portfolio/worktrees/grand-lynx-20260829` (branch `grand-lynx-20260829`)
**Picks up from:** `docs/superpowers/specs/2026-08-29-context-index-vercel-endpoint-handoff.md` and `docs/context-index.md` ("Not yet done")

## Problem

`POST /api/context-query` is deployed to production with a persistent DuckDB
FTS index over the private AI-chat-history corpus, but nothing calls it.
`/api/chat` streams answers grounded only in `content/profile.md`. The
handoff doc specifies the intended boundary:

```text
browser -> POST /api/chat -> query-planning model -> validated ContextQuery JSON
        -> server-side DuckDB retrieval -> answer model -> readable streamed answer
```

This spec wires that boundary into `/api/chat` only. `/api/answer` (the
structured Facia path) is explicitly out of scope — its `QUESTION_NOT_MODELED`
fallback already routes unmodeled questions to chat.

## Goals

- On every chat turn, a query-planning step decides whether the corpus should
  be consulted, and with what `ContextQuery` (`term`, `kind`, `expansion`,
  `limit`), or decides no retrieval is needed.
- When retrieval is needed, the Edge `/api/chat` function reaches the Node-only
  `/api/context-query` endpoint via an internal same-origin HTTP call — the
  DuckDB/Node boundary already built stays exactly as documented.
- Retrieved rows are given to the answer model as dated, sourced working
  context that never overrides `content/profile.md`, per the freshness
  contract in `docs/build-out-semantic-context.md` ("Priority 2").
- Any failure anywhere in planning or retrieval falls back silently to
  today's profile-only behavior. The user-visible chat never breaks or stalls
  because of this feature.
- Production behavior is verifiable three ways: a manual chat-UI check, a
  repeatable scripted smoke test, and Vercel function logs — without ever
  exposing the private bearer key or corpus content to the browser or to logs.

## Non-goals

- No changes to `/api/answer`, Facia, or the structured `AnswerSet` path.
- No changes to `/api/context-query` itself, its auth model, or the DuckDB
  runtime — this spec only adds a caller.
- No heuristic/keyword-based retrieval trigger (rejected approach; see below).
- No UI-visible "searching context…" affordance (rejected approach; see below).

## Approaches considered

- **A — Planner-in-loop before streaming (chosen).** A structured
  query-planning call decides retrieval per turn; on success, a same-origin
  fetch to `/api/context-query` retrieves bounded rows before the stream
  starts. Matches the handoff doc's design exactly and reuses existing
  structured-generation infrastructure.
- **B — Heuristic parallel retrieval, no planning model.** Extend
  `question-grammar.ts` with keyword heuristics fired in parallel with the
  stream, skipping the model call. Rejected: this is exactly the
  hand-rolled-heuristic pile-up `docs/build-out-semantic-context.md` warns
  against, and it contradicts the handoff doc's explicit "query-planning
  model" design.
- **C — Two-stage streaming (status token, then answer).** Stream a
  preliminary "searching context…" token before the real answer. Rejected:
  adds UI/protocol complexity for a cosmetic benefit not asked for.

## Architecture

Two new modules, both plain functions with no cyboflow/DB state of their own:

- **`api/_lib/context-query-planner.ts`** — `planContextQuery(question, history)`.
  A structured-generation call reusing `generateOpenRouterStructured` (same
  `CHAT_MODEL` already configured for chat and for `/api/answer`'s structured
  provider) against a JSON schema whose result is either
  `{ needed: false }` or `{ needed: true, term, kind, expansion?, limit? }`.
  Any refusal, malformed JSON, or timeout is caught internally and normalized
  to `{ needed: false }` — this function never throws.
- **`api/_lib/context-retrieval-client.ts`** — `retrieveContext(query, origin)`.
  Does `fetch(`${origin}/api/context-query`, ...)` with
  `Authorization: Bearer ${process.env.CONTEXT_QUERY_API_KEY}`, a 4-second
  `AbortController` timeout, and returns the typed `ContextRow[] |
  CatalogRow[]` from a 200 response. Throws on any non-200, network error, or
  timeout — the caller is responsible for catching.

`api/_lib/chat-core.ts` changes:

- `buildMessages` becomes `async buildMessages(userMessages, origin)`.
- It calls `planContextQuery`, and — only when `needed: true` — calls
  `retrieveContext` inside a `try/catch`. On any thrown error, the catch logs
  and proceeds exactly as if `needed: false`.
- On a successful retrieval with `results.length > 0`, a new system-role
  block is appended (after `portfolioGrounding()`, before
  `markdownAssistantInstructions()`) formatting each row as
  `[<project>, <date>, <filePath>] <text or preview>`, followed by an explicit
  instruction: *"The material above is dated working context from Jeremy's
  own development history. It may be exploratory, superseded, or informal.
  Treat it as evidence of current or past thinking, never as more
  authoritative than the canonical profile above. Cite it as 'as of `<date>`'
  when you draw on it."*
- `handleChatRequest` passes `new URL(request.url).origin` as `origin` and,
  after building messages, records the outcome (`hit` / `none` / `error`) to
  set response headers and to log — see Observability below.

No other file in the existing chat pipeline (`provider.ts`, `config.ts`,
`rate-limit.ts`, `http.ts`) changes.

## Data flow

1. `handleChatRequest` validates the request as today.
2. `buildMessages(valid.messages, origin)`:
   a. `planContextQuery(latestUserQuestion, history)` — ~3s timeout budget,
      matching the existing structured-generation timeout pattern.
   b. If `needed`, `retrieveContext(query, origin)` — 4s timeout budget.
   c. Assemble the system prompt with or without the context block.
3. `streamChat(messages)` runs exactly as today.
4. The `Response` is constructed with the streamed body plus two additional
   headers set before the stream begins (both computed synchronously from the
   step-2 outcome, so they don't require buffering the stream):
   - `x-context-retrieval: hit | none | error`
   - `x-context-retrieval-count: <N>` (present only when `hit`)

No query term, row content, or the bearer key ever appears in a response
header.

## Error handling

Every failure mode degrades to the current profile-only behavior; none of
them produce a user-visible error or add unbounded latency:

| Failure | Handling |
|---|---|
| Planner refusal / malformed JSON / timeout | `planContextQuery` returns `{needed:false}` internally |
| `CONTEXT_QUERY_API_KEY` not configured | `retrieveContext` throws immediately (no network call); caught by `buildMessages` |
| `/api/context-query` non-200, network error, or 4s timeout | caught by `buildMessages`, treated as no context |
| Retrieval succeeds with zero rows | treated as `none`, not `hit` — no context block added |

## Observability and production verification

Three independent verification paths, per the requirement that this be
confirmed in production rather than only in tests:

1. **Manual chat-UI check.** After deploy, ask the live site a question
   answerable only from the private corpus (not from `content/profile.md`)
   and read the streamed answer for grounded, dated material.
2. **Scripted prod smoke test.** New `scripts/verify-chat-context-prod.mjs`,
   in the style of the existing `scripts/context-*.mjs` scripts: POSTs a
   fixed corpus-only question to the deployed `/api/chat` and asserts
   `x-context-retrieval: hit` and `x-context-retrieval-count > 0` on the
   response.
3. **Server log inspection.** Each request logs one structured line via
   `console.log`/`console.error` (Edge function console output lands in
   Vercel's function logs):
   `{ route: 'chat', contextRetrieval: 'hit'|'none'|'error', kind?, term?, resultCount?, planMs, retrievalMs }`.
   The user's own question terms are logged (diagnostic value); row
   text/content is never logged.

## Testing plan

- `context-query-planner.test.ts` — valid plan JSON parses to a typed
  `ContextQuery`; refusal, malformed JSON, and timeout all normalize to
  `{needed:false}`, mocking the structured-generation dependency (same
  pattern as `api/_lib/structured-provider.test.ts`).
- `context-retrieval-client.test.ts` — success returns typed rows; non-200,
  network error, and timeout all throw, mocking `fetch`.
- `chat-core.test.ts` — `buildMessages` includes the context block only when
  both calls succeed with `results.length > 0`; omits it on planner
  `needed:false`, on retrieval failure, and on zero results; the response
  carries the correct `x-context-retrieval*` headers in each case.
- `scripts/verify-chat-context-prod.mjs` — repeatable scripted prod check
  (see Observability above). Not part of `npm test`; run manually / on demand
  against the deployed URL.
- Manual UI check documented as a release step, not automated.

## Risks and open items carried forward

- **Planning-call latency on every turn.** Approach A adds one blocking
  structured-generation round trip to every chat turn, even when retrieval
  turns out not to be needed. Accepted trade-off per the "every turn"
  decision; revisit only if production latency measurements (from the log
  line's `planMs`) show this materially hurts the "seamless UI" priority.
- **Cold-start extension header timing.** Because the two response headers
  are set before the stream body begins, the planning + (optional) retrieval
  latency is now on the critical path to first byte, not just to first token.
  This is inherent to Approach A and was accepted in the trigger-timing
  decision above.
- **Corpus content is exploratory/self-contradictory by nature.** The
  system-prompt framing instructs the model to treat retrieved rows as
  dated working context, not settled fact, per
  `docs/build-out-semantic-context.md`'s freshness contract. This is a
  prompting mitigation, not a structural guarantee — worth revisiting if the
  live chat starts overstating unsettled material as fact.
