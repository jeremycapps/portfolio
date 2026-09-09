# Klarna + StratOS → Technical Product Manager case study — reframe spec

**Status:** Implemented and verified
**Date:** 2026-09-09
**Branch:** `claude/ai-product-management-case-ec5fc9`
**Type:** Narrative / register reset across docs, positioning copy, and the live page lead. The interactive machinery (view models, evidence sets, cases) is **not** rewritten — what changes is what *leads*, the voice, and which number is treated as the hero.

---

## 1. Why this reframe

The Klarna golden case and StratOS are currently framed as an **enterprise-transformation / commitment-judgment** system (the L0–L5 firewall, the FIT/FOG/COLLISION verdict engine, the 60-metric matrix). Jeremy is repositioning both as a **technical product manager case study**, tuned to the thesis that AI is *reinventing* the PM role — moving the PM from execution to judgment, metric-grain discipline, and holding the human/AI boundary.

The deeper reason, named in the brainstorming session: the instrument-first framing was partly a way to avoid standing in front of the decision. **The leader's job is to hold the tension and walk someone through it; that holding is what gets hired — not the tool.** See memory `leadership-is-the-offer` and `best-idea-is-someone-elses` (the latter is nuanced, not replaced).

## 2. The four locked decisions

1. **Leading product question = the governed boundary.**
   *"Where does this growth stop being sustainable — where is the line the AI must not cross alone, and how do you know when you've crossed it?"*
   The scaling call (*"the pilot works, scale it"*) is the **surface** decision it disciplines. The scaling question hides a fatal assumption: that the boundary hasn't already moved underneath you. The governed boundary catches that assumption. In Klarna terms: "deepen the assistant's mandate" assumed the human buffer receiving the complex queue was intact — but it was already being cut before launch. The line had moved; nobody was watching it.

2. **The apparatus recedes, stays underneath.**
   Plain product-management language leads (guiding metric, the boundary, the gate, the rollback). The L0–L5 levels, 12-pole ontology, 60-metric matrix, and verdict types become **inspectable depth** beneath a fold — available on drill-in, not what a reader meets first.

3. **Voice = first-person technical PM who leads.**
   Jeremy names the call, holds the tension, and walks the reader through it. StratOS appears as *"what I built to catch it"* — evidence the judgment is real, **never the grammatical subject of the sentence that makes the decision.** No tool-shoving ("see, if you run it, it works for you too").

4. **Scope = docs + positioning copy + the live page lead.**
   Reframe the two canonical docs, the portfolio copy, and the **hero/intro copy + lead-metric ordering** on the canonical public page. Not the deep interactive rewrite of the 2,700 lines of page code.

## 3. The reframe spine (the through-line every surface must carry)

> When your AI pilot is working, the numbers everyone celebrates — deflection, blended CSAT, average handle time — climb *right up to the edge of the cliff*. They're the wrong number. The number that governs whether you can keep growing is the one nobody puts on the launch slide: **queue depth / backlog age by segment**, and **load factor ρ on the human capacity that receives every transfer the AI can't handle.** A technical PM's job at that moment is to hold that discomfort and walk the org to the sustainable line before the next irreversible increment — not to ride the flattering aggregate over the edge.

**The hero metric flips.** The "less-sexy number" leads:
- **Primary:** backlog age / queue depth by segment; load factor ρ on the starved complex queue (Kingman: wait goes vertical as ρ→1).
- **Demoted:** deflection share, blended/aggregate CSAT, AHT, projected savings → named as "the flattering aggregate that moves *up* toward the cliff."

This is Jeremy's signature move — **proportions vs. load** (memory `two-questions-in-automation`).

## 4. Voice guardrails (apply to every surface)

- **Jeremy makes the call in first person.** "Here's the call I'd hold." StratOS is evidence: "what I built to catch it," never "the tool decides."
- **Positive / opportunity-first** (memory `positive-opportunity-framing`): the boundary is how you grow *safely*, not a doom story. Klarna stays *vindicated by the company itself* (it reached the same conclusion in May 2025), never a humiliation.
- **Clarity over cleverness** (memory `clarity-over-cleverness`): plain statements; name the governing metric plainly; no aphorisms that make the reader work.
- **Status-precise** (memory `portfolio-answers-need-grounding`): StratOS is an independent 2026 prototype with no demonstrated adoption or measured customer impact. Do not invent traction.
- **No hindsight leaks into the dated verdict:** the May-2025 reversal *checks* the call; it does not *make* it. Keep the OBSERVED / ESTIMATED / FOG / HINDSIGHT discipline intact.

## 5. Per-surface changes

### 5.1 `docs/stratos/golden-case-klarna-ai-support.md`
- **Keep** every sourced fact, evidence tag, the tension mapping, the 60-metric matrix, verdict types, market modulation. They recede below a fold, they are not deleted.
- **Rewrite the top framing** (currently "Golden-case handoff for the case-data agent"): open in **first person as the technical PM**. State the call every 2026 PM faces, the hidden assumption in the scaling question, the moving boundary, and how a PM holds it before the increment.
- **Promote the backlog / queue-depth evidence** (currently buried as "Teams, people & the backlog signal (L3 grounding)") to the **hero evidence block**, immediately after the framing. The cuts-precede-launch timeline and the quadrupled backlog are the proof the boundary had already moved.
- **Add a clear fold** ("How the instrument reads it underneath") under which the ontology / L0–L5 / matrix / verdict-type material lives, so a PM reader meets the decision first and the machinery only on drill-in.
- Preserve the counter-move (Hold the tranche + install the L2 firewall) but state it in PM language first, with the grammar underneath.

