# Session Handoff — 2026-09-02
*Built a log-mining extractor that induces a "your-questions → deterministic-unix" ontology from Claude transcripts — and surfaced one real fork: should the grouping layer stay pure-deterministic, or earn cleaner clusters from a one-time embedding pass?*

---

## The Setup
**Who:** Jeremy Capps, building a portfolio around Facia (deterministic *answer → UI recipe*) and its upstream Libera concern (*question → query → answer*). North star: build the instrument that lets a conclusion emerge **inductively from evidence**, rather than declaring it top-down. This session spun up a *new* personal project — `~/Dev/ontology/` — separate from the portfolio product code.

**Goal coming in:** Parse his own Claude/Codex runtime logs to build "an ontology mapped to me." Over the first exchange this sharpened into something specific: a **personal query compiler**, induced from his logs, that maps a natural-language intent ("where did I mention this Facia concept") straight to the deterministic operation that has historically resolved it (`rg`, `find`, a python script) — **skipping the LLM intermediary at dispatch time.**

---

## What Happened
We classified the work as architectural and went slow. Before designing anything we read the repo (Facia's `answer → recipe` contract, the hand-authored `src/lib/stratos/ontology.ts`, the chat/answer surfaces) so the idea could be positioned precisely: this is a *third* kind of ontology — not authored from a model like StratOS's six tensions, but **induced bottom-up from runtime traces of how Jeremy actually interrogates systems.** That framing matters because it's the whole point: the instrument earns its rules from what already worked in his history.

Two forks got resolved fast. First: the ontology is **for dispatch** — connecting NL queries to deterministic unix/python, not a dashboard (he corrected my initial read). Second: build the **extractor first (Phase A)**, not the live dispatcher (Phase B) — the honest inductive order is to *see what's in the logs before deciding how to fire on it.* Scope: the portfolio project only, its logs living under `~/.claude/projects/-Users-jeremycapps-Dev-portfolio*` (main dir + 17 worktrees). Home for the tool: `~/Dev/ontology/`.

I wrote a stdlib-only Python extractor and ran it against the real logs — and running it *before* trusting it paid off immediately. The core premise **held**: genuine locate-intents resolve cleanly to deterministic search (e.g. *"fix the facia validator require bug"* and *"not knowing about facia…"* both land on `grep/rg` over the exact files — 287 such pairs). But the first run also exposed two contaminants. One was a real extraction bug — Claude's skill-loader payloads (`"Base directory for this skill: …"`) were being captured as Jeremy's intent — which I fixed (same category as the `<system-reminder>` tags already stripped). The other was low-signal confirmations ("yes", "ok", "2") that carry no locate intent; rather than silently drop them I added a `low_signal` flag so the *pruning* stays Jeremy's call, not mine.

That left one genuine, unresolved tension — the reason this handoff exists. The **pairs layer is solid**, but the **signature/grouping layer is the weak link.** The deterministic "leading verb + 2 keywords" rule is too crude: it misses paraphrases (same meaning, different words → different bucket) and produces junk buckets from pasted paths. The clean fix is semantic clustering via embeddings — but embeddings are exactly the "model intermediary" Jeremy set out to skip. He asked how embeddings would work, I explained (model touches *induction* once at build time, never *dispatch* at runtime), and he asked for this handoff so the tradeoff can be assessed deliberately rather than decided in passing.

---

## Decisions Made
**Personal query compiler, induced from logs — not a dashboard** — the value is mapping NL intent → the deterministic op that already resolved it, skipping the LLM at dispatch. Corrects the initial "analytics surface" read.

**Phase A (extractor) before Phase B (dispatcher)** — the inductively honest order: inspect what's actually in the logs before designing how to fire on it.

**Lives in `~/Dev/ontology/`, not the portfolio repo** — it reads across projects and isn't portfolio product code; keep it standalone.

**Portfolio-scoped for the first run** — main project dir + its 17 worktree dirs, each tagged so the split is visible.

**Stdlib-only extractor, zero model in Phase A** — honors the "no intermediary" spirit and keeps the probe cheap and fully explainable.

**Low-signal turns flagged, not deleted** — pruning "yes"/"ok"/"2" is Jeremy's judgment call; the tool marks them (`low_signal: true`) rather than deciding for him.

**Skill-loader payloads stripped from intents** — a genuine extraction bug (harness injection ≠ user's words), fixed; distinct from the pruning question above.

---

## Still Open
**THE decision this handoff is for: deterministic vs. embedding for the signature/grouping layer.** The pairs are trustworthy; the *shapes* built from them are not yet. Two paths, and the choice is a values call as much as a technical one:

- **Stay pure-deterministic.** Improve the token rule (strip pasted paths and workflow-runner boilerplate, weight keywords by op-kind). Fully explainable, stdlib-only, but grouping stays coarse and paraphrase-blind.
- **One-time offline embedding pass.** Embed each substantive intent once (local `sentence-transformers` `all-MiniLM-L6-v2`, ~90MB, runs on his Mac offline — or `nomic-embed-text` via Ollama), cluster the vectors (HDBSCAN / agglomerative), label each cluster. **Model touches induction once at build time; runtime dispatch stays deterministic** (embed the one new query, cosine-match against ~50 stored centroids — pure arithmetic, no LLM reasoning). Cleaner semantic buckets, at the cost of a dependency and two tuning knobs (`min_cluster_size` + distance threshold) that Jeremy would own.

**How to actually assess it (the proposed next move, not yet approved):** build a *second, optional* pass — `cluster.py` that reads the existing `out/pairs.jsonl` and writes `out/ontology.embedded.json` alongside the deterministic `out/ontology.json`, so the two groupings can be **diffed side by side on his real data** and the embedding forced to prove it earns its place. Phase A stays intact either way.

**Secondary open threads:**
- Pruning policy for `low_signal` and junk signatures (`2`, `users·users·jeremycapps` from a pasted download path) — filter at build, or leave raw and filter at read?
- Codex logs are still out of scope — the original idea named "claude and codex"; only Claude has been touched.
- Phase B (the live dispatcher) is entirely unbuilt and undiscussed beyond "it comes later."

---

## Made This Session
- `~/Dev/ontology/extract.py` — stdlib-only extractor. Segments transcripts → pairs each genuine user intent with the tool calls that resolved it → classifies op-kind (`search-text`, `find-file`, `read-file`, `run-script`, `edit`, `git`, …) → induces a deterministic intent signature. Flags `low_signal`, strips skill-loader payloads, tags worktree vs. main. Run: `python3 extract.py` (defaults to portfolio).
- `~/Dev/ontology/out/pairs.jsonl` — 4,126 `(intent → op)` pairs (280 low-signal, 3,846 substantive). Raw, greppable, one JSON object per line.
- `~/Dev/ontology/out/ontology.json` — intents grouped by induced signature → count, example intents, resolving op-kinds, top command templates. **This is the induced instrument — and the artifact whose grouping quality the open decision is about.**

---

## Next Actions
1. **Make the deterministic-vs-embedding call** — or, to decide with evidence rather than in the abstract, greenlight building `cluster.py` (the optional embedding pass) and diff `ontology.embedded.json` against `ontology.json` on the real 3,846 substantive intents.
2. If embedding proceeds: confirm the local embedder (`sentence-transformers all-MiniLM-L6-v2` vs. Ollama `nomic-embed-text`) and accept the two tuning knobs as Jeremy-owned.
3. Decide the pruning policy for `low_signal` / junk signatures — build-time filter vs. read-time filter.
4. Only after the signature layer is trusted: scope Phase B (the live dispatcher) and whether to fold in Codex logs.

---

## To Load Next Time
- `~/Dev/ontology/extract.py` and both files in `~/Dev/ontology/out/` — read `pairs.jsonl` first (the trustworthy layer), then `ontology.json` (the layer under debate).
- Repo context for *why* this exists: `content/blog/facia-v2-design.md` (the `answer → recipe` vs. `question → query` split — this project is the induced, bottom-up cousin of the latter) and `src/lib/stratos/ontology.ts` (the *declared* ontology this one is deliberately the inverse of).

---

> **Tone note:** Deliberate, inductive, values-driven. Jeremy corrects framing precisely and wants the honest inductive order — build the probe, run it on real data, let the tradeoff surface, *then* decide. Don't pre-pick the embedding path for him; the "no model intermediary" north star is load-bearing, so any model use has to earn itself against his own logs.
