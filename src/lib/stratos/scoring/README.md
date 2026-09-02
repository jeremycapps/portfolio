# StratOS scoring rubric

This package translates the Tempo vault's Tension Model v5.1 and Commitment Review v0.1 into a testable StratOS rubric. Version 0.2 adds the transferability/instantiation test exposed by the Target Canada case.

The [decision-logic ledger](./DECISION_LOGIC.md) defines the permitted authoring anchors, distinguishes reported facts from coded judgments, and records the case for the initial numbers.

The companion [judgment-layer guide](../decisions/README.md) documents how a
dated v0.2 Commitment Review is projected into `FIT`, `FOG`, or `COLLISION`, an
evidenced validated scale, material unknowns, and an ordered pair of bounded
operations. Scoring remains the quantitative substrate; the judgment layer
adds authorization semantics without collapsing people, time, and finance into
a universal score.

Each completed case has a separate outcome-calibrated retrodiction, while Ford has a latest-evidence calibration because its final 2026 horizon remains open. The original commitment-only `FOG` scorecards remain available for historical integrity. Calibrated outputs are Target `COLLISION`, Adobe `ABSORBABLE`, Domino's endpoint `COLLISION`, and Ford current `COLLISION` against the original plan.

It deliberately does **not** produce one universal score. The output has two layers:

1. **Organization-position diagnostics** describe where the organization sits across the six tensions and how well that judgment is evidenced.
2. **Commitment Review** decides whether a specific goal is worth pursuing and whether people, time, and finance can absorb it without tripping a risk floor.

## Position diagnostics

Each tension requires a position from `-1` to `+1`, a rationale, an observable metric, and either desk confidence or balanced evidence counts. Zero means deliberate synthesis or no material position; it is not automatically good.

The computed diagnostics are:

- **Commitment Index:** mean absolute position across all six tensions.
- **Spread:** normalized Shannon entropy of absolute position mass.
- **Evidence Index:** mean confidence.
- **Position interval:** `position ± 1.96 × (1/√3) × √(1 − confidence)`, clamped to `[-1, 1]`.
- **Layer Balance:** absolute strategy-side position minus its paired business-side position, reported at `|balance| ≥ 0.25`.
- **Priority:** posture-adjusted attention share multiplied by position uncertainty.

These diagnostics route inquiry. They never decide viability.

## Goal strain

Goal pull is compared with the company position tension by tension. Opposing poles create a pole-mismatch headwind. Version 0.2 separately estimates the share of installed capacity that is portable into the goal's context. This prevents an aligned operating capability from being called a tailwind when it must still be rebuilt in a new country, channel, technology, or business model.

Strain magnitude is normalized and may be used to prioritize research. It may not be added to capacity figures or treated as a probability of success.

| Tension | Capacity models receiving the strain |
| --- | --- |
| Advantage | Finance, people |
| Resource | People, finance |
| Discernment | Time |
| Execution | Risk, time |
| Invention | People, time |
| Operations | Time, finance |

Risk is a gate or uncertainty amplifier, not a spend model.

## Commitment Review

For people, time, and finance:

`effective capacity = capacity × transferability`

`reserve = effective capacity − committed`

`fit = reserve − goal load`

The models remain independent. A large finance surplus cannot compensate for a time deficit.

The decision cascade is:

1. A failed value or risk floor produces `FLOOR`.
2. An unresolved value or hard risk floor produces `FOG`.
3. Any definitely negative spend-model fit produces `COLLISION`, even if another spend model remains uncertain (`false AND unknown = false`).
4. If no model definitely collides, an indeterminate placement or fit range crossing zero produces `FOG`.
5. Only all-passing floors and non-negative fits produce `ABSORBABLE`.

For public-only cases, `committed` and `actual` figures are unavailable by definition. The reviewer must either return an indeterminate placement or state a sourced structural bound that the disclosed plan itself imposes. A structural bound is a contestable hypothesis; it does not masquerade as inside knowledge.

## Evidence contract

Every capacity figure requires a value/range, unit, epistemic state, confidence, `asOf`, source reference, and source class.

- Class A: mandatory disclosure.
- Class B: regulated or registry data.
- Class C: observed public signal.
- Class D: analyst or teaching framing; cannot supply a number.
- Inside: evidence that may support `committed` or `actual` state.

An `estimated` figure must be a range. Lower confidence should widen the range, not move its midpoint. Missing evidence receives no favorable default.

## Inputs still required for each case

The four case files under `../cases` are evidence profiles linked to provisional commitment-date scorecards. Re-scoring a decision-date snapshot requires the following cited judgments:

1. Strategic posture: insurgent, challenger, or incumbent.
2. Six organization positions, rationales, metrics, and confidence bases.
3. A measurable goal, horizon, sponsor, and three to five initiatives.
4. Six goal-pull directions and importance values.
5. Transferability ranges for context-changing capability claims.
6. People, time, and finance placements in compatible units.
7. Explicit risk floors with pass, trip, or unknown status.
8. A recorded prediction before the outcome window is opened.

The outcome should stay sealed until the rubric version, lenses, and prediction are pinned. A historical reconstruction written by the same analyst is useful for method development, but it is not an independent blind validation.

The Target August 2013 decision packet is a contemporaneous, cutoff-safe
reconstruction. It must remain separate from the Target outcome-calibrated
retrodiction described here: the former excludes later results when authoring
its verdict and operations, while the latter intentionally uses outcomes to
calibrate the method. Neither is a success prediction.
