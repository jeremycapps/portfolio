---
title: "A Domain Graph, Measured Against What It Forgot"
slug: domain-graph-harness
date: 2026-09-22
summary: Could I turn my AI chat history into compact knowledge graphs without losing what I return to those conversations for? I built a harness to find out. Compression worked; reconstruction depended on what I asked for. The harness is the point; the graph is what it produced.
kind: article
status: "Experiment log · September 2026"
---

## The premise

I built a custom Claude skill called `domain`. It reads a conversation and
extracts a warranted event graph: who established something, changed it, named
it, or asked for it to be made, with evidence back to the conversation.

Partway through, the question got larger. **Could I run my entire AI chat
history — Claude, ChatGPT, and Codex — through this and end up with something
smaller that still answers the questions I reopen those chats to ask?**

Smaller is easy. Useful after getting smaller is the part that needs a test.
The intended harness compares transcript and graph on file size, token count,
query latency, and reconstruction accuracy, conversation by conversation. This
first pass establishes compression, investigates what survives, and tests a
cheap way to predict where the graph will need help. It does not establish a
query-latency improvement or a production pipeline across the whole archive.

The harness is the point; the graph is what it produced. A testing harness
isn't overhead you add after a feature. It's how you find out which feature
was worth building.

## The spine: extract an event, keep its warrant

The skill's unit is an *origin event*. Its basic shape is
`from -[operation]-> target`, with a separate `to` for whom the act was for,
plus a warrant and a source span. The distinction I want to preserve is
between a meaning edge — why something matters — and an execution edge — how
something gets done.

The ledger lives in `domain.toon`. TOON means token-oriented notation: a
compact table representation suited to a uniform edge array. The important
compression, though, happens before serialization. The extractor chooses
which events deserve a row.

That choice is visible in the artifacts. The branding graph retains naming,
redefinition, correction, and handoff events. It holds back an abandoned name
and a thematic association that didn't become a durable project-state change.
The technical graph retains the intake strategy and the request for a YAML
write-up; individual source entries remain content inside that artifact,
rather than becoming separate origin events.

**The graph preserves a record of changes. It doesn't promise to preserve
everything those changes produced.** The harness has to score both kinds of
question, or compression can look successful simply because the test never
asks for what was discarded.

## Compression worked. Reconstruction split by question.

I started with two hand-extracted conversations: *Domain table structure and
updates*, about REBUS/BURSE and the relationship between human principles and
work; and *Neara Corus Demo Refinement*, a technical conversation dominated by
source lists, stack choices, and an intake specification.

| conversation | transcript bytes | graph bytes | estimated transcript → graph tokens | character compression |
|---|---|---|---|---|
| branding / philosophy | 33,671 | 4,239 | ~8,313 → ~1,058 | 7.9× |
| technical / specification | 74,016 | 3,315 | ~18,351 → ~828 | 22.2× |

Those are file measurements and **character-count-divided-by-4 token estimates**,
not tokenizer results. `tiktoken` was unavailable. The compression column is
the ratio of character counts, consistent with those estimates; bytes are
listed separately so the units don't quietly change underneath the claim.

The reconstruction exercise answered questions from the graph alone and
graded against the transcript. The experiment brief reports the same ordering
in both conversations: decision, state, provenance, and terminology recall
held up better than verbatim content recall. The underlying question-and-answer
grading sheet isn't among the retained artifacts, so I am not presenting its
exact scores as independently auditable results here. The brief itself warns
that its round percentages come from a tiny, hand-graded question set. Trust
the ordering as a working signal, not the apparent precision.

The files make the mechanism inspectable:

| question asks for | what the graph keeps | the lesson |
|---|---|---|
| a naming or framing decision | actor, operation, target, warrant | The event is the useful compression unit. |
| why the technical conversation changed direction | a short record of the new framing and intake strategy | A decision can survive without the surrounding exposition. |
| the full source registry or YAML | the event that requested the artifact | Recording that content was produced does not reconstruct its contents. |

The technical conversation has **11 extracted edges** despite its much larger
payload; the branding conversation has **18**. Those are extraction judgments,
not objective counts of everything meaningful that happened. But they explain
why the technical file compresses harder: much of its size is content attached
to comparatively few selected events.

