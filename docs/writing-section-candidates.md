# Writing section — ranked candidates

Survey date: 2026-08-26. Sources searched:

- `~/Downloads/AI Chat History/Drive` (112 files) — the Google Drive export
- `~/Downloads/AI Chat History/claude/conversations.json` (228 conversations)
- `~/Downloads/AI Chat History/GeminiChatHistory.html` (31 MB)
- `~/Downloads/AI Chat History/ChatGPT` (151 conversations, 264 canvas documents) —
  added 2026-08-26; see Appendix C
- `~/Downloads` (loose PDFs referenced by the Gemini export but absent from Drive)
- All repos under `~/Dev` (`facia`, `libera`, `timpos`, `cord-mcp`, `domain-v1`,
  `domain.os`, `domain-sketch.ai`, `jeremy.domain.ai`, …)

Ranking criterion: how well the piece proves the positioning already asserted in
`content/profile.md` — ontology / context-infrastructure engineer — weighted by how
close it is to publishable without new writing.

---

## Three findings that change the shortlist

1. **The Drive's `domain/04_PROJECTIONS/WHITE_PAPERS/` folder is empty.** So are
   `ONE_PAGERS`, `EXECUTIVE_SUMMARIES`, `BRAND_AND_SALES`, and `91_ACCEPTED_SNAPSHOTS`.
   The finished whitepapers are not where the Drive structure says they are.

2. **Three of the strongest whitepapers are not in Drive at all** — they're loose in
   `~/Downloads` (TIMPOS v3, Corus Overview, Domain: Executable Interpretation).
   The Gemini history references them as attachments; Drive never got them.

3. **The repo docs are the strongest evidence in the whole corpus** and were not part
   of the original ask. `facia/docs/facia-v2-design.md`, `libera/docs/runtime.md`, and
   `cord-mcp/docs/adr/2026-08-09-coordination-architecture.md` are design documents
   backed by shipped, tested code. Everything in Drive is a proposal; these are
   proposals that were built. For an engineering audience they outrank the Drive
   whitepapers.

---

## Tier 1 — lead with these

### 1. Domain — *All Execution Requires Meaning*
`Drive/domain/02_TRAJECTORIES/T01_PRODUCT_THESIS/domain-white-paper.md` · ~6,000 words · Markdown

The flagship. Full product whitepaper: abstract, numbered sections, the
Program → Product/Process V, the microincubator hypothesis. It is the literal subject
of the "what he most wants to do" line in `profile.md`. Already Markdown — drops
straight into a content pipeline.

> **Version conflict — resolve before publishing.** Two revisions exist, both dated
> July 13:
> - `Drive/.../domain-white-paper.md` (13:48) — subtitle *"A Local-First Program Cloud
>   for Proprietary Organizational Services"*
> - `~/Downloads/domain-white-paper (1).md` (15:52, newer, shorter) — subtitle
>   *"A Local-First Program Runtime for Generating Proprietary Products"*
>
> The abstracts diverge materially, not cosmetically. Also: the Drive copy is
> byte-identical (md5 `26227515…`) to `99_CONFLICTS_AND_PENDING_REVIEW/[outdated]
> domain-product-white-paper.md` — so the copy filed as canonical is the one filed
> elsewhere as outdated.

### 2. Domain — *Second-Order Convergence Architecture*
`Drive/domain/02_TRAJECTORIES/T02_ORGANIZATIONAL_CONVERGENCE/Domain_Second_Order_Convergence_Architecture.pdf`
· 10 pages, designed · plus a text twin at `domain-white-paper.docx` (1,858 words)

The only document in the corpus that was laid out *as* a whitepaper — cover, abstract,
running heads, "WHITE PAPER DRAFT · JULY 2026". Self-contained thesis that doesn't
require buying into Domain-the-product: *velocity is a property of a cycle;
acceleration is a property of the relationship between cycles.* Publish the PDF as the
download and the docx text as the web version.

### 3. Facia v2 — Design
`~/Dev/facia/docs/facia-v2-design.md` · ~15 KB · status: ratified, 2026-08-18

