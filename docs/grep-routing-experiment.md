# Experiment: Routing `grep -r` → `git grep` from observed agent logs

**Date:** 2026-09-18
**Status:** Complete. Intervention built, tested (19/19), and running live as a `PreToolUse` hook.
**Corpus:** `~/.claude/projects/-Users-jeremycapps-Dev-portfolio*` — 140 sessions, 6,280 tool calls, 2,962 Bash calls.

## Why this matters (plain language)

The experiment below is about one small thing — how an AI coding agent searches your files. But the point isn't the search. It's the method, and what it means for anyone who uses an agent like this.

Strip out the mechanism and a person using the agent notices three things:

- **It stops stalling.** A search that used to make the agent churn for eight seconds now returns instantly. Over a work session, that's the difference between waiting on it and it keeping up with you.
- **It stays sharp for longer.** An agent has a limited working memory for each session. Every sloppy search filled that memory with thousands of irrelevant lines, and when it fills up the agent starts *forgetting* — losing the plan, re-asking things you already answered, drifting off task. Clearing the junk means the agent gets much further into a hard job before it loses the thread.
- **It costs less.** That wasted memory is also wasted money (or wasted usage budget). Cleaner work is simply more done per dollar.

The bigger idea is how the fix was found. Nobody guessed. The agent's own history — a log of everything it did — was mined to find where it kept doing something the slow, expensive way, and only that spot was fixed. Every user has their own version of that waste sitting in their logs. So the real promise is **an agent that learns its own bad habits from watching itself work, and quietly stops repeating them — tuned to how you actually work, not a generic checklist.**

And it does this safely. It only auto-corrects the reversible, low-stakes actions — a search costs a wasted moment if it's wrong, never damage. Anything that changes your files or makes a real decision stays gated behind you. So the agent gets faster and cheaper *and* more trustworthy over time, without you having to watch it.

The rest of this document is the evidence that this actually works, on real logs, with real numbers.

## Abstract

Starting from the observation-first premise — *the work is already logged; mine the log to find what should become deterministic* — I looked for one automatable trajectory in my own Claude Code history. Recursive text search surfaced as the strongest candidate. Across 140 sessions the agent reached for unscoped Bash `grep -r` 291 times while using the already-scoped built-in `Grep` tool only 35 times. Benchmarking showed the scoped alternative (`git grep`) is ~250× faster and loads ~10× less context — and that **~99.6% of that win is scope + consolidation, not the tool**: `git grep` (the same grep engine, tracked-files-only) matched ripgrep to within ~6 ms. I promoted the finding to a `PreToolUse` hook that routes the convergent case and preserves an escape for the rest, proved it with a 19-case test suite, and confirmed it firing live.

## 1. Question

> Can observed, accepted work trajectories reveal the smallest safe deterministic workflow worth automating?

Scoped to one concrete decision: **when the agent runs a recursive filesystem search, could it have known — deterministically — to use a scoped search instead?**

## 2. Data source

Claude Code writes an append-only JSONL transcript per session under `~/.claude/projects/<sanitized-cwd>/`. Each record carries typed `tool_use` blocks (name + input), timestamps, and paired `tool_result` bodies. This is an audit log that was deterministic before I touched it; the extractors only read structure out of it.

## 3. Methodology

Model-free, stdlib-only Python passes over the raw JSONL, each answering one question. All scripts live in the session scratchpad; the numbers below are reproducible from the corpus.

| Script | Purpose |
|---|---|
| `toolsplit.py` | Split every search call by tool: built-in `Grep` vs Bash `grep` vs `git grep` vs `rg`; sub-classify Bash greps by shape. |
| `dig290.py` | Characterize the 291 `grep -r` calls: search scope, `--include`/manual-exclude usage, episode position. |
| `before.py` | For each `grep -r`, reconstruct the tool calls that preceded it in the episode (how much context was available at decision time). |
| `bench5.py` | Wall-clock + bytes/lines (context) for naive grep vs the observed 2-step loop vs `git grep` vs native `rg`, on a live search term against the real repo. |
| `route-grep.py` | The intervention: a `PreToolUse` hook implementing the routing decision. |
| `test_route_grep.py` | 19-case suite (16 hermetic unit + 3 stdin integration) proving the hook. |

