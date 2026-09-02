# Golden-case handoff — McDonald's × IBM drive-thru "Automated Order Taker" (AOT)

**For:** the case-data agent building profiles/scorecards/decision-points.
**Status:** research done — figures below are confirmed and attributed. Same profile schema as `target-canada.ts` (sources → facts → snapshots). Tag convention (OBSERVED / ESTIMATED / FOG / HINDSIGHT) and the cutoff-safe rule from `research-needed.md` apply throughout.

**Why this case (domain = AI):** it is the most *recognizable* public AI-deployment failure — the viral drive-thru misorders — and it is a clean **transferability + release-velocity** story: McDonald's built the capability in-house (Apprente → McD Tech Labs), handed it to IBM, scaled to 100+ restaurants, and pulled it when accuracy never cleared the human baseline.

> **Read this before choosing it as the golden case.** McDonald's **never disclosed a dollar figure** — no budget, no spend, no impairment. The instrument's spine is the spend-over-time chart, and this case has *no finance line to draw*. That makes it a weak *golden* case (the chart would be empty) but a strong *secondary/illustrative* case whose constraints are **scale (100+ stores), operations/value (order accuracy vs human baseline), and transferability (in-house capability handed to a partner)**. Recommendation: **keep Watson/MD Anderson as the golden case (it has the dollars); use McDonald's as the recognizable AI companion case that leads on accuracy + transferability, with finance explicitly marked FOG.** Everything below is built so it drops in either way.

---

## Commitment

