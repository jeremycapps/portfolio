---
title: "A Query Compiler, Induced From My Own Logs"
slug: query-compiler-induced
date: 2026-09-02
summary: How do you decide what's safe to automate, and what's worth making deterministic? Not by taste — by building the harness that scores an answer before you trust it. I built one, then let it settle six routing methods, a verification prototype, and a convergence kernel in turn, against my own execution logs. The harness is the point; the router is what it produced.
kind: article
status: In progress · September 2026
sourceUrl: https://github.com/jeremycapps/ontology
---

## The premise

Every day I ask an agent things like *"where did I mention the Facia concept?"*
and it reasons its way to an `rg` invocation I could have typed myself. The
model is an expensive intermediary for a question whose deterministic answer is
already sitting in my history. So: **could I mine my own Claude transcripts,
learn which deterministic operation followed each kind of intent, and route
future prompts straight to that operation — calling the model only when the
cache misses?**

This is the inverse of the usual instinct. Instead of declaring a taxonomy top
down, the rules have to be *earned* from evidence — the tool calls that already
worked. And crucially, I refused to decide "deterministic vs. embedding" by
taste. I built the instrument that would let the data decide.

That instrument is the actual subject of what follows. Every stage below
repeats the same move: before trusting an approach, build the harness that
scores it, then let the score — not a preference — pick the next question.
The six routers, the verification prototype, and the convergence kernel are
three successive product decisions this one harness was asked to settle. Read
it that way and the specific numbers matter less than the method that
produced them: a testing harness isn't overhead you add once a feature is
built, it's how you find out which feature was worth building in the first
place.

## The spine: extract, then measure

**Phase A — the extractor.** A stdlib-only, model-free pass over
`~/.claude/projects/**/*.jsonl` that pairs each genuine user intent with the
tool calls that resolved it. A shell-aware classifier (handling `cd &&`,
`env`/`sudo` wrappers, pipelines, line continuations) buckets each command into
an *op-kind*: `search-text`, `read-file`, `edit`, `run-script`, `git`, and so
on. On my portfolio logs that's ~4,100 `(intent → op)` pairs.

**The evaluation harness.** Before trusting any router, I built the thing that
scores one. It splits the pairs *by session* — a router is never judged on
sessions it learned from — and reports four metrics:

| metric | what it measures |
|---|---|
| **matching accuracy** | of the queries it routed, how many hit the op that actually resolved them |
| **model calls** | how many queries it deferred (cache misses) |
| **turns** | agentic turns spent — a cache hit collapses to **1**, a miss costs the real resolution length |
| **execution time** | wall-clock to route |

Building the harness *first* immediately earned its keep: it caught a labeling
bug (I'd labeled each intent by its *first* op, but agents read to orient before
acting, so the first op is `read-file` noise — switching to the *dominant* op of
the resolution moved every score ~12 points) and it disproved my favorite
hypothesis, cheaply, before I'd bet anything on it.

## Six methods, and what each one taught

Every router is a callable `intent → op_kind | None`, where `None` means "defer
to the model." They differ only in *what they pull from the sentence*. Scored on
held-out sessions, dominant-op label:

| method | accuracy | coverage | the lesson |
|---|---|---|---|
| **majority-class** | 35% | 100% | The floor: always guess the single most common op. Anything that can't beat this is worthless. |
| **keyword-vote** | 37% | 97% | Sum the op-histories of an intent's content words. Barely beats the floor — because a shared noun like *facia* is a **topic**, not an **operation**. |
| **action-shape** | 39% | 86% | Route on the single salient verb (*where*, *fix*, *run*). The verb carries more signal than the nouns — but it's still weak. |
| **facia-declared** | 32% | 95% | My portfolio's own question-grammar (`word × verb × arity`), ported verbatim. It scores *below the floor*: tuned for questions, it collapses 71% of my dev imperatives into one bucket. **The method transfers; the lexicon does not.** |
| **imperative-shape** | 31% | 88% | So I re-drew the verb-classes from my own leading words (*locate, mutate, execute, vcs, inspect*) × arity. It got *worse* — **lumping `find`/`show`/`look` into "locate" destroys the very detail that discriminates ops.** |
| **verb × arity** | **41%** | 80% | The synthesis: keep the **exact** verb (granularity) and add Facia's structural **arity** (the one transferable idea). Best deterministic result. |
| **nearest-jaccard** | 24% | 97% | Whole-intent similarity — route to the op of the most *similar past sentence*. It scores *worst of all*, and diagnosing why is the key finding below. |

