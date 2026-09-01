# StratOS v2 — Surface questions, decision dates, and actual-vs-StratOS

**Status:** Build spec for the interactive commitment review.
**Companion to:** [`product-and-case-study-spec.md`](./product-and-case-study-spec.md) (the source of truth).
**Reconciled to:** `main` @ `92d1a2c` (the expanded decision library + comparison model).
**Scope:** three areas of that spec, translated into a fixed, buildable schema keyed to the code — the **decision-date timeline** (spec §8.2, §11.3), the **surface questions** (§8.4, §6.1), and **actual-vs-StratOS** (§10.6, §8.3). Everything else in the spec is out of scope here.

The governing principle for all three: **the questions are a projection of the data model, not free authoring.** Every input is a closed enum drawn from a type union already in the code; the only free text is a `rationale` the schema refuses to accept without `sourceRefs`. The UI never asks the user to name the verdict — it collects judgments and the resolver composes them.

Code anchors (all paths under `src/lib/stratos/`):

| Concern | Module | Key exports |
|---|---|---|
| Timeline + evidence states | `decisions/decision-point.ts` | `DECISION_SEQUENCES`, `EVIDENCE_DISPLAY_STATES`, `EXPOSURE_CATEGORIES`, `DecisionPoint`, `DecisionInput`, `ActualOperation` |
| Decision library (packets) | `decisions/fixtures/calibrated-commitment-experiences.ts` | `CALIBRATED_COMMITMENT_EXPERIENCES`, `AuthoredDecisionExperience` |
| Actual-vs-StratOS | `decisions/decision-comparison.ts` | `DecisionComparison`, `ExposureComparisonCategory`, `ExposureComparisonValue` |
| Surface-question schema | `scoring/rubric.ts` | `CommitmentReviewInput`, `RiskFloorInput`, `CapacityPlacement`, `SourceClass`, `evaluateCommitmentReview` |
| Verdict + two operations | `decisions/judgment.ts`, `decisions/verdict-adapter.ts`, `decisions/presentation.ts` | `CANONICAL_OPERATIONS`, verdict resolution, view-model adapter |
| Irreversibility of the increment | `judgment/contract.ts` | `CommitmentJudgmentInput.requestedCommitment.irreversibility` |

> **Engine note.** Build the UI against the **`decisions/` pipeline** — that is where `92d1a2c` landed the presentation view-model, the `DecisionComparison` type, and the packet library. The parallel `judgment/contract.ts` (on the `stratos-judgment-verdict-wip` branch) is not the shipped path; do not wire the UI to it.

---

## 1. Decision dates (the timeline)

A case is not a single judgment. It is the **same question set answered at multiple dates**, each using only the evidence available by that date. This is what makes the instrument honest rather than a hindsight narrative.

### 1.1 The sequence

`DECISION_SEQUENCES = ['T0', 'T1', 'T2', 'T3', 'T4']` (in code). From spec §8.2:

| Point | Meaning |
|---|---|
| `T0` — Authorization | Initial commitment approved |
| `T1` — Initial release | Pilot / first stores / first sites produce evidence |
| `T2` — Scaling decision | Irreversible exposure materially increased |
| `T3` — Warning state | Evidence first moves a binding dimension into material `FOG`/`COLLISION` |
| `T4` — Exit / outcome | Commitment ends, stabilizes, or reaches the observed outcome |

Each `DecisionPoint` carries `sequence`, `decisionDate`, `knowledgeCutoff`, `actor` (with `authorityStatus`), and a `currentCommitment`.

### 1.2 The invariant (no hindsight leak)

Moving the timeline **recomputes** the verdict and the two recommendations using only evidence available by the selected point's `knowledgeCutoff` (spec §11.3). Enforce it in the data, not the UI:

- Every `DecisionInput` has a `displayState` from `EVIDENCE_DISPLAY_STATES = ['OBSERVED', 'ESTIMATED', 'FOG', 'HINDSIGHT']`.
- `OBSERVED` / `ESTIMATED` may determine the verdict. `FOG` must remain unknown. **`HINDSIGHT` may never determine a verdict** — it renders only in a separate outcome layer, visible at `T4`, and is excluded from the resolver input at every earlier point.
- `materiality: 'material' | 'context'` — only `material` unknowns can block (see §2.4).

### 1.3 UI control