- **Company:** McDonald's Corporation (NYSE: MCD).
- **Vendor:** IBM.
- **Case name:** Automated Order Taker (AOT) — AI voice ordering at the drive-thru.
- **Capability origin:** McDonald's acquired voice-AI startup **Apprente** (2019-09-10) and folded it into an internal unit, **McD Tech Labs**. In the 2021 partnership, McDonald's **sold McD Tech Labs to IBM** and IBM took over developing/scaling the technology. → this is the **transferability** hook: the source capability was McDonald's own, transferred out to the partner.
- **Commitment (T0):** roll out AI voice ordering across the drive-thru network to speed service and simplify crew operations; test at ~100 US restaurants first.
- **Announced publicly:** 2021-10-26 (McDonald's/IBM global partnership).
- **Status:** completed (ended 2024-06-17; technology shut off in all restaurants no later than 2024-07-26; never scaled beyond the ~100-store test).

**Suggested `targets[]`:** like Watson, no clean numeric milestone. The honest target is a readiness/value gate: *"Reach human-parity order accuracy and scale AOT beyond the 100-store test."* The disconfirming outcome: accuracy plateaued below the human baseline and the test was ended without a broad rollout.

---

## Sources (map to `sources[]`)

> **Source-kind note:** all trade-press / news (`news` / `trade-press` — the kind the schema doesn't have yet, same as Watson). The primary corporate anchors are the Oct 2021 IBM/McDonald's release and the June 2024 McDonald's statement to franchisees (reported via CNBC/Restaurant Business); pin those two primary URLs if you want a company-release kind.

| id | title | publisher | kind | publishedAt | url |
|---|---|---|---|---|---|
| `mcd-apprente-2019` | McDonald's acquires Apprente to bring voice technology to drive-thrus | TechCrunch | trade-press | 2019-09-10 | https://techcrunch.com/2019/09/10/mcdonalds-acquires-apprente/ |
| `mcd-ibm-partner-2021` | McDonald's Partners with IBM to Expand Voice-Ordering Technology | QSR Magazine | trade-press | 2021-10-28 | https://www.qsrmagazine.com/operations/technology/mcdonalds-partners-ibm-expand-voice-ordering-technology/ |
| `cnbc-2024` | McDonald's to end AI drive-thru test with IBM | CNBC | trade-press | 2024-06-17 | https://www.cnbc.com/2024/06/17/mcdonalds-to-end-ibm-ai-drive-thru-test.html |
| `rb-2024` | McDonald's is ending its drive-thru AI test | Restaurant Business | trade-press | 2024-06-17 | https://www.restaurantbusinessonline.com/technology/mcdonalds-ending-its-drive-thru-ai-test |
| `restaurantdive-2024` | McDonald's ends IBM drive-thru voice order test | Restaurant Dive | trade-press | 2024-06-18 | https://www.restaurantdive.com/news/mcdonalds-ibm-drive-thru-automation-voice-ordering-ai/719085/ |
| `nrn-2024` | McDonald's is ending its AI drive-thru test with IBM | Nation's Restaurant News | trade-press | 2024-06-17 | https://www.nrn.com/quick-service/mcdonald-s-is-ending-its-ai-drive-thru-test-with-ibm |

---

## Facts (map to `facts[]`)

Each row: statement · metric · `observedAt` · origin tag · source · locator.

### Capability & transfer (the transferability line)

- **`mcd-apprente-acquired`** — "McDonald's acquired voice-AI startup Apprente in 2019 to build drive-thru voice ordering, folding it into an internal unit, McD Tech Labs." · qualitative · observedAt `2019-09-10` · **OBSERVED** · `mcd-apprente-2019`.
- **`mcd-techlabs-sold-ibm`** — "In the October 2021 partnership, McDonald's sold McD Tech Labs to IBM, transferring the in-house capability to the partner to develop and scale." · qualitative · observedAt `2021-10-26` · **OBSERVED** · `mcd-ibm-partner-2021`. **← core transferability fact.**

### Scale (the release-velocity line — the closest thing to a "goal line")

- **`mcd-aot-restaurant-count`** — "The AOT test was deployed at more than 100 US McDonald's drive-thru restaurants." · `{ value: 100, unit: 'restaurants', bound: 'lower' }` · observedAt `2024-06-17` · **OBSERVED** · `cnbc-2024` / `rb-2024`. **← use as the committed-scale anchor if you build any progression chart.**
- **`mcd-test-duration`** — "The test ran roughly two and a half years, from the October 2021 partnership to the mid-2024 wind-down." · `{ value: 2.5, unit: 'years' }` · observedAt `2024-06-17` · **ESTIMATED** (Oct 2021 → Jun 2024) · `nrn-2024`.

### Operations / value (the floor that tripped)

- **`mcd-accuracy-plateau`** — "The IBM system's order accuracy reportedly plateaued around 80–85%, below the ~90%+ typical of human crew." · `{ low: 80, high: 85, unit: 'percent order accuracy' }` · observedAt `2024` · **OBSERVED (reported/analyst — confirm exact figure & attribution)** · complex.com / TheStreet retrospective; corroborated by `restaurantdive-2024` noting 2022 analyst reports that the tech "was underperforming expectations." **← core value/operations-floor fact. Flag the soft attribution; McDonald's never officially stated an accuracy number.**
- **`mcd-underperforming-2022`** — "By 2022, analyst reports suggested the IBM voice technology was underperforming expectations." · qualitative · observedAt `2022` · **OBSERVED** · `restaurantdive-2024`. (Good T1 warning-point evidence.)
- **`mcd-accent-difficulty`** — "The system had difficulty interpreting different accents and dialects, contributing to misorders." · qualitative · observedAt `2024` · **OBSERVED** · aibusiness.com / `restaurantdive-2024`.

### The halt

- **`mcd-end-announced`** — "McDonald's told franchisees on June 17, 2024 that it would end the IBM AOT test." · observedAt `2024-06-17` · **OBSERVED** · `cnbc-2024` / `rb-2024`.
- **`mcd-shutoff-date`** — "The technology was to be shut off in all participating restaurants no later than July 26, 2024." · `{ value: '2024-07-26', unit: 'shutoff date' }` · observedAt `2024-06-17` · **OBSERVED** · `rb-2024` / `restaurantdive-2024`.
- **`mcd-exec-quote`** — Mason Smoot, chief restaurant officer, McDonald's USA: *"While there have been successes to date, we feel there is an opportunity to explore voice ordering solutions more broadly."* · observedAt `2024-06-17` · **OBSERVED** · `rb-2024` / `cnbc-2024`. (Use for the sponsor/owner tone; note it frames the exit as redirection, not failure.)

### Adjacent context — HINDSIGHT, do not set an in-window verdict

- **`mcd-google-successor`** *(HINDSIGHT / after case window)* — "McDonald's later pursued a Google-Cloud-based voice system (ArchIQ), reported around 90% accuracy." Keep only as 'the redirection landed somewhere' color; publishedAt is 2025+, so it is inadmissible at every in-window decision date. Sources: complex.com, artificialintelligence-news.com (2025).

---

## Decision points (map to `snapshots[]`)

- **T0 — Commitment (2021-10-26).** Cutoff `2021-10-26`. Admissible: the partnership release + the 2019 acquisition history. **Verdict: FOG.** The commitment states ambition (network-wide voice ordering) and a transferred capability, but no accuracy gate, no scale-out threshold, no disclosed budget. `finance` is **FOG by nature** — McDonald's never disclosed spend, so finance stays `insufficient-evidence` at *every* point in this case. factRefs: `mcd-apprente-acquired`, `mcd-techlabs-sold-ibm`.
  - `transferability`: inferred — capability existed in-house and was handed to IBM; whether it would transfer to a partner-run, network-scale deployment is the open question.
  - `operations`: inferred/low — 100-store voice deployment implies heavy real-world-audio readiness (accents, noise, lane bleed), unstated at commit.

- **T1 — Underperformance warning (2022).** Cutoff end-2022. Admissible: the 2022 analyst "underperforming expectations" reporting. **Verdict: FOG, warning.** The test is live at scale, but the first contrary signal (`mcd-underperforming-2022`) is public and no accuracy gate is disclosed — the "still scaled, no gate cleared" state, analogous to Target's continued rollout. factRefs: `mcd-underperforming-2022`, `mcd-aot-restaurant-count`.

- **T2 — Halt (2024-06-17).** Cutoff `2024-06-17`. Everything admissible. **Verdict: COLLISION / FLOOR.** The floor is **value/operations**: accuracy plateaued below the human baseline (`mcd-accuracy-plateau`) across a 100+ store deployment, and McDonald's ended the test. Unlike Watson there is **no finance floor** (no dollars public) — the trip is purely operational value not clearing the human-parity bar. `breakingModels` empty (no counted-capacity collision). factRefs: `mcd-accuracy-plateau`, `mcd-accent-difficulty`, `mcd-aot-restaurant-count`, `mcd-end-announced`, `mcd-shutoff-date`, `mcd-exec-quote`.

**Owner resolution (for `ownerFor()`):** the uncertainty sits on operational value (order accuracy in the field), so the natural owner is **the operations lead** (McDonald's chief restaurant officer). The move at T2 reads: *"AOT is live in 100+ restaurants and still can't match a human on accuracy — get the restaurant-operations lead's read before any network rollout."* Key off the value/operations floor label in the central resolver, not the review input.

---

## The arc in one line (for the case card)

FOG (2021, capability transferred out, no accuracy gate) → FOG (2022, analysts flag underperformance while still scaled to 100 stores) → **COLLISION** (2024, accuracy never cleared the human baseline; test pulled from all restaurants). AI scaled to the field before it was accurate enough to trust — and the capability had been handed to the partner to prove.

---

## Loose ends for the implementer (cheap to close)

1. **The accuracy number is the soft spot.** ~80–85% (IBM) vs ~90% (human) is *reported/analyst*, not a McDonald's-stated figure. Confirm the exact number and attribution before it goes on a card; if you can't pin it, state it as qualitative ("below human parity") rather than a hard percent.
2. **Two primary URLs** — the Oct 2021 IBM/McDonald's release and the June 2024 statement to franchisees. Trade-press citations for every fact are above; the primaries would upgrade the source kind to company-release.
3. **No dollars exist.** Don't fabricate a spend line. If the UI needs a progression, the 100-store scale (`mcd-aot-restaurant-count`) is the only committed quantity — and finance is legitimately FOG, which is itself a faithful thing for the instrument to show.
