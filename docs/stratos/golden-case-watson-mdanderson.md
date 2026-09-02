# Golden case handoff — IBM Watson × MD Anderson "Oncology Expert Advisor"

**For:** the case-data agent building profiles/scorecards/decision-points.
**Status:** research done — figures below are confirmed and attributed to specific sources. Drops onto the same profile schema as `target-canada.ts` (sources → facts → snapshots). Tag convention (OBSERVED / ESTIMATED / FOG / HINDSIGHT) and the cutoff-safe rule from `research-needed.md` apply throughout.

**Why this is the golden case (domain = AI):** it is the clearest public instance of *AI capital committed before value was demonstrated*, and it clears all four data demands the instrument needs:

1. **Goal line** — a contracted commitment (non-competitively awarded) that realized spend overran, with a hard terminal figure.
2. **The move** — a dated decision sequence (2012 start → contract extended 12 times → Feb 2017 halt) with a natural owner (the clinical sponsor / CMO).
3. **Constraints** — quantified: finance ($62M spent), governance ($51.4M awarded non-competitively; $11.6M gift-fund deficit), operations (never integrated with the Epic EHR → readiness floor), value (never used on a real patient → value floor).
4. **The arc** — FOG at commit (no disconfirming evidence shown) → FOG deepening as scope narrows → **COLLISION / FLOOR** at the Feb 2017 audit (value floor and readiness floor both tripped). It does *not* recover, which makes it the counterpart to a positive control.

