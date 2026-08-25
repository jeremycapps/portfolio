# Facia markdown Producer + answer cache — design

Date: 2026-08-22
Status: Design approved in brainstorming; Phase 1 to be implemented first.

## Problem

Every deterministic answer today requires a hand-authored TypeScript function
in `api/_lib/portfolio-answer-source.ts` (`zocdocAnswerSet()`,
`technologiesAnswerSet()`). That does not scale: each new question is a code
change. Meanwhile unmodeled questions fall through to the raw chat path
(`/api/chat` → `text/plain` → `chat-view.tsx` renders `{m.content}` with only
`white-space: pre-wrap`), so the model's markdown shows up literally
(`1.`, `**bold**`, `### heading`). Two answer surfaces, two failure modes.

## The architecture we are working with

Facia states its own boundary (github.com/jeremycapps/facia): Facia
"does not interpret questions, evaluate domain truth, execute operations, or
render pixels." The in-repo copy encodes it as
`RENDERER_BOUNDARY = "Renderer consumes semantic specs; it does not evaluate
Domain truth."` (`packages/facia-core/src/recipe.ts`). Three roles:

| Role | In this repo |
|---|---|
| **Producer** — supplies answer data (`AnswerSetV2`) | `portfolio-answer-source.ts` (hand-authored) |
| **Facia** — validates + resolves to a `ComponentRecipe` | `@facia/core` (`resolveAnswerSet`) |
| **Renderer** — turns the recipe into pixels | `src/components/facia/semantic-surface.tsx` |

`AnswerSetV2` is the seam. Everything below keeps that seam fixed.

## The inversion

A model emitting markdown is just another **Producer**. Instead of one TS
function per question, add **one generic Producer** that maps markdown →
`AnswerSetV2`, then let the existing Facia pipeline + renderer do the rest.
Add a **cache** so a produced answer is reused: unmodeled questions accrete
into deterministic ones over time. The cache is the bridge between
model-authored and hand-authored — it is what eventually retires the
hand-authored TS Producers.

```
question
  ├─ hand-authored Producer matches?  → AnswerSet (evidence-backed)   [retire in Phase 2+]
  ├─ cache hit (normalized Q + valid pins)? → AnswerSet (deterministic replay)
  └─ miss → model emits markdown → parse → AnswerSet (model-authored)
                                            └─ store in cache ─────────┘
                                  ↓
                       Facia (@facia/core, untouched)
                                  ↓
                       SemanticSurface (+ detail/table patterns)
```

All three branches emit the same `AnswerSetV2` shape, so Facia and the renderer
never know which path produced an answer.

## Phasing

- **Phase 1 — markdown Producer as fallback.** Unmodeled question → model
  markdown → deterministic parse → `AnswerSetV2` → Facia → SemanticSurface,
  tagged model-authored. Ends per-question TS for the long tail; fixes the
  raw-markdown symptom. No cache. **Implemented first.**
- **Phase 2 — answer cache.** Normalized question → stored `AnswerSetV2` +
  schema pin + profile hash, in Upstash Redis. Hit = deterministic replay;
  miss = produce + store. Once proven, retire hand-authored Producers.
  **Designed here, implemented next.**
- **Phase 3 — curation.** Review/promote cached model answers to "verified";
  semantic-similarity matching so paraphrases hit one entry. **Sketched only.**

---

## Phase 1 — detailed design

### New module: `api/_lib/markdown-answer-producer.ts`

Pure function `markdownToAnswerSet(question: string, markdown: string):
AnswerSetV2`. Deterministic; no network. Uses a small markdown parser
(`marked` lexer → token list; ~30KB, no runtime deps) to get an AST, then maps:

| Markdown token | AnswerSet mapping | Facia shape → pattern |
|---|---|---|
| A single top-level list (`-` / `1.`) | `answerType: 'value'`, one Value item per list item; item text → `value`; a leading `**Label:**` → a field; inline link → `url` field | `collection` → `list` |
| Paragraph(s) only (prose) | `answerType: 'value'`, a single Value item; prose → `summary` field | `singular-value` → `detail` |
| Inline link (any of the above) | `url` field, scheme-allowlisted to `https:`/`mailto:` | rendered as the existing chip |

