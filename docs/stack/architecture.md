# Canonical `.domain` v2 — one document, five layers

## The problem it solves

`.domain` (Corus policy), Libera's model `.yaml`, and Domain's topology `.yaml`
are not one schema — they are **one ontology projected at three altitudes**:
Corus *declares* a domain, Domain *choreographs* who converges it, Libera
*executes* the convergence. They share the `Contract → Result → Verdict → State
→ Snapshot` backbone and the `who/what/how/when/where/why` ontology, welded at a
single identity: **`meaning.how` *is* the contract.** The domain's rules
(Corus) are the acceptance contract (Domain) are the executable expected-values
(Libera).

v2 makes that literal: **one canonical document each engine projects from.**

## How to read this system — the lifecycle (00–05)

If you have no other context, read this first. The system is one loop — the
operating loop of a forward-deployed intelligence. Drop into a situation, see
what is there, say what "good" means, do it, check it against what you said,
judge whether it moved the objective, and represent the whole thing so the next
worker can act. That is the agentic development lifecycle, and it is the same
loop whether the domain is utility clearance, code retrieval, or strategy. The
loop is how a recommendation becomes an execution you can trust.

One run produces six artifacts, in dependency order. Each is made by one kind of
work, and each is the only input the next stage may use.

| Stage | Work (verb) | Artifact (noun) | Engine | What it establishes |
|---|---|---|---|---|
| **00_Observation** | capture | evidence — what, when, where | Timpos + Locus | what actually happened |
| **01_Meaning** | author | the contract — rule, tolerance, objective | the `.domain` file | what "good" is declared to be |
| **02_Execution** | implement | a candidate result | Libera (Runtime) | what the rule computes on the evidence |
| **03_Domain** | validate | a verdict — does it conform? | Domain | that the *accomplished* meets the *authored* |
| **04_Accountability** | evaluate | a snapshot + a trajectory | Corus | whether results move toward the objective |
| **05_Facia** | represent | an inquiry surface | Facia | how anyone interrogates and reads the loop |

The nouns name what is left on the table; the verbs name the work that produced
it. The numbers are dependencies, not decoration: a verdict (03) needs a result
(02) and a contract (01); accountability (04) needs an objective (01) and a
history of results. This is the `Contract → Result → Verdict → State → Snapshot`
backbone above, with observation at the front and representation at the back.

**Why observation is 00.** Everything rests on it — including the authoring.
You cannot write a contract for what you have not observed, and observation is
not only sensors: it is knowledge held in people's heads, what is seen before it
is written. Authoring the contract is itself the first act of recording an
observation. Capture, not contract, is the floor.

**Why validation is Domain, and why nothing is named twice.** A domain is not
only what is *written*; it is what is *accomplished*. Validation is the one
stage that holds the contract and the execution together and asks whether they
agree — written meeting accomplished — which is the actual sense of the word,
and where meaning is *exhibited* rather than *asserted*. So the two acts get two
names: the authored contract is **Meaning** (01, asserted — the `.domain` file's
`meaning:` block); the validation engine is **Domain** (03, exhibited).
Author and validate are different work, not one engine appearing twice.
*Consequence, done:* the validation engine is the `domain` repo (renamed from
`meaning`); "meaning" is what it exhibits — its job description, not its title.

**Two convergences, not one.** 03 asks "does this result meet its contract?" —
trust, within a single run. 04 asks "are we trending toward the objective?" —
worth, across runs. A result can conform perfectly while the trajectory fails;
that is why Domain owns 03 and Corus owns 04. This is also the **promotion
test**: 03 says a fast path is *safe*, the measured cost says it is *worth it*,
and only both together justify moving work to the hot path. Speed alone is the
rg-beats-grep trap — the asset is knowing what earns the hot path, and being
able to prove it means the same thing once it gets there.

**Facia is not a UI; it is the inquiry surface.** It is how you both pose
questions to the loop and read its answers, and its four roles are the registers
of inquiry — a system constant `[value, verdict, operation, convergence]`:

| Inquiry | Facia role | Asks | Reads |
|---|---|---|---|
| value query | value | what is this? | any artifact |
| expression assessment | operation | what does this evaluate to? | 02 Execution |
| validation check | verdict | does it conform? | 03 Domain |
| convergence question | convergence | are we trending toward the objective? | 04 Accountability |