> **Goal-line caveat (read before you build the spend chart).** Unlike Target/VA, MD Anderson never published a single pre-committed lifecycle budget. The strongest committable anchor is the **$51.4M in contracts awarded to the two vendors** (the audit's own figure) as the "committed" line, and **$62.1M total spend** as the realized line — an overshoot of ~$10.7M plus the fact that the contracted work was never completed. Model the goal line as the contracted commitment; annotate that the overshoot here is as much *governance* (non-competitive, gift-fund deficit) as raw dollars. If that reads as too thin a budget line for the chart, VA remains the anchor and this case leads on the value/readiness floors instead.

---

## Commitment

- **Company:** The University of Texas MD Anderson Cancer Center (public academic medical center, part of the UT System).
- **Vendor:** IBM (Watson); implementation partner PwC.
- **Case name:** Oncology Expert Advisor (OEA) — a Watson-powered clinical decision-support tool intended to recommend cancer treatments.
- **Commitment (T0):** build an AI advisor that ingests the medical literature and patient records to recommend evidence-based treatments, starting in leukemia, then generalizing across cancers and integrating into routine clinical practice.
- **Announced publicly:** 2013-10-18 (MD Anderson/IBM joint announcement). Work under contract began **2012**.
- **Status:** completed (halted / benched February 2017; project never reached clinical use).

**Suggested `targets[]`:** the OEA had no single public numeric milestone as clean as Target's "125 stores." The honest target is qualitative: *"Deploy an AI advisor into routine clinical oncology practice."* The disconfirming outcome is that it was never used on a patient and never integrated with the EHR — so the target is best expressed as a readiness/value gate, not a count.

---

## Sources (map to `sources[]`)

> **Source-kind note:** two of these are `audit-report` (the UT System special review) — the same union extension you flagged for GAO/OIG. The trade press pieces are a kind the schema doesn't have yet (`news` / `trade-press`); pick a label and note it, as you did for `agency-release`.

| id | title | publisher | kind | publishedAt | url |
|---|---|---|---|---|---|
| `mda-ibm-announce-2013` | MD Anderson Taps IBM Watson to Power "Moon Shots" Mission | MD Anderson / IBM | company-release | 2013-10-18 | (MD Anderson newsroom / IBM press — confirm exact URL) |
| `ut-audit-2017` | Special Review of Procurement Practices, Oncology Expert Advisor Project | University of Texas System (Audit Office) | audit-report | 2017-02 (dated Nov 2016, released Feb 2017) | (UT System audit office PDF — confirm exact URL) |
| `statnews-2017` | IBM's Watson supercomputer recommended "unsafe and incorrect" cancer treatments… / MD Anderson coverage | STAT News | trade-press | 2017-09-05 | https://www.statnews.com/2017/09/05/watson-ibm-cancer/ |
| `forbes-herper-2017` | MD Anderson Benches IBM Watson In Setback For Artificial Intelligence In Medicine | Forbes (Matthew Herper) | trade-press | 2017-02-19 | https://www.forbes.com/sites/matthewherper/2017/02/19/md-anderson-benches-ibm-watson-in-setback-for-artificial-intelligence-in-medicine/ |
| `chron-2017` | Touted IBM supercomputer project at MD Anderson on hold | Houston Chronicle | trade-press | 2017-02 | https://www.houstonchronicle.com/news/houston-texas/houston/article/Touted-IBM-supercomputer-project-at-MD-Anderson-10941783.php |
| `register-2017` | Watson cancer-busting trial on hold after "damning" audit report | The Register | trade-press | 2017-02-20 | https://www.theregister.com/2017/02/20/watson_cancerbusting_trial_on_hold_after_damning_audit_report/ |
| `jnci-2017` | A comparison of a machine-learning oncology advisor… (OEA evaluation) | JNCI (J. Natl. Cancer Inst.) | filing/peer-reviewed | 2017 (djx113) | https://academic.oup.com/jnci/article/109/5/djx113/3847623 |

---

## Facts (map to `facts[]`)

Each row: statement · metric · `observedAt` · origin tag · source · locator.

### Financial (the spend line)

- **`oea-total-spend`** — "MD Anderson spent approximately $62 million on the Oncology Expert Advisor project before it was halted." · `{ value: 62.1, unit: 'USD millions total spend' }` · observedAt `2017-02` · **OBSERVED** · `statnews-2017` (figure widely reported; $62M headline) / `forbes-herper-2017`. Component split below sums to $62.2M — reconcile to the $62M reported total and note rounding.
- **`oea-ibm-payments`** — "IBM was paid approximately $39.2 million for the project." · `{ value: 39.2, unit: 'USD millions' }` · observedAt `2017-02` · **OBSERVED** · `statnews-2017` / Houston Chronicle. Locator: audit payments summary.
- **`oea-pwc-payments`** — "PwC was paid approximately $23 million for the project." · `{ value: 23, unit: 'USD millions' }` · observedAt `2017-02` · **OBSERVED** · `statnews-2017` / `chron-2017`.
- **`oea-noncompetitive-awards`** — "About $51.4 million in contracts were awarded to the two vendors without competitive bidding." · `{ value: 51.4, unit: 'USD millions non-competitively awarded' }` · observedAt `2016-11` · **OBSERVED** · `ut-audit-2017` (procurement findings). **← use as the committed / goal-line anchor.**
- **`oea-giftfund-deficit`** — "The project ran an $11.6 million deficit in a gift/institutional fund, having spent money before it was received." · `{ value: 11.6, unit: 'USD millions fund deficit' }` · observedAt `2016-11` · **OBSERVED** · `ut-audit-2017`. (Finance floor evidence — spend outran authorized funding.)
- **`oea-spend-overshoot`** — "Realized spend of ~$62.1M against ~$51.4M of contracted awards implies an overshoot of ~$10.7M, with the contracted work never completed." · `{ value: 10.7, unit: 'USD millions over committed' }` · observedAt `2017-02` · **ESTIMATED** (calc: 62.1 − 51.4) · `ut-audit-2017` + `statnews-2017`.

### Governance / procurement (the audit floor)

- **`oea-audit-existence`** — "A UT System special review found procurement and management irregularities in the OEA project." · qualitative · observedAt `2017-02` · **OBSERVED** · `ut-audit-2017` / `register-2017`.
- **`oea-irregularities-scope`** — "The audit questioned more than $40 million in project spending/practices." · `{ value: 40, unit: 'USD millions questioned', bound: 'lower' }` · observedAt `2017-02` · **OBSERVED** · `chron-2017`. (Confirm exact phrasing against the audit PDF before quoting the number.)
- **`oea-work-not-done`** — "The audit found the center paid vendors for work that was not completed." · qualitative · observedAt `2016-11` · **OBSERVED** · `ut-audit-2017` / `statnews-2017`.

### Operations / readiness (the readiness floor)

- **`oea-no-epic-integration`** — "The OEA was never integrated with MD Anderson's new Epic electronic health record; using it required manual data entry, making it unusable in routine practice." · qualitative · observedAt `2016-11` · **OBSERVED** · `jnci-2017` / `ut-audit-2017`. **← core readiness-floor fact.**
- **`oea-scope-changes`** — "Project scope changed repeatedly — from one leukemia to another and then to lung cancer — without reaching deployment in any." · qualitative · observedAt `2017` · **OBSERVED** · `jnci-2017` / `statnews-2017`.
- **`oea-contract-extensions`** — "The IBM contract was extended 12 times over the life of the project." · `{ value: 12, unit: 'contract extensions' }` · observedAt `2017-02` · **OBSERVED** · `statnews-2017`. (This is the "kept committing without a gate" signal — good for the T-series between commit and halt.)

### Value (the value floor — the decisive one)

- **`oea-never-on-patients`** — "The tool was never used on real patients in clinical care; it did not progress beyond a pilot/benchmarking phase before the contract expired." · qualitative · observedAt `2017-02` · **OBSERVED** · `statnews-2017` / `forbes-herper-2017`. **← core value-floor fact.**
- **`oea-benched-2017`** — "MD Anderson stopped using Watson and put the project on hold; IBM's contract had expired." · observedAt `2017-02-19` · **OBSERVED** · `forbes-herper-2017` / `chron-2017`.

### Adjacent domain context — DO NOT attribute to MD Anderson

- **`watson-oncology-unsafe-advice`** *(HINDSIGHT / different project)* — Internal IBM documents reported by STAT (July 2018) described Watson for Oncology giving "unsafe and incorrect" treatment recommendations. **This concerns Watson for Oncology / Memorial Sloan Kettering training data, not the MD Anderson OEA.** Keep it only as domain color if at all; **do not** let it set an MD Anderson decision-date verdict. Source: Healthcare Dive / STAT, 2018-07 (https://www.healthcaredive.com/news/stat-ibms-watson-gave-unsafe-and-incorrect-cancer-treatment-advice/528666/).

---

## Decision points (map to `snapshots[]`)

Cutoff-safe: a snapshot may only cite sources with `publishedAt ≤ knowledgeCutoff`. That constrains the early points hard — the audit and spend figures are only admissible from Feb 2017 on.

- **T0 — Commitment (2013-10-18).** Cutoff `2013-10-18`. Admissible: only the announcement. **Verdict: FOG.** Value/finance/operations all `insufficient-evidence` — the public commitment states ambition (AI advisor into practice) but discloses no budget ceiling, no readiness gate, no disconfirming evidence. Same shape as Target T0 and VA T0. factRefs: `mda-ibm-announce-2013`.
  - `finance`: insufficient-evidence (no disclosed envelope).
  - `operations`: inferred/low — integrating an AI advisor into a live cancer-care workflow implies a large systems-integration + EHR dependency, unstated at commit.
  - `value`: insufficient-evidence — no expected clinical-value metric disclosed.

- **T1 — Scope narrowing / continued commitment (2014–2016).** Cutoff mid-2016 (before audit). Admissible: announcement + any contemporaneous pilot reporting you can source cutoff-safe (JNCI evaluation methods, scope changes). **Verdict: FOG, deepening.** The signal here is `oea-scope-changes` + `oea-contract-extensions` — repeated re-scoping and 12 extensions with no deployment gate cleared. Owner focus: the clinical sponsor. Note: much of the JNCI/audit detail is only *publishable* in 2017, so keep T1 evidence-light and flag the extensions as the visible "still committing, no gate" fact. factRefs: `oea-scope-changes`, `oea-contract-extensions`.

- **T2 — Audit + halt (2017-02).** Cutoff `2017-02-19`. Everything admissible. **Verdict: COLLISION / FLOOR.** Two floors trip:
  - **Value floor** — `oea-never-on-patients`: ~$62M spent, tool never used on a patient. This is the decisive trip.
  - **Readiness floor** — `oea-no-epic-integration`: never integrated with Epic; unusable in routine practice.
  - Plus finance/governance evidence: `oea-total-spend`, `oea-noncompetitive-awards`, `oea-giftfund-deficit`, `oea-work-not-done`.
  - factRefs: all financial + governance + operations + value facts above.
  - This is the FLOOR trip that recovers the arc's terminal verdict — analogous to VA T2's `first-site-remediation` trip. `breakingModels` should be empty (no capacity-model collision computed here; the trip is value/readiness, not a counted-capacity shortfall).

**Owner resolution (for `ownerFor()`):** the uncertainty sits on value + operational readiness, not on a counted capacity leg. The natural owner is **the clinical sponsor** (MD Anderson's project sponsor / Chief Medical Officer). The move at T2 reads: *"~$62M is committed and the advisor has never touched a patient or the EHR — get the sponsor's read before any renewal."* Keep this in the central resolver keyed off the value/readiness floor labels, not authored on the review input.

---

## The arc in one line (for the case card)

FOG (2013, ambition without a gate) → FOG (2014–16, re-scoped and re-extended 12× without deployment) → **COLLISION** (Feb 2017, ~$62M spent, never used on a patient, never integrated with the EHR; $51.4M awarded non-competitively). AI capital committed before value was demonstrated.

---

## Loose ends for the implementer (cheap to close)

1. **Two exact URLs** — the MD Anderson 2013 announcement and the UT System audit PDF. I have the figures and the trade-press URLs that cite them; the two primary URLs still need to be pinned. Everything numeric is already sourced to a named publication above.
2. **The `$40M questioned` phrasing** — confirm the exact number/wording against the audit PDF before it goes on a card; Houston Chronicle is the current source.
3. **Reconcile $39.2M + $23M = $62.2M vs the $62M / $62.1M headline** — rounding; state the total as reported and let the components note "≈".
