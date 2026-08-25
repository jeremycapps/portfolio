# StratOS — Source Citations

Working citation sheet for the lens sources referenced in [`ontology.ts`](./ontology.ts).
Every tension pole in StratOS is anchored by one or more **lenses** (e.g. `porter_01 thesis`).
This sheet gives each lens code its full citation and the exact claim borrowed, so the
instrument cites real works rather than name-dropping shorthand.

**Provenance.** Bibliographic data and the "concept borrowed" framing come from the Tempo
vault source docs (`engine/v2/00_Sources/…`), which the Gemini research chats generated. A
Gemini chat is *not* a citable authority — it is where the sourcing was worked out — so every
citation below points to the underlying work. Framing is attributed (no verbatim quotes pulled).

**Legend.** Role = how the lens acts on the pole: `thesis` (defines the pole), `counterweight`
(defines the opposing pole against it), `supporting` (secondary lens on the pole). Floor lenses
are gates the engine tests, not pole-defining lenses.

---

## The six tensions and their lenses

### 1. Advantage — *Economics · StratOps*
> Does advantage come from assets the firm controls or interactions it enables?
> ◀ **Controlled value chain** (CSO) — **Orchestrated ecosystem** (CMO) ▶

| Pole | Lens code · role | Concept borrowed |
|---|---|---|
| Left | `porter_01` · thesis | A firm's advantage is a **defensible spread between cost and customer value** that it controls through its activity system. |
| Left | `maister_07` · supporting | The economic relationship is measured by whether it **accumulates or consumes client trust**, not just technical delivery. |
| Right | `parker_11` · counterweight | Value is increasingly created by **interactions among external participants (network effects)**, not by owned assets. |

- **`porter_01`** — Porter, Michael E. (1980). *Competitive Strategy: Techniques for Analyzing Industries and Competitors.* Free Press. — Pillar: *Market Positioning.*
- **`maister_07`** — Maister, David H., Green, Charles H., & Galford, Robert M. (2000). *The Trusted Advisor.* Free Press. — Pillar: *Advisor Relationship.*
- **`parker_11`** — Parker, Geoffrey G., Van Alstyne, Marshall W., & Choudary, Sangeet Paul (2016). *Platform Revolution: How Networked Markets Are Transforming the Economy.* W. W. Norton. — Pillar: *Network Ecosystems.*

### 2. Resource — *Economics · BizOps*
> Is the firm preserving the capacity that produces value, and does that capacity realize a durable return?
> ◀ **Workforce capacity** (CPO) — **Capital return** (CFO) ▶

| Pole | Lens code · role | Concept borrowed |
|---|---|---|
| Left | `ton_10` · counterweight | **Workforce capacity is a strategic asset, not a utilization pool** — skilled exception coverage, decision authority, and protected slack raise total system throughput before they are asked to return cash. |
| Right | `dupont_03` · thesis | Return decomposes into **margin × asset turnover × leverage**; the pole asks which lever drives ROE and whether the driver is durable. |

> **This is the origin of the "workforce capacity" pillar language** you asked about: the CPO
> pole label and the lens line *"Treat workforce capacity as a strategic asset, not a utilization
> pool"* are drawn directly from Ton's Good Jobs argument (`ton_10`).

- **`ton_10`** — Ton, Zeynep (2023). *The Case for Good Jobs: How Great Companies Bring Dignity, Pay, and Meaning to Everyone's Work.* Harvard Business Review Press. (Underlying framework: *The Good Jobs Strategy*, 2014.) — Pillar: *Human Economics.*
- **`dupont_03`** — Brown, F. Donaldson / DuPont Corporation (1914). *DuPont Analysis* (ROE decomposition). — Pillar: *Financial Return.*

### 3. Discernment — *Commitment · StratOps*
> When should the firm impose a clear answer, and when keep the problem open?
> ◀ **Structured conviction** (CEO) — **Open inquiry** (CDO) ▶

| Pole | Lens code · role | Concept borrowed |
|---|---|---|
| Left | `minto_02` · thesis | A governing assertion must rest on a **mutually exclusive, collectively exhaustive (MECE)** support structure — conviction that is structured rather than asserted. |
| Right | `edmondson_09` · counterweight | Commitments should stay open to revision: **contradictory evidence must be able to change the conclusion without interpersonal penalty** (psychological safety). |
| Right | `parker_11` · supporting | Parts of the value proposition must be **discovered from participant behavior** rather than pre-decided. |

- **`minto_02`** — Minto, Barbara (1987). *The Pyramid Principle: Logic in Writing and Thinking.* (Developed at McKinsey from 1967; 3rd ed. used.) — Pillar: *Structural Reasoning.*
- **`edmondson_09`** — Edmondson, Amy C. (1999). "Psychological Safety and Learning Behavior in Work Teams." *Administrative Science Quarterly*, 44(2), 350–383. — Pillar: *Team Psychology.*
- **`parker_11`** — see Tension 1.

### 4. Execution — *Commitment · BizOps*
> What must be assured inside the firm, and what is ready to be released into the environment?
> ◀ **Risk friction** (CRO) — **Release** (CTO) ▶

