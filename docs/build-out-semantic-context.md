# Building out the portfolio (Context)

This is an interactive portfolio: a site you can talk to, that answers questions
about Jeremy's work. It doubles as a live testbed for a mostly-deterministic
answer layer (Facia today, Domain/Libera later) — but the portfolio comes first.

## Priorities (in order)

1. **A seamless UI experience.**
2. **A portfolio that answers most questions asked about Jeremy.**
3. **The Facia → UI pattern logic** (a structured `AnswerSet` deterministically
   resolves to a rendered surface).
4. **Swapping the backend for a mostly-deterministic model** using Domain and
   Libera.

Everything below serves that order. Provenance, evidence tiers, and
inspectability are the *direction of travel* (priority 4), not the near-term
focus — a verdict that renders a paragraph of caveats is a regression against
priority 1. Keep answers concise; earn depth only where it stays seamless.

## Where things stand

- **Chat (breadth).** `/api/chat` streams answers from an open-weights model
  grounded in `content/profile.md`. This already covers priority 2 — it can
  answer most questions.
- **Structured answers (the Facia seam).** `/api/answer` resolves *modeled*
  questions through the vendored `@facia/core` runtime into a component recipe,
  rendered by `semantic-surface`. Unmodeled questions return
  `QUESTION_NOT_MODELED`, and the UI falls back to chat. One question is modeled
  today (Zocdoc).
- **Runtime split.** `/api/chat` is Edge; `/api/answer` is Node (AJV needs a real
  runtime). Keep new deterministic work on the Node side.

The hybrid is the whole point: **chat gives breadth now; the deterministic layer
grows underneath it, one pattern at a time, without ever breaking the surface.**

---

## Priority 1 — UI

Keep the current visual language; change what it *says* and *shows*.

- Copy describes the real project (a conversational portfolio), not the old
  "assistant for your work" framing.
- The connect-pattern (formerly Slack/Google) is kept as a visual, repurposed to
  show **context sources** — Profile (live), GitHub and Drive (planned, see
  priority 2).
- "Selected work" holds **real project/product/case-study cards** (Libera,
  Facia, Domain/Corus, …).

UI changes should stay cheap — a turn or two at a time — because the surface is
iterated continuously. Don't gold-plate; ship, look, adjust.

## Priority 2 — Answer most questions (context sources)

`profile.md` currently carries everything. It should stay the **canonical,
curated record of settled experience** — the answer to *"what has Jeremy done."*

The next lift is pulling in **GitHub repos** and **Google Drive**, which are rich
context for *"what is Jeremy working on / how does he think now."* The concern is
real: those sources contain **iterations of ideas that have morphed over time** —
rich, but partly stale or self-contradictory. Handle it by contract, not by hope:

- **Two freshness contracts, kept separate.** `profile.md` = settled, canonical.
  Ingested repo/Drive material = **working context**: timestamped, recency-first,
  and never allowed to override the canonical record. An answer can say "current
  thinking, as of <date>" without restating it as established fact.
- **Supersession is data, not deletion.** Libera already models this
  (`archive/v1/` keeps the superseded protocol, marked). Mirror it: when a newer
  doc supersedes an older idea, tag the old one `superseded-by`, don't drop it —
  so the assistant can say "this evolved from X" instead of confidently citing a
  dead idea.
- **Ingest as tagged snapshots.** Pull repo READMEs/docs and selected Drive docs
  into a context store keyed by `source`, `path`, `last-modified`. Retrieval
  prefers recent and same-topic; the model gets *material*, not authority.
- **Route by question, not by blob.** "What did you build?" → canonical profile.
  "What are you exploring in Libera?" → working context. The
  `QUESTION_NOT_MODELED` fallback already gives us a clean place to choose the
  source before it reaches the model.

Net: the repos and Drive make the portfolio current and specific without letting
half-finished ideas speak as finished ones.

## Priority 3 — Facia → UI pattern logic

The workflow to build toward: take **prompts written during development**, use
them to **generate Facia patterns**, and **test the logic** against the runtime.

The stated risk is the important one: **Facia must not degrade into a pile of
hand-coded rules** — one bespoke special-case per question. Hold this line:

- **Patterns vs. data.** Facia's value is the *deterministic resolver*: an
  `AnswerSet`'s shape (`answerType`, `structure`, `density`, roles, field
  priorities) resolves to a component recipe the same way every time — that's the
  reusable logic, guarded by the conformance suite (~98 tests). A hand-authored
  `AnswerSet` for a new question is **data**, not a new rule, *as long as it
  reuses existing patterns*. Data can grow freely; the rule-set must not.
- **New patterns are earned, not added per-question.** A genuinely new *shape*
  (one the resolvers can't render) is added deliberately — schema + resolver +
  **conformance fixtures (accepted / rejected / semantic-only)** — and pinned by
  schema hash. Rarely. If adding a question makes you reach for a new resolver
  branch, stop: that's the smell the concern is about.
- **The prompt→pattern harness makes the boundary explicit.** A dev prompt emits
  a candidate `AnswerSet` → validate against the pinned schema → resolve through
  Facia → render. The harness's job is to answer one question: *does this reuse
  an existing pattern (ship it as data), or does it expose a pattern gap (a
  deliberate, fixture-backed pattern addition)?* Prompts generate **candidates
  and test cases**, never resolver rules directly.
- **Determinism is the invariant.** Same `AnswerSet` in → same recipe out, always
  re-runnable. If a change can't be expressed as (a) new data or (b) a
  conformance-tested pattern, it doesn't belong in Facia.

## Priority 4 — Deterministic backend (Domain / Libera)

The long game: back the answers with an executable model instead of a prompt.
The reconstruction-cost experiment
(`libera/experiments/semantic-reconstruction-cost/`) already argues Method B
(declare once, evaluate, replayable trace) beats Method A (restate the rule every
request) on reduced repeated context, consistency, inspectability, and
replayability — and `profile.md`-as-system-prompt is exactly Method A.

This is where provenance and evidence tiers eventually live. But it lands *after*
the UI, the coverage, and the Facia pattern logic are solid — and it lands
without making answers verbose. The `AnswerSet` seam is already the boundary a
Domain/Libera evaluation would produce; swapping the modeled-answer source from
hand-authored data to a Libera evaluation is a backend change behind an unchanged
Facia surface.

---

## The seam to protect

One contract crosses everything: the `AnswerSet`. Libera (or a hand-authored
source) *produces* it; Facia *resolves and renders* it; neither reaches across.
Chat covers what isn't modeled yet. Grow the modeled corpus as data, grow the
pattern rules only by conformance, and keep every answer something a visitor
would actually want to read.
