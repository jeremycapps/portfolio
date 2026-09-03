# Crosswalk — Tempo v1 · StratOS engine · enterprise transformation · Klarna

**Date:** 2026-09-03
**Purpose:** One kernel keeps getting re-derived from four directions — the Tempo v1
assessment framework, the six-tension StratOS ontology in this repo, the enterprise
L0–L5 transformation lifecycle, and, informally, an executive cross-examination. This
table fixes the crosswalk so the mapping stops being re-argued each session, and marks
where the labels **match literally** versus where they only **rhyme**.

The convergence is the point: a kernel reached independently by four framings is
*discovered, not invented*. That is the credibility argument for StratOS.

---

## Sources

- **Tempo v1 vault** (Obsidian, iCloud): `…/iCloud~md~obsidian/Documents/Tempo/` —
  `Tempo_Start_Here.md`, `engine/v1/🧠 Wiki - Framework.md`,
  `10_Assessments/CommitmentReview/_metadata/`.
- **StratOS engine** (this repo): [ontology.ts](../../src/lib/stratos/ontology.ts),
  [judgment/contract.ts](../../src/lib/stratos/judgment/contract.ts),
  [pages/stratos-flow.tsx](../../src/pages/stratos-flow.tsx).
- **Enterprise L0–L5 lifecycle**: Jeremy's transformation-architecture exploration
  (handoff, 2026-09-03).
- **Klarna golden case**: see [golden-case sources](#klarna-sources) below.

---

## Master crosswalk

| Concept | Tempo v1 label | StratOS engine (field / file) | Enterprise term | Klarna instance | Match |
|---|---|---|---|---|---|
| Strategic vs operational layer | **StratOps** (Architecture / Blueprint) vs **BizOps** (Mechanics / Manuals) | `layer: 'StratOps' \| 'BizOps'` on every tension, [ontology.ts](../../src/lib/stratos/ontology.ts) | L0/L1 Strategy vs L3 Implementation | "AI-first" thesis (StratOps) vs assistant build (BizOps) | **Literal** — same words, direct descent |
| Gate grammar | **Three-Gate Transformation** (DNA → Protocol → Fragility) | `releaseGate`, gate resolution in [contract.ts](../../src/lib/stratos/judgment/contract.ts) | Hard / Soft Gates | Gate 2 (business case) never truly cleared | Concept |
| Continuous baseline | viability **floors** (`SURVIVAL`) | `FLOOR` band, value-/risk-floor → `COLLISION` | Floors → automatic rollback | No SLO floor on dispute/fraud/hardship | **Literal** (floor) |
| Verdict about the subject | `subject_finding.viability_status` — `PASS` / `FLAG` / `SURVIVAL` | `verdict` — `FIT` / `FOG` / `COLLISION` | Gate decision — go / hold / stop | HOLD | Concept (evolved labels) |
| Trust in the assessment | `assessment_quality.status` — `VALID` / `REVIEW` / `REJECT`, kept **separate** ("neither status launders the other") | evidence-integrity / `evidenceStandardMet`, `EVIDENCE_STATUSES` | Audit-readiness of the business case | Case validated on the AI's own aggregate metrics → not `VALID` | **Literal + load-bearing** (see §Gems) |
| Staged pipeline | lifecycle: **Design → Run → Evaluate → Deliver → Learn** | flow-view screens; `reassessment` triggers | L0/L1 → L2 → L3 → L4 → L5 | (self-similar, not identical) | Rhyme (fractal) |
| Decision / company archetypes | **Challenger / Insurgent / Incumbent** (Aaker lineage) | — (candidate for the traversal layer) | Fortress / Quality Engine / Experimenter / Guarded Sprint | Experimenter traversal run on a Fortress decision | Rhyme |
| Ownership of a pole | `leftOwner` / `rightOwner` (C-suite) | `leftOwner`/`rightOwner`, [ontology.ts](../../src/lib/stratos/ontology.ts) | TOM / RACI accountable owner | COO (exception handling) has no retained owner | **Literal** |

---

## The two gems

### 1. The verdict/credibility split is already formal

Tempo v1 keeps two result systems apart and forbids either from laundering the other:

- `subject_finding.viability_status` — what the assessment concludes about the subject.
- `assessment_quality.status` — whether the run is supported and safe to use.

This is exactly the executive cross-examination StratOS's front door dramatizes:
*"what's your verdict"* (viability) is a different question from *"who are you, can I
trust this"* (assessment quality). The challenger's credibility beat is not a new UI
idea — it is this separation, made visible.

For Klarna it is decisive: the finding could read `PASS`-like on blended metrics while
the assessment quality is `REVIEW`/`REJECT`, because the benefit case was validated on
the AI's own aggregate CSAT — self-reported, unsegmented, confirmation-biased. A `PASS`
finding on a `REJECT` assessment is precisely the trap Tempo's rules name.

### 2. StratOps / BizOps is unbroken lineage

The v1 wiki's "StratOps: The Architecture" vs "BizOps: The Mechanics" split survives
verbatim as the `layer` field on every tension in the shipping ontology. The six-tension
model is not a fresh abstraction; it is Tempo v1's top-level split, refined.

---

## The ethics are canon, not an add-on

The anti-humiliation discipline (established when Klarna replaced the too-big-to-fail
cases) is already written into Tempo v1's safe-interpretation rules, e.g.:

- *"Never read a subject position as performance."*
- *"Never infer decision improvement from artifact production."*
- *"Treat a `REVIEW` run as a contestable hypothesis with its named limitations visible."*

StratOS facilitates a conclusion; it does not grade a subject. The rules enforce it.

---

## Implication for grounding

Because Tempo v1 is already built on named, sourced, modern frameworks — Aaker
archetypes, Neilson/Pasternack Org DNA, GitLab TeamOps, Hamel & Zanini's Humanocracy,
Taleb fragility — "ground the abstract in real, hardcore, modern-enterprise language" is
a **retrieval** task, not an invention task. The next step is pulling those named
sources through to the Klarna reading, in the enterprise vocabulary (business case /
NPV, TOM / RACI, SLO floors, containment rate, CapEx gate) rather than framework jargon.

<a id="klarna-sources"></a>
## Klarna sources (no-hindsight; decision-date only)

- Klarna press release, 2024-02-27 — first-month metrics, CSAT "on par" (aggregate).
- The Pragmatic Engineer, 2024-02-29 — outsourced contractors; L1-only automation.
- Bloomberg, 2025-05-08 — CEO reversal (quarantined as hindsight; checks the call).
