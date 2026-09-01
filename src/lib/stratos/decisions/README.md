# StratOS judgment layer

The judgment layer turns a dated commitment review into a bounded decision
packet for inspection and presentation. It extends the scoring v0.2 substrate;
it does not replace or reinterpret it. The scoring layer still evaluates value
and risk floors plus the independent people, time, and finance models. The
judgment layer names what can be authorized at a particular cutoff and emits
two ordered operations.

The public API is exported from [`index.ts`](./index.ts). The principal types
and validators live in [`decision-point.ts`](./decision-point.ts),
[`evidence-integrity.ts`](./evidence-integrity.ts), and
[`judgment.ts`](./judgment.ts). Decision experiences are authored fixtures, not
UI business logic:

- [`fixtures/target-canada-august-2013.ts`](./fixtures/target-canada-august-2013.ts)
  defines the dated decision point and resolves its packet.
- [`target-canada-august-evaluation.ts`](./target-canada-august-evaluation.ts)
  adapts the v0.2 review, generates the recommendation pair, and defines the
  bounded actual-versus-StratOS comparison.
- [`fixtures/calibrated-commitment-experiences.ts`](./fixtures/calibrated-commitment-experiences.ts)
  defines Target T0 plus Adobe, Domino's, and Ford commitment-date packets from
  the existing calibrated profiles and scorecards.
- [`presentation.ts`](./presentation.ts) exposes the pure renderer-ready view
  model used by `/stratos-v2`.

## DecisionPoint and the evidence profile

A `DecisionPoint` is a companion to a case profile and one of its snapshots.
The profile owns dated sources, facts, and six-system/constraint assessments.
The snapshot freezes what is knowable. The decision point adds the decision
actor, current commitment, requested increment, cadence, reversibility,
reassessment boundary, exposure categories, assumptions, and hindsight.

Resolution validates the profile and snapshot linkage before producing a
packet. Contemporaneous inputs may use only sources published on or before the
declared knowledge cutoff. Later material is resolved only into the structurally
separate hindsight collection. Changing a timeline date means resolving another
authored packet; a React component never filters evidence or recomputes a
verdict.

The four display states are explicit epistemic claims:

- `OBSERVED` — placed directly from cutoff-safe evidence.
- `ESTIMATED` — calculated from disclosed inputs, with the calculation visible.
- `FOG` — decision-material information is not placed; it receives no favorable
  default.
- `HINDSIGHT` — outcome evidence published after the decision cutoff and barred
  from the contemporaneous judgment.

Analytical constructs and assumptions retain persistent labels in the view
model. They must not be restyled or paraphrased as reported facts.

## Verdict projection

The adapter projects the v0.2 result into three authorization verdicts:

- `FIT` means the review is `ABSORBABLE`, the authorization scale is evidenced,
  and no decision-material unknown remains.
- `FOG` means the boundary cannot be placed. It carries material unknowns and a
  `not-determined` validated scale unless evidence supports a narrower one.
- `COLLISION` means a known value or risk floor is breached, or at least one
  independent capacity model definitely collides.

Known scoring `FLOOR` cases become `COLLISION` with the `value-floor` or
`risk-floor` cause subtype. An unknown value or risk floor remains `FOG`.
`ABSORBABLE` never becomes `FIT` merely because no collision was found: the
validated scale itself must be evidenced.

People, time, and finance remain independently typed models. Their raw deficits
are never ranked, summed, or converted into a universal cross-unit score.

## Ordered operations

Every valid judgment contains exactly two recommendations:

1. the commitment operation;
2. the path operation.

Each recommendation uses one of six canonical operations: `START`, `END`,
`CONTINUE`, `CHANGE`, `EXCEPTION`, or `ESCALATE`. Labels such as `HOLD`, `LEARN`,
`ADVANCE`, and `ROUTE_BACK` are presentation macros, not additional operations.
Both recommendations require an object, owner and authority status,
authorization reason, a concrete boundary, gate conditions, and reassessment
behavior. Missing, duplicate, reversed, extra, or unbounded pairs fail
validation.

## Bounded comparison

Counterfactual exposure is reported separately for scope activation, contracts,
capital, inventory, people, and cash. A placed estimate in one category does
not authorize inference in another. The Target August comparison places only a
maximum store-activation scenario bound through the next release decision or
year end; the other five categories remain `FOG`. The cross-case commitment
packets do not invent counterfactual quantities: their scenario exposure
remains `FOG` until the relevant evidence is placed.

This layer explicitly does **not**:

- predict whether a strategy or alternative will succeed;
- turn unlike people, time, and finance units into a universal score;
- claim that all unreleased obligations were avoidable;
- use hindsight to strengthen a contemporaneous verdict.

## Target Canada boundary

The default `/stratos-v2` packet is the August 21, 2013 scaling decision after
68 stores were operating and another 56 were planned. `T1`, `T2`, proposed
release gates, staged-tranche alternatives, and counterfactual quantities are
StratOS analytical terminology. They are not documented Target terminology or
actions. The public packet does not identify the decision authority or
delegation boundary, so authority remains `unknown`.

The August judgment is a cutoff-safe contemporaneous reconstruction: its
verdict and recommendations exclude later operating results and the exit.
Outcome-calibrated retrodictions in the scoring package answer a different
question by intentionally using a later evidence window. They are useful for
method calibration but are not independent blind predictions and must never be
presented as the August decision packet.
