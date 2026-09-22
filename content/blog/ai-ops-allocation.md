---
title: "AI Operations — A Capital-Allocation Architecture"
slug: ai-ops-allocation
date: 2026-09-22
summary: A framework for allocating model inference and human attention through cheap probes, measured outcomes, and recoverable allocation decisions. Each completed cycle should improve the basis on which the next commitment is made.
kind: article
status: "White paper draft · September 2026"
---

*A framework for allocating model inference and human attention through cheap
probes, measured outcomes, and recoverable allocation decisions. An organization
improves its return on AI when completed work changes where subsequent effort is
committed.*

## Abstract

AI increases an organization's capacity to spend effort faster than it establishes
judgment about where that effort belongs. A model call may be inexpensive in
isolation while a workflow repeats it without a meaningful limit. Human attention
then follows the generated work: reviewing, correcting, reconciling, and deciding
what to retain. Greater execution capacity does not supply an allocation policy.

A small experiment on my own conversation archive suggests an operating
architecture for that problem. A cheap structural signal predicts where semantic
extraction is likely to produce a useful decision graph. The extraction supplies
an outcome signal as a byproduct. A ledger preserves the prediction and the
observed result, making disagreement available to guide the next allocation.

The loop is simple: cheap probe, expensive commitment, free confirmation, logged
return, reallocation. Its broader claim is that AI operations should make the
placement of expensive resources measurable. Deterministic computation, model
inference, and human judgment each need a reason to occupy their part of the
workflow, and an instrument that can reveal when that reason no longer holds.

Capital allocation provides the governing analogy. The experiment does not
establish financial ROI or a generally valid routing threshold. It demonstrates
how a small commitment can produce evidence for the next one, provided that the
outcome remains visible and the limits of the signal remain explicit.

> Spending buys an outcome. Logged outcomes improve the next spending decision.

## 1. The organizational problem is allocation

An organization can automate a workflow before it knows which part deserves the
investment. It can apply a model to every input because inference is available,
or insist on deterministic rules because their behavior is familiar. Either
choice can become a preference defended after implementation rather than a
hypothesis tested before expansion.

The relevant resources extend beyond inference. A generated answer consumes
review attention. A compressed record may save reading while increasing the cost
of recovering omitted material. A cheap routing rule can reduce model calls while
sending difficult cases into a path that cannot resolve them. Cost moves through
the workflow even when a local operation becomes cheaper.

The allocation question therefore needs an outcome attached. Which expensive step
improves the result, for which class of input, under which acceptance conditions?
What evidence would justify extending that step, narrowing its use, or replacing
it with a cheaper path?

**The unit of allocation.** A model call is an accounting unit. An allocation
decision is a commitment to a path for a particular kind of work. Evaluating that
decision requires the result, its adequacy for the intended use, and the resources
needed to obtain and recover it.

The operating discipline begins by making that commitment inspectable. Teams need
to know what they expected the expensive step to buy before they can learn from
what it actually produced.

## 2. The allocation loop

In the [companion graph experiment](/blog/domain-graph-harness), I asked whether
conversation histories could become compact event graphs without losing the
information that made those conversations worth reopening. The extraction kept
changes, decisions, and their warrants. Full specifications and other substantial
payloads could require a return to the source.

That distinction created a routing problem. Decision-dense conversations appeared
better suited to graph-based reconstruction. Content-dense conversations required
a graph with working source pointers. Before committing to extraction across the
archive, I needed a cheap indication of which condition I was likely to encounter.

```text
cheap probe → expensive commitment → free confirmation → logged return → reallocation
```

Each stage has a separate responsibility:

| Stage | Function | Harness implementation |
|---|---|---|
| **Cheap probe** | Predict the likely yield before committing expensive effort. | Count conversation turns relative to file size: turns/KB. |
| **Expensive commitment** | Perform the work whose value is being tested. | Extract the warranted event graph through semantic interpretation. |
| **Free confirmation** | Recover an outcome signal from work already performed. | Count extracted edges relative to source size: edges/KB. |
| **Logged return** | Preserve the prediction beside the observed result. | Record agreement and disagreement under explicit thresholds. |
| **Reallocation** | Change the next commitment using the accumulated evidence. | Retune the gate and distinguish graph from graph-plus-pointers routes. |

