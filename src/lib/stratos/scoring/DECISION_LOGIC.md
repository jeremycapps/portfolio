---
schema: stratos.scoring-decision-logic/1
rubric_version: 0.2.0
status: draft-next-hypothesis
evidence_tier: public-desk
knowledge_policy: commitment-snapshot-only
---

# Commitment scorecard decision logic

The numbers in these scorecards are **coded judgments**, not measured natural constants and not probabilities of success. Their purpose is to make the analyst's interpretation inspectable, challengeable, and repeatable.

## Authority order

Every scorecard value belongs to one of three levels:

1. **Reported fact** — a dated statement or metric in the cutoff-safe case profile.
2. **Framework calculation** — an equation fixed in Tempo before these cases were scored, such as Commitment Index, Evidence Index, position uncertainty, layer balance, or the `FLOOR → FOG → COLLISION → ABSORBABLE` cascade.
3. **Anchored desk judgment** — a categorical interpretation encoded at a disclosed anchor, with rationale, source references, and confidence.

The third level may direct attention. It cannot override a missing capacity figure, trip or clear a hard floor by implication, or be presented as measured precision.

## Authoring anchors

New desk judgments use quarter steps. Intermediate decimals are not permitted merely because the software accepts real numbers.

### Position and goal pull

| Magnitude | Interpretation |
| ---: | --- |
| `0.00` | No material position or pull is supported. |
| `0.25` | Lean: visible preference, readily reversible. |
| `0.50` | Material: shapes multiple disclosed choices. |
| `0.75` | Strong: central to the commitment or operating model. |
| `1.00` | Full: explicit and gating; alternatives are substantially foreclosed. |

The sign comes from Tempo's existing pole convention: negative is the internally validated left pole and positive is the externally validated right pole. Zero is not automatically good.

Target's six organization positions are the exception to the quarter-step authoring convention. They are retained at `−0.7`, `+0.2`, `−0.6`, `−0.4`, `−0.6`, and `+0.4` because they are pre-existing, disclosed Tempo judgments. The scorecards label their source with the `tempo:` namespace rather than presenting them as newly derived facts.

### Importance

| Value | Interpretation |
| ---: | --- |
| `0.25` | Peripheral contributor. |
| `0.50` | Material contributor. |
| `0.75` | Necessary to the stated goal. |
| `1.00` | Gating: the goal cannot be achieved without it. |

### Desk confidence

| Value | Interpretation |
| ---: | --- |
| `0.25` | Low: one-sided or indirect public evidence. |
| `0.50` | Medium: multiple direct signals, with important counter-evidence missing. |
| `0.75` | High: direct, balanced, and repeated public evidence. |
| `1.00` | Effectively complete direct evidence; rarely defensible at desk tier. |

Confidence widens the position interval. It does not move the selected position.

### Transferability

Transferability estimates use broad bands rather than bespoke percentages:

| Band | Portable share | Interpretation |
| --- | ---: | --- |
| Rebuild | `0.00–0.25` | Most capacity must be instantiated in the new context. |
| Limited | `0.25–0.50` | Some reusable capability, with substantial contextual rebuilding. |
| Substantial | `0.50–0.75` | Material reuse, with consequential local work remaining. |
| Mostly portable | `0.75–1.00` | The operating model is designed to travel; local variance remains. |

An instantiation band whose low end is zero creates an **uncertain** headwind, not a definite one. Overlapping strain bands are not ranked.

## Scoring sequence

1. Freeze the commitment snapshot and exclude every later source.
2. State the organization position independently of the goal. Do not infer a company capability merely because the goal requires it.
3. Place the goal pull and importance on each of the six tensions.
4. Compare pole direction, then assess transferability separately. Alignment cannot erase instantiation work.
5. Route strain to people, time, finance, and risk using Tempo's fixed mapping.
6. Place capacity, committed load, goal load, and transferability in compatible units where the evidence permits it.
7. Apply value and risk floors before testing capacity fit.
8. Apply three-valued conjunction to capacity: one definite negative fit establishes `CAN = no` even if another model is unknown. Return `FOG` only when no model definitely collides and the boundary remains unresolved.

## Coded judgments by case

Tension order below is **Advantage, Resource, Discernment, Execution, Invention, Operations**.

| Case | Organization position | Goal pull | Transferability by tension |
| --- | --- | --- | --- |
| Target Canada | `−.70, +.20, −.60, −.40, −.60, +.40` | `−.50, +.50, −.75, +.75, −.50, +.75` | Limited, limited, substantial, limited, limited, rebuild |
| Adobe Creative Cloud | `−.50, +.25, +.25, +.25, +.75, 0` | `−.50, +.75, +.25, +.50, +.75, +.75` | Substantial, limited, substantial, limited, substantial, rebuild |
| Domino's 2025 growth | `+.75, +.75, −.50, +.50, −.50, +.50` | `+.75, +.75, −.50, +.75, −.50, +.75` | Mostly portable, substantial, mostly portable, substantial, mostly portable, substantial |
| Ford Model e | `−.75, +.25, −.50, −.25, +.75, 0` | `−.75, +.75, −.75, +.75, +.75, +1.00` | Limited, limited, substantial, limited, limited, rebuild |

The rationale and source references for every cell live beside the inputs in `commitment-scorecards.ts`; the table is a readable index, not a second source of truth.