Read top to bottom, that table is the whole argument. Two blunt lessons fell
out of it:

1. **The signal lives in the fine word, not the abstraction.** Every attempt to
   generalize the verb into a class lost ground. Granularity beat elegance.
2. **My prior art's *structure* was reusable; its *content* wasn't.** Facia's
   arity — "how many places does the ask have?" — is the only piece that
   survived contact with a different corpus, and it earned its +1.7 only when
   bolted onto the exact verb, never as a replacement for it.

## Watching one sentence fail

The harness traces a single example through every router, showing what each one
*pulls* and what it *matches*. For the canonical *"where did I mention the facia
validator"* — a sentence any human instantly routes to `grep`:

```
router             pulls from example              → matches
majority-class     (ignores input)                 read-file
keyword-vote       facia mention validator where   read-file
action-shape       where                           edit
facia-declared     ('where','lexical','1·open')    → model
imperative-shape   (locate, 1·open)                read-file
verb×arity         ('where','1·open')              list-dir
```

**Not one deterministic router sends it to `search-text`.** You can see exactly
why: each pulls a thin feature (`where`, or `where × 1·open`), looks up that
bucket's *majority* op across all of history, and "where"-flavored prompts skew
toward reading and editing in aggregate — so the one query that should obviously
be `grep` gets mis-sent. The failure isn't a bug. It's the ceiling of routing on
an *abstraction* of the sentence.

## The real axis: topic vs. action

Whole-intent similarity was supposed to rescue routing by finding the *specific*
past sentence that worked. Instead it came dead last — and the reason is the
most important thing this project found.

Ask the nearest-intent router for the neighbors of *"where did I mention the
facia validator"* (which should be `grep`):

```
0.40  [read-file  ]  fix the facia validator require bug
0.12  [edit       ]  also I realized that the facia v2 design has a document!
0.09  [search-text]  look at stratos, where did it get the pillar language...
```

The nearest neighbor is **the same topic with the opposite action.** Content-word
similarity is *topic* similarity — it measures what a sentence is *about*, and
"about facia's validator" is shared by a request to *find* it and a request to
*fix* it, which resolve to completely different operations. The signal that
actually decides the op — the verb — is a single token, and it drowns in the
topic nouns that fill the rest of the sentence.

That is why every method sorts the way it does. The only router that cleared the
pack (**verb × arity**, 41%) did so by *throwing the topic away* and keeping the
action. Everything that attended to the whole sentence — keyword-vote,
nearest-jaccard — inherited the topic's noise.

## What this means for "deterministic vs. embedding"

I started out unable to decide between a deterministic cache and an embedding
model, and I refused to decide it by taste. The data decided, and it did so in a
way I didn't predict:

- **Op-kind is weakly determined by the intent, and its signal lives in the
  verb.** Deterministic routing on the verb tops out ~41%; every richer feature
  did worse. An embedding of the sentence would encode *mostly topic* — the same
  thing that just sank Jaccard — so it is unlikely to beat a verb-based key at
  choosing the *operation*. That is now an evidence-backed prediction, not a
  hunch, and the harness can confirm it with one more row.