| Pole | Lens code · role | Concept borrowed |
|---|---|---|
| Left | `nist_12` · governance foundation | Every material autonomous decision should be **governed, mapped, measured, and managed** — the minimum control regime for autonomous operation. |
| Left | `anthropic_13` · runtime control | An agent should **critique and revise its proposed action against an explicit constitution at runtime**. |
| Right | `dora_15` · thesis | The pole asks **how fast change can reach production without raising the failure rate** (the DORA speed/stability finding). |
| Right | `teamops_14` · supporting | Distinguish approval gates that **add control** from those that are **pure coordination tax**. |

- **`nist_12`** — National Institute of Standards and Technology (2023). *AI Risk Management Framework (AI RMF 1.0).* NIST. — Pillar: *Agentic Integrity.*
- **`anthropic_13`** — Bai, Yuntao, et al. / Anthropic (2022). "Constitutional AI: Harmlessness from AI Feedback." *arXiv:2212.08073.* — Pillar: *Agentic Integrity.*
- **`dora_15`** — Forsgren, Nicole, Humble, Jez, & Kim, Gene (2018). *Accelerate: The Science of Lean Software and DevOps.* IT Revolution. — Pillar: *Delivery Performance.*
- **`teamops_14`** — GitLab (2022). *TeamOps: Redefining Teamwork.* — Pillar: *Delegation Protocol.*

### 5. Invention — *Renewal · StratOps*
> Does renewal come from deepening what the firm knows, or creating what the market has not seen?
> ◀ **Codified fluency** (CKO) — **Novel offering creation** (CGO) ▶

| Pole | Lens code · role | Concept borrowed |
|---|---|---|
| Left | `nonaka_17` · thesis | Renewal comes from **converting tacit mastery into transferable institutional knowledge** — can the mastery of the best people be transferred to anyone else? |
| Left | `apqc_05` · supporting | The pace of renewal is bounded by **how quickly the process architecture can be changed**. |
| Right | `aaker_16` · thesis | The strongest renewal doesn't compete to be preferred — it **creates a new subcategory that makes competitors irrelevant**. |

- **`nonaka_17`** — Nonaka, Ikujiro & Takeuchi, Hirotaka (1995). *The Knowledge-Creating Company.* Oxford University Press. — Pillar: *Knowledge Creation.*
- **`apqc_05`** — American Productivity & Quality Center (2018). *Process Classification Framework (PCF), v8.0.* (Established 1992.) — Pillar: *Process Taxonomy.*
- **`aaker_16`** — Aaker, David A. (2011). *Brand Relevance: Making Competitors Irrelevant.* Jossey-Bass/Wiley. — Pillar: *Category Creation.*

### 6. Operations — *Renewal · BizOps*
> Does output come from applied effort or from systems that remove the need for it?
> ◀ **Execution discipline** (COO) — **Systems and flow** (CIO) ▶

| Pole | Lens code · role | Concept borrowed |
|---|---|---|
| Left | `goldratt_04` · thesis | Output is governed by **the single binding constraint** limiting the flow of value (Theory of Constraints). |
| Left | `dora_15` · supporting | Whether the efficiency/resilience tradeoff is **structural or a symptom of manual process**. |
| Right | `apqc_05` · thesis | Which processes are **defined and stable enough to standardize, compare, or automate**. |

- **`goldratt_04`** — Goldratt, Eliyahu M. & Cox, Jeff (1984). *The Goal: A Process of Ongoing Improvement.* North River Press. — Pillar: *Throughput Physics.*
- **`dora_15`** / **`apqc_05`** — see above.

---

## Floor lenses (gates, not pole-defining)

These sources are referenced by the engine as floors the firm must clear; they are not named in
the `ontology.ts` pole lens strings, but belong in a complete bibliography.

- **`badaracco_08`** — Badaracco, Joseph L. (1997). *Defining Moments: When Managers Must Choose Between Right and Right.* Harvard Business School Press. — Pillar: *Ethical Framework* (human-accountability / ethical floor).
- **`kotter_06`** — Kotter, John P. (1996). *Leading Change.* Harvard Business Review Press. — Pillar: *Change Dynamics* (absorption floor).
- **`edmondson_09`**, **`maister_07`**, **`nist_12`**, **`anthropic_13`** also act as floors (candor, trust, control, runtime) in addition to their pole roles above.

---

## Data-quality flags — RESOLVED

All five corrected in the Tempo vault source frontmatter (`engine/v2/00_Sources/…`):

1. ~~**`ton_10` year.**~~ `founding_year` 2014 → **2023** (*The Case for Good Jobs*, the named title).
2. ~~**`nist_12` authorship.**~~ `author_founding` "NIST / Anthropic" → **NIST**.
3. ~~**`minto_02` year.**~~ `founding_year` 1967 → **1987** (first book edition).
4. ~~**Label vs. title.**~~ `maister_07` "Advisor Relationship" → **The Trusted Advisor** (+ full author list); `edmondson_09` "Team Psychology" → **Psychological Safety and Learning Behavior in Work Teams**.
5. ~~**`anthropic_13` year.**~~ `founding_year` 2023 → **2022** (arXiv posting date).
