# Spec — the answer-role readout (StratOS judgment flow, screen 1)

**Date:** 2026-09-02
**Surface:** `src/pages/stratos-flow.tsx` (+ `stratos-flow.css`) — the hero screen and the flow section beneath it.
**Status:** design agreed in session; not yet implemented. This supersedes the four-row `StepReadout` card currently under the chart.

---

## 1. Why

The chart answers *how much / how fast*. The prose headline that sat above it ("Averaged $2M a month…") restated the chart and did case-study work, so it was cut. What replaces it is not another caption but the thing the instrument is actually for:

> **Given where this commitment is, can it still converge on its goal — and what pivot would get it there?**

Everything on screen 1 now serves that question, expressed through Facia's four **answer roles** — a ladder of composition, each rung a higher-order question than the last (`content/blog/facia-v2-design.md`, "Answer roles"):

| Role | Composition | Answers | Here it is… |
|---|---|---|---|
| **Value** | atomic — one fact | what is known | the dollars (people/time later) committed — the chart's dot labels |
| **Verdict** | composite — many facts → one judgment | what has been judged | the step's colour: Converging / Unresolved / Diverged |
| **Operation** | directional — a judgment → a change | what change is enacted or offered | the **Proposed tasks** section |
| **Convergence** | converging — a *sequence* → a trajectory | did repeated motion approach the goal | the **chart itself**, plus the pivot line + confidence under it |

The reframe resolves the earlier "grey is wrong" instinct: on a convergence trajectory every point is *motion*, so an unresolved step is amber (moving, unproven), never grey (stalled). Only a diverged step is red.

---

## 2. The four roles, placed

### Value — atomic fact (no dedicated row)
The committed dollars are already the labelled dots on the chart. Value is **not** a separate text row; it lives on the chart. For a case with no public dollars (McDonald's), the dots read `no line` and the money framing is absent by design — see §6.

### Verdict — drives colour only (never shown as a word)
The selected step's verdict sets one tone that themes the whole step. **The verdict word never renders** — colour is the sole carrier. `Band` is derived from the view: `value-floor`/`risk-floor` cause → `FLOOR`, else `view.verdict`. Tone mapping:

- Converging (FIT) → `ok` (green)
- Unresolved (FOG) → `uncertain` (amber / `--accent`)
- Diverged (COLLISION / FLOOR) → `bad` (red)

Colour propagates to: the chart's dots (each dot already shows its own step's verdict — keep), the pivot line, and the confidence figure. A `VERDICT_WORDS` map may still exist for `aria-label`/internal use, but it is not painted on screen.

### Operation → one Proposed task, "Do ___ because ___" (screen 3)
The operation role becomes a **single proposed task**, framed as *"{action}. Because {reason}."* — not a list of two. It is sourced from the **composed** `decisionRecommendation(view)`, not the raw recommendation tuple:

| Task part | Source |
|---|---|
| the action ("do") | `decisionRecommendation(view).move` |
| the reason ("because") | `decisionRecommendation(view).focus.detail` (omitted when absent) |
| owner (assignee chip) | `decisionRecommendation(view).owner` (omitted on EXIT — no one left to ask) |

> **Why the composed layer, not `recommendations[0]`.** The spec first pointed at `recommendations[0].displayLabel` / `.authorizationReason`, but those are raw engine values — `displayLabel` is a verb macro (`"HOLD"`), the reason is generic boilerplate, and the owner is a legalistic string. `decisionRecommendation` is the human-facing layer that already resolves the move into a sentence, the reason into the focus detail, and the owner into a natural role (e.g. "the delivery lead"). `view.recommendations` remains a `['commitment','path']` tuple — **not** the Facia meaning/execution axis — and is what `decisionRecommendation` composes from.

Rendered verdict-toned. This task is **screen 3** of the flow — its own phone screen, after screen 1 (chart) and screen 2 (the constraints "why"). It re-resolves with the selected step like the rest of the flow.

### Convergence — the chart + two things under it
The chart is the convergence view (a temporal sequence approaching the goal line). Directly under the chart there are **only two elements, and nothing else**:

1. **The pivot** — the authored one-line answer to "what pivot converges us from here": e.g. *"Prove adoption at one site before authorising wider rollout."*
2. **A confidence score** — how much of the read is actually evidenced at this step.

Both verdict-toned.

---

## 3. Layout (screen 1, top to bottom)

```
SCREEN 1 (hero)
  app head (StratOS · bell)
  case switcher            Target · Watson · VA · McDonald's
  kicker                   <case name>
  ──────────────────────────────────────────────
  CHART (convergence)      dated dots, verdict-coloured; goal line when $ exists
  ──────────────────────────────────────────────
  pivot                    “Prove adoption at one site…”     ← verdict-toned
  confidence               “Confidence 62%”                  ← verdict-toned

SCREEN 2   the constraints “why” (existing)
SCREEN 3   the proposed task — “Do X because Y.” + owner   ← verdict-toned
```