- **Where an embedding genuinely earns its place is the *other* channel.** The
  intent has two jobs to route: *which operation* (the verb → deterministic) and
  *which argument* — the file, the term to `grep`, the symbol. The argument
  channel is pure topic, and topic similarity is exactly what embeddings and
  Jaccard are good at. The model belongs there, filling the `<str>` in
  `rg "<str>"`, not choosing between `rg` and `sed`.

So the design the evidence points to is a **decomposition**, not a contest:
route the operation deterministically from the verb-shape (fast, model-free,
~41% and improvable), and use similarity — Jaccard first, embedding only if it
pays — to fill the argument. The cache-with-model-fallback still stands; the
model is simply demoted from "decides everything" to "resolves the argument when
the deterministic op is known but the target isn't."

## The turn: from predicting to enumerating

Every method above tries to *predict the one right op*, and they all plateau
near 41%. But that ceiling is self-imposed — it comes from forcing a single
answer. Keep the whole candidate distribution instead of collapsing it with
`argmax`, and the numbers change character. Building the call-graph as a
`term → op` co-occurrence structure and asking not "the op" but "is the true op
in the top-k candidates":

| | recall of the true op |
|---|---|
| top-1 (predict) | ~37% |
| top-3 candidates | 62% |
| top-5 candidates | 69% |
| top-8 candidates | 77% |
| every co-occurring op (unranked) | 85% |

**Prediction tops out at ~41%; enumeration lifts the ceiling to ~77–85%.** The
intent under-determines *the* operation but strongly determines *a small set* —
and because read-only unix ops are cheap and their output is self-verifying
(`grep` returns hits or nothing), you can run the candidate set and let the
**output** pick the winner. You stop predicting and start enumerating-and-verifying.

## Is enumeration free? A measured answer

Enumerating only pays if running K candidates doesn't cost K× the time. Running
a real locate intent's read-only candidates against the portfolio repo
(10-core machine, filesystem cache warm), sequential-sum vs. parallel-max:

| K candidates | sequential | parallel | speedup |
|---|---|---|---|
| 2 | 20 ms | 17 ms | 1.14× |
| 4 | 27 ms | 20 ms | 1.35× |
| 8 | 63 ms | 37 ms | 1.72× |
| 16 | 186 ms | 72 ms | 2.57× |
| 32 | 356 ms | 111 ms | 3.20× |

The claim holds *directionally* — sequential climbs linearly while parallel
grows far slower — but with two honest caveats the benchmark made concrete:

1. **The real reason enumeration is affordable is that the ops are *absolutely*
   cheap**, not that parallelism is magic. Even sequential top-8 is 63ms —
   imperceptible for an interactive query. Parallelism is a bonus, not the
   enabler.
2. **The parallel win is sub-linear and capped by cores.** It's `min(K, cores)`
   minus overhead: 1.1× at K=2 rising to 3.2× at K=32 on 10 cores, never K×.
   And a chunk of the loss is *Python's* process-spawn and thread-join overhead
   (~2ms spawn floor, ~4–6ms join) — a compiled, natively-parallel harness would
   reclaim much of it. That, not heavy math, is the honest case for a Mojo/SIMD
   rewrite: lower per-task overhead and true vectorized scoring, so the
   enumerate-and-verify loop stays flat as the candidate set and the call-graph
   grow.

The architecture the evidence now describes: a `term × op` call-graph scores a
small candidate set (vectorizable), a bounded parallel fan-out runs the
read-only candidates in ~one command's time, and ground-truth output — not a
prediction — chooses the winner. Prediction accuracy (41%) stops being the
ceiling; verified recall (77%+) becomes the accuracy, at close to prediction's
latency.

## The prototype: it routes what the classifiers couldn't

The dispatcher is built and runs against the live repo. For *"where did I mention
the facia validator"* — the sentence every classifier mis-sent to `edit` /
`list-dir` / `read-file` — it now does the obvious right thing:

```
candidates (from call-graph): search-text, find-file, read-file
  search-text → grep -rIlE --exclude-dir=… "facia|validator" <repo>
WINNER: search-text (728 hits)
  content/blog/facia-v2-design.md
  content/profile.md
  docs/…
```

