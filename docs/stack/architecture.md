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

## The five canonical terms

| Layer | Term | The one question it owns | Kind |
|---|---|---|---|
| **Timpos** | **Observation** | When & where was it observed? | domain-carrying |
| **Libera** | **Runtime** | Where did state move? (executes the model) | invariant bracket |
| **Domain** | **Meaning** | What does the motion mean? Does it conform? | domain-carrying |
| **Corus** | **Accountability** | Did we get what we said we wanted? | domain-carrying |
| **Facia** | **Surface** | How does it become usable? | invariant bracket |

Two ratified calls:

1. **"Context" belongs to Corus.** Corus reconstructs *why* (context /
   time-to-because) in order to judge the trajectory against the declared
   objective. Libera is therefore **runtime infrastructure**, not "context
   infrastructure."
2. **Two convergences, different scopes.** Domain = *conformance* ("does this
   result meet its contract?", snapshot-level). Corus = *teleology* ("are we
   trending toward the objective?", trajectory-level). Facia's `verdict` role
   reads Domain; its `convergence` role reads Corus.

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