Nothing else under the chart on screen 1. The old four-row card is removed. The device is fixed-height; pivot + confidence are small, so unlike the four-row card they fit without the internal scroll that card forced.

The flow is a run of phone screens; the task is **screen 3**, re-resolving with the selected step.

---

## 4. Data sources (nothing authored for display, except the pivot)

| Element | Source | Notes |
|---|---|---|
| Dot value / label | `costSeries(...)` → `point.total`; `formatUsdMillions` | `no line` when the case has no cost figures |
| Verdict / band | `bandOf(view)` from `view.verdict` + `view.cause.kind` | FLOOR recovered from cause |
| Tone (colour) | band → `ok` / `uncertain` / `bad` | drives dots, pivot, confidence |
| Proposed task (screen 3) | `decisionRecommendation(view)` | `move` (action) · `focus.detail` (reason) · `owner` (natural role) — not the raw `recommendations[0]` tokens |
| Convergence pivot | `CONVERGENCE_PIVOTS[decisionId]` — **authored** | editorial "what would you do"; keyed by decision id; missing → possibility line only |
| Confidence score | **derived** — see §5 | countable, not authored |

The pivot is the one deliberate editorial claim. It is kept as a presentation-layer map (`Record<decisionId, string>`) rather than in the case profile, so it doesn't collide with case-data authoring; it can migrate into the case schema later if the case agent wants to own it.

---

## 5. Confidence score

Confidence is **evidence completeness of the read**, derived from the decision's conditions (`view.legs`, each `pass | fail | no-line`):

```
resolved = legs where status ∈ {pass, fail}
total    = all legs
confidence = round(100 × resolved / total)      // 0–100%, integer
```

Rationale: a step where every condition is priced (pass or fail) is a confident read; a step full of `no-line` (unpriceable / unknown) is not. This produces a meaningful arc — low at the commitment point, higher once evidence accumulates — and pairs honestly with the verdict (high confidence + Diverged = "we're sure it broke away"; low confidence + Unresolved = "we can't yet tell").

**Display:** a percentage, e.g. `Confidence 62%`, verdict-toned. (A ring/meter is a later refinement; start with the number.) Fallback: if `legs` is empty, the score is suppressed rather than shown as 0 / NaN.

> Alternatives considered and rejected for v1: averaging `PresentationTension.confidence` (absent on cases without a scorecard, so not always available); counting `materialUnknowns` (unbounded, no natural denominator). Legs are always present and bounded.

---

## 6. Edge case — no public dollars (McDonald's)

A case can have dated decisions and **no disclosed dollars**. Then:
- The chart draws no spend line and no $ ticks; dots read `no line` and sit on the baseline (already implemented via `costScale` observed-max-0 handling and `SpendPlot`'s `hasCostLine`).
- **Value** as dollars is absent; the dated markers carry it instead.
- **Convergence** reads on the case's real dimension, not spend — e.g. *"No dollar goal disclosed — convergence reads on accuracy, not spend."* The authored pivot still applies.
- **Confidence** is unaffected (legs exist regardless of dollars).

This is not a degraded state to hide — a legitimately empty money line is itself a faithful thing for the instrument to show.

---

## 7. Decisions (resolved in session)

1. **Task placement → screen 3.** The proposed task is its own phone screen, third in the flow, after screen 1 (chart) and screen 2 (constraints "why").
2. **Confidence → percentage.** Start with `Confidence 62%`; a ring/meter is a later refinement.
3. **Verdict word → not shown.** Colour is the only carrier; no verdict text renders on screen 1.
4. **One task, not two.** Framed "Do {action} because {reason}" from the `commitment`-plane recommendation. The two recommendations are planes `commitment`/`path`, not the meaning/execution axis; only the first is shown.

---

## 8. Out of scope

- Verdict vocabulary is expected to change again; it stays a single map so a reword is one edit.
- No engine or case-data changes: this is a presentation-layer redesign of `stratos-flow.tsx` / `stratos-flow.css`. The pivot map and confidence derivation live in the page/presentation layer.
- Authored pivot lines currently exist for Watson only; Target / VA / McDonald's need their lines written (one per decision) or they fall back to the possibility-only convergence line.

---

## 9. Build checklist

- [ ] Remove the four-row `StepReadout`; keep `bandOf`, `CONVERGENCE_PIVOTS` (and `VERDICT_WORDS` only for `aria`, not display).
- [ ] Screen-1 under-chart block: pivot line + `Confidence NN%`, verdict-toned. Nothing else.
- [ ] `confidenceOf(view)` from `legs` (§5), integer percent, empty-legs fallback.
- [ ] Screen 3 = `ProposedTask` from `recommendations[0]`: "Do {displayLabel} because {authorizationReason}." + owner chip, verdict-toned. Fit into the existing `STAGES` flow after the constraints screen.
- [ ] Verify colour propagation for all three verdicts across Target / Watson / VA / McDonald's.
- [ ] Author pivot lines for Target, VA, McDonald's decisions (or accept fallback).
- [ ] Confirm screen 1 fits the fixed device at every step / case without internal scroll.