A scrubber over the case's decision points (keyboard-accessible per spec §11.5). Selecting a point:
1. swaps the active evidence set (filtered by `knowledgeCutoff`),
2. re-runs the resolver,
3. re-renders verdict + two recommendations + actual-vs-StratOS,
4. keeps hindsight in its own outcome panel, never folded into the judgment.

### 1.4 State of the library (as of `92d1a2c`)

`CALIBRATED_COMMITMENT_EXPERIENCES` now supplies **five packets**: a `T0` commitment packet for **all four cases** (Target Canada, Adobe, Domino's, Ford) plus **Target `T2`** (`fixtures/target-canada-august-2013.ts`). So the timeline has real multi-case data and, for Target, two points.

Remaining authoring gap for full timeline depth: **`T1`, `T3`, `T4`** are not yet built for any case, and the non-Target cases have only `T0`. The packets are deliberately **cutoff-safe** — where the public packet cannot place a figure, the input is `FOG` rather than an inferred number (see §3.2). Adding `T1–T4` for Target is the shortest path to demonstrating the recompute-on-date behavior end to end.

---

## 2. The surface questions

The questions are a one-to-one projection of `CommitmentReviewInput` (`scoring/rubric.ts`) plus the increment's irreversibility. Present them as closed controls; derive `FIT`/`FOG`/`COLLISION` — never ask for it. **None of this is built in the shipped UI yet** — this section is the net-new schema for the input flow.

### 2.1 The fixed question set

| # | Question | Field | Closed options | Notes |
|---|---|---|---|---|
| 0 | What access do you have to the figures? | `accessTier` | `desk` · `inside-access` | Gates §2.3 — a desk review cannot assert `committed`/`actual` figures |
| 1 | Is the goal worth pursuing, on the merits? | `value` | `worth-pursuing` · `not-worth-pursuing` · `unknown` | `not` → value floor breached; `unknown` → fog |
| 2 | Does each floor hold? | `riskFloors[].status` | `pass` · `trip` · `unknown` | Fixed floor list below; any `trip` → floor; any `unknown` → fog |
| 3 | Can you place each reserve against the increment? | `placements[people\|time\|finance]` | can't place · reserve covers it · load exceeds it · range straddles | Maps to `CapacityPlacement.kind` + fit sign (§2.2) |
| 3b | How good is that figure? | `sourceClass` | `A` · `B` · `C` · `D` · `inside` | Validation, not a verdict (§2.3) |
| 4 | How irreversible is this increment? | `requestedCommitment.irreversibility` | `low` · `medium` · `high` | Raises the evidence standard (spec §4.4) |

**Fixed floor list** (from the authored scorecards): `liquidity`, `legal-operability`, `stakeholder-legitimacy`, `change-readiness`, `delivery-governance`. `riskFloors` is an array, so a case may present a subset, but these five are the canonical vocabulary — do not invent per-case floors in the UI.

**Reserves evaluated:** `people`, `time`, `finance` only (`SPEND_MODELS` in `evaluateCommitmentReview`). `risk` exists in `CapacityModel` but is not iterated by the commitment review — do not add a fourth reserve question.

### 2.2 How a reserve answer becomes a status

`evaluateCapacityPlacement` classifies fit by sign (`classifyFit`): `fit.low >= 0` → **fits**; `fit.high < 0` → **collides**; straddling zero → **uncertain**; `kind: 'indeterminate'` → **indeterminate**. Surface the four placement options as:

| Option shown | `CapacityPlacement.kind` | Status |
|---|---|---|
| "Can't place it / not disclosed" | `indeterminate` (with `reason`) | uncertain → **FOG** |
| "Reserve covers the load" | `structural-lower-bound` (`fitAtLeast >= 0`) or `structural-bound` positive | fits → **FIT** |
| "Load exceeds the reserve" | `structural-upper-bound` (`fitAtMost < 0`) | collides → **COLLISION** |
| "Placed, but the range straddles" | `structural-bound` straddling zero | uncertain → **FOG** |

### 2.3 Source-class validation (public vs private)

The `desk`/`inside-access` axis is the public/private boundary. `validateCapacityFigure` enforces:

- `sourceClass: 'D'` cannot supply a capacity figure — disable "reserve covers it" / "load exceeds it" for a D-class figure.
- `committed`/`actual` epistemic states require `sourceClass: 'inside'`.
- A `desk` review cannot assert a `committed`/`actual` figure at all.

Practical consequence for the UI: **on a desk review, the certain placement options require an A/B/C public source; a stranger running their own decision is `inside-access` and can place `committed` figures.** This is why the public case packets tend to bottom out at FOG and a real inside run can reach a green light.

### 2.4 Materiality gate

An unknown blocks only when a plausible value would change the authorized operation (spec §4.3, §6.1 gate 3). Carry `materiality: 'material' | 'context'` on each input; only `material` FOG binds. Surface it as a single check on any `FOG`/uncertain answer: "Could a plausible value change your move?"

### 2.5 The composition cascade

`evaluateCommitmentReview` resolves the answers deterministically (verbatim order):

1. `value === 'not-worth-pursuing'` **or** any floor `trip` → **FLOOR** (`should: no`)
2. `value === 'unknown'` **or** any floor `unknown` → **FOG** (`should: unknown`)
3. any reserve **collides** → **COLLISION** (`should: yes`, `can: no`)
4. any reserve **uncertain/indeterminate** → **FOG** (`should: yes`, `can: unknown`)
5. else → **ABSORBABLE** (`should: yes`, `can: yes`)

It emits two axes — `should` (value + floors) and `can` (reserves) — plus `breakingModels` and `reasons`. Reconcile the scoring outcome to the spec's verdict vocabulary (§4.5) for display:

| `evaluateCommitmentReview` outcome | Spec verdict (§4.5) | Typical commitment operation |
|---|---|---|
| `ABSORBABLE` | `FIT` (up to validated scale only) | `CONTINUE` / `START` |
| `FOG` | `FOG` | `CHANGE(smaller tranche)` / `START(path.validation)` |
| `COLLISION` | `COLLISION` (capacity) | `CHANGE` / `ADD` / `RESCOPE` |
| `FLOOR` (value/floor) | `COLLISION` (value cause) | `END` when value breached with no recovery |

The two-operation output and its authorization conditions come from spec §6 and the judgment gates (`decisions/judgment.ts`). `FLOOR` and capacity-`COLLISION` both display as `COLLISION` but authorize **different** operations — surface the `cause`/`binding_dimensions`, never a bare color (spec §4.5, §10.4).

---

## 3. Actual vs StratOS

The "so what" of every historical case: compare the operation pair the organization actually chose against the pair StratOS authorized at the same date, and estimate the exposure difference. Never claim success was certain (spec §8.3, §10.6). **This is shipped** as of `92d1a2c` — build the UI against the real types below.

### 3.1 The shipped model: `DecisionComparison`

`decisions/decision-comparison.ts` defines the comparison the UI renders:

```text
DecisionComparison {
  decisionPointId
  period { startsAt, endsAt, endBasis }
  actualOperations:  ActualOperation[]          // what the org did
  stratosOperations: OperationRecommendation[]  // the authorized pair
  exposures: Record<ExposureCategory, ExposureComparisonCategory>
  caveats: string[]
}
```

Each `ExposureComparisonCategory` holds `actualIntent` vs `stratosScenario` (both `ExposureComparisonValue`) plus a `limitation`. An `ExposureComparisonValue` carries `status: EvidenceDisplayState`, an optional `metric` (`MetricValue | MetricRange`), and optional `calculation` / `assumption` — provenance attached to every figure, which is the discipline §3.3 requires. `ActualOperation.operation` is currently `'CONTINUE' | 'PREPARE'` (widen with a `provenance` value if a case needs another actual verb).

Render as a two-row compare table (spec §10.6), preserving the commitment/path two-card distinction on mobile (§11.5), each cell showing the macro label (`HOLD`, `REDESIGN`) over the canonical operation.

### 3.2 The exposure quantities (spec §8.3)

- **Next safe commitment** — the largest increment for which evidence, capacity, value, risk, and authority stay inside the envelope (`nextSafeCommitment` in the evaluation).
- **Decision gap** — the categorical difference between `actualOperations` and `stratosOperations`. Not arithmetic.
- **Excess commitment** — actual commitment at the next decision point − commitment StratOS authorized at the earlier point.
- **Avoidable exposure** — `actualIntent` − `stratosScenario` per `ExposureCategory` (from `EXPOSURE_CATEGORIES`: stores, leases, employees, months, dollars, sites, aircraft, …). A **scenario estimate with visible assumptions**; default to a range; never present it as proof the initiative would have succeeded. Where the cutoff-safe packet cannot quantify a category, `actualIntent.status` is `FOG` and the `limitation` string says so — render that honestly rather than inventing a number.

### 3.3 Provenance discipline

Thresholds and constructs carry `ConstructProvenance = 'documented' | 'inferred' | 'analytical' | 'assumption'`. Per spec §15.4, never present an `analytical` threshold as management's actual documented gate — label it. The comparison's credibility depends on this (spec §10.8 methodology section).

### 3.4 State of the library (as of `92d1a2c`)

Every packet in `CALIBRATED_COMMITMENT_EXPERIENCES` carries `actualOperations` and an `exposures` map, so actual-vs-StratOS renders for all five today. What is still limited: avoidable exposure is only quantified where the public packet allows it (otherwise `FOG`), and the comparison exists only at each case's authored point(s) — extending it across `T1–T4` depends on authoring those decision points (§1.4).

---

## 4. Built vs. planned cases

The spec's 14-case portfolio (§9) and the cases actually in the code are **not the same set** — the four built cases predate the spec's validation portfolio. This table reconciles them so the UI is built against what exists while the roster grows.

| Case | Sector | Status | Decision points | Spec role (§9) |
|---|---|---|---|---|
| Target Canada | Private retail | **Built · fully judged** | `T0`, `T2` | Anchor · Release 1 |
| Adobe Creative Cloud | Private software | **Built · `T0` packet** | `T0` | not in §9 portfolio |
| Domino's 2025 growth | Private retail | **Built · `T0` packet** | `T0` | not in §9 portfolio |
| Ford Model e | Private auto | **Built · `T0` packet** | `T0` | not in §9 portfolio |
| VA EHR modernization | Gov health IT | Planned | — | Release 2 |
| 2020 Census | Gov operations | Planned | — | Release 3 · positive control |
| Tesco Fresh & Easy | Private retail | Planned | — | Principal (Release 4) |
| Best Buy China | Private retail | Planned | — | Principal (Release 4) |
| FBI VCF → Sentinel | Gov IT | Planned | — | Principal (Release 5+) |
| F-35 concurrency | Gov defense | Planned | — | Principal (Release 5+) |
| Uber China | Private platform | Planned | — | Principal (Release 5+) |
| Healthcare.gov | Gov | Planned | — | Supporting |
| Walmart Germany | Private retail | Planned | — | Supporting |
| Home Depot China | Private retail | Planned | — | Supporting |
| Starbucks Australia | Private retail | Planned | — | Supporting |
| IRS modernization | Gov | Planned | — | Supporting |
| California High-Speed Rail | Gov infrastructure | Planned | — | Supporting |

Notes for the build:

- **Built ≠ fully judged.** Only Target has a second decision point (`T2`) and the deep dated evaluation (`target-canada-august-evaluation.ts`). Adobe / Domino's / Ford each have a `T0` commitment packet plus commitment + outcome-retrodiction scorecards, but no second point and no dated evaluation. The UI must not assume every case has more than one point.
- **The spec's priorities are unbuilt.** The next cases the spec wants (VA EHR at Release 2, 2020 Census at Release 3 as the non-failure control) are not in the code. The four built cases are all **private-sector desk reviews**; the spec's validation track is government cases, none of which exist yet.
- **All 17 named cases** here come from spec §9 and the built library. The `Public-Data-Case-Studies.md` transcript is the reasoning behind the selection; the spec §9 tables are the authority.

## 5. Build checklist (subset of spec §14 for these three areas)

- [ ] Moving `T0–T4` recomputes verdict + recommendations using only evidence available by that date; hindsight is isolated to an outcome layer.
- [ ] Every surface question is a closed control; the only free text is a `rationale` requiring `sourceRefs`.
- [ ] Reserve placements derive `fit/collide/uncertain/indeterminate` from `CapacityPlacement`; the UI never asks for `FIT/FOG/COLLISION` directly.
- [ ] Source-class rules gate placement options; `desk` locks `committed`/`actual`.
- [ ] Every blocking `FOG` is demonstrably `material`.
- [ ] Every `FIT` names its validated scale; verdicts show `cause` + `binding_dimensions`, not color alone.
- [ ] Each historical case renders both operation pairs (`actualOperations` vs `stratosOperations`) and an avoidable-exposure estimate with units, interval, and assumptions.
- [ ] Analytical thresholds are labeled and never shown as documented management gates.