An inquiry is an expression; Facia is the front end to the kernel law
`Value_out = Evaluate(Expression, Props)` — the question is the Expression, the
current lifecycle state is the Props. That is why Facia carries no domain: it
only poses expressions against state. The numbered legend you are reading is
Facia at rest — a static representation of the loop; a live Facia lets a worker
ask "is 03 passing? is 04 converging?" at any rung.

**Dynamic vs static numbering.** This lifecycle (`00–05`) is *dynamic* — *when*
in a run an artifact is produced. It is orthogonal to the **L0–L7 responsibility
scope** below, which is *static* — *where* a responsibility sits, under "the
pattern may repeat, responsibility must not." Keep the prefixes apart: bare
two-digit `00–05` is a run's flow; `L`-prefixed `L0–L7` is the responsibility
map. Both cut across the engines.

## The five canonical terms

| Layer | Term | The one question it owns | Kind |
|---|---|---|---|
| **Timpos** | **Observation** | When & where was it observed? | domain-carrying |
| **Libera** | **Runtime** | Where did state move? (executes the model) | invariant bracket |
| **Domain** | **Meaning** | Does the accomplished conform to the authored meaning? | domain-carrying |
| **Corus** | **Accountability** | Did we get what we said we wanted? | domain-carrying |
| **Facia** | **Surface** | How is the loop interrogated and represented? | invariant bracket |

Three ratified calls:

1. **"Context" belongs to Corus.** Corus reconstructs *why* (context /
   time-to-because) in order to judge the trajectory against the declared
   objective. Libera is therefore **runtime infrastructure**, not "context
   infrastructure."
