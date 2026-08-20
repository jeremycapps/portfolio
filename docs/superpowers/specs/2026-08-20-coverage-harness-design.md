# Coverage Harness — design (priority 2, first build)

Date: 2026-08-20
Status: approved for planning
Roadmap: `docs/build-out-semantic-context.md` — Priority 2 ("Answer most
questions")

## Why this, and why first

Priority 2 in the roadmap is titled "Answer most questions." The near-term
pressure, in the owner's words: *however many questions get asked of the chat, I
want it to be able to answer them.*

The roadmap frames priority 2 as ingesting GitHub + Drive as timestamped working
context. That is a **means**, not the goal. The goal is **answer coverage** —
shrinking the set of questions the chat *should* answer well but can't. Ingestion
is one lever toward coverage; it is not the point, and building it first means
ingesting blind.

So the first build of priority 2 is not ingestion. It is a **coverage harness**:
a tool that fires a curated set of realistic questions at the chat, judges each
answer for grounding, and reports which questions fail and why. It does two jobs:

1. Turns "answer most questions" into a **measurable number** (grounded-coverage
   %), re-runnable as the corpus grows.
2. **Aims** every later supply decision — what to write into `profile.md`, what
   to ingest from GitHub/Drive, what to model in Facia — at the questions that
   actually miss, instead of guessing the gap shape.

This also front-loads the "prompts written during development → test the logic"
harness that priority 3 depends on.

## Goal / metric

- **Grounded-coverage %** = fraction of the curated question set the chat answers
  *well*, where "well" means the answer is grounded in the material the model was
  actually given.
- **The quality floor is the whole point.** A fluent, confident answer that is
  not supported by the grounding corpus **fails**. That failure mode — sounding
  right while making things up — is the exact regression against priority 1 (a
  seamless surface) that this harness exists to catch. The target is not 100%
  coverage; it is *maximum grounded coverage without hallucination*.

## Non-goals (explicitly deferred — YAGNI)

None of these are in the first build. Each becomes an *aimed* follow-on cycle,
justified by what the report shows:

- GitHub / Google Drive ingestion, and the working-context layer.
- Embeddings / vector retrieval. The corpus fits in the prompt today; retrieval
  is added only when it stops fitting.
- LLM-generated question sets (curated seed list only, for now).
- Expected-fact assertions per question (judging is LLM-as-judge on grounding).
- Any UI / dashboard.
- **Live logging** of real visitor traffic. The transcript log is the interface
  and live logging is a *drop-in second producer* for it (see "The transcript
  log"), but wiring persistence into the Edge chat endpoint — plus the privacy
  decision that implies — is a later cycle, not v1.

## Architecture

### Location and invocation

- New top-level `eval/` directory.
- Run on demand via `npm run eval`. **Not** part of the default `vitest` run —
  live runs cost API calls. The harness's own pure logic *is* unit-tested in the
  normal `vitest` run (see Testing).

### In-process pipeline (key decision)

The runner exercises the chat pipeline **in-process**, not over HTTP. It imports
the production pieces from `api/_lib`:

- `buildMessages` and `systemPrompt` (`api/_lib/chat-core.ts`, `config.ts`) to
  assemble the exact same message array production sends.
- `streamChat` (`api/_lib/provider.ts`) to get answers from the real provider.

Two consequences, both intended:

1. The harness tests the **exact production prompt**. No drift between "what we
   evaluate" and "what visitors get."
2. **The judge grounds each answer against whatever the model was given** — i.e.
   the assembled system prompt. Today that is `profile.md`. When working context
   is added later (a future cycle), grounding is automatically measured against
   the *new* supply with **no change to the harness**. This is the seam that lets
   the coverage number stay meaningful as the corpus grows.

### Dependency injection

Follows the existing codebase idiom (`chat-core`/`answer-core` already accept
injectable `stream` / `checkLimit` deps). The runner and judge take injectable
LLM-call functions so that unit tests run with deterministic mocks and no network.

## Data — the question set

File: `eval/questions.yaml` (YAML for comment-friendly hand editing). Plain data,
versioned in git, grows freely.

A question is a **sequence of 1–5 turns** so the schema never has to change when
multi-turn judging lands (see Phasing). Single-turn questions are just a
one-element `turns` list.

```yaml
- id: zocdoc-work
  persona: recruiter          # recruiter | peer | curious
  notes: optional free text
  turns:
    - "What did Jeremy work on at Zocdoc?"
- id: current-focus
  persona: peer
  turns:
    - "What is Jeremy building right now?"
    - "How does Facia relate to that?"   # up to 5 turns total
```

Loader validates: unique `id`, `persona` in the allowed set, `turns` a list of
1–5 non-empty strings. Invalid files fail fast with a clear message.

## The transcript log (the interface)

The evaluator's input is a **persisted `(prompt, response)` record**, and it does
not care where that record came from. This log is the seam between "what was
said" and "the evaluation":

- **Producers** write records into the log. The v1 producer is the curated runner
  (below). A future producer is live logging on `/api/chat` — same record shape,
  no evaluator change. There is **no separate evaluation endpoint**: logging the
  existing chat traffic is the capture mechanism, and the curated runner writes
  the same records offline.
- **The evaluator** (judge + report) reads records from the log offline —
  decoupled from any live back-and-forth, and re-runnable (re-judge saved records
  with a different judge or rubric without re-generating answers).

Record shape (one per sampled answer), written as JSON lines / a JSON array under
`eval/reports/`:

```json
{
  "id": "zocdoc-work",
  "producer": "curated",        // curated | live (future)
  "persona": "recruiter",       // present for curated; may be absent for live
  "model": "meta-llama/llama-3.3-70b-instruct",
  "prompt": "<assembled system prompt + user turn(s)>",
  "question": "<the user question text>",
  "response": "<model answer>",
  "sample": 1,                  // which of N samples (curated)
  "timestamp": "2026-08-20T00:00:00Z"
}
```

The judge consumes these records; verdicts are attached to them in the report.
`prompt` carries the grounding corpus, so the judge grounds against exactly what
the model was given regardless of producer.

## Runner — `eval/run.ts` (the v1 producer)

The curated runner is the v1 producer: it turns the seed question set into log
records. For each question:

- Replay its `turns` against the chat pipeline. In v1, only single-turn questions
  (`turns.length === 1`) are executed; multi-turn entries are **skipped with a
  reported "not-yet-evaluated" status** rather than silently dropped (so the set
  can be authored ahead of the multi-turn phase).
- **Sample N times** (default 3, `--samples` to override). LLM answers vary
  run-to-run; a flaky pass is not a pass, so each question is run N times and
  aggregated. Sampling is the primary cost knob.
- Collect every sampled answer (full text) for judging and for the persisted
  transcript.

Flags: `--limit <n>`, `--samples <n>`, `--filter <persona|id>`.

## Judge — `eval/judge.ts` (LLM-as-judge, grounding-focused)

Input per judgement: `{ question, answer, groundingCorpus }`, where
`groundingCorpus` is the system prompt the model actually received.

The judge returns **strict JSON**, validated on parse:

```json
{
  "grounded": 0,          // 0 unsupported | 1 partial | 2 fully supported
  "answered": 0,          // 0 evades | 1 partial | 2 answers the question
  "hallucination": true,  // asserts something the corpus does not support
  "category": "breadth-gap", // ok | breadth-gap | freshness-gap | hallucination
  "rationale": "one line"
}
```

- **Low temperature** for the judge.
- The judge uses a **stronger model** than the chat model (`EVAL_JUDGE_MODEL`,
  default a capable model via the existing OpenRouter setup). A weak judge is the
  classic LLM-as-judge failure and is avoided deliberately.
- A malformed / unparseable judge reply is a **harness error**, never a silent
  pass. Retry once, then fail the run loudly.
- `category` is the gap-shape diagnostic. `breadth-gap` = the answer would be
  gettable if the material existed but it isn't in the corpus; `freshness-gap` =
  the corpus has settled material but the question is about current/in-progress
  work; `hallucination` = the model asserted unsupported claims; `ok` = grounded
  and answered.

## Aggregation, report, and transcript persistence

### Verdict aggregation

Per question, across its N samples: **pass** iff a majority of samples are
`grounded >= 1` **and** `answered >= 1` **and** `hallucination === false`.
Otherwise fail. A non-unanimous result (e.g. 2/3) is flagged **flaky** in the
report — flakiness is signal, not noise.

### Coverage number

`coverage% = passing questions / evaluated questions`. Multi-turn questions
skipped in v1 are excluded from the denominator and counted separately.

### Report output

- **Console summary:** coverage %, and counts per `category` (the gap-shape
  breakdown — breadth vs freshness vs hallucination falls out of the data, which
  is the diagnostic the owner asked for).
- **`eval/reports/<timestamp>.md`:** table of question → verdict → category →
  one-line rationale, failures first.

### Persisted transcripts

The run writes its log records (see "The transcript log") to
`eval/reports/<timestamp>.json`, and the judge verdicts alongside them. This is
the same log the evaluator reads — the curated run *is* one producer of it — so
evaluation is independent of any live back-and-forth and re-judgeable without
regenerating answers. Live logging later writes the same records to a persistent
store; the evaluator does not change.

## Configuration

Reuses `api/_lib/config.ts` / OpenRouter setup. Env:

- `CHAT_MODEL` — the model under test (already exists; the harness tests whatever
  production uses).
- `EVAL_JUDGE_MODEL` — the judge model (new; defaults to a stronger model).
- `EVAL_SAMPLES` — default sample count (default 3; `--samples` overrides).
- `OPENROUTER_API_KEY` — as today.

## Testing

Pure logic is unit-tested in the normal `vitest` run, matching existing test
style (`*.test.ts` next to source, injected mocks — no network):

- Question-file loading + validation (dupes, bad persona, empty/oversized
  `turns`).
- Sample aggregation: majority pass/fail, flaky detection, single-turn-only
  gating, multi-turn skip accounting.
- Judge-reply parsing: valid JSON accepted; malformed rejected; retry-then-fail.
- Report formatting: coverage math, category counts, ordering (failures first).

The live end-to-end run (`npm run eval`) is manual and excluded from CI.

## Phasing

- **v1 (this build):** everything above for **single-turn** questions. Multi-turn
  entries are authored-allowed but skipped-and-reported.
- **Phase 2 (same spec, flagged):** multi-turn execution + judging — replay up to
  5 turns, judge the final answer (and optionally per-turn) against the corpus.
  No schema change required.
- **Later, aimed cycles (separate specs):** GitHub ingestion, Drive ingestion,
  working-context freshness layer, chat-transcript ingestion, real-traffic
  capture, embeddings — each justified by, and aimed with, the report.

## Future hooks (not built in v1)

- **Live logging as a second producer.** Persisting each real `(prompt,
  response)` from `/api/chat` into the transcript log makes real visitor Q&A an
  input to the *same* evaluator — no new endpoint, no evaluator change, and the
  real questions can graduate into the curated seed set. The two open items are
  where the log physically lives (the chat endpoint is Edge and cannot write
  local disk, so it needs a store — KV / blob / small DB) and a privacy decision
  on persisting visitor data. The record shape above is designed to receive it.
- **Working-context grounding.** Because the judge grounds against the assembled
  system prompt, adding a working-context layer to that prompt later extends
  grounded-coverage measurement to the new material for free.

## The seam this protects

The harness never reaches past the chat prompt. It measures whatever supply the
model is given, against whatever questions are curated. Grow the corpus (data),
grow the question set (data), and the coverage number stays honest — which is the
only way "answer most questions" becomes something you can actually hold yourself
to instead of guess at.