**The cheap path is structural.** Turns/KB can be computed from transcript markers
and file size without semantic reasoning. The expensive step is deciding which
utterances establish durable events and what those events mean. A deterministic
gate does not make that extraction deterministic; it supplies an inexpensive
prior about where the resulting representation may be sufficient.

**The outcome is defined before comparison.** The calibration predicted a
decision-heavy conversation at turns/KB ≥ 0.70 and confirmed that label at
edges/KB ≥ 0.40. Both thresholds were hand-set and provisional. They agreed on
4/5 conversations, or 80%, at N = 5. Those figures describe agreement within the
calibration set, not held-out accuracy.

The confirmation is also narrower than truth about usefulness. Edges reflect
extraction judgments. Their density is an outcome signal for the gate, while
successful reconstruction remains the purpose of the workflow. A dense graph can
still omit the passage a future question requires.

## 3. A restrained marginal-return model

Capital allocation offers a useful structural analogy because it separates a
small exploratory commitment from a larger deployment of resources. This is an
analogy, not a literal economic law or a claim that every operational outcome can
be reduced to money. The harness has not measured financial return, and edge
density is not a financial instrument.

The analogy clarifies the sequence of commitments:

| Harness step | Investment analogue |
|---|---|
| Cheap gate: turns/KB | A small probe or cheap bet that locates promising signal. |
| Expensive extraction | The capital outlay. |
| Free confirmation: edges/KB | Measuring realized return. |
| Predict-vs-actual ledger | Tracking return against the investment thesis. |
| Retune thresholds | Reallocating toward what pays. |
| Phased rollout, no master plan | Withholding full deployment while the thesis remains untested. |

**Marginal return: the next commitment.** The question is what an additional unit
of effort is expected to improve. In this archive, another model pass might
produce a useful decision record. Repairing source pointers might instead improve
access to content the graph cannot contain. Human review might resolve whether
an extracted event misrepresents the source. Each expenditure serves a different
limitation; their relative value depends on the current constraint.

Goldratt's theory of constraints provides an adjacent way to reason about that
choice. Improving extraction throughput has limited value when useful
reconstruction is constrained by missing source access. The allocation should
follow the constraint on the outcome, including when that moves spending away
from the model itself.

**Diminishing returns.** A path that earned its first allocation need not earn
unlimited expansion. Extending graph extraction to increasingly content-heavy
conversations may produce less useful decision memory per unit of effort, while
leaving more of the needed material outside the graph. That is a hypothesis to
measure against reconstruction needs, not a curve established by this experiment.

**Exploration and exploitation.** The multi-armed bandit framing names the tension
between using a promising path and spending enough elsewhere to learn whether it
remains the best available choice. A gate that always accepts its own prior stops
learning about the inputs it excludes. Some investigation of uncertain and
rejected cases must remain possible, with its cost made explicit.

A phased rollout also preserves a real option: the ability to expand, revise, or
stop after learning more. The small experiment purchases information as well as
an artifact. Its value includes avoiding a larger commitment based on a mistaken
assumption.

## 4. Why confirmation can be free

Counting edges before extraction would be circular. The count depends on the
semantic work the cheap gate is supposed to precede. After extraction, however,
the edge array already exists. Its density can be computed without another model
pass or a separately commissioned labeling exercise.

This is the precise sense in which confirmation is free: **the confirmation
signal is a byproduct of a commitment already made.** Counting and recording it
still require ordinary computation and bookkeeping. The expensive semantic work
has already been paid for.

That relationship matters operationally. If every allocation decision requires a
separate expensive evaluation, learning can become a competing expenditure that
is postponed under pressure. When normal execution leaves the necessary evidence
behind, comparison can become part of the workflow itself. Each completed
extraction can expose a disagreement without purchasing another extraction to
discover it.

**A byproduct is not independent validation.** The edge count measures what the
extractor retained under its selection rules. It cannot establish that those
rules captured every important decision or preserved sufficient context. The
companion's reconstruction exercise suggested that decision and provenance
questions survived better than verbatim content questions, but its detailed
grading sheet was not retained for independent inspection. No exact recall claim
is needed to use that limitation in the design.