Enumerate-and-verify succeeds precisely where prediction failed — because it
never had to *guess* that "where did I mention" means `grep`. It ran the
candidates and the **output** decided.

Building it surfaced three design laws that only show up when you run real
commands, each now pinned by a test:

1. **Verification only works for *target-conditioned* ops.** `grep`/`find` carry
   the term in their args, so a non-empty result is evidence. `ls -R` returns
   output no matter what — it verifies nothing and was silently winning on raw
   volume until conditioning was required.
2. **Selection is a ranked *gate*, not a maximizer.** Take the highest
   call-graph-ranked candidate that returns *any* evidence — never the one with
   the most hits, or `find`'s sprawl over `node_modules` beats the precise
   `grep` every time.
3. **The parallel floor is the slowest candidate, so prune ruthlessly.** An
   unbounded `ls -R` over `node_modules` dragged a whole dispatch to 3.4s;
   dropping non-verifiable ops and switching `find` from `-not -path` (descends
   then filters) to `-prune` (skips) cut it to ~1s. The benchmark predicted this
   exactly — one slow eval sets `max`.

And the arg-slot half — the part I flagged as unproven — held up: a deterministic
rule (content words minus verbs and filler) pulls `["facia", "validator"]` out
of the sentence and fills `grep`'s pattern slot correctly, no model.

## Where it stands

The system the evidence built, end to end, is model-free and unix-native in
spirit: a `term × op` call-graph proposes a small candidate set, arg-slots are
filled deterministically from the intent, the read-only candidates run in a
bounded parallel fan-out, and ground-truth output — not a prediction — picks the
winner. Prediction's 41% ceiling is gone; the dispatcher is right when *any*
candidate is right, which the recall table put near 77%.

What remains is honestly scoped: the mutating half (`edit`/`git`/`run`) can't be
speculated and keeps a confirm-then-run path; the deterministic Python is still
the miner and the reference dispatcher, with a compiled Mojo/unix harness the
natural home for the hot path once the shape is settled.

## The scoreboard verdict: verification collapsed too

Put on the same held-out scoreboard — intents whose true op is verifiable — the
dispatcher **lost to the classifier it was meant to beat**:

| router | accuracy | coverage | correct/total |
|---|---|---|---|
| enumerate-verify | 28.6% | 98% | 14/50 |
| verb × arity (classifier) | 50.0% | 72% | 18/50 |

And the diagnosis is the same ghost that has haunted every stage:

- The verifiable subset is **72% read-file, 28% search-text**.
- The dispatcher predicted **search-text 92% of the time** — it collapsed to
  "always grep." Its accuracy is just the search-text base rate.

**"Non-empty output" does not verify the operation — it verifies the topic
exists.** The term `facia` is *somewhere* in the repo whether the intent wanted
to search for it, read a file about it, or find a file named for it. So grep
always "succeeds," the ranked gate always takes rank-1, and enumerate-and-verify
degenerates into "predict the most common op." The 77% recall was real — the true
op *is* in the candidate set — but **converting recall into accuracy needs a
verifier that discriminates *between* candidates, and non-emptiness doesn't.**
Topic-vs-action, one last time, at the verification layer.

One honest caveat in the dispatcher's favor: op-kind-exact-match under-credits
it. 72% of these intents' logged op was `read-file` — but the agent read those
files *after locating them*, and the dispatcher's grep returns exactly the files
you'd then read. By result it may be useful; by label it mismatches. We have no
result-level ground truth to score that fairer claim, so the scoreboard shows
the strict number, and the strict number says: not yet.

## What the whole arc actually proved

Every method — six classifiers, whole-intent similarity, and enumerate-and-verify
— ran aground on the same rock: **an intent's topic is easy to read and tells you
almost nothing about the operation; the operation lives in a sparse action
signal that everything else drowns out.** Prediction plateaus at ~41%; naive
enumeration collapses to base rate. The one lever that consistently helped was
*isolating the verb and discarding the topic* (verb × arity, 50% on locate
intents).

