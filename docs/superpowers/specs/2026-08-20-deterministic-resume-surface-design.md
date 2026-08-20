# Deterministic Resume Surface — Design

**Date:** 2026-08-20
**Status:** Approved for planning
**Scope:** Portfolio (`/Users/jeremycapps/Dev/portfolio`)

## Context & problem

The portfolio's "Generate a resume" starter currently sends a text prompt and
lets `/api/chat` (the model) answer. The mature resume machinery lives in a
sibling repo, `claude-job-application`, where `career-ops`'s CV pipeline works
as follows (confirmed in `career-ops/build-cv-html.mjs:5`): **the model reads
Corus + profile, composes the entire CV body, and emits a JSON payload**, which
the `.mjs` deterministically renders to HTML/PDF. The only deterministic layer
today is the HTML template — **100% of the resume content is model-authored on
every run.**

Meanwhile `claude-job-application/corus-data-v2/engagements.yaml` already holds
hand-written, source-bound `resume_bullets` — specific, ARK-cited, with
`themes`, `role_fit`, `caution`, and `source_refs`. The model paraphrases those
into smoother, more generic prose each run, sanding off the specificity.

**The quality gap and the determinism gap have one root cause:** the model is
rewriting content that was already better as source. Inverting the pipeline —
assembling the body deterministically from the verbatim bullets and confining
the model to a labeled minority — fixes both at once.

## North-star claim

