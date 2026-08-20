# Building out the portfolio as a deterministic semantic-context testbed

**Goal:** evolve this site from an LLM-that-recites-a-bio into a live **Facia
deployment of a Libera model of Jeremy's own professional context** — and use it
as the real-data testbed that pushes the `semantic-reconstruction-cost`
experiment from a five-fixture toy into something running on personal data.

This is not a rewrite. Today's chat is already a working *control*. The plan
below keeps it live and grows the deterministic core underneath it.

**Implementation status (2026-08-20):** the first Facia v2 vertical slice is
now in this repository. `@facia/core` is vendored as a workspace package,
`POST /api/answer` resolves the declared Zocdoc question, and the React client
renders the returned recipe at glance/inspect/focus/audit depth. `/api/chat`
remains the Method-A fallback and control.

---

## 1. Why this site is the right testbed

The reconstruction-cost experiment (`libera/experiments/semantic-reconstruction-cost/`)
compared two ways of answering the same questions:

- **Method A — prompt-only.** Restate the rule in the prompt every run.
- **Method B — the Libera Domain pipeline.** Declare the model once; evaluate;
  emit an addressed, replayable trace.

Its verdict was *continue*: Method B won 4/5 of §9 and all three §10 dimensions
(replayability, inspectability, reduced repeated context).

**This portfolio's chat is a textbook Method A system.** `content/profile.md` is
the "rule," and it is restated in full as the system prompt on *every single
request* (`api/_lib/config.ts` → `systemPrompt()` → `buildMessages()`). The
answer is free-text; it can drift; nothing records *which* fact or *which source*
grounded a claim; there is nothing to replay.

So the experiment already predicts the win — but it proved it on synthetic
issue-completeness fixtures. The interesting, unproven question is whether the
same win holds on **messy, provenance-laden personal data**: a résumé knowledge
base with claim tiers, caution flags, and "do not overclaim" rules. This site is
the cheapest honest place to find out, because the data is real, the questions
are real (recruiters, collaborators), and the Method-A baseline is already
deployed.

---

## 2. The mapping (portfolio ↔ Libera ecosystem)

Libera's ecosystem line:

```text
Address defines where motion happened.
Domain names what the motion means.
Timpos records observed changes.
Corus evaluates objective satisfaction.
Facia routes active state into use.
```

The portfolio slots straight in:

| Portfolio thing today | Libera unit it becomes |
|---|---|
| `content/profile.md` (flat prose) | **`@jeremy/context`** — a model **Package**: Pages, one per experience unit, carrying evidence and provenance |
| The résumé KB's `evidence_status` / claim tiers / `avoid_overclaiming` | **Domain** contracts + **Verdicts** (executable guardrails, not prose hopes) |
| A user question ("what did Jeremy build at Zocdoc?") | A declared **question model** evaluated against the package |
| The streamed free-text answer | A **Facia AnswerSet** (`facia.answer-set/2`) rendered as a typed surface |
| `/api/chat` (control) and `/api/answer` (Facia) | A Libera **Deployment**: a versioned package behind a usable boundary |
| The chat UI | The **Facia** surface — shape/pattern/affordance resolvers + renderer recipes |