2. **Two convergences, different scopes.** Domain = *conformance* ("does this
   result meet its contract?", snapshot-level). Corus = *teleology* ("are we
   trending toward the objective?", trajectory-level). Facia's `verdict` role
   reads Domain; its `convergence` role reads Corus.
3. **Author and validate are distinct; no engine is named twice.** Along the
   lifecycle the authored contract is **Meaning** (asserted — the `.domain`
   file's `meaning:` block, stage 01) and validation is **Domain** (exhibited —
   accomplished meeting authored, stage 03). That validation engine is the
   `domain` repo (renamed from `meaning`, 2026-09-20); "meaning" is what it
   exhibits, not its title.

`Domain` is one protocol with two implementations: `libera/domain` (embedded,
in production) and `domain-v1` (standalone reference topology —
Author/Implementer/Verifier + Orchestrator sink).

## What a `.domain` file declares — the whole of it

Three blocks and an objective. Nothing else is authorable.

```yaml
name:      <domain>
version:   <semver>
objective: <the declared outcome — what Accountability judges against>

observation:            # Timpos — when & where it was seen
  when:  [<temporal source fields>]
  where: [<spatial/locus source fields>]

meaning:                # Domain — who / what / how, where "how" IS the contract
  who:   [<actors / authorities>]
  what:  [<entities under discernment>]
  how:   { <rules, tolerances> }

accountability:         # Corus — why, and the test for "did we get what we wanted"
  why:         [<significance to reconstruct>]
  convergence: { question: <...>, closer_when: <predicate> }
  preserve:    [<what legacy pins across versions>]
```

## What is machinery, not declaration

Deliberately absent from the file, because it is the same for every domain:

- **`runtime` (Libera)** — the conformance check is a pure function of
  `meaning.how`; it is *generated*, never authored. Runtime is a projection.
- **`surface.roles` (Facia)** — `[value, verdict, operation, convergence]` is a
  system constant. It lives in the Facia runtime.
- **role topology (Domain)** — Author/Implementer/Verifier/Orchestrator is
  protocol-level; it lives in the Domain runtime.

The file gets *shorter* as the system gets *more general* — the mark of the
abstraction being right.

## Two brackets, three content layers

```
question → [ Libera ] → answer → [ Facia ] → interface
             runtime               surface
             (invariant)           (invariant)

   the domain content between them = Timpos · Domain · Corus
                                     (observation · meaning · accountability)
```

Libera and Facia take *any* domain with zero per-domain declaration. Timpos,
Domain, and Corus carry the domain's actual content. A `.domain` file is a
declaration for the three; the two brackets run it.

## Worked example — `utility-clearance` (Neara)

The same domain in canonical v2 form. Only observation / meaning /
accountability are written; runtime and surface are supplied by the brackets.

```yaml
name:      utility-clearance
version:   2.0.0
objective: keep vegetation clear of conductors within policy tolerance

observation:
  when:  [observation_timestamp, import_timestamp]
  where: [vegetation_point, conductor_segment]

meaning:
  who:   [utility_operator]
  what:  [vegetation, conductor, clearance_relationship, encroachment]
  how:
    clearance: { attach_distance_m: 3.0 }
    risk:      { severe_lt_m: 1.0, moderate_lt_m: 3.0, watch_lt_m: 5.0 }

accountability:
  why:         [clearance_risk, maintenance_priority, operational_attention]
  convergence:
    question:    "Are encroachments trending toward or away from tolerance?"
    closer_when: "encroachment_count decreasing AND severe_band empty"
  preserve:    [clearance_policy, risk_policy, domain_version, context_hash]
```

## The L0–L7 responsibility layers (reconciled from `Domain Architectural Layers`, Drive, 2026-07-15)

The five canonical terms above are the **engine axis** — which engine owns a
slice. The `.domain` roles (Author / Implementer / Verifier / Orchestrator) are
the **cycle axis** — what moves state to convergence. This is the third,
orthogonal axis: **responsibility scope**, under the rule:

> The pattern may repeat. Responsibility must not.

| Layer | Verb | The one question it owns |
|---|---|---|
| L0 — address & storage substrate | persist / locate | Where is it, and how does it stay the same thing over time? |
| L1 — blueprint & graph topology | arrange | What exists, and what connects to what? |
| L2 — relations & edge contracts | relate | What happens across this connection? |
| L3 — ontologies | mean | What does it mean, vs adjacent concepts? |
| L4 — interfaces | expose | What must this object provide? |
| L5 — schemas & data contracts | encode | How is it represented so a machine reads it? |
| L6 — runtime | execute | What happens now, given current state? |
| L7 — evidence | prove | How do we know it worked or remains true? |

**Welds to the five canonical terms** (the axes cross-cut; this is not a
bijection):

- **L0 persist/locate = Timpos + Locus** — Timpos owns *when* (persist), Locus
  owns *where* (locate).
- **L1–L2 arrange/relate = Domain topology** — the `Program → … → Product`
  graph and its edge contracts (`domain-v1`).
- **L3 mean = Domain** (Meaning); **L4–L5 expose/encode** are the interface and
  schema of the `.domain` file itself.
- **L6 execute = Libera (Runtime).**
- **L7 prove = Corus (Accountability) + evidence** — evidence returning to the
  Program is `Sₙ₊₁ = Sₙ + Δₙ`, second-order convergence.

**Facia's uses are the cycle roles:** `coordinate` = Orchestrator, `implement`
= Implementer, `verify` = Verifier.

**Resolved drift.** The Drive draft placed **Libera at L0 ("locates")**;
canonical is now **Libera at L6 ("Runtime")**, with L0's locate role owned by
**Locus**. This document supersedes the draft on that point.

## Lineage — the parts have precedent; the assembly is the contribution

Two bodies of prior work the architecture stands on. Neither packaged a
runnable, authored, verifiable version — that assembly is what `.domain` v2
adds.

**Second-order cybernetics — Heinz von Foerster** (*Cybernetics of Cybernetics*,
1974; *Objects: Tokens for Eigenbehaviors*, 1976). The observer sits inside the
system; purpose is supplied by the participant, not intrinsic to the mechanism.
Stable states are **eigenforms** — fixed points of a recursive operation.

- `meaning` is authored, not intrinsic — the participant supplying purpose.
- Domain/Corus `convergence` reaching its `closer_when` predicate is recursion
  to a fixed point; the emitted **`Snapshot` is the eigenform**.
- The name *second-order* is this lineage: verification acts on *how*
  implementation changes state, not on judging a finished output.

**Distributed & joint cognition — Hutchins; Woods & Hollnagel** (*Cognition in
the Wild*, 1995; *Joint Cognitive Systems*, 2005). Cognition lives across people,
tools, and representations and persists through external artifacts, not one
head. The unit of analysis is the human+machine **joint system**, which must
stay observable and directable and is brittle at its boundaries.

- The `.domain` file plus `Snapshot`/`preserve` is coherence externalized into a
  durable representation that survives the handoff (Hutchins' change-of-watch).
- `runtime` generated from `meaning.how`, `who`/authority declared in the file,
  and Facia surfaces keep the joint system observable and directable under human
  authority (Woods & Hollnagel's *substitution myth*; the governed boundary).

Adjacent: Maturana & Varela (structural coupling), Pask (conversation theory),
Wegner/Argote (transactive memory — the group-scale form of externalized
coherence).