The one you flagged, and it earns the spot. `answer → shape → pattern → affordances →
recipe`, plus the cut between Concern A (Facia) and Concern B (Libera query planning).
Unique among the candidates in that **the thing it describes is running on this site
right now** and is published as `@facia/core`. Strongest available proof that the
modeling instinct survives contact with an implementation. Pair with
`facia/packages/facia-core/spec/answer-set-v2-contract.md` (28 KB) as the appendix.

### 4. Domain — *Executable Interpretation for Operational Reality*
`~/Downloads/Domain- Executable Interpretation for Operational Reality.pdf` · 8 pages

*(Promoted from Tier 2 — see the TIMPOS note below for why it takes this slot.)*

The cleanest single-idea essay in the corpus. *Observations are relationships, not
reality; reality is reconstructed, not stored.* Shortest path to a genuinely good blog
post rather than a document-with-a-download-button, and it entails none of the
naming problems that TIMPOS does.

---

> ### ⚠️ TIMPOS v3 — pulled from Tier 1
>
> `~/Downloads/TIMPOS White Paper.pdf` is a strong document in isolation: problem →
> five-layer architecture (UTID / Ledger / Profile / Solution / Authority) → named
> pilot on telecom poles, GIS, and LiDAR reconciliation.
>
> **But it describes a superseded system, and publishing it would contradict the
> site.** There are three distinct things named Timpos:
>
> | | What it is | Status |
> |---|---|---|
> | **TIMPOS v3** (the whitepaper, May 2026) | Deterministic replay for physical-world event systems; 128-bit UTID spacetime anchors; LiDAR/GIS | Origin implementation |
> | **`~/Dev/timpos`** (on disk) | Actually *Corus* — the Python/Mojo context-management prototype. `docs/migration-from-timpos.md`: "TIMPOS (product) → Corus", "UTID → Timpo" | `profile.md` marks this lineage **superseded and dormant** |
> | **`github.com/jeremycapps/timpos`** (current, public) | YAML-first protocol for source-located state changes at addressable paths — locator registry, moments, replay/diff | v1 spec, no implementation — this is the one the site describes |
>
> Publishing the whitepaper puts UTID, LiDAR, and 128-bit spacetime addressing
> directly beside a site that says Timpos is a YAML state-change protocol. A careful
> reader catches that.
>
> **If you still want to publish it**, frame it explicitly as origin history —
> "the physical-world system the current protocol came out of" — the same way
> `profile.md` already handles the two Coruses. Don't publish it as current work.
>
> The older `TIMPOS_Protocol_White_Paper.pdf` (3 pages, May 28 — sexagesimal
> addressing, Mojo kernel, HFT framing) is a third variant again. Leave it.

### Related gap: `profile.md` documents the Corus collision but not the Timpos one

`content/profile.md` carries an "Important correction for the assistant" block for the
two things named Corus. The identical trap exists for Timpos — and it is worse than
three referents. See below.

---

# Appendix A: The Neara demo

**Not a whitepaper — the strongest *demonstration* in the corpus, and the best evidence
for the FDE positioning.** Lives in the Corus workbench at `~/Dev/timpos`.

## What it is

A self-directed proof-of-concept built around June 2026 while applying to **Neara** for a
Forward Deployed Engineer role (Claude conv #114, 2026-06-12; `Jeremy_Capps_Neara_FDE.pdf`
in the Gemini history). Instead of only sending a resume, he built a working demo against
the company's actual problem domain — infrastructure digital twins.

## The pipeline

Built first in Colab (`Drive/Colab Notebooks/Neara PoC.ipynb`, 8 cells), then landed in the repo:

1. **Real public data.** NYC DOT *Mobile Telecommunications Franchise Pole Reservation
   Locations* — 10,185 rows, real franchisees (Crown Castle Fiber) — plus a real LiDAR
   tile, `980195.laz` (~18M points).