Nor does the free signal survive every routing policy. If the gate begins
skipping extraction, skipped cases produce no edge counts. The ledger can then
measure accepted cases while becoming blind to mistaken exclusions. Inspecting
those exclusions requires deliberate sampling or another source of evidence;
that work has a real cost.

The architecture is self-correcting only to the extent that relevant outcomes
remain observable and disagreements can change the route. The demonstrated
calibration supplies that feedback structure. It is not an already self-tuning
service.

## 5. Corpus modality is a generalization risk

The first structural signal was encouraging. Across the initial pair of
conversations, turns/KB separated the files at 2.25 versus 0.221, a 10.2×
difference. Fenced-code share separated them at 3% versus 70%. Vocabulary
diversity and gzip compression showed little separation on that pair.

The cadence gate still missed a calibration case: a conversation with substantial
analytical exposition but relatively few extracted events. Back-and-forth could
occur without producing many durable decisions. A second feature needed to detect
payload within the exchange.

The experiment brief reports a follow-up beyond the companion's first pass:
adding fenced-code share moved agreement from 4/5 to 5/5 on the same calibration
set. Fenced-code shares were 0–3% for decision-dense examples and 34–70% for
content-dense examples. That separation is useful evidence for a hypothesis. It
is **post-hoc fit on N = 5**, with a threshold chosen after seeing the data, and
must not be presented as validated accuracy.

**The signal contains a fact about its author.** I code. Much of the payload in
my content-heavy conversations arrives as fenced YAML or code. A fence counter
therefore detects a visible convention through which my substantive artifacts
enter the archive.

Consider transferring the same gate to a strategy consultant's or analyst's
archive. Long frameworks, memos, and tables may arrive as unfenced prose. A
conversation dominated by those materials could score approximately 0% fenced
code. If cadence clears the first gate, the second feature would fail to correct
a decision-heavy prediction on precisely the conversation where content recovery
matters most. This is a generalization risk implied by the feature's definition,
not a measured result from a second archive.

**The general quantity is payload density.** The operational distinction is how
much of an exchange consists of supplied or generated material versus dialogue
that establishes changes. Code fences are a modality-specific observation of that
quantity. They are not its definition.

A candidate that might transfer better is the fraction of bytes in long,
unbroken, single-speaker blocks. It would detect substantial prose as well as
code, though it would still need evaluation: a long block may contain consequential
decisions, and a short exchange may settle nothing. Average characters per turn
is also modality-agnostic, but largely inverts turns/KB and should not be treated
as independent evidence.

Porting the pipeline therefore means reopening the allocation thesis. The same
measurement procedure can travel; its feature meanings and thresholds need to
earn their place in the new corpus.

## 6. AI operations as an allocation competency

The gate and router make an AI-operations responsibility concrete: decide where
model inference and human attention earn their cost, identify what cheaper
computation can resolve, and instrument the boundary so it can change with
experience.

This responsibility spans the workflow. Deterministic computation can count,
route, and compare when the relevant structure is explicit. Model inference can
interpret material whose meaning the structure does not settle. Human judgment
can establish acceptance conditions and resolve consequential ambiguity. An
operator needs evidence for those assignments and a way to recognize when a case
has crossed their limits.

My own logs provide a bounded demonstration of that practice. The experiment
supports a conditional representation choice: graph-based recovery for decision
questions, graph plus source access for content questions. It does not establish
that graph-only memory is sufficient across an archive, or that its retained
span labels already constitute a validated retrieval path. Building working
pointers remains part of making the proposed content route useful.

The [query-compiler study](/blog/query-compiler-induced) follows the same operating
principle. Candidate mechanisms are exposed to a scoreboard, and their results
change the next question. Preference can propose an experiment. Measured progress
must govern further commitment.

**What an allocation record needs to preserve:**

- The intended outcome and acceptance basis.
- The input class, cheap signal, and gate version used.
- The predicted result and the route selected before execution.
- The observed result, relevant resource cost, and evidence available for review.
- The disagreement or uncertainty that could justify changing the next route.