The resulting product decision is conditional. A graph alone looks promising
for decision questions. Content-heavy conversations need the graph **and
working pointers back to the source spans**. The higher compression ratio
comes partly from dropping exactly the material I might reopen the chat to get.

## Watching one correction survive

In the branding conversation, the assistant tries to reinterpret the
relationship between Discipline and Ascending Sound. I correct it:

> Discipline is in the right place table. Ascending sound is the most accurate row within the BURSE table.

The graph retains that sentence as the warrant on this edge:

```text
from:   jeremy
to:     assistant
op:     correct
target: as_row
```

Follow the information through the pipeline. The transcript contains the
assistant's proposed reinterpretation, the tables, my correction, and the
assistant's acknowledgment. The graph selects the correction, identifies who
made it and to whom, and attaches it to the Ascending Sound row. A future
reader can recover the intervention without reading the whole exchange.

Now change the question to ask for the complete table. The correction edge
doesn't contain it. The source transcript does. The same extraction succeeds
or fails depending on what the reader needs reconstructed.

There is another limit visible in the technical example. Its graph condenses
the RAG discussion into a framing decision. The transcript is more qualified:
RAG may still help with source intake, even though it is the wrong primary
product frame. That qualification matters. A short edge label cannot silently
replace the fuller answer.

Likewise, the demo's model input is synthetic; public grid and vegetation
layers are reference data and proxies, not Neara's private operational model.
The source conversation explicitly withholds a claim to exact crew costs.
Retaining the demo decision must not turn those boundaries into facts the
demo has supposedly proved.

This is why the warrant and pointer belong in the design. They let a compact
claim lead back to the passage that can qualify it. The retained ledgers have
span labels; this pass does not establish that those labels form a validated,
automatic retrieval path.

## The cheap signal: structure beats vocabulary

Before extracting the archive, I wanted a cheap estimate of where graph-only
reconstruction might be enough. My first candidate was *edges per KB*: how
many durable events a conversation contains relative to its size.

That is circular. **Counting extracted edges requires doing the extraction I
am trying to decide whether to do.** It can confirm a result afterward. It
can't be the cheap gate before it.

So I compared signals computable directly from the transcript:

| signal | branding | technical | separation | lesson |
|---|---|---|---|---|
| extracted edges/KB | 0.547 | 0.152 | 3.6× | Useful afterward; requires extraction. |
| **turns/KB** | **2.25** | **0.221** | **10.2×** | Strong separation here, no semantic reasoning. |
| average characters/turn | 449 | 4,588 | roughly 10×, inverted | Long payloads show up in turn length. |
| fenced-code share of lines | 3% | 70% | strongly separated | Useful, but dependent on formatting. |
| type-token ratio | 0.166 | 0.149 | 1.1× | Barely distinguishes these files. |
| gzip ratio | 0.307 | 0.291 | 1.05× | My compressibility hunch didn't work. |

`signals.py` counts `### USER` and `### ASSISTANT` markers and divides by
UTF-8 bytes expressed in KiB, although its output calls the unit KB. Code share
is the fraction of lines inside fences, not a fraction of tokens. Type-token
ratio measures unique words relative to word occurrences; gzip ratio measures
compressed bytes relative to original bytes.

On these files, structural signals separated the conversations; lexical
diversity and byte compressibility barely moved. That is a result about this
pair, not a general verdict on either technique.

The broader scan was restricted to themed web conversations and excluded
short texts. Its reported shape was smooth rather than bimodal: a continuum
between conversational back-and-forth and long content dumps. Branding and
philosophy titles appeared toward the high-cadence end; specifications,
research, and filing dumps toward the low end. That is face validity, not
independent labeling. The retained `scan.py` shows the selection and counting
method; its full result table isn't part of the referenced artifacts, so I
am keeping the distribution claim qualitative.

The implication matters more than a convenient label: **decision-heavy and
content-heavy are positions on a spectrum.** Any gate that turns that spectrum
into a choice is a provisional operating rule.

## Calibration: predict, confirm, log the miss