2. **Spatial filter.** CSV rows falling inside the LiDAR tile bounds → **106 poles**.
3. **Reconciliation.** `laspy` + a `scipy` `cKDTree` over the point cloud: for each pole,
   find LiDAR base and top points within a radius, derive mount height.
4. **Span detection.** Neighboring poles linked into primary spans.
5. **Ledger.** 106 assets, 318 observations — exactly 3 per asset
   (`GIS_ORIGIN`, `LIDAR_BASE`, `LIDAR_TOP`).

## The actual point

Two versions of the same reconciliation policy, differing in one parameter:

```yaml
# neara-infrastructure@0.1.0.domain     # @0.1.1.domain
attach_distance_m: 5.0                  attach_distance_m: 2.0
```

with the matching execution contract also dropping `LIDAR_TOP` from accepted labels and
removing a `refines` edge. Reconstruct context under each, hash both, diff.

**Same observations + different declared policy → different, deterministic, explainable
result.** That is `time_to_because` made concrete, and the domain file says so in its own
KPI block: *"Why did this observation attach to this asset? Why did this reconstruction
change?"*

## It runs today

```
$ python3 demos/neara/walkthrough.py
Neara Infrastructure — Context Reconstruction
  318 observations / 106 assets
  Replay hash: fb605bfd…
  Threshold delta: 5m → 2m
  Assets changed: 106
```

### One real bug, fixed (2026-08-26)

`Threshold delta` originally printed `unchanged`, which was false — the policy changed
5m → 2m. `src/corus/legacy/diff.py` passed the `reconciliation` dict into
`format_threshold_delta()`, but that function does `how.get("reconciliation", {})`
itself — so it dug one level too deep, found nothing, and returned `"unchanged"`.

The fix passes `domain.how` (not `domain.how.reconciliation`) to `neara_delta`:

```python
# src/corus/legacy/diff.py — corrected
report["threshold_delta"] = neara_delta(
    from_d.raw.get("domain", {}).get("how", {}),
    to_d.raw.get("domain", {}).get("how", {}),
)
```

The output now reads `5m → 2m`, and the 4 Python tests plus the two other callers of the
delta functions are unaffected (the `utility_clearance` branch builds its own dict for a
differently-shaped function).

**`Assets changed: 106` was always correct.** 318 ÷ 106 = exactly 3 observations per
asset, so dropping `LIDAR_TOP` changes every asset's fingerprint. All 106 is the right
answer.

Net: the demo's conclusion — *"Replay output changed deterministically due to explicit
reconciliation policy changes, not hidden heuristics"* — is now matched by its own output.

## If it goes on the site

- **It is the FDE thesis performed, not argued.** Conv #227 says the FDE's real
  deliverable is *a domain — declared question-to-verdict paths*. This demo's deliverable
  is literally two `.domain` files and the diff between them. Nothing else in the corpus
  demonstrates that claim; everything else asserts it.
- **Diff bug fixed** (2026-08-26) — the output now shows `5m → 2m`, which is the whole
  demonstration. That was the one blocker.
- **Be precise about the LiDAR.** The committed ledger records `"laz_read": false` — the
  point-cloud extraction ran in Colab and the repo replays the pre-built ledger. Frame it
  as "reconciled from LiDAR and GIS," not "reads the point cloud on every run."
- **The data is NYC DOT open data, not Neara's.** Using the company name for a self-made
  PoC is fine; implying access to their data is not.
- **Lineage caveat.** This sits in the workbench that `profile.md` marks superseded and
  dormant. The demo's value is as a case study of the method, not as current tooling.

---

# Appendix B: Timpo in the Corus workbench, and the UTID patent drafts

## A. What is actually implemented

`~/Dev/timpos` (the Corus workbench) contains a small, complete, honest Timpo engine.

**371 lines total**, across two mirrored trees:

| File | Lines | What it does |
|---|---|---|
| `src/corus/timpo/model.py` | 34 | `Timpo` dataclass — `when`, `where_x/y/z` |
| `src/corus/timpo/codec.py` | 52 | lat/lon degrees → milliarcseconds → packed int |
| `wire/layout.mojo` | 38 | bit constants, `pack_timpo` / extract halves |
| `wire/codec_compact.mojo` | 83 | encode/decode |
| `wire/ledger_bundle.mojo` | 139 | append-only bundle + structural checks |
| `wire/reseed.mojo` | 8 | new observation at the same quantized place |
| `wire/envelope.mojo` | 17 | envelope struct |

Tests: 191 lines across 4 files (`run_all.mojo`, `test_ledger_bundle.mojo`,
`test_domain_loader.py`, `test_context_reconstruct.py`).

The entire identifier is:

```text
UInt128 = (spatial_u64 << 64) | time_ns_u64
  spatial_u64 = (lat_int32_mas << 32) | lon_int32_mas
  time_ns_u64 = unsigned nanoseconds, Unix epoch
```

Deterministic bit-packing of two coordinates and a timestamp. Nothing else.

**Verified by grep across the whole Timpo source: zero occurrences of** `entropy`,
`PUF`, `thermal`, `jitter`, `silicon`, `hash`, `crypt`, or `sign`. The only hits are the
word "signed" in a comment describing signed milliarcseconds.

`reseed.mojo` in full:

```mojo
fn reseed_utid(old: UInt128, time_ns: UInt64) -> UInt128:
    return pack_utid(spatial_u64(old), time_ns)
```

### The engine spec is the best artifact in the repo

`docs/timpo-mojo-engine-spec.md` is the most recent authoritative spec, and it is
unusually disciplined — a naming table of use/do-not-use, one mandated wire layout, and
an explicit list of things not to build. Two lines from it matter enormously below:

> **"UTID is not a separate concept. It is a legacy synonym for Timpo. Do not use the
> term UTID anywhere."**

> "Do **not** implement alternate layouts, version switches, Morton interleave, or extra
> fields (salt, vertical, scale, flags) on the wire."

And `docs/authority-layer.md` puts crypto firmly outside the identifier:

> "Crypto — Sign `(utid, actor_id, payload)` here — **not in the 128-bit key**."

### Migration is half-done

`src/timpos/utid/` and `src/corus/timpo/wire/` are **byte-identical copies** — the rename
duplicated rather than moved. `codec.py` still exports `encode_utid` and `utid_str` as
"aliases used by infrastructure ingest." Cosmetic, but it's why the repo reads as two
projects at once.

---

## B. The UTID patent drafts describe a different invention

Ten documents in `~/Downloads`, May 16–26 2026: eight `TIMPOS_ PPA` revisions,
`UTID_Patent_Draft_v1.pdf`, and `TIMPOS_UTID_Design_Spec.md`.

**`UTID_Patent_Draft_v1.pdf`** (2pp, May 21) — *"Universal Temporal Identifier for Audio
Provenance."* 64-bit spatiotemporal anchor + 64-bit **"thermal receipt"** derived from
silicon thermal entropy and a Physically Unclonable Function, captured from the audio
buffer as it processes. Positioned against C2PA. Claim 4 asserts the thermal segment can
**distinguish human audio capture from synthetic AI generation** by computational density.

**`TIMPOS_ PPA v7.pdf`** (4pp, May 19) — *"System and Method for Hardware-Accelerated,
Self-Certifying Digital Identifiers via Clock-Gated Permutation."* TIMPOS™ as a
trademark. A clock-gated switching matrix physically re-routes payload segments; Mode A
for HFT with fiber-optic latency compensation, Mode B for media provenance via recursive
bit-interleaving; MLIR-compiled deployment.

**`TIMPOS_UTID_Design_Spec.md`** (May 26) — a third layout again: 24-bit stochastic salt
from hardware clock jitter, 24-bit vertical vector, 64-bit H3 res-15 anchor, 16-bit
hybrid pulse, with `New_Salt = Hash(Old_Salt + New_Pulse + Hardware_Entropy)`.

### Every one of these was explicitly rejected by the engineering