This is a proposed operating record, not a claim that the small calibration
already contains a complete cost ledger. To establish operational ROI, subsequent
work would need to measure useful reconstruction alongside inference, review,
and retrieval costs. Agreement with an edge-density label cannot supply that
conclusion by itself.

## 7. Boundaries and failure modes

An allocation architecture earns its place when the evidence it preserves can
improve consequential, recurring decisions. Formalizing every trivial choice
would consume the resources the method is meant to place more carefully.

- **Metric capture:** the workflow optimizes turns, edge counts, or compression
  while useful reconstruction deteriorates. The acceptance basis must remain
  attached to the user's question.
- **Premature concentration:** a promising probe becomes an archive-wide policy
  before it is tested on new cases. N = 5 and a post-hoc feature do not validate
  a deployment threshold.
- **Corpus drift:** a gate calibrated on fenced technical payload silently
  encounters prose-heavy material or changing conversation habits. A stable
  implementation can carry an unstable signal.
- **Confirmation that is not actually free:** extraction is skipped, and the
  outcome required to check the gate disappears. The ledger must expose missing
  observations; sampling them requires an explicit expenditure.
- **False confirmation:** the extraction's own edge count is treated as
  independent evidence of semantic correctness or business value. Outcome proxies
  need checks against the purpose they are intended to serve.
- **Over-instrumentation:** maintaining the measurement system costs more than
  the decisions it can improve. The record should be proportionate to the
  uncertainty and the scale of repeated commitment.
- **Unrecoverable comparison:** thresholds, units, or extraction criteria change
  without being recorded, making apparent improvements impossible to interpret.
  The companion already exposes a KB/KiB inconsistency in its calibration; a
  continuing ledger needs consistent units or explicit versioned differences.

These limits constrain the investment claim. A cheap gate can locate promising
work without proving that the work is valuable. An observable outcome can improve
a policy only if the outcome measures something relevant and someone can act on
the correction.

## 8. The ledger as organizational infrastructure

An extraction produces a representation. A recoverable allocation record preserves
why that representation was worth attempting, what it supplied, and where the
expectation failed. That record can change the conditions under which the next
extraction begins.

```text
prediction → observed outcome → retained discrepancy → revised allocation
```

This is the connection to organizational acceleration. A faster extraction changes
the cost of the current cycle. A retained discrepancy can improve the placement
of effort across later cycles. The method compounds when each completed commitment
reduces uncertainty that would otherwise have to be purchased again.

Compounding is conditional. A ledger that no one consults is only storage. A ledger
that preserves successful cases and discards misses cannot justify concentration.
A ledger stripped of its corpus, criteria, and version history invites a local
finding to become an unsupported general rule.

The durable asset is the recoverable relationship between expectation, commitment,
and outcome. Models and routing features can change while that relationship
continues to support a better allocation decision.

## Conclusion

AI operations requires a disciplined answer to where the next expensive unit of
effort belongs. The harness offers an architecture for developing that answer:
build the cheap probe, make a bounded commitment, recover the available outcome,
record the discrepancy, and revise the next allocation.

The evidence here remains small and local. The cadence threshold is provisional,
the confirmation label depends on extraction judgment, and the stronger feature
reflects the modality of a coder's archive. Those limits are part of the operating
record that makes further commitment intelligible.

The ledger is the compounding asset. Each extraction creates an output; preserving
what it taught about spending creates a better basis for the work that follows.

## Research foundations

The synthesis and application in this paper are my own. The following concepts
provide adjacent foundations; they do not independently validate the harness.
Quotations are omitted pending verification.

- **Marginal return and diminishing returns:** evaluating the next commitment
  and recognizing that extending a successful path may change its yield.
- **Exploration versus exploitation; the multi-armed bandit problem:** balancing
  use of a promising path with learning about alternatives and uncertain cases.
- **Real options:** preserving the ability to expand, revise, or stop a staged
  commitment as evidence develops.
- **Goldratt's theory of constraints; *The Goal*:** directing improvement toward
  the constraint on the overall outcome.
- **Portfolio allocation:** distributing limited resources across competing
  uses and revising those commitments as outcomes become observable.
