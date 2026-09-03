# Golden-case handoff — McDonald's × IBM drive-thru "Automated Order Taker" (AOT)

**For:** the case-data agent building profiles/scorecards/decision-points.
**Status:** implemented in `mcdonalds-ibm-aot.ts`, with web-researched corrections to the original handoff. Same profile schema as `target-canada.ts` (sources → facts → snapshots). Tag convention (OBSERVED / ESTIMATED / FOG / HINDSIGHT) and the cutoff-safe rule from `research-needed.md` apply throughout.

**Why this case (domain = AI):** it is a recognizable public AI-deployment reversal and a clean **transferability + release-velocity** story: McDonald's built the capability in-house (Apprente → McD Tech Labs), handed it to IBM, expanded the test from 10 to 24 to 100+ restaurants, and ended the IBM path without publishing evidence that it had cleared the 95%+ broader-adoption gate.

> **Read this before choosing it as the golden case.** McDonald's **never disclosed a dollar figure** — no budget, no spend, no impairment. The instrument's spine is the spend-over-time chart, and this case has *no finance line to draw*. That makes it a weak *golden* case but a strong *secondary/illustrative* case whose constraints are **scale (100+ stores), operational readiness (order accuracy against the company's reported adoption gate), and transferability (in-house capability handed to a partner)**. Recommendation: **keep Watson/MD Anderson as the golden case (it has the dollars); use McDonald's as the recognizable AI companion case that leads on accuracy + transferability, with finance explicitly marked FOG.**

---

## Commitment

- **Company:** McDonald's Corporation (NYSE: MCD).
- **Vendor:** IBM.
- **Case name:** Automated Order Taker (AOT) — AI voice ordering at the drive-thru.
- **Capability origin:** McDonald's acquired voice-AI startup **Apprente** (2019-09-10) and folded it into an internal unit, **McD Tech Labs**. In the 2021 partnership, McDonald's **sold McD Tech Labs to IBM** and IBM took over developing/scaling the technology. → this is the **transferability** hook: the source capability was McDonald's own, transferred out to the partner.
- **Commitment (T0):** transfer the restaurant-tested AOT capability to IBM to develop it further and scale it across markets, languages, dialects, and menu variations.
- **Announced publicly:** 2021-10-27 (McDonald's/IBM joint statement; the original handoff's October 26 date was not supported by the primary release).
- **Status:** completed (ended 2024-06-17; technology shut off in all restaurants no later than 2024-07-26; never scaled beyond the ~100-store test).

**Implemented `targets[]`:** *"Reach at least 95% order accuracy before broader adoption."* That threshold comes from the June 2022 BTIG franchisee survey reported contemporaneously by Restaurant Dive. It is not retroactively applied to the October 2021 packet, where the accuracy release gate remains FOG.

---

## Sources (map to `sources[]`)

> **Source-kind note:** the October 2021 source is the primary McDonald's/IBM joint statement. The accuracy and halt evidence is reported news; the 2024 franchisee memo is not public, so the profile does not elevate it to `company-release`.

| id | title | publisher | kind | publishedAt | url |
|---|---|---|---|---|---|
| `restaurant-dive-aot-pilot-2021` | McDonald's pilots automated drive-thru ordering in Chicago | Restaurant Dive | news | 2021-06-03 | https://www.restaurantdive.com/news/mcdonalds-pilots-automated-drive-thru-ordering-in-chicago/601210/ |
| `ibm-mcdonalds-aot-2021` | Joint Statement from McDonald’s and IBM | IBM Newsroom | company-release | 2021-10-27 | https://newsroom.ibm.com/Joint-Statement-from-McDonalds-and-IBM |
| `restaurant-dive-aot-accuracy-2022` | McDonald's AI voice ordering tests underperforming on accuracy, survey says | Restaurant Dive | news | 2022-06-23 | https://www.restaurantdive.com/news/mcdonalds-ai-drive-thru-voice-ordering-accuracy/625923/ |
| `restaurant-dive-aot-halt-2024` | McDonald’s ends IBM drive-thru voice order test | Restaurant Dive | news | 2024-06-17 | https://www.restaurantdive.com/news/mcdonalds-ibm-drive-thru-automation-voice-ordering-ai/719085/ |
| `ai-business-aot-halt-2024` | McDonald's Drops IBM's AI Order Tech, Seeks New Drive-Thru Tech | AI Business | news | 2024-06-17 | https://aibusiness.com/nlp/mcdonald-s-drops-ibm-s-ai-order-tech-seeks-new-drive-thru-tech |

---

## Facts (map to `facts[]`)

Each row: statement · metric · `observedAt` · origin tag · source · locator.

### Capability & transfer (the transferability line)

- **`mcd-apprente-origin`** — "McDonald's created McD Tech Labs after acquiring voice-AI company Apprente in 2019." · qualitative · observedAt `2019` · **OBSERVED** · `ibm-mcdonalds-aot-2021`.
- **`mcd-tech-labs-transfer`** — "IBM agreed to acquire McD Tech Labs and take its team into IBM Cloud and Cognitive Software to accelerate AOT development and deployment." · qualitative · observedAt `2021-10-27` · **OBSERVED** · `ibm-mcdonalds-aot-2021`. **← core transferability fact.**

### Scale (the release-velocity line — the closest thing to a "goal line")

- **`mcd-aot-pre-transfer-pilot`** — 10 Chicago restaurants · observedAt `2021-06-03` · **OBSERVED** · `restaurant-dive-aot-pilot-2021`.
- **`mcd-aot-test-24-restaurants`** — 24 Illinois restaurants · observedAt `2022-06-23` · **OBSERVED** · `restaurant-dive-aot-accuracy-2022`.
- **`mcd-aot-over-100-restaurants`** — more than 100 restaurants · observedAt `2024-06-17` · **OBSERVED**, represented as a lower-bound unit · `ai-business-aot-halt-2024`.

### Operations / value (the floor that tripped)

- **`mcd-aot-pre-transfer-accuracy`** — roughly 85% accuracy at 10 restaurants, reported by McDonald's CEO · observedAt `2021-06-03` · **OBSERVED** · `restaurant-dive-aot-pilot-2021`.
- **`mcd-aot-pre-transfer-intervention`** — employees recorded about 20% of pilot orders · observedAt `2021-06-03` · **OBSERVED** · `restaurant-dive-aot-pilot-2021`.
- **`mcd-aot-low-80s-accuracy`** — low-80% accuracy at 24 Illinois restaurants, from a BTIG franchisee survey · observedAt `2022-06-23` · **OBSERVED (reported analyst survey)** · `restaurant-dive-aot-accuracy-2022`.
- **`mcd-aot-95-percent-gate`** — McDonald's sought 95%+ accuracy before broader adoption, per the same BTIG report · observedAt `2022-06-23` · **OBSERVED (reported analyst survey)** · `restaurant-dive-aot-accuracy-2022`.

There is no public terminal accuracy measure. The implementation therefore does **not** turn the 2021 85%, the 2022 low-80s result, or anonymous 2024 comments into a claimed 2024 “plateau,” and it does not invent a human-baseline comparison.

### The halt

- **`mcd-aot-partnership-ended`** — McDonald's decided not to renew the IBM AOT partnership and would explore other voice-ordering paths · observedAt `2024-06-17` · **OBSERVED** · `ai-business-aot-halt-2024`.
- **`mcd-aot-shutoff-by-july`** — all test systems would be off no later than July 26 · observedAt `2024-06-17` · **OBSERVED** · `ai-business-aot-halt-2024`.
- **`mcd-aot-operations-owner`** — Mason Smoot, chief restaurant officer, framed the decision as a redirection to broader voice-ordering options · observedAt `2024-06-17` · **OBSERVED** · `ai-business-aot-halt-2024`.
- **`mcd-voice-ordering-still-valued`** — McDonald's retained confidence in voice ordering as a category · observedAt `2024-06-17` · **OBSERVED** · `restaurant-dive-aot-halt-2024`.

### Adjacent context — HINDSIGHT, do not set an in-window verdict

- **`mcd-google-successor`** *(HINDSIGHT / after case window)* — "McDonald's later pursued a Google-Cloud-based voice system (ArchIQ), reported around 90% accuracy." Keep only as 'the redirection landed somewhere' color; publishedAt is 2025+, so it is inadmissible at every in-window decision date. Sources: complex.com, artificialintelligence-news.com (2025).

---

## Decision points (map to `snapshots[]`)

- **T0 — Capability transfer (2021-10-27).** The pre-transfer pilot had 10 restaurants, roughly 85% accuracy, and about 20% employee intervention. **Verdict: FOG.** Those measures had no public release threshold, and the transfer to IBM supplied no scale-out gate or disclosed budget. `finance` is **FOG by nature** at every point.
  - `transferability`: inferred — capability existed in-house and was handed to IBM; whether it would transfer to a partner-run, network-scale deployment is the open question.
  - `operations`: inferred/low — 100-store voice deployment implies heavy real-world-audio readiness (accents, noise, lane bleed), unstated at commit.

- **T1 — Field-accuracy warning (2022-06-23).** The test had expanded to 24 restaurants and reported low-80s accuracy against a 95%+ condition for broader adoption. **Verdict: FOG, warning.** The requested commitment remains the bounded test, not broader adoption; the improvement cycle, operational benefit, people load, time, and finance are unplaced.

- **T2 — IBM-path halt (2024-06-17).** **Verdict: COLLISION / FLOOR.** The last public accuracy measure was below the 95%+ broader-adoption gate; no terminal measure established clearance, and McDonald's ended the IBM path after a 100+ restaurant test. This is an **operational-readiness floor**, not a claim that voice ordering lacked value: McDonald's explicitly retained the category thesis. `finance` remains FOG and `breakingModels` is empty.

**Owner resolution (for `ownerFor()`):** the first failed leg is `order-accuracy-readiness`, which the central resolver routes to **the restaurant-operations lead**. The model does not claim a human-baseline comparison the sources do not establish.

---

## The arc in one line (for the case card)

FOG (2021, capability transferred out with pilot measures but no release gate) → FOG (2022, 24-store accuracy sits below the newly reported broader-adoption gate) → **COLLISION** (2024, no public evidence clears that gate before the IBM path ends after 100+ restaurants).

---

## Research resolutions

1. **Accuracy conflict resolved by date and scope.** The 85% figure belongs to McDonald's 10-restaurant June 2021 pilot; the low-80s figure belongs to the 24-restaurant June 2022 survey. Neither is authored as a terminal 2024 accuracy result.
2. **Announcement date corrected.** Both IBM and McDonald's host the joint statement dated October 27, 2021.
3. **Terminal causality bounded.** McDonald's did not publish terminal accuracy or say accuracy caused the halt. The case says only that no public measure established clearance of the reported wider-adoption gate before the observed decision to end the IBM path.
4. **No dollars exist.** The UI renders `no line`; it does not plot `$0M`, and finance remains explicitly FOG.
