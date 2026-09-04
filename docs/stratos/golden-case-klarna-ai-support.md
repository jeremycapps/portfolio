# Golden-case handoff — Klarna AI customer-service assistant

**For:** the case-data agent building profiles/scorecards/decision-points.
**Status:** canonical golden case as of 2026-09-03. **Not yet implemented as a code case** (`src/lib/stratos/cases/` has no `klarna-*.ts`). The existing code cases (Target Canada, Watson/MD Anderson, VA EHR, McDonald's, Adobe, Domino's, Ford) remain load-bearing for the running flow view until Klarna is built; their **golden-case docs** are archived under `archive/`. Tag convention (OBSERVED / ESTIMATED / FOG / HINDSIGHT) and the cutoff-safe rule from `research-needed.md` apply throughout.

**Why this case (domain = AI):** it replaces the too-big-to-fail cases, which read as a humiliation tool. Klarna is **one bounded decision**, recent, and the challenge was **vindicated by the protagonist itself** — the instrument facilitates the conclusion the company reached, rather than grading a corpse. It is also the decision every 2026 executive is making: "the pilot's deflection numbers are incredible — do we scale it across the function?"

> **The bound (present tense, early 2024).** On the first-month numbers, deepen the assistant's mandate — route more of the complex queue to it and let human capacity keep shrinking — or **hold** that increment until quality on the high-stakes segment is priced? The viewer sits in the executive's chair; StratOS is the challenger in the room, using only what was knowable at the decision date.

---

## Commitment