An on-page resume, rendered as a Facia surface, whose body is assembled
deterministically from source-verbatim bullets, carrying a live
**"deterministic vs. model" provenance badge** (e.g. "91% deterministic / 9%
model") that expands to the exact operations that produced it. The badge *is*
the argument for Domain / Corus / Facia: source-bound, replayable, auditable.

## Goals

1. Render a tailored resume on-page from a pasted job description.
2. Keep the resume **body 100% source-verbatim** — bullets, roles, dates, skills
   come from a baked corpus, never rewritten.
3. Confine the model to two **labeled** operations: selection/ranking and the
   tailored summary paragraph.
4. Compute and display a **layered provenance metric**: a headline
   deterministic/model percentage, plus an audit view listing the operations.
5. Degrade to a **100% deterministic** render when no model key is configured.

## Non-goals

- Rebuilding or modifying `career-ops` / `experience-mcp-server`. Those are the
  *source*; `corus-data-v2` is read-only. We import a snapshot, we do not wire a
  live dependency.
- PDF/DOCX export. On-page render only for v1.
- Job discovery, scanning, trackers, cover letters, submission — all out of
  scope. This is the resume surface only.
- Changing the `@facia/core` schema. The `payload` and `evidence` fields are
  freeform JSON; provenance rides on them without a schema change.

## Decisions (locked with Jeremy)

- **Data source:** baked snapshot in the portfolio repo (no live/build-time
  dependency on the sibling repo at request time).
- **Model role:** selection + summary. The body is verbatim; the model does
  job→bullet selection/ranking (a labeled op) and writes the summary (a labeled
  op).
- **Metric:** both layered — headline percentage + operation-level audit trace.

## Architecture

Seven pieces, mirroring the existing `answer` pipeline patterns.

### 1. Snapshot — the deterministic source

**File:** `content/resume-corpus.json` (committed; the source of truth in the
portfolio).

Converted once from `corus-data-v2/engagements.yaml` by a one-off, manually-run
script `scripts/build-resume-corpus.mjs` that reads the sibling
`../claude-job-application/corus-data-v2/` path. The script documents provenance
and makes re-sync reproducible; it is **not** run at build time (per the baked
decision). If the sibling path is absent the script errors clearly and the
committed JSON is unaffected.

Shape (illustrative):

```jsonc
{
  "header": {
    "name": "Jeremy Capps",
    "contacts": ["jeremy@nycwork.space", "linkedin.com/in/jeremycapps", "New York, NY"]
  },
  "engagements": [
    {
      "id": "aroko_operations_source_of_truth",
      "organization": "Aroko",
      "roleContext": ["Head of Operations"],
      "timePeriod": "2024–Present",
      "themes": ["project_operations", "notion_systems", "..."],
      "roleFit": { "strongest": ["Product Operations", "..."], "secondary": ["..."] },
      "caution": ["Frame as an internal project-operations system, not an ERP."],
      "bullets": [
        {
          "id": "aroko.b1",
          "text": "Built a Notion-based project budgeting and estimating system that connected timesheets to an existing projects board and calculated budget consumption from hours worked.",
          "evidenceRefs": ["ARO-001"],
          "sourceRefs": ["engagements.yaml#aroko_operations_source_of_truth"]
        }
      ]
    }
  ],
  "skills": [ { "group": "Frontend", "items": ["React", "TypeScript", "..."] } ],
  "education": [ { "degree": "Bachelor's Degree, minor in Mathematics" } ],
  "projects": [ { "id": "domain", "name": "Domain", "text": "...", "sourceRefs": ["..."] } ]
}
```

Every bullet has a stable `id` (for the selection op to reference) and its
provenance (`evidenceRefs`, `sourceRefs`). Bullet `text` is verbatim from the
corpus and never altered downstream.

### 2. Assembler + two labeled model ops

**File:** `api/_lib/resume-source.ts` (mirrors `portfolio-answer-source.ts`).

`assembleResume(jobDescription, corpus, deps): ResumeAssembly`

- **Deterministic pre-rank:** score each engagement/bullet by overlap of the job
  text against `themes` + `roleFit`. This is always computed and is the
  no-model fallback ordering.
- **Model op A — selection/ranking:** the model receives the job description and
  the candidate bullets (id + text + themes) and returns an **ordered list of
  bullet IDs only** — it never returns prose. Output is parsed as JSON; any id
  not in the corpus is dropped; on empty/parse failure we fall back to the
  deterministic pre-rank. Recorded as an operation with `engine: "model"`.
- **Model op B — summary:** the model writes one tailored summary paragraph from
  the selected bullets + job. This is the only model-authored *text*. Recorded
  as an operation with `engine: "model"`.
- **Assemble** an `AnswerSetV2`:
  - One `Value` item per selected engagement; `payload` carries
    `organization`, `roleContext`, `timePeriod`, and the ordered verbatim
    `bullets`; `evidence` = `{ status: "source-verbatim", sourceRefs, evidenceRefs }`.
  - The summary as a `Value` item with `evidence.status: "model-authored"`.
  - Skills/education/projects as source-verbatim items.
  - `trace` entries record: corpus loaded, deterministic pre-rank, selection op
    (engine), summary op (engine), items emitted.

Model calls reuse `provider.ts`. Since it exposes only streaming `streamChat`,
add a small `collectChat(messages)` helper that accumulates the stream into a
string. Selection prompts for strict JSON; summary prompts for a single
paragraph, no lists.

### 3. Provenance & the layered metric

Computed in `resume-source` from the assembled answer set, returned in the API
envelope (not embedded in the Facia recipe):

```ts
interface ResumeProvenance {
  deterministicPct: number; // share of RENDERED TEXT that is source-verbatim
  modelPct: number;         // remainder (summary text)
  operations: Array<{
    kind: "corpus-load" | "pre-rank" | "selection" | "summary" | "emit";
    engine: "deterministic" | "model";
    detail: string;         // e.g. "12 of 34 bullets selected", "1 model call"
  }>;
}
```

- **Headline** = character (or token) share of rendered text. The summary is the
  only model-authored text; selection changes ordering, not text, so it does not
  move the text ratio (it appears in the audit as a model *operation*). This is
  the honest "both layered" split: text-provenance headline, operation-level
  audit.
- **Audit** = the `operations` list, aligned with the answer set's `trace`.

### 4. API

**Files:** `api/resume.ts` (Vercel handler) + `api/_lib/resume-core.ts` (logic),
following `answer.ts` / `answer-core.ts` exactly (POST-only, rate limit,
size/JSON validation).

Request: `{ jobDescription: string, depth?: DisclosureDepth }`
Response 200:

```jsonc
{
  "protocol": "portfolio.resume/1",
  "schemaPin": ANSWER_SET_SCHEMA_PIN,
  "recipe": { /* resolved Facia recipe */ },
  "provenance": { "deterministicPct": 91, "modelPct": 9, "operations": [ /* ... */ ] }
}
```

Errors mirror `answer-core`: `METHOD_NOT_ALLOWED`, `RATE_LIMITED`,
`REQUEST_TOO_LARGE`, `INVALID_JSON`, `INVALID_REQUEST`, plus
`RESUME_ASSEMBLY_FAILED` (500) if Facia resolution fails. A missing job
description is `INVALID_REQUEST`. `jobDescription` cap: 20,000 chars (a posting
is longer than a question, so larger than the answer route's 1,000).

### 5. Rendering — `ResumeSurface`

**File:** `src/components/facia/resume-surface.tsx` + `src/lib/resume.ts` (client
fetch wrapper mirroring `answer.ts`).

A purpose-built resume renderer (not `SemanticSurface`, whose generic
field-list layout does not read as a resume) that consumes the resolved recipe +
`provenance`:

- Header, tailored summary, experience (org / role / period / verbatim
  bullets), skills, education, projects.
- A persistent **provenance badge** ("91% deterministic / 9% model"). Clicking
  it expands the `operations` audit list. Model-authored blocks (the summary)
  get a small inline marker so a reader can see exactly which text the model
  wrote.
- Reuses the disclosure-depth concept only if it earns its place; otherwise a
  single default depth for v1.

### 6. Frontend flow — resume mode

In `App.tsx` / `PromptStarters`:

- "Generate a resume" arms a **resume mode**: composer placeholder becomes
  "Paste the job description or a link", and a subtle indicator shows the mode is
  active (with a way to cancel back to normal chat).
- The next composer submit, while resume mode is active, routes to `/api/resume`
  (via `src/lib/resume.ts`) instead of the `answer`→`chat` path, and renders
  `ResumeSurface` (with badge) in place of `ChatView` / `SemanticSurface`.
- "New chat" / reset clears resume mode and the rendered resume.
- Resume mode consumes on submit (one resume per arm), then returns to normal.

### 7. Determinism fallback

When no model key is configured (`provider`/config absent), skip model ops A and
B: use the deterministic pre-rank for selection and assemble the summary from
source fragments (e.g. the top engagement summaries). The surface still renders,
the badge reads **100% deterministic**, and the audit shows both ops as
`engine: "deterministic"`. This is also the seed for a future "force
deterministic" toggle.

## Data flow

```
job description
  -> /api/resume (validate, rate-limit)
  -> resume-core -> resume-source.assembleResume
       -> load content/resume-corpus.json
       -> deterministic pre-rank (themes/roleFit vs job)
       -> [model op A] selection -> ordered bullet IDs (fallback: pre-rank)
       -> [model op B] summary -> paragraph (fallback: source fragments)
       -> assemble AnswerSetV2 (verbatim bullets + labeled summary + trace)
       -> compute ResumeProvenance
  -> resolveAnswerSet -> recipe
  -> { recipe, provenance }
  -> ResumeSurface renders resume + provenance badge
```

## Error handling

- Model op failure (network, parse, empty) never fails the request: fall back to
  deterministic behavior for that op and mark it `engine: "deterministic"` in the
  audit. The resume always renders.
- Corpus load/parse failure is a 500 `RESUME_ASSEMBLY_FAILED` (a broken committed
  snapshot is a build-time bug, surfaced loudly).
- Client `resume.ts` surfaces API errors the way `answer.ts` does; the surface
  shows an inline error and lets the user retry.

## Testing plan (TDD)

Unit (`resume-source.test.ts`):

- **Verbatim guarantee:** every rendered bullet's text is `===` to a corpus
  bullet — assert no mutation, for both model and deterministic paths (model path
  uses a stub returning IDs).
- **Selection contract:** model op A output is filtered to known corpus IDs;
  unknown/duplicate IDs dropped; empty/garbage → deterministic pre-rank.
- **Deterministic pre-rank:** given a job weighted to certain themes, the
  expected engagements rank first (pure function, no model).
- **Metric math:** `deterministicPct + modelPct === 100`; with the summary as the
  only model text, the ratio matches the character split; no-model path yields
  `deterministicPct === 100`.
- **Fallback:** with model deps absent, ops A and B report `engine:
  "deterministic"` and the surface still assembles.

Core (`resume-core.test.ts`): request validation, method/rate-limit/size errors,
response envelope shape — mirroring `answer-core.test.ts`.

Client (`resume.test.ts`): success and error paths (fetch-mocked, mirroring
`answer.test.ts`).

Converter (`scripts/build-resume-corpus.mjs`): a smoke test that the committed
`content/resume-corpus.json` parses and satisfies a minimal shape guard
(engagements non-empty, every bullet has id + text + refs), so a bad re-sync is
caught.

## Open questions / risks

- **Selection prompt reliability:** the model must return only known IDs as JSON.
  Mitigated by strict parsing + deterministic fallback, but prompt wording will
  need iteration. Low risk to correctness (fallback guarantees a render), medium
  risk to tailoring quality.
- **Metric honesty:** headline is a *text* ratio; selection (a real model
  influence on *what* is shown) contributes to the audit but not the headline.
  This is a deliberate, defensible choice, but the badge copy should make the
  distinction legible ("model wrote 9% of the text; also ranked the bullets").
- **Corpus curation:** the first `resume-corpus.json` needs a careful pass so the
  verbatim bullets read well on their own (they should — they already exist).

## Out of scope / future

- Force-deterministic toggle (the fallback path already exists; expose it later).
- PDF/DOCX export from the same answer set.
- Live corpus sync / `experience-mcp-server` integration.
- Cover letters and the rest of the `career-ops` loop.
```