The résumé KB is the unlock here. It *already* has the structure Domain wants —
`source_refs`, `evidence_status` (`source_backed` > `resume_derived` >
`user_asserted`), claim tiers (`artifact_backed` > `lived` > `asserted` >
`generated`), and explicit `avoid_overclaiming` rules (e.g. "use the
source-backed $135K figure, not the unsupported $760K"; "project leadership, not
formal people management"). Today `profile.md` **flattens all of that into
prose** and hopes the LLM honors it. Method B keeps it executable: each answer
item carries its evidence, and the overclaim rules become **verifiers that can
reject a claim**, not suggestions.

---

## 3. The one contract that governs everything

Facia's release seam (`worktrees/.../docs/facia-contract.md`) is the discipline
to hold onto: the **AnswerSet is the single serialized boundary** between
"a question was answered by a model" and "render it as an interface."

`facia.answer-set/2` (from the schema) has exactly the fields a portfolio
answer needs:

- `answerType`: `value` | `verdict` | `operation` | `convergence`
- `path`: `meaning` | `execution`
- `items[]`: `Value`, `Verdict`, `Operation`, or `Convergence`, with item-local
  payloads, evidence, field priority, and conditional promotion
- `structure`: `dimension` | `group` | `sequence` (+ `sequenceKind`:
  `temporal` | `dependency` | `trace`)
- `inspection`: `none` | `available`
- `operations[]`: `model-operation` | `host-callback` (e.g. "Email Jeremy",
  "Open the repo")
- `trace`: direct or item-correlated history provenance
- consumer resolution context: cumulative `glance` | `inspect` | `focus` |
  `audit` disclosure depth

A career-timeline answer is a `sequence`/`temporal` of `Value` items each with
`evidence`; a "does Jeremy have X?" answer is a `Verdict`; "contact him" is a
an `Operation`. **The boundary rule must be respected**: Libera
evaluates the Domain model and normalizes a completed answer through
`facia_bridge/`; Facia only resolves and renders it. Libera never renders; Facia
never evaluates.

---

## 4. Build-out path (phased, each phase shippable)

Mirror the experiment's rigor: small, testable steps, and keep measuring.

**Phase 0 — Baseline (done).** The Method-A chat is live. Freeze it as the
control. Capture a fixed set of ~10 real portfolio questions as the shared test
corpus (the analogue of the five issue fixtures).

**Phase 1 — Author `@jeremy/context` as Libera Pages.** Convert each résumé-KB
experience unit into a Libera Page: a markdown body + executable metadata
declaring its `Value`s and their `evidence`/provenance. Port the
`avoid_overclaiming` rules as Domain `contract`s (fixed verifiers). Package and
test it the way `models/` are tested today. Output lives in the `libera` repo,
not here — this site only *deploys* it.

**Phase 2 — Question models.** Declare a handful of question models that map the
corpus's question shapes ("what did X build at Y", "skills in Z", "how to reach
him", "is X true about him") onto evaluations over the package, each emitting an
AnswerSet. This is where "meaning" becomes deterministic.

**Phase 3a — The Facia surface (first slice done).** The pinned Facia v2 runtime
now resolves a checked-in Zocdoc AnswerSet through a separate Node endpoint.
The UI renders the recipe and exposes cumulative disclosure depth, evidence,
and trace inspection. Unsupported questions explicitly fall through to the
unchanged chat path.

**Phase 3b — Libera-produced answers.** Migrate `facia_bridge/` into Libera's
Domain layer, update it to the v2 schema and pin, and replace the checked-in
portfolio source with released Libera-generated AnswerSets. Because Mojo does
not run inside the current Vercel function, begin with build-time JSON artifacts
before introducing a separately deployed Libera service.

**Phase 4 — Deployment semantics.** Treat `/api/answer` as the deterministic
Libera Deployment while `/api/chat` remains the control: pin the live package
version, support rollback, and record what inputs and state are admitted. The
provider-swap abstraction already here (`api/_lib/provider.ts`) remains the
right shape for the free-text path.

**Phase 5 — Demote the LLM (the key move).** The model becomes the source of
*meaning*; the LLM is pushed to the **edges only**:
1. **In:** natural-language question → pick/parameterize a declared question
   model (a router/normalizer).
2. **Out:** phrase a *finished, deterministic* AnswerSet into fluent prose —
   without inventing content.

The verdict, the evidence, and the provenance are computed deterministically and
are replayable; the LLM never decides what's true, only how to word it. That is
the whole thesis, running on your own data.

---

## 5. The measurement loop (what makes it a testbed, not a demo)

Re-run the reconstruction-cost scorecard against the portfolio corpus, Method A
(Phase 0, live) vs Method B (Phases 1–5), on the same §9/§10 dimensions:

- **Reduced repeated context** — `profile.md` reshipped every request vs the
  package declared once.
- **Semantic drift / consistency** — does the free-text bio contradict itself
  across runs vs a fixed verifier.
- **Inspectability** — "trust me" prose vs an AnswerSet whose every claim points
  at a source and evidence tier.
- **Replayability** — nothing vs a trace that rebuilds the settled answer.
- **Overclaim safety (new, portfolio-specific)** — how often does Method A
  violate an `avoid_overclaiming` rule under adversarial prompting, vs Method B
  where the rule is a verifier that structurally can't be bypassed.

That last row is the strongest real-world case for the whole approach, and it's
one only *personal* data with real reputational stakes can motivate.

---

## 6. Boundaries to keep

- **The layering discipline.** A module never imports from a layer above it;
  Facia never evaluates Domain; Libera never copies Facia's resolvers/renderers.
  The AnswerSet is the only thing that crosses.
- **Determinism is the value — not the runtime.** Per the experiment's own
  §10 note: the win is the reusable, verifiable, inspectable *meaning* (the
  contract, the fixed verifier, the addressed log), independent of what executes
  it. Don't let "the LLM sounds good" relaunch Method A by the back door.
- **The chat stays usable throughout.** Every phase ships behind the working
  UI; Method B replaces Method A one answer-type at a time.

---

## 7. First concrete step

Pick the **corpus** and freeze the control:

1. Expand the first modeled Zocdoc question into a fixed corpus of ~10 real
   questions a visitor would ask this site.
2. Run each against today's live chat; save the answers as the Method-A baseline
   (this is the portfolio's `prompt-only/runs/`).
3. In `libera`, replace the repository's profile-grounded Zocdoc fixture with a
   Page in `@jeremy/context`, its evidence-bound `Value`s, and the equivalent
   declared question model emitting the pinned v2 AnswerSet.
4. Diff the Facia-rendered answer against the Method-A baseline on the six
   rows above.

If that single unit reproduces the experiment's result on real data, the rest of
the build-out is justified — and the portfolio has quietly become the clearest
possible demo of the thing Jeremy actually builds: deterministic, source-bound,
inspectable meaning.