- **Company:** Klarna Bank AB.
- **Vendor:** OpenAI.
- **Case name:** AI customer-service assistant — LLM as the default front door for inbound support.
- **Commitment (T0, early 2024):** on the strength of the first-month launch metrics, deepen the assistant's mandate (route more of the complex queue to it) while letting the human support queue — largely outsourced — shrink via hiring freeze and attrition.
- **Announced publicly:** 2024-02-27 (Klarna press release; corroborated on OpenAI's case page).
- **Status:** the increment was taken; **reversed 2025-05-08** (CEO concedes cost was "too predominant... lower quality"; rehiring for disputes/fraud/hardship). The reversal is **HINDSIGHT** — it checks the call, it does not make it.

**Implemented `targets[]` (the steering metric, and its flaw):** the case was steered by *aggregate* CSAT ("on par with human agents") plus deflection and speed. The material unknown is **segment-level quality on high-severity contact types** — disputes, fraud, hardship, account closure — which the aggregate metric cannot resolve. FOG at the decision date.

**The break (structural):** two moves collide — automation is **L1-tier only** (anything complex *always* transfers to a human) while the human capacity that receives those transfers is being **decommissioned**. The transfer target and the capacity being cut are the same population.

---

## Sources (map to `sources[]`)

> **Source-kind note:** the 2024-02-27 release is a primary company release (self-reported, unsegmented — treat CSAT "on par" as ESTIMATED, not OBSERVED). The Pragmatic Engineer piece is contemporaneous independent analysis available *at* the decision date — it is the challenger's no-hindsight ammunition. The Bloomberg reversal is HINDSIGHT and must never feed the dated verdict.

| id | title | publisher | kind | publishedAt | url |
|---|---|---|---|---|---|
| klarna-pr-2024 | "Klarna AI assistant handles two-thirds of customer service chats in its first month" | Klarna | company-release | 2024-02-27 | https://www.klarna.com/international/press/klarna-ai-assistant-handles-two-thirds-of-customer-service-chats-in-its-first-month/ |
| openai-klarna | "Klarna's AI assistant does the work of 700 full-time agents" | OpenAI | vendor-release | 2024-02-27 | https://openai.com/index/klarna/ |
| pragmatic-2024 | "Klarna's AI chatbot: how revolutionary is it, really?" | The Pragmatic Engineer | independent-analysis | 2024-02-29 | https://blog.pragmaticengineer.com/klarnas-ai-chatbot/ |
| bloomberg-2025 | "Klarna Turns From AI to Real-Person Customer Service" | Bloomberg | news (HINDSIGHT) | 2025-05-08 | https://www.bloomberg.com/news/articles/2025-05-08/klarna-turns-from-ai-to-real-person-customer-service |
| cnbc-2025 | "Klarna CEO says AI helped company shrink workforce by 40%" | CNBC | news (context) | 2025-05-14 | https://www.cnbc.com/2025/05/14/klarna-ceo-says-ai-helped-company-shrink-workforce-by-40percent.html |

## Facts (decision-date; map to `facts[]` / snapshots)

| fact | value | status | source |
|---|---|---|---|
| First-month conversations | 2.3M | OBSERVED | klarna-pr-2024 |
| Share of support chats | two-thirds | OBSERVED | klarna-pr-2024 |
| FTE-equivalent | 700 agents (mostly outsourced) | ESTIMATED | klarna-pr-2024 / pragmatic-2024 |
| Resolution time | 11 min → 2 min | OBSERVED | klarna-pr-2024 |
| Repeat inquiries | −25% | ESTIMATED | klarna-pr-2024 |
| Reach | 23 markets, 35+ languages, 24/7 | OBSERVED | klarna-pr-2024 |
| Projected profit | $40M (2024) | ESTIMATED | klarna-pr-2024 |
| CSAT | "on par with human agents" (aggregate, unsegmented) | ESTIMATED | klarna-pr-2024 |
| Automation depth | L1 only — complex always transfers | OBSERVED | pragmatic-2024 |
| Complex-segment quality | not measured at decision date | FOG | — |
| Human capacity | 5,000 → ~3,800 FTE, target 2,000; freeze + attrition | OBSERVED | cnbc-2025 |
| Outcome (post-decision) | reversal; rehire for disputes/fraud/hardship | HINDSIGHT | bloomberg-2025 |

---

## Tension mapping (six-tension ontology)

Clears on **CIO** (systems & flow), **CTO** (release), **CFO** (capital return). Breaks on **COO** (exception handling — the transferred complex queue) and **CRO** (control & traceability — confidently-wrong policy answers). Fog on **CDO** (disconfirming evidence — segmented CSAT never surfaced) and **CPO** (workforce capacity — decommissioned). See `docs/stratos/tempo-enterprise-crosswalk.md` for the full crosswalk and the L0–L5 placement (the failure is at L2, the captured business-case firewall).

---

## Klarna through Tempo's gates (grounding in named frameworks)

Tempo v1's Three-Gate Transformation is a diagnostic sequence. Run on Klarna in the frameworks' own sourced language, it reproduces the FIT/FOG/COLLISION verdict — clears on Base OPE, breaks on the Shatter Test — with nothing invented.

- **Gate 1 · DNA** (Neilson/Pasternack, *Org DNA*): the execution profile is **Fits-and-Starts** — high initiative and speed, weak coordination and follow-through (commit-then-reverse). The specific defect is **information flows**: the signal that decided the case (segment-level quality) was never instrumented, so it never reached the decision. *PMO: no exception reporting; broken benefit-tracking loop.*
- **Gate 2 · Protocol** (GitLab, *TeamOps*): elite decision **velocity** (23 markets, ship-fast) but on a bad single-source-of-truth — the SSOT was an aggregate-metrics dashboard, not a contestable written decision record. *PMO: fast CapEx cycle, no audit-ready decision log. Base OPE looks excellent.*
- **Gate 3 · Fragility** (Taleb / IMF, the *Shatter Test*): efficiency (OPE) was raised by removing the **human buffer** (exception handlers) → the **Crystalline** state (high efficiency, no adaptive reserve). The complex/emotional-ticket spike is the black-swan bump; **Risk-Adjusted OPE shatters** though Base OPE was high. *PMO: unit economics optimized by decommissioning the resilience reserve; no SLO floor to trigger rollback before the break.*
- **Humanocracy** (Hamel & Zanini) — **inverted**: its thesis is that human ingenuity/autonomy is the only durable advantage; Klarna automated precisely the judgment-dense work (disputes, hardship) where that ingenuity **was** the moat.
- **Archetypes** (Zhang & Cabage): a fintech **insurgent** ran an insurgent efficiency play but placed an **incumbent-scale irreversible** bet — an Experimenter traversal on a Fortress decision.

## The counter-move (the operation StratOS proposes)

Not "you're wrong" — the smallest **reversible** path to the same goal. This is the engine's paired operation (commitment plane + path plane), and it is Klarna's own May-2025 fix, offered in early 2024 before the shatter.

- **Commitment plane — Hold the tranche.** Freeze automation depth at L1; the L1 win continues. Do not route more of the complex queue. *(Owner: exec sponsor.)*
- **Path plane — Install the missing L2 firewall.** Make the decision reversible before the next increment. *(Owner: ops + data lead.)*

**Exit criteria — what opens the gate** (each restores one broken/fog pole):

| Condition | Restores | Reading flips |
|---|---|---|
| Instrument segment CSAT + containment by contact driver | CDO · disconfirming evidence | FOG → visible |
| Set SLO floors on dispute/fraud/hardship + auto-rollback | CRO · control & traceability | BREAKS → gated |
| Name an exception owner (RACI-Accountable) for transfers | COO · exception handling | BREAKS → owned |
| Size the human buffer to complex-queue volume | CPO · workforce capacity | Crystalline → Resilient |

**Next safe commitment:** prove segment quality at L1 depth before the next increment; re-present at Gate 2.

---

## Teams, people & the backlog signal (L3 grounding)

The L3 collision has named owners and a dated, on-the-ground signal that preceded every headline metric.

**Who:**
- **Champion:** Sebastian Siemiatkowski (CEO) — the AI-first thesis and the claims.
- **Build (clears):** Klarna Engineering — Martin Elwin, Sr. Director of Engineering — with OpenAI (Brad Lightcap, COO) as model partner.
- **Bore the cost (breaks):** ~250 staff → **Foundever** (Sep 2023); ~500 roles → **Foundever + Accenture** (Oct 2023; Accenture took financial-crime prevention); external agent pool ~3,000 → ~2,300.

**The backlog signal — the metric they should have watched.** Following the 750 outsourced roles, unresolved customer/merchant queries **quadrupled**; merchants waited **up to a month** (two outsourced employees + internal documents, per Sifted). Concentrated in merchant / smaller-business queries across the UK, Belgium, the Netherlands, and France — the judgment-heavy segment.

**Timeline — the cuts came first.** The outsourcing (Sep–Oct 2023) and the quadrupled backlog **predate the Feb 2024 assistant launch**. The AI was deployed onto a queue that was already backing up. So deflection and blended CSAT (Feb 2024) measured throughput *share* on a system whose real health metric — **backlog / queue depth (arrivals vs completions)** — was already red, and moving *opposite* to deflection: the more the assistant deflected simple tickets, the more the complex queue piled into the human capacity that had just been cut.

**Implication:** the correct guiding metric is **queue depth / backlog age by segment**, not deflection or blended CSAT. Backlog is the leading indicator of the break; it was observable in late 2023; it was not the steering metric.

### Additional sources (add to `sources[]`)

| id | title | publisher | kind | publishedAt | url |
|---|---|---|---|---|---|
| sifted-cut-250 | "Klarna outsources customer services staff, cutting 250 employees" | Sifted | news | 2023-09 | https://sifted.eu/articles/klarna-cuts-250-customer-services-employees-news |
| sifted-cut-500 | "Klarna transfers another 500 jobs globally to Foundever and Accenture" | Sifted | news | 2023-10 | https://sifted.eu/articles/klarna-outsources-another-500-jobs-globally-news |
| sifted-backlog | "Support backlog grows at Klarna following outsourcing of roles, former employees say" | Sifted | news | ~2024 | https://sifted.eu/articles/support-backlog-grows-at-klarna-following-outsourcing-of-roles-former-employees-say-news |
| cxdive-uber | "Klarna pursues 'Uber' style customer service model" | CX Dive | news | 2025 | https://www.customerexperiencedive.com/news/klarna-pursues-uber-style-customer-service-model/812763/ |

### Additional facts (add to `facts[]`)

| fact | value | status | source |
|---|---|---|---|
| Support roles outsourced | 250 (Sep 2023) + 500 (Oct 2023) = 750 | OBSERVED | sifted-cut-250 / sifted-cut-500 |
| Outsourcing partners | Foundever (support); Accenture (financial-crime prevention) | OBSERVED | sifted-cut-500 |
| Unresolved queries after outsourcing | quadrupled | OBSERVED | sifted-backlog |
| Merchant support wait | up to one month | OBSERVED | sifted-backlog |
| External agent pool | ~3,000 → ~2,300 | OBSERVED | bigeye |
| Build lead | Martin Elwin, Sr. Director of Engineering | OBSERVED | — |
| Cut-vs-launch ordering | cuts + backlog (late 2023) precede AI launch (Feb 2024) | OBSERVED | sifted / klarna-pr-2024 |

## The measurement layer — 60 metrics (12 poles × L1–L5)

Each of the twelve ontology poles carries one metric at every level of the transformation
lifecycle (L1 strategy → L2 business case → L3 implementation → L4 operations → L5 audit).
A cell is a **typed, owned outcome node**; a metric is the case where that node is quantitative
and instrumented. Klarna's failure is legible as specific cells that were owned but never wired
(FOG), and cells whose gate was skipped.

| Pole (owner) | L1 strategy | L2 business case | L3 implementation | L4 operations | L5 audit |
|---|---|---|---|---|---|
| CSO · controlled advantage | Moat coverage % | Make-vs-buy case | Owned-IP in build % | Switching-cost index | IP asset value on B/S |
| CMO · orchestrated ecosystem | External value share | Participant ROI case | Partner integration % | Active participant rate | Ecosystem revenue (audited) |
| CPO · workforce capacity | Skill-coverage ratio | **Capacity vs. demand** | Staffing ramp vs. plan | **Buffer% · attrition · ρ** | Capacity cost vs. baseline |
| CFO · capital & return | ROIC vs. cost of capital | NPV / payback case | Budget burn vs. plan | Cost per resolved contact | **Net savings vs. baseline (GL)** |
| CEO · decision quality | Strategic-bet thesis | Go/no-go options priced | Scope adherence | Decision-to-outcome variance | Decision outcome audit |
| CDO · disconfirming evidence | Evidence coverage | Disconfirming-evidence plan | **Instrumented signals %** | Signal latency (time-to-detect) | Evidence audit trail |
| CRO · risk & traceability | Irreversibility exposure | Risk & rollback plan | Control coverage built | Incident rate vs. tolerance | Traceability / defensibility |
| CTO · technical release | Architecture fit | Technical feasibility case | Release readiness (DORA) | Uptime / SLO | Capitalized-dev audit |
| CKO · knowledge | Knowledge-moat thesis | Knowledge-capture plan | Knowledge codified % | Knowledge freshness / decay | Retained-knowledge audit |
| CGO · growth | Growth thesis / TAM | Growth case (CAC/LTV) | Launch readiness (GTM) | Retention / churn | Realized growth vs. plan |
| COO · operations | Operating-model fit | **Exception-handling design** | Runbook / failover | **Backlog age by segment** | Ops loss vs. baseline |
| CIO · flow & information | Information-flow thesis | Data-flow / integration case | Flow integration % | Flow throughput / cycle time | Information-cost audit |

**The three decisive cells (bold above):** `CPO·L2 Capacity vs. demand` is the gate that would
have caught the cut before it shipped; `COO·L2 Exception-handling design` is the collision node
(AI always transfers → complex queue → cut population); `COO·L4 Backlog age by segment` and
`CPO·L4 Buffer%·attrition·ρ` are the operating floors that were red before launch and never
steered on; `CFO·L5 Net savings vs. baseline (GL)` is where the $40M has to net against the
un-booked remediation.

### L4 operations reading (Klarna)

The dashboard Klarna *watched* was the green half — deflection share, blended CSAT, average
handle time, projected savings. The dashboard that would have shown the break was the **floor
half, and it was dark**: `COO·L4` backlog age by segment (red, quadrupled, pre-launch),
`CPO·L4` load factor ρ on the starved complex queue (ρ≈0.7→0.94 after −750 agents; Kingman
says wait goes vertical as ρ→1), `CDO·L4` signal latency (no leading indicator wired at the
complex-segment grain). A green aggregate sitting on top of a red floor is the signature of an
aggregation-grain failure.

### L5 audit reading (Klarna)

At the general-ledger line the $40M "projected profit improvement" is a **PASS finding on an
unmeasured liability**. Booked/disclosed: +$40M projected. Not disclosed, not netted: backlog
remediation cost, complex-team rebuild (the 2025 rehire), merchant churn, brand cost. Verdict:
**unauditable — $40M un-netted against the very liabilities the cut created.** The L5 floor
(net savings vs. baseline, GL-true) cannot be certified because the offsetting costs were never
instrumented at L4.