Rules:
- Deterministic and total: any markdown maps to *some* valid `AnswerSetV2`
  (worst case, the whole string becomes one prose `detail` item). It never
  throws; on a parse it cannot classify, it degrades to prose.
- Every produced item is tagged `evidenceTier: 'model-authored'` with
  `evidence.status: 'model-generated'` (contrast the hand-authored
  `'profile-grounded'`). This drives the renderer's provenance tag.
- `trace` records `{ producer: 'markdown', id: 'portfolio.model.v1' }` so the
  audit depth still shows where the answer came from.
- Field priority: `value`/first field → primary (glance), other fields →
  secondary, `evidenceTier`/`source` → audit. `url` → primary so the chip is
  reachable at glance (matches the technologies Producer).

Security posture: markdown is parsed to **data**, never to HTML. There is no
`dangerouslySetInnerHTML`, no sanitizer, no CSP requirement — model text only
lands in React text nodes and the scheme-checked chip anchor. This is the main
reason Phase 1 is chosen over rendering model HTML directly (the DEA-001 path).

### Model call: `api/_lib/answer-core.ts`

`handleAnswerRequest` gains a fallback after the hand-authored Producers miss:
1. Call the model for a **complete** (non-streamed) markdown answer using
   `systemPrompt()` + the question. Drain `streamChat` (`provider.ts`) to a
   single string server-side.
2. `markdownToAnswerSet(question, markdown)` → `AnswerSetV2`.
3. `resolveAnswerSet(answerSet, { depth })` → recipe, returned in the existing
   `StructuredAnswerResponse` envelope.

Consequence: `/api/answer` stops returning `QUESTION_NOT_MODELED` for
answerable questions. The chat path (`/api/chat`, `sendChat`) is retained only
for genuinely conversational/interactive turns (follow-ups, the
"send me a message" choice flow), not for single Q&A.

### Prompt contract: `content/profile.md`

Add a short output-format contract to the "How the assistant should talk"
section naming the markdown subset the model may emit: headings, unordered/
ordered lists, tables, links, emphasis, inline code — and nothing else (no raw
HTML, no images). Small edit; makes the parser's job clean and total.

### Renderer: `src/components/facia/semantic-surface.tsx`

- Add a `detail` pattern branch (single prose item) alongside the existing
  `List` branch. (`table`/`comparison-matrix` is deferred — see Out of scope.)
- Add a **provenance tag** for model-authored items — reuse the resume surface's
  precedent (`resume-surface.tsx` shows `deterministicPct` / "model-written").
  A small "model-written" chip in the item or header when
  `evidenceTier === 'model-authored'`.

### Streaming / UX

The parser needs the complete answer, so a produced (uncached) answer shows a
thinking indicator while the model generates, then renders the finished Facia
surface — no token-streaming into a bubble, no per-delta re-parse. Cached hits
(Phase 2) render instantly.

### App integration: `src/App.tsx`

The `sendStructuredAnswer` → `QUESTION_NOT_MODELED` → `sendChat` fallback
(around `App.tsx:117`) collapses: structured answers now cover the long tail, so
the chat fallback is reached only for conversational turns. Keep the chat path;
change the trigger.

### Testing (TDD)

- `markdown-answer-producer.test.ts` (node env, like the existing answer-source
  tests): list markdown → collection/list; table → dimension; prose → detail;
  link → scheme-allowlisted `url` field; malicious/odd markdown never throws and
  never yields a non-`https`/`mailto` link; output always validates via
  `resolveAnswerSet`.
- `answer-core.test.ts`: with a stubbed model returning fixed markdown, the
  route returns a resolved recipe and marks items model-authored.