| Patent concept | Engine spec / authority-layer position |
|---|---|
| Stochastic salt from hardware jitter | "Do not implement … extra fields (**salt**, vertical, scale, flags) on the wire" |
| Recursive bit-interleaving (Mode B) | "Do not implement … **Morton interleave**" |
| Self-certifying identifier | "Crypto … **not in the 128-bit key**" |
| Mode A / Mode B application profiles | "There is **no profile id.** Timpo has one wire layout" |
| The name UTID | "**Do not use the term UTID anywhere**" |
| `Hash(Old_Salt + Pulse + Entropy)` reseed | `reseed` = repack the same coordinates with a new timestamp |

This isn't drift. The workbench spec reads as a point-by-point retraction of the patent
architecture — which makes sense chronologically: PPAs mid-May, engine spec late May.

---

## C. What this means for the site

### 1. Keep the patent material off it — your instinct was right, and here's the specific reason

It's not that patents are unseemly on a portfolio. It's that these documents claim
non-spoofability, physical entanglement, PUF-derived self-certification, and human-vs-AI
audio discrimination by thermal signature — **none of which is implemented, and some of
which is technically contentious on its own terms** (per-die thermal entropy captured
through an audio buffer as a stable fingerprint; computational density as a reliable
human/synthetic discriminator). `profile.md`'s never-overclaim rule doesn't survive
contact with any of it. The 371 lines that *do* exist are honest and defensible; the
patent drafts would poison them by association.

### 2. There may be a disclosure clock — check with a patent attorney

The PPAs date to **May 16–19 2026**. A US provisional gives roughly a 12-month window to
file a non-provisional, which would put the deadline around **May 2027**. Publishing a
whitepaper is a public disclosure. The US has a one-year inventor grace period; most
other jurisdictions apply **absolute novelty**, where prior publication generally ends
foreign rights.

I am not a lawyer and this is not advice — but it is a real question that should be
answered before anything TIMPOS-adjacent goes public, and the answer differs by document:

| Document | Discloses patent claims? | Read |
|---|---|---|
| **TIMPOS v3 whitepaper** | Probably not | Describes UTID as where+when only, "intentionally semantically weak — not identity, ownership, ontology, or objective truth." That is the *opposite* of a self-certifying identifier. |
| **`TIMPOS_Protocol_White_Paper.pdf`** (3pp) | Possibly | Sexagesimal addressing, Mojo kernel, HFT framing — overlaps PPA Mode A. |
| **`TIMPOS_UTID_Design_Spec.md`** | **Yes** | Stochastic salt, hardware jitter, hash-chained reseed. This is the claimed subject matter. |
| **Geospatial ID / HFT Recommendation** | Possibly | TEEs, hardware attestation, "Proof of Origin." |

### 3. There are four things named UTID/Timpos, not three

Revising the table from the Tier 1 note:

| Name | What it is | Where |
|---|---|---|
| **UTID** (patent) | Hardware-entropy self-certifying identifier; PUF, thermal receipt, clock-gated permutation | `~/Downloads` PPAs — **never built, explicitly rejected** |
| **UTID / Timpo** (workbench) | 371 lines; deterministic lat‖lon‖time bit-packing | `~/Dev/timpos` — built and tested, lineage marked dormant |
| **TIMPOS v3** (whitepaper) | Five-layer replay architecture around the above | `~/Downloads/TIMPOS White Paper.pdf` |
| **Timpos** (current, public) | YAML protocol for source-located state changes at addressable paths | `github.com/jeremycapps/timpos` — v1 spec, no implementation. **This is what the site describes.** |

Only the fourth is current. The `profile.md` disambiguation block for Timpos should name
at least the patent/workbench/current split, the same way the Corus block does.

### 4. There is a genuinely good short post buried in here

Not the patent — **the retraction**. "I filed provisionals on a self-certifying,
hardware-entangled identifier, then designed the thing and cut every one of those
properties out of it, because an observation primitive that carries identity, crypto, and
trust isn't a primitive any more." The engine spec's do-not-build list is the evidence,
and it's dated. That is a much rarer piece of writing than another architecture paper —
and it is publishable without disclosing anything the PPAs claim, because its entire
subject is what was *removed*.