So the honest state, model-free and measured end to end:

- The **classifier** (verb × arity) is the strongest router, and it wins by
  *selectivity* — 50% accuracy at 72% coverage, deferring the quarter it can't
  read. That deferral is a feature: it's the cache knowing when to call the model.
- **Enumerate-and-verify is not dead — but its verifier must discriminate.** The
  next real version has to make the candidate ops genuinely test *different*
  hypotheses: read-a-named-file vs. search-a-term is an **arg-type** distinction
  (does the target look like a path or a term?), and specificity (one named file
  beats 728 grep hits) is a ranking signal non-emptiness throws away.

The instrument did its job: it turned "deterministic vs. embedding" from a matter
of taste into a stack of measured results, and it found — repeatedly, from
independent directions — that the hard part was never the mechanism. It was that
the signal deciding a unix operation is thin, and topic is loud.

## Where it resolves: retrieval is a convergence kernel

The scoreboard said enumerate-and-verify wasn't better than the classifier — but
it was measuring the wrong shape. One more look at the logs settled it: **67% of
the unix operations are pipes**, and the op-kind *sequences* that resolve an
intent drift coarse→precise (`search-text → read-file` is the top transition)
but only 35% run monotonically — the rest oscillate. Retrieval isn't a
classification, a fixed pipeline, or a clean ladder. **It's a result-conditioned
search**: the next operation depends on what the last one returned. That is
exactly why every static predictor capped at ~41% — they were guessing one step
of an adaptive loop from the intent alone.

Named properly, that loop is a **convergence kernel**, and it is the same control
structure as the Libera kernel (`strategy/search.mojo`): a bounded search whose
operators are scored by how far they move the state toward the goal.

```
expand   apply every admissible operator once, score each by convergence
search   expand repeatedly to a bounded depth, stopping at the goal
```

Operators are unix calls carrying a `{precondition, effect}`; the state is the
candidate set and its precision; the score is `d(before) − d(after)`. A cheap
prior proposes which operator to try; **convergence — a deterministic distance
over state — decides.** That is Libera's own heuristic-proposes / Domain-verifies
split, and Facia's fourth answer role, **Convergence** ("whether repeated motion
approaches the goal, over a sequence"), made operational over unix instead of
over answers.

Built and run live against the repo, it does what the whole study was reaching
for:

```
"where is the question grammar arity parser"
  locate  1010 files   → narrow  9 files → pinpoint  → CONVERGED (verified line hits)
"where did I mention the facia validator"
  locate   728 files   → narrow 104 files → (stalls) → DEFER to model
```

It converges when the intent admits a precise answer and **defers when it
doesn't** — the cache-with-fallback, now principled: it hands off exactly when no
operator reduces the distance. Two findings about the distance metric were the
real load-bearing work, each now a test: **precision must be strictly
lexicographic over count** (or moving files→lines reads as divergence and the
kernel never descends), and **pinpoint must gate on a narrowed set** (or
precision-dominance rushes to line-level over thousands of files). The metric
*is* the strategy.

## The unified comparison: classifier, dispatcher, and kernel

The first unified run timed out after 120 seconds. That was not non-convergence:
the kernel is depth-bounded and stops when no operator lowers distance. The
benchmark was repeatedly traversing duplicated worktrees and a large normalized
transcript corpus for every intent and every operator. The repaired evaluation
excludes generated and duplicated trees, builds one immutable 315-file content
index for the kernel, streams per-intent progress, bounds worker concurrency,
and applies per-command and overall deadlines. The index took 2.0 seconds to
build; all 50 held-out intents then completed in 22.1 seconds.

On the same held-out verifiable subset:

| method | accuracy when committed | coverage | correct / all 50 |
|---|---:|---:|---:|
| verb × arity classifier | **50.0%** | 72.0% | **18/50 (36%)** |
| enumerate-and-verify | 28.6% | **98.0%** | 14/50 (28%) |
| Libera-style convergence kernel | 0.0% | 16.0% | 0/50 (0%) |

The kernel's native result is different from the classification score: it
reached a verified fixed point on **8/50 intents (16%)**, averaging three steps
and 971 ms per evaluated intent. All eight converged cases had `read-file` as
their historical dominant-op label, while this kernel terminates in a
grep-based `pinpoint`; exact op-kind scoring therefore records all eight as
wrong. That is a real mismatch, not a number to hide, but it does not establish
that the returned locations were useless. The current corpus has operation
labels, not result-level relevance judgments, so it cannot yet distinguish
"wrong operation" from "a useful locating step immediately before the logged
read."

The comparison therefore changes the claim. The Libera-style kernel is not yet
the best router: the selective classifier wins the historical op-kind task.
What the kernel adds is a separately measurable contract — **converged,
stalled, or deferred, with a trace**. To claim better retrieval, the next eval
needs result-level ground truth: expected files or line ranges for each intent,
not merely the dominant command observed in a prior agent run.

## What the whole study became

It started as "deterministic vs. embedding." It ended somewhere better: a
measured account of why unix retrieval is hard (the op signal is thin, topic is
loud, and the next step depends on the last one's output), and a model-free,
unix-native architecture that takes that seriously —

> a **convergence kernel** over a small precision-ranked operator alphabet, where
> a cheap prior proposes, deterministic Δconvergence scores, a bounded parallel
> fan-out runs the read-only candidates, and the loop iterates to a verified
> fixed point or defers — the Libera kernel, specialized to retrieval.

The instrument earned every rule from evidence, kept its negative results, and
arrived — inductively — at the same convergence architecture the rest of the work
was already built on.

## Why this matters beyond one router

Zoomed out, this is a small, measured answer to a question the whole industry
is arguing by taste right now: **how do you decide what's safe to automate,
and what's worth making deterministic?** Not every mechanism deserves the same
confidence, and the study's actual product is a way to tell the difference
empirically instead of asserting it.

There are only three ways any system touches data: you **read** it, you
**write** it, or you **audit** it — review the list of operations already
performed on it. Audit is the easy case and not really a design choice at
all: it's just documentation of what happened, so it's deterministic by
definition — there's no judgment call left to make once the operation is
already in the past. That's worth naming here because it's the raw material
this whole study runs on: `~/.claude/projects/**/*.jsonl` *is* an audit
log, and the extractor's only job was to read structure out of a record that
was already deterministic before I touched it.

Read is the next easiest, and it's the one this study actually earned a real
architecture for. A read doesn't mutate anything, so a wrong guess costs
time, not damage — you can try several candidates, even all of them, and let
the output pick the winner, because "expensive" and "risky" are different
axes and reads are only ever on the first one. That's the whole justification
for enumerate-and-verify's bounded parallel fan-out: it's affordable to guess
wrong at scale exactly because a read-only guess is *reversible by
construction* — there's nothing to undo.

Write is where that logic stops working, and the study says so directly by
refusing to extend it there: "the mutating half (`edit`/`git`/`run`) can't be
speculated and keeps a confirm-then-run path." A write can't be tried
speculatively and scored after the fact, because by the time you have the
result, the mutation already happened. So the honest architecture doesn't
pretend writes and reads deserve the same treatment — it makes automation's
frontier a measured line, not a stated policy: audit is free, reads earn
determinism from evidence because guessing wrong is cheap, and writes stay
gated behind confirmation because guessing wrong isn't. The harness is how
that line got found instead of argued.

*Next, if pursued: fold the enumerate-and-verify fan-out in as the kernel's
`expand`, add the arg-type-aware operators (path → read, term → search), and lift
the reference kernel into Libera's Mojo so the hot path is compiled and native.*