Benchmarks: repo with 634 MB `node_modules` and 16 MB `.git`; term `Domain` (59 tracked files); grep timings single-run (dominated by cold `node_modules` I/O), `rg` best-of-5.

## 4. What was tested, and the outcomes

### 4.1 Which search tool does the agent actually use?

| Search call | Count |
|---|---|
| Built-in `Grep` tool (rg + `.gitignore`, already optimal) | 35 |
| `git grep` in Bash (already optimal) | 7 |
| `rg` in Bash | 18 |
| **Bash `grep -r`** (unscoped recursive walk) | **291** |
| `grep <explicit file>` (targeted, already cheap) | 469 |
| `\| grep` (stream filter) | 346 |

**Outcome:** Of all recursive filesystem searches, **~87% took the unscoped `grep -r` path** despite a scoped tool being available. `grep -r` is **9.8% of all Bash calls, 4.6% of every tool call.**

### 4.2 What was unique about the 291? (Was it uncertainty?)

| Signal | Share |
|---|---|
| Searched the whole tree (`.`/cwd) | 63% |
| Searched a source subdir | 35% |
| Searched an ignored/generated dir | 2% |
| Was the first search in its episode | 29% |
| Carried `--include` (type narrowing) | 45% |
| **Hand-excluded noise** (`\| grep -v node_modules …`) | **42%** |

**Outcome:** The 291 are **location-uncertain** searches — cast a wide net when the target's whereabouts are unknown. The 42% that manually piped out `node_modules`/`worktrees` prove the agent *knew* the scope problem and re-solved it by hand every time, rather than being ignorant of it. The uncertainty was about *where*, not *whether to skip vendored dirs*.

### 4.3 How much context was available at decision time?

| Prior tool calls in the episode before the `grep -r` | Share |
|---|---|
| 0 (cold — only the user prompt) | 15% |
| 1–2 | 22% |
| 3–6 | 24% |
| 7+ | 38% |

Median 4, mean 9.4. A prior `Read`/`Grep`/`Glob` had run in 39% of cases.

**Outcome:** Two decisions with opposite context requirements. **Which tool** (scoped vs unscoped) is decidable from the command + cwd alone — zero context. **How broad** (whole-tree vs targeted) depends on accumulated context, and the agent already handled it acceptably (broad when cold, narrow once warm). The automatable decision is the stateless one.

### 4.4 Time and context cost (the core benchmark)

Term `Domain`, same repo:

| Approach | Time | Context loaded | Complete? |
|---|---|---|---|
| Naive `grep -rl` (no scope) | 8,328 ms | 428 lines / 22.7 KB / ~5,700 tok | complete, ~90% noise |
| Observed 2-step loop | ~8,455 ms | 40 lines (capped) | incomplete, 2 round-trips |
| **`git grep -l`** (grep engine, tracked scope) | **31 ms** | 59 lines / 2.3 KB / ~580 tok | complete, one call |
| Native `rg -l` | 25 ms | 59 lines / 2.4 KB / ~600 tok | complete, one call |

**Outcome:** ~250–330× faster and ~10× less context than the observed loop.

### 4.5 Decomposition — is the win the tool, or the method?

Controlling for the engine with `git grep` (same grep binary, tracked scope, one call):

- Naive `grep` → `git grep`: 8,328 ms → 31 ms = **~269×**, using the *same engine*.
- `git grep` → `rg`: 31 ms → 25 ms = **~1.2×**.

**Outcome:** **~99.6% of the speedup is scope + consolidation; ~0.4% is ripgrep being a faster binary.** The 10× context reduction is *100% scope, 0% tool*. Tightening scope further (tracked-only → type-pathspec) changed time 31→31 ms and files 59→55 — negligible. The scope cliff is binary: filesystem-walk vs git index.

### 4.6 The intervention and its proof