## Computed diagnostics

| Case | Commitment Index | Evidence Index | Spread | What the diagnostics say |
| --- | ---: | ---: | ---: | --- |
| Target Canada | `0.483` | `0.417` | `0.963` | A broadly distributed incumbent posture; the score is limited by desk confidence and imported baseline judgments. |
| Adobe Creative Cloud | `0.333` | `0.375` | `0.834` | A concentrated invention commitment with much of the launch operating model still unobserved. |
| Domino's growth | `0.583` | `0.500` | `0.989` | The strongest and most evenly distributed installed commitment among the four cases. |
| Ford Model e | `0.417` | `0.417` | `0.840` | Strong positions in controlled advantage and invention, with the new operating flow not yet established. |

These are descriptive indices. Higher does not mean better, safer, or more likely to succeed.

## Commitment verdicts

All four initial public scorecards currently return `FOG`, for different substantive reasons:

| Case | Why the boundary cannot yet be placed | Strongest case that can be made from the packet |
| --- | --- | --- |
| Target Canada | No people, investment, loss-tolerance, milestone-slack, or risk-gate placement. | Release and Canadian operating-system instantiation deserve priority; coherence with the U.S. model does not prove portability. |
| Adobe Creative Cloud | No completion horizon, cash trough, critical-role capacity, renewal gate, or reliability floor. | Invention is aligned; recurring economics and cloud operations carry the principal new load. |
| Domino's growth | No market-level people/capital schedule, annual milestone path, or downside thresholds. | The most portable case, supported by adopted digital capability and sub-three-year average new-store payback. |
| Ford Model e | No schedule reserve, ramp curves, people placement, loss tolerance, or reversible industrial gates. | Collision is plausible because operations and release carry large strain, but public evidence cannot establish the fit boundary. |

`FOG` is not a forecast of failure. It is the method's instruction to buy the smallest amount of information that would place the decision boundary.

### Target outcome-calibrated retrodiction

The commitment-only Target scorecard remains `FOG` because it contains only the July 2012 public packet. A second, explicitly labeled retrodiction uses the later outcome to backcast realistic bounds:

| Model | Filled input | Result |
| --- | --- | --- |
| People | 17,600 realized employees versus a 15,000–18,000 estimated 125-store load | `−400` to `+2,600` employees; uncertain and near the boundary |
| Time | At most 10 rollout months versus more than 21 months without a continuing stable operation | Fit strictly below `−11` months; collision |
| Finance | `−$941M` 2013 EBIT against a nonnegative operating-economics floor | Fit at most `−$941M`; collision |
| Exposure | 133 stores, 17,600 employees, and `$5.105B` of exit charges | High irreversibility; informs risk and resequencing |

The model therefore returns `SHOULD = yes`, `CAN = no`, and `COLLISION`. Time and finance are reported as colliding models without comparing their raw deficits, because months and dollars are not commensurable. The narrative identifies time as primary based on causal sequence, not a cross-unit numeric ranking.

### Calibrated results across the four cases

| Case | People | Time | Finance / economic attainment | Model result |
| --- | --- | --- | --- | --- |
| Target Canada | `−400` to `+2,600` employees; quantity near boundary, readiness unresolved | `<−11` months to stable operations | `≤−$941M` EBIT versus break-even floor | `COLLISION` |
| Adobe Creative Cloud | Outcome establishes delivery coverage, but not spare critical-role reserve | Completed over about 55 months with no public deadline; fit `≥0` | Subscription share reached 78%, or `+28` points above a majority test | `ABSORBABLE` |
| Domino's growth | Causal people constraint unresolved | `−2,858` stores at the 2025 deadline | `−$4.8732B` global retail sales versus endpoint | `COLLISION` against endpoints; underlying system continued growing |
| Ford Model e | Critical-role capacity unresolved | `−1` missed dated intermediate production milestone | `−139.8` percentage points versus the 8% margin target as of 2024 | Current `COLLISION`; final 2026 outcome remains open |

Adobe's nonnegative people and time bounds do not claim quantified surplus. They state only what the completed outcome proves. Domino's result is an endpoint collision, not a generic business failure: it added 776 net stores and grew operating income 8.5% during 2025. Ford's wholesale, revenue, and EBIT-per-wholesale ratios remain separate from production run rate and vehicle contribution margin.

## Retrodiction limitation

These scorecards were authored after some case outcomes were historically knowable. The software enforces the source cutoff, but it cannot erase an analyst's prior knowledge. They are therefore **cutoff-safe retrodictions**, not independent blind predictions. They are suitable for testing whether the method produces a coherent, contestable case from the permitted packet. Predictive validation requires freezing the rubric and scorecard on a genuinely unresolved case, timestamping it, and opening the outcome later.

## How to challenge a number

A reviewer should not argue that a value merely “feels high.” A challenge should identify one of four things:

1. A source outside the permitted knowledge cutoff.
2. A mismatch between the evidence and the selected anchor definition.
3. Material counter-evidence omitted from the rationale or confidence tier.
4. A conclusion that changes only under a different anchor or portability band.

When adjacent defensible anchors produce the same decision outcome and the same attention set, the judgment is stable enough for the current decision. When they change either, the scorecard should report sensitivity and purchase more information rather than choose the convenient number.
