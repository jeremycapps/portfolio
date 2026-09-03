# StratOS case research — data needed, all cases

Every item maps onto the profile schema so returned data drops straight into code. For **each fact**:

1. **Statement** — one sentence.
2. **Metric** — value + unit, or low/high range + unit (omit if qualitative).
3. **As-of date** — the date the figure describes (`observedAt`), ISO `YYYY-MM-DD`.
4. **Source** — title, publisher, kind, **publishedAt** (first date a public analyst could use it), URL.
5. **Locator** — section / page / paragraph.

Tag each **OBSERVED** (stated in source), **ESTIMATED** (derived — show the calc), or **FOG** (decision-relevant but not publicly placeable). **Cutoff-safe rule:** a fact used at a decision date may only cite sources published on or before that date. Anything later is **HINDSIGHT** — captured, but never allowed to set that date's verdict.

## The dimensions every decision point wants (spec §8.4)

For each case and each decision date, the model wants the **commitment** + the **requested increment**, and cutoff-safe evidence on:

| Dimension | What to find |
|---|---|
| People | capacity / readiness, already committed, required load |
| Time | runway, deadlines, learning/cycle time, slippage |
| Finance | budget / cash, obligated exposure, incremental cost, loss |
| Operations | demonstrated performance, required scale, readiness gate |
| Value | expected vs observed value; **value floor** (economic, and for government also mission) |
| Risk / exposure | tolerable exposure, irreversible exposure, incremental exposure |
| Transferability *(where relevant)* | source capability, what transferred, required local capability |

Figures and sources shown below come from the `Public-Data-Case-Studies.md` transcript and spec §9 — treat them as **starting points to confirm and attribute**, not as final facts.

---

# A. Built cases (little or no research)

### 1. Target Canada — private retail · **anchor**
Primary test: release capacity exceeded operating readiness.
- **T0 (2012-07-12)**, **T2 (2013-08-21)** — built. **T3 (2014-02-26)** and **T4 (2015-02-25)** — building now from existing profile facts (`canada-ebit-2013` −$941M; `exit-charge-2014` $5.105B; `stores-at-exit` 133). No research needed.
- **T1 pilot (spring 2013) — NEEDS:** the **first-wave store count** at the March 2013 pilot launch + the press-release URL. That single number unlocks a T1 snapshot.

### 2. Adobe Creative Cloud — private software
Test: subscription transition before renewal evidence. **T0 (2013-01-22) built** (profile + commitment & retrodiction scorecards).
- **To extend to an arc (optional):** T1 first-year renewal/retention (2014), T2/T3 ARR ramp vs perpetual run-off, outcome (CC as standard). Sources: Adobe 10-K / earnings (2013–2017).

### 3. Domino's 2025 growth — private retail
Test: global growth on an adopted franchise system. **T0 (2019-02-21) built.**
- **To extend (optional):** annual store-count vs 25,000 target, same-store sales, franchisee returns (2020–2025), and the actual 2025 store count. Sources: Domino's 10-K / investor day.

### 4. Ford Model e — private auto
Test: industrial conversion before full capacity placement. **T0 (2022-07-21) built.**
- **To extend (optional):** run-rate retiming (2023), Model e quarterly losses, battery-cost trajectory, plant ramp (2023–2025). Sources: Ford earnings / 10-K.

---

# B. Principal planned cases (full research)