- `semantic-surface.test.tsx`: a `detail` recipe renders prose; a model-authored
  item shows the provenance tag; a profile-grounded item does not.

---

## Phase 2 — answer cache (designed, not yet implemented)

### Store

Upstash Redis, already a dependency (`@upstash/redis`, used by
`api/_lib/rate-limit.ts`). Fail-open like the rate limiter: no Upstash
configured → cache disabled, Producer runs every time (local dev keeps working).

### Key + value

- **Key:** `answer:v{schemaPinShort}:{normalizedQuestion}` where
  `normalizedQuestion` reuses the existing `normalizedQuestion()` normalization
  (lowercase, punctuation-stripped). Exact/normalized match only in Phase 2;
  semantic similarity is Phase 3.
- **Value:** the produced `AnswerSetV2` (JSON) plus metadata: `schemaPin`
  (`ANSWER_SET_SCHEMA_SHA256`), `profileHash` (hash of `content/profile.md`,
  available from the `gen-profile` step), `producedAt`, `producer: 'markdown'`,
  `verified: false`.

### Read/write flow

- On request, after hand-authored Producers miss: compute key, `GET`. On hit,
  validate the stored pins against current `schemaPin` + `profileHash`; if they
  match, resolve and return (deterministic replay). If they differ, treat as a
  miss (stale).
- On miss, run the markdown Producer, `SET` the value (with a TTL, e.g. 30d),
  then return.

### Invalidation

- **Schema pin change** (`@facia/core` bump) → key prefix changes → old entries
  are simply never read.
- **Profile change** → `profileHash` mismatch → stale entries ignored and
  re-produced.
- **Manual purge** → a small admin script / key-prefix delete.

### Retiring hand-authored Producers

Once cache + Producer are proven, the hand-authored `zocdocAnswerSet()` /
`technologiesAnswerSet()` can be removed, OR promoted into the cache as
`verified: true` seed entries so their evidence framing survives. The matcher
list in `answerPortfolioQuestion` shrinks to nothing; the cache is the Producer
layer. This is the "note to remove later" made concrete.

### Provenance

Cached model answers stay `evidenceTier: 'model-authored'` and `verified:
false` until Phase 3 curation flips them. The renderer shows the model-written
tag accordingly.

---

## Phase 3 — curation (sketch)

- A review surface (or CLI) lists cached model answers; a human can edit and
  mark `verified: true` (promotes to evidence-backed framing, drops the
  model-written tag).
- Semantic-similarity matching (embeddings) so paraphrases hit one cache entry
  instead of producing near-duplicates.
- Depends on Phase 2 usage data; details deferred.

---

## Open decisions (with recommendations)

1. **Retire vs. seed hand-authored Producers in Phase 2?** Recommendation:
   **seed** them into the cache as `verified: true` so Zocdoc/technologies keep
   their evidence framing, then delete the TS.
2. **Cache TTL + size cap.** Recommendation: 30-day TTL, no hard count cap
   initially; revisit if Upstash usage warrants.

## Out of scope

- **Table / `comparison-matrix` rendering.** A markdown table degrades to a
  prose `detail` item for now (the total-mapping rule); the `table` pattern and
  its renderer branch are a later slice.
- Rendering model-produced *HTML* (the DEA-001 path) — the whole point of B is
  to avoid an HTML-injection surface.
- Multi-turn conversational rewrites; the chat path stays as-is for those.
- Phase 3 implementation.

## Files touched (Phase 1)

- `api/_lib/markdown-answer-producer.ts` (new) + test
- `api/_lib/answer-core.ts` — model-fallback branch
- `api/_lib/provider.ts` / a small "collect full completion" helper (if not
  already drainable)
- `content/profile.md` — markdown-subset output contract
- `src/components/facia/semantic-surface.tsx` (+ test) — `detail` branch,
  provenance tag
- `src/App.tsx` — collapse the `QUESTION_NOT_MODELED` → chat trigger
- `package.json` — add `marked` (parser)