### 5.2 `docs/stratos/product-and-case-study-spec.md`
- **Rewrite the Primary question** (line 5) and **§2 Product thesis** from *"largest commitment you can responsibly make next"* to the **governed-boundary** framing in TPM terms: the instrument a technical PM uses to find and hold the sustainable line for an AI increment.
- **Keep** the two-recommendation contract, evidence labels, operation grammar, output schema, case-study method (they recede/stay underneath).
- **Rewrite the hero copy (§10.1)** to the new lead (see 5.4 for the headline).
- Where the spec introduces intent, use first-person framing that positions StratOS as evidence of Jeremy's judgment, not as an autonomous grader.

### 5.3 `content/profile.md` (StratOS section, ~L253–264) + `src/lib/projects.ts` (card, L41–48)
- **Rewrite both to first-person TPM leadership.** Lead with the governed boundary and the Klarna call; StratOS named as the evidence.
- Current card: *"Using Klarna's AI support rollout, StratOS shows how strong aggregate metrics can hide a shrinking human exception system…"* → put the **call and the PM** first, the instrument second. Suggested direction (tighten in copy): *"The call every 2026 PM faces — the AI pilot's numbers are great, so scale it. I hold the harder question: the boundary between AI and human has already moved, and the flattering metrics hide it. StratOS is what I built to find the line before the next increment."*
- Keep `profile.md`'s "status precise" guidance intact (the note at ~L361 about `/stratos-v2` being the current public expression).
- Note: `projects.ts` card `description` is prose; keep it within roughly the current length so the card layout holds.

### 5.4 Live page lead — **`/stratos-v2`** (canonical lead surface)
- **Decision (default, easily reversible):** lead on `/stratos-v2`, which `profile.md` already canonizes as "the current public product expression." If Jeremy prefers `/stratos-flow`, the same lead copy applies there instead. *(This was the one open call at spec-writing time; recorded as resolved-by-default.)*
- Change **hero + intro copy only**, plus **lead-metric ordering** — not the interactive internals.
- **Headline direction:** *"When the AI pilot works, the boundary moves — and the numbers hide it."* Subhead in first person naming what a technical PM watches instead.
- **Lead-metric ordering:** surface the boundary metric (queue depth / load ρ by segment) as the hero reading; demote deflection/aggregate CSAT to "the flattering aggregate." Verify against the view model that the boundary metric is actually available to surface (see `src/lib/stratos/decisions/*`); if a value isn't in the data, say so rather than authoring it (the page's existing rule: "nothing is authored for display").
- Keep the commit button inert and the decision layer read-only (existing constraints in `stratos-flow.tsx`).

## 6. Execution order

1. Land this spec + the handoff (commit).
2. `golden-case-klarna-ai-support.md` — establishes the canonical narrative; everything downstream borrows its language.
3. `product-and-case-study-spec.md` — align the product framing to the new lead.
4. `content/profile.md` StratOS section + `src/lib/projects.ts` card.
5. `/stratos-v2` hero/intro + lead-metric ordering.
6. Run the test suite (`npm test` / the relevant `e2e/stratos-*.spec.ts`, `src/lib/stratos/**` unit tests) and the prerender check, since copy on prerendered public routes is asserted in tests.

## 7. Acceptance criteria

1. A first-time reader meets **the decision and the person holding it** before any ontology/level/matrix vocabulary.
2. The **governed-boundary question leads**; the scaling call is presented as the surface decision it disciplines.
3. The **boundary metric** (queue depth / load ρ by segment) is the hero reading; deflection/aggregate CSAT are explicitly framed as the flattering aggregate.
4. Voice is **first-person technical PM**; in every sentence that makes a call, Jeremy is the subject and StratOS is evidence — never the decider.
5. The apparatus (L0–L5, poles, 60-metric matrix, verdict types) is **present but below a fold**, intact and inspectable.
6. No invented adoption/traction; StratOS's status stays precise.
7. Evidence tags and the no-hindsight rule are preserved in the dated verdict.
8. Klarna reads as **vindicated by the company itself**, in a positive/opportunity register — not a failure autopsy.
9. Tests and prerender pass after the live-page copy change.

## 8. Out of scope (explicit)

- Deep rewrite of the interactive internals of `stratos-flow.tsx` / `stratos-v2.tsx` (2,700 lines) — only hero/intro copy and lead-metric ordering change now.
- New cases, new evidence, or new model machinery.
- Changing the FIT/FOG/COLLISION grammar or the two-recommendation contract.
- `/stratos` (six-tension predecessor) copy beyond what a consistent register requires.

## 9. Provenance

Locked decisions from the 2026-09-09 brainstorming session. Supporting memory: `leadership-is-the-offer`, `best-idea-is-someone-elses`, `subtraction-product-instinct`, `two-questions-in-automation`, `intelligence-execution-gap`, `positive-opportunity-framing`, `clarity-over-cleverness`, `portfolio-answers-need-grounding`, `klarna-golden-case`.

## 10. Implementation record

Implemented on 2026-09-09 across the canonical Klarna case, product specification, portfolio profile and card, `/stratos-v2` React and crawl surfaces, route metadata, and affected tests. The published backlog increase leads as observed evidence; segment-level backlog age and human-queue load remain explicitly identified as measures that needed instrumentation rather than authored historical values. The ontology, lifecycle model, matrix, and verdict grammar remain available as inspection depth.

Verification:

- `npm test -- --run`: 83 application test files / 687 tests and 16 Facia test files / 113 tests passed.
- `npm run build`: production client, SSR bundle, and prerender completed.
- `npx playwright test e2e/stratos-v2.spec.ts`: 3 Chromium tests passed, including the narrative-order and accessibility checks.
