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