Confirm the disclosure question first regardless.

---

## Tier 2 — strong, needs light framing

### 5. Domain — *Executable Interpretation for Operational Reality*
`~/Downloads/Domain- Executable Interpretation for Operational Reality.pdf` · 8 pages

The cleanest single-idea essay in the corpus. *Observations are relationships, not
reality; reality is reconstructed, not stored.* Shortest path to a genuinely good blog
post rather than a document-with-a-download-button. Overlaps #1 and #2 conceptually —
publish it as the essay-length entry point to them.

### 6. *Human-Led Automation: Category and Product Strategy*
`Drive/domain/02_TRAJECTORIES/T05_.../10-human-led-automation-category-and-product-strategy.md.docx` · 1,486 words

The best point-of-view piece here — a category argument, not a system spec. *"Humans
decide. Automation remembers, routes, and verifies."* The most readable item in the
whole corpus for a non-specialist hiring audience, and nearly blog-ready as written.

### 7. Corus — *Overview* and *Origin Domain*
`~/Downloads/Corus Overview.pdf` (7 pages) · `~/Downloads/Corus Origin Domain.pdf` (36 pages)

*Overview* is tight and publishable as-is: Timpo + Domain = Context, Legacy as a
protocol that distributes reconstruction capability rather than conclusions.
*Origin Domain* is a 36-page derivation log (UTID → Timpo → Domain → Context → Legacy →
Corus) — better as a "how the idea actually evolved" long read than a front-page post,
but it's rare and honest material. Both directly back the "most proud of: Domain /
Corus" claim in `profile.md`.

### 8. *Timpos Protocol*
`Drive/timpos/Timpos Protocol.docx` · 754 words

A canonical protocol spec that states its own unresolved questions in the status line
(epoch and overflow policy). Short, precise, and the openness about what isn't settled
is the point. Good short post; shows spec-writing craft in under 800 words.

### 9. Libera — the Mojo reference runtime
`~/Dev/libera/docs/runtime.md` · ~14 KB

`Value_out = Evaluate(Expression, Props)` as the entire execution surface, then the
layer map from kernel through strategy. Same virtue as #3: describes working code.
Denser than Facia v2, so second in that pairing.

---

## Tier 3 — good, narrower, or more work

10. **cord-mcp coordination ADR** — `~/Dev/cord-mcp/docs/adr/2026-08-09-coordination-architecture.md`.
    Ten architectural questions decided explicitly, with an honest implementation-status
    section admitting §7 is not done and §4 is partial. That candor is the strongest
    thing about it. Companion: `docs/schema-overview.md` (append-only logs + rebuildable
    projections, with a Mermaid diagram).
11. **Domain Architectural Layers (L0–L7)** — `Drive/.../T04_BODY_KERNEL_AND_RUNTIME/`, 2,610 words,
    with L0 and L6 companions. *"The pattern may repeat. Responsibility must not."*
    Systems-architecture deep dive; reads as internal documentation.
12. **Domain Principles** — `Drive/domain/01_COMPASS/09-domain-principles.md.docx`, 2,473 words.
    Doctrine, opinionated and readable, but presupposes Domain.
13. **Libera Product North Star** — `Drive/libera/Libera Product North Star.docx`, 857 words.
    Obsidian + Notion + Vercel as the product triangle. Pairs with the existing Libera
    project card.
14. **Domain Language System** — `Drive/.../T06_LANGUAGE_AND_SURFACES/[old] domain-language-system(2).md`.
    Product language derived from product architecture. Cross-disciplinary and unusual,
    but it's live positioning work, not a finished argument.
15. **Semantic Architecture Handoff** — `Drive/work computer/the knot/`. Real client work:
    JSON-LD narrative layer for LLM ingestion. Concrete and differentiated, but **names a
    client** — needs a permission check and probably anonymizing.