### 5. VA Electronic Health Record modernization — government health IT · **Release 2**
Test: evidence after one site governing release to the next.
**Timeline & needs:**
- **T0 — Authorization (2018):** Cerner contract signing date; contract value + term; scope (# VA facilities to convert; replace VistA); planned schedule; baseline lifecycle cost estimate.
- **T1 — First deployment (Oct 2020):** first go-live site (Mann-Grandstaff, Spokane) + date; users/clinicians; first reported problems (patient-safety, outages, ticket backlog).
- **T2 — Continued rollout (2021–2022):** sites live by end-2022; cost obligated; OIG patient-safety findings (# incidents/harm cases); schedule slippage vs baseline.
- **T3 — Deployment pause (Apr 2023):** pause date + duration (~20 months); reasons; **revised lifecycle cost $49.8B = $32.7B implementation + $17.1B sustainment** (confirm/attribute); sites live at pause; user-satisfaction / unresolved-config data.
- **T4 — Reset (2024–2025):** restart status + date; sites live now / next wave; current total cost; revised schedule.
- **Mission-value note:** capture any statement framing continuation as care-continuity despite cost — the dual value floor.
- **Sources:** VA award announcement (2018); VA OIG deployment reports (2021–22); GAO `GAO-25-106874`, `GAO-25-108091`; VA press on pause/reset.

### 6. FBI Virtual Case File → Sentinel — government IT · principal
Test: failed commitment followed by explicit learning and redesign.
**Needs:**
- **VCF:** program start + termination date; total spent (**~$170M over ~3 years** — confirm); DOJ OIG findings (requirements defects, IT-investment-management, oversight).
- **Sentinel:** structure (**4 phases**); initial cost estimate (**~$425M = ~$305M contractor + ~$120M program/support** — confirm); delivery outcome.
- **Transferability:** the OIG finding that transfer from VCF to Sentinel **could not be reliably quantified** (this is a real `Transferability = FOG` example — capture the exact language + cite).
- **Sources:** DOJ OIG `a0614` (VCF exec summary + findings), `a0703` (Sentinel exec summary).

### 7. Tesco Fresh & Easy — private retail · principal
Test: continued capital release before economics validated.
**Timeline & needs:**
- **T0 — Entry (2007):** launch date; planned store/format commitment; capital plan if disclosed.
- **T-series:** store count + capital committed + operating loss + sales by year (2008–2012); the Dec 2012 "tightly constrained capital / not acceptable returns in an appropriate timeframe" strategic-review statement + date.
- **Exit (2013):** total impact (**~£1.2B** = **~£169M trading losses + ~£1.0B impairments/onerous leases** — confirm); store count at exit; employees.
- **Sources:** Tesco PLC "strategic review of Fresh & Easy" (2012); Tesco preliminary results 2012/13; historical store-count reporting.

### 8. F-35 concurrency — government defense · principal
Test: irreversible production before uncertainty retired.
**Needs:**
- Baseline cost/schedule at major milestones vs revised; **share of aircraft procured before full-rate-production readiness (~1/3** — confirm, GAO-22-105128); program delay (**>decade**) and cost growth (**~$183B above original** — confirm, GAO-23-106047); unit exposure metric (units produced × exposure/unit) while testing incomplete.
- **Sources:** GAO F-35 series — `GAO-22-105128`, `GAO-23-106047`, and the 2014 cost-control commentary.

### 9. Best Buy China — private retail · principal
Test: capability existed but imported format did not transfer.
**Needs:**
- Branded-store model vs **Five Star** localized model (10-K language contrasting the two — capture verbatim, it's the natural experiment); branded store count (**8 by FY2011** — confirm) and closure; Five Star network scale + retention; employee/exposure figures.
- **Transferability** is the headline dimension here.
- **Sources:** Best Buy 10-K filings (SEC, e.g. `a2197223z10-k`, later 10-K noting the 8-store closure).

### 10. 2020 Census technology modernization — government operations · **positive/control**
Test: technology and mitigation producing a **non-failure** outcome.
**Needs:**
- Program budget/estimate over time (**~$14.2B final incl. pandemic costs** — confirm); technology/automation innovations and their field-productivity effect; testing/staffing/adoption evidence; where FOG or COLLISION on a dimension was **mitigated back to FIT**.
- This is the case that must **not** end in disaster — source the recovery/mitigation evidence deliberately.
- **Sources:** GAO `GAO-21-478` and related 2020-census cost/operations assessments.

### 11. Uber China — private platform · principal
Test: financial capacity existed while sustainable value economics did not.
**Needs:**
- Annual loss (**>$1B/yr** — confirm); subsidy/burn scale; funding raised; city-launch org/people; rides/share/adoption (value evidence); the 2016 transfer to Didi for an ownership stake (exit form + date).
- Headline is **capacity > load but value < value-floor** — get the loss + subsidy figures and any adoption metrics.
- **Sources:** contemporaneous reporting (CEO "$1B/yr" statement); Bloomberg/reporting on the Didi transfer.

---

# C. Supporting / boundary cases (research when reached)

### 12. Healthcare.gov — government · supporting
Test: whole-system integration readiness vs a fixed launch deadline.
**Needs:** the statutory launch date (Oct 1 2013); CMS contracting timeline (from 2011); contractor spend; launch-day operational metrics (failures, enrollment); GAO reconstruction of acquisition planning + oversight. **Source:** GAO `GAO-14-694`.

### 13. Walmart Germany — private retail · supporting
Test: transferability of home-market capability.
**Needs:** entry via acquisitions; stores disposed (**85 in 2006** — confirm); disposal loss (**~$918M pretax** — confirm); transferability factors (merchandising, labor, pricing/regulation, supplier, format, localization). **Source:** Walmart SEC filing on the disposal.

### 14. Home Depot China — private retail · supporting
Test: valuable market goal vs wrong operating format.
**Needs:** big-box store closure (**7 stores** — confirm); employees affected (**~850** — confirm); after-tax charge (**~$160M** — confirm); entry timing/acquisition; shift to specialty/online. Derived: employees/store, charge/store. **Source:** Home Depot IR release (2012-09-13).

### 15. Starbucks Australia — private retail · supporting
Test: rollout velocity outrunning customer validation.
**Needs:** stores closed (**61 in 2008** — confirm); footprint (**84**, **23 remaining** — confirm); jobs affected (**~685** — confirm); rollout speed; geographic concentration. Finance is weak (no standalone segment) — use for time+people+demand, not finance. **Sources:** Starbucks 2008 annual report; contemporary AU reporting (ABC News).

### 16. IRS modernization — government · supporting
Test: portfolio commitments competing for shared capacity.
**Needs:** the set of modernization programs; planned-vs-actual cost & schedule reported to Congress; shared people/time/technology capacity; where the **sum of committed** exceeds shared capacity. **Source:** GAO IRS-modernization series (e.g. `GAO-25-107611`).

### 17. California High-Speed Rail — government infrastructure · boundary
Test: path dependence / commitments without a clean exit.
**Needs:** system scope (**520-mi SF–LA** — confirm); cost baseline (**~$68.4B early estimate** — confirm) and repeated revisions; funding/right-of-way/environmental risks; irreversibility markers (land acquired, packages awarded). Use as a **no-clean-exit** boundary test. **Source:** GAO `GAO-13-163T` and later CA-HSR assessments.

---

## Modeling notes (so returned data fits)

- **Dual value floor for government cases** (VA, Census, Healthcare.gov, FBI, IRS, HSR, F-35): capture both the *economic* floor and any *mission/statutory* floor. Continuation despite economic collision, on mission grounds, is a finding — not noise.
- **Source-kind gap.** `CaseSource.kind` is currently `filing | annual-report | earnings-release | company-release`. Government sources (GAO / OIG / agency press) don't fit — I'll extend the union (`audit-report` / `agency-release`). No action needed from you.
- **Priority order** (matches spec §9.3 publishing order): **VA EHR → 2020 Census → Best Buy China or Tesco → FBI/F-35/Uber → supporting.** If you gather in that order I can build in the same order.

## What I'm building now (needs nothing from you)

- **Target T3 + T4** — full decision points, evaluations, comparisons, tests (grounded in existing facts).
- **VA EHR scaffolding** — profile / scorecard / decision-point files with `TODO(source)` rows keyed to §5 above, so your data slots in mechanically.