The fix routes only the stateless decision: a `PreToolUse` hook that denies a recursive grep — inside a git work tree, not aimed at an ignored dir, without `--no-ignore` — and hands back the `git grep` reformulation, letting the agent continue. Denying (not rewriting) keeps it robust across compound commands.

**Routability of the 291:** ~98% (285) → `git grep`/`Grep` tool; 2% (6) genuinely needed the unscoped path (searching ignored/generated dirs) — the preserved escape.

**Test suite (`test_route_grep.py`): 19/19 pass** — 7 FIRE cases, 9 escape cases, 3 stdin-integration cases against a real temp git repo. The suite caught a real false-escape bug: the first ignore-pattern would have *silently skipped* any recursive grep whose **search term** was a word like `build`, `out`, or `coverage` (mistaking the term for a path); the tightened pattern fires correctly. Confirmed firing live: `grep -rn build .` was blocked with guidance before executing.

## 5. Threats to validity / gotchas surfaced

- **Stale term confound.** The first benchmark term (`facia`) had been retired from tracked source, so `git grep` correctly returned 0 while `grep` dredged matches from build artifacts — not a fair comparison. Re-run with a live term (`Domain`).
- **`rg` reads stdin and hangs** when given no path argument and a non-tty stdin; early benchmarks "timed out" for this reason, not slowness. Always pass a path.
- **`rg` was shadowed** by a shell function routing to the 210 MB Claude binary; the first "rg" timings measured a command-not-found / binary launch, not native ripgrep. Installed native `rg` (Homebrew) to get a clean number.
- **`node_modules` (634 MB) I/O** dominates every unscoped-grep timing and caused aggregate benchmark timeouts; arms were run singly.
- **Grep timings are single-run**; magnitudes are robust, exact ms are not.
- **These are the agent's calls** resolving the user's intents — still the workflow, but the actor is the agent, not a human at a shell.

## 6. Outcome

The observation-first hypothesis held for this trajectory. A convergent, high-frequency pattern (291 unscoped recursive searches) decomposed cleanly into a **stateless, deterministic sub-decision** (which tool — ~98% routable) and a **context-dependent judgment** (how broad — left to the model). The deterministic part was promoted to a governed interceptor with a named escape and proven with executable tests. The measured payoff: ~250× time and ~10× context per routed call, and — the non-obvious result — **the value was architectural (scope + consolidation), not the tool.** "Use ripgrep because it's faster" would have credited the wrong cause; `git grep`, the grep already present, captures essentially all of it.

## 7. What generalizes

This is the observe → promote → govern loop in miniature: mine the audit log, isolate the deterministic sub-decision from the judgment one, draw the escape boundary, promote it to an interceptor that **stays on as a conformance check** (if `grep -r` reappears, it's caught). The read/write/audit distinction held: search is a *read*, reversible by construction, so a wrong route costs a round-trip, not damage — which is what makes it safe to automate deterministically. A *write* would have kept a confirm-then-run gate.

## 8. Limitations & next steps

- Routability (98/2) is a static classification of command shape, not proof each routed search returned an equally useful result; `git grep`'s tracked scope can miss a target that lives in an ignored/untracked file (the escape exists for exactly this, and a zero-result should trigger fallback).
- The hook currently *denies + guides* (one extra round-trip on first occurrence). A transparent-rewrite variant is possible for the simple single-command case.
- Next: generalize the method to a second trajectory (e.g. the test-refine loop, `npx vitest … | tail` → grep → re-run, seen across 10 sessions), and — the harder problem — episode/intent induction on an *unlabeled* event stream, where the segmentation the Claude logs give for free must itself be inferred.

## Artifacts

- Hook: `.claude/hooks/route-grep.py`
- Tests: `.claude/hooks/test_route_grep.py` (`python3 .claude/hooks/test_route_grep.py`)
- Wiring: `.claude/settings.local.json` (`PreToolUse`/`Bash`, gitignored)
- Analysis scripts: session scratchpad (`toolsplit.py`, `dig290.py`, `before.py`, `bench5.py`)