---

## Not recommended

- **Orchestrator export packets** (`Drive/orchestrator/`, 5 files). Gemini role-play
  session logs. One contains personal financial detail — the 73 Lefferts Place
  acquisition, S-Corp income, VA loan structure. Exclude.
- **Work-computer playbooks** — SOPs, Client Tiers, Figma-to-Framer, 12-Month Roadmap.
  Competent studio-ops material, but off-positioning and client-naming.
- **Geospatial ID / HFT Recommendation** (`Drive/tempo studio/`). Marked "Confidential
  Strategy Document"; sub-100ns latency claims are unvalidated. Skip.
- **Convergence Map, Current Frontier, Operation-to-Vector Map.** All self-labeled
  "non-canonical recovery view." Internal navigation, not publications.
- Resumes, capability YAMLs, the job-search knowledge base, `experience_units.*`.

---

## Written in chat but never made into a document

These have no artifact yet. Ranked by how much stronger the site would be for having them.

1. **"The FDE is a distribution channel, not a destination"** — Claude conv #227,
   2026-08-24. The freshest and sharpest thesis in the whole corpus: the forward-deployed
   engineer's real deliverable is a domain — declared question-to-verdict paths — and the
   engine layer (kernel, modelir, address, facia) separates from the manager layer (corus,
   timpos, domain, strategy). Points straight at the roles `profile.md` says he's
   targeting. **Highest-value thing to write next.**