The next pass compared cadence with hand-counted edges across **five**
conversations. This is the calibration retained in `stats.py`:

| conversation | turns/KB | hand-counted edges | recorded KB | edges/KB |
|---|---|---|---|---|
| branding | 2.25 | 18 | 32.9 | 0.547 |
| decision-ledger | 1.38 | 5 | 7.2 | 0.694 |
| uncertainty-arch | 0.90 | 6 | 21.1 | 0.284 |
| RLM vs Corus | 0.60 | 2 | 8.4 | 0.238 |
| technical | 0.22 | 11 | 74.0 | 0.149 |

There is a measurement wrinkle worth leaving visible: the calibration script
uses the manually entered **74.0 KB** for the technical conversation, whereas
the signal script computes **72.3 KiB** from its bytes. That is why its edge
density appears as **0.149** here and **0.152** above. These are the recorded
calculations, not a perfectly normalized benchmark.

The retained calibration gives **Pearson r = 0.80** and **Spearman rho = 0.90**,
with **N = 5**. Enough to motivate another experiment. Nowhere near enough to
treat the relationship as settled.

I set provisional gates: predict decision-heavy at **turns/KB ≥ 0.70**;
confirm that label at **edges/KB ≥ 0.40**. The feedback ledger is simple:

| conversation | cheap prediction | extraction label | result |
|---|---|---|---|
| branding | decision | decision | agrees |
| decision-ledger | decision | decision | agrees |
| uncertainty-arch | decision | content | **miss** |
| RLM vs Corus | content | content | agrees |
| technical | content | content | agrees |

That is **4/5 agreement, or 80%**, on the calibration examples under hand-set
thresholds. It is not held-out accuracy, and the confirmation label is itself
derived from subjective edge counts. My and Claude's judgment can wobble by a
couple of edges; the apparent precision of a density doesn't remove that.

The proposed loop is the useful architecture: a cheap gate predicts, the
extraction I do anyway supplies a confirmation signal, and the ledger records
prediction against outcome. Disagreements show where to inspect and retune.
That is a feedback design demonstrated on a small calibration table, not an
already self-tuning service.

## What the anomalies actually teach

Read the tables together and the lessons are blunt:

1. **Compression needs a reconstruction question attached.** The technical
   file wins on size partly by shedding payload. That is useful for recovering
   decisions and costly for recovering their complete contents.
2. **A pre-filter cannot depend on the expensive result.** Edges/KB belongs
   after extraction. Turns/KB earns its place before extraction because it
   only needs transcript structure.
3. **Cadence is not substance.** Decision-ledger has higher edge density than
   branding despite lower turn density. A few dense turns can carry more
   decisions than a faster exchange.
4. **A miss is a specification for the next experiment.** Uncertainty-arch
   clears the cadence gate but falls below the event-density gate. The brief's
   diagnosis is analytical assistant exposition with relatively few discrete
   human decisions. Turns tell me an exchange happened, not what it settled.

The suggested next move was to combine turns/KB with average characters per
turn or fenced-code share. The scripts add a useful qualification: whole-file
average characters per turn largely inverts turns per byte, aside from
encoding differences. It should not be assumed to supply independent
information. Fenced-code share is the more distinct candidate, though it may
only help on conversations whose payload is fenced.

## Where it stands

This is a first phased pass: two complete hand extractions, a tiny subjective
reconstruction exercise, and a five-point calibration. Token counts are
estimates. Labels are judgments. Thresholds are hand-set. The broader scan is
selected by topic and length. Query latency and end-to-end span retrieval
remain unestablished. The directions are useful enough to guide the next
test; the exact numbers are not a performance guarantee.

The harness has already changed what I would build. Graph-only memory is
conditional on the question. Source pointers are part of useful reconstruction.
The gate needs a cheap structural signal, and its mistakes need to remain
visible after extraction.

That is a better place to start than a master plan for converting the entire
archive. The instrument found where the attractive feature stops being
sufficient, while the experiment was still small enough to inspect.

*Next: add fenced-code share as the second gate feature, keep logging
prediction against extraction, and test whether it improves the misses
without breaking the cases cadence already gets right.*