2. **Measuring the business value of agentic → deterministic migration** — Claude conv
   #226, 2026-08-20. He tells Jonathan he *wrote a whitepaper on this*. No such document
   is on this machine, and no file was attached to that conversation.

   **It is not the Second-Order Convergence paper.** Word-frequency check across the full
   10-page PDF: `token` 0 · `deterministic` 0 · `spend` 0 · `savings` 0 · `ROI` 0. That
   paper is an organizational-acceleration argument sourced to Minto, APQC, Goldratt,
   NIST AI RMF, and Edmondson — a different thesis entirely from "migrate an agentic
   workflow to a deterministic program and count the money saved."

   **But it may still be the right thing to send.** In that same thread the pushback was
   that token spend undersells the case to a transformation partner — cycle time, rework,
   and utilization carry more weight. Second-Order Convergence *is* the cycle-time-and-
   rework paper (Goldratt's bottleneck asymmetry, validation as correction signal). If
   that's the substitution being made, it's a defensible one — the email framing just has
   to change to match the paper, because the deterministic/token thesis isn't in it.
3. **"The Chorus Is the Best Part"** — Claude conv #125. Timpo, the Bantu NTU concept of
   time, Greek tragedy, pop music. The only thing that bridges the NEW INC cultural work
   and the systems work. Distinctive in a way none of the whitepapers are.
4. **An etymology series** — Claude convs #222, #223, #117, #139, #130, #116. Sustained
   word-interrogation as an ontology method: author/agent/stakeholder, protocol/system/
   service/infrastructure, surface/context, why "model" was rejected. Reads as a natural
   recurring column and is exactly on-brand for the ontology positioning.

---

## Suggested launch set

Four posts, no new writing required beyond intros and version resolution:

| Slot | Piece | Work needed |
|---|---|---|
| Flagship | Domain — *All Execution Requires Meaning* | Resolve the two-revision conflict |
| Architecture | Domain — *Second-Order Convergence* | None; ship PDF + docx text |
| Proof | *Facia v2 — Design* | Light intro framing it as the site's own engine |
| Essay | Domain — *Executable Interpretation* | Convert PDF → Markdown |

Then #6 (*Human-Led Automation*) as the most readable follow-up, and the FDE piece as
the first thing written natively for the site.

**This launch set is also the Jonathan set.** The blog idea came out of that same thread
(#226, 8/25): *"Blog that surfaces white papers"*, plus the observation that a senior
partner skimming on his phone should reach the artifacts without a chat prompt standing
in front of them. If Second-Order Convergence is what gets sent, it wants a live URL
next to the email, not just an attachment.

## Open decisions

- **Canonical Domain whitepaper revision** — Cloud/Services or Runtime/Products?
- **Whole PDFs, or Markdown web versions?** Everything in Tier 1 except #1 and #3 is
  PDF-first. A blog section wants text; converting #2, #4, #5, and #7 is real work.
- **Repo docs on the site, or linked to GitHub?** They're already public. Rendering them
  here means they drift from the repo unless the section pulls from source.
- **Dates and status.** Several carry honest status lines ("draft", "working model",
  "epoch unresolved"). Keeping those is consistent with the never-overclaim rule in
  `profile.md` — worth surfacing as post metadata rather than hiding.

---

# Appendix C: The ChatGPT export (added 2026-08-26)

151 conversations, 264 distinct canvas documents (`:::writing{variant="document"}`
blocks). This is where most of the Domain / Corus / Facia / Timpos writing was actually
authored. It changes the survey in three ways — none of which adds a new front-page
whitepaper, and one of which complicates an existing decision.

## 1. The Domain flagship version conflict is three-way, not two

The Tier 1.1 note flagged two July-13 revisions. The ChatGPT canvas holds a **third**,
also July 2026, in the "Domain: Domain (product)" / "Domain: Domain (architecture)"
conversations (canvas `52dcb8d3`, 32.8 KB):

| Source | Subtitle | Abstract's third sentence |
|---|---|---|
| Drive `domain-white-paper.md` (Jul 13, 13:48) | A Local-First **Program Cloud** for Proprietary Organizational **Services** | proprietary organizational **programs** available on demand |
| `~/Downloads/domain-white-paper (1).md` (Jul 13, 15:52) | A Local-First **Program Runtime** for Generating Proprietary **Products** | company-specific **products** generated from company-specific programs |
| ChatGPT canvas `52dcb8d3` (Jul 13) | A Local-First **Application Cloud** for Proprietary Organizational **Services** | proprietary organizational **services** available on demand |

The paper was being revised live in ChatGPT canvas on July 13; the three variants trade
**Program / Application / Runtime** against **Cloud / Runtime** and **Services /
Products / Programs**. This does not change the recommendation (still the flagship), but
open decision #1 in the spec — "which revision is canonical" — is now a **three-way**
choice, and the honest answer may be that none of the three is final. Pick the framing
deliberately before publishing.

## 2. Provenance, not new artifacts

The ChatGPT canvas is the origin of several pieces already in the survey — it confirms
authorship rather than adding candidates:

- **Corus Origin Domain** (canvas `1a8cab40`, May 28) — the source of
  `~/Downloads/Corus Origin Domain.pdf` (Tier 2 #7).
- **TIMPOS** architecture docs (canvases `9db864c2`, `2b541dca`, `5dcd9499`, May 28) —
  the origin of the TIMPOS whitepaper lineage. **Still held out** (Appendix B): patent
  overlap and the three-referent naming collision are unchanged by this source.
- **Organizational Acceleration** (7/30) — an outline that became the Second-Order
  Convergence paper (Tier 1 #2); it names its two source Google Docs.
- **Human-Led Automation** (8/3) — the naming/positioning conversation behind the
  Drive doc (Tier 2 #6). Confirms the title and framing; not a separate artifact.

## 3. New *supporting* material (not whitepapers)

A body of market/positioning writing exists here that could inform the site's framing or
a future essay, but is not launch-set blog material:

- **StratOS v5 C-Suite Micro-Report Series** (canvas `3268fe17`, 40 KB, 7/26) — the
  largest single canvas doc; benchmark/market analysis around StratOS.
- **Competitive Positioning Analysis** (8/23), **Corus: Market Research** (7/8),
  **FDE Tooling Market Analysis** (8/8) — market scans, useful as background for how the
  work is described, not as posts.

**Net effect on the blog spec:** none structurally. The launch set stands; open
decision #1 widens from two candidates to three. Everything TIMPOS/UTID-related remains
excluded for the same reasons.
