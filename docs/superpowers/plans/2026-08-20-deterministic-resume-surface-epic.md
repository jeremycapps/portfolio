# Epic: Deterministic Resume Surface — Firewalled Execution

**For a Codex orchestrator.** This epic dispatches worker subagents to build the
deterministic on-page resume surface. It is a **context firewall**: workers
inherit *contracts and addresses*, not payloads. Never paste this whole file, the
spec, or the detailed plan into a worker — hand each worker only its `TASK_PACKET`
(inline below) and let it read its own line-range slice of the detailed plan.

- **Detailed plan (the payload workers slice):** `docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md`
- **Spec (context, not for workers):** `docs/superpowers/specs/2026-08-20-deterministic-resume-surface-design.md`

---

## Orchestration protocol

1. Read the `GLOBAL_MANIFEST` (below). Hold it at the root. Give workers the
   *path to this file* plus their one `TASK_PACKET` — not the manifest's prose.
2. Dispatch tasks by **wave** (see DAG). Tasks in the same wave touch disjoint
   files and have no ordering dependency — spawn them **in parallel**. Do not
   start a wave until every task in the prior wave reports `status: done`.
3. Each `TASK_PACKET` carries two `SUBTASK_PACKET`s — an **implementor** and a
   **validator**. Spawn the implementor first; on its `done`, spawn the validator.
   The validator receives acceptance criteria only — never the implementor's
   report, the code, or the `steps_ref`.
4. **Firewall:** a worker's prompt = its `TASK_PACKET` (or one `SUBTASK_PACKET`) +
   the path to the detailed plan. Nothing else. The worker reads its own slice.
5. **Repair cap:** if a validator returns `fail`, re-dispatch the implementor once
   with the validator's findings (max **2 repair rounds** per task). Still failing
   → emit `status: blocked` with the reason and stop that lane.
6. **Verify refs before dispatch:** confirm each `steps_ref` line range resolves in
   the detailed plan (it was written against the committed version; do not reflow
   the file). A broken ref blocks the task — a firewalled worker has no fallback.

---

## Dependency DAG & wave schedule

```
        ┌──────────────── SERVER LANE ────────────────┐      ┌──── CLIENT LANE ────┐
T1 corpus ─► T2 rank ─► T3 select ─► T4 summary ─► T5 assemble ─► T6 api ─┐
                                                                          ├─► T9 wiring
T7 client ─────────────────────────────────────────► T8 surface ─────────┘
```

| Wave | Tasks (parallel) | Depends on |
|------|------------------|------------|
| 1 | **T1** ‖ **T7** | — |
| 2 | **T2** ‖ **T8** | T2←T1 · T8←T7 |
| 3 | **T3** | T2 |
| 4 | **T4** | T3 (same file as T3; sequential) |
| 5 | **T5** | T4 |
| 6 | **T6** | T5, T1 |
| 7 | **T9** | T6, T8 |

Why not more parallel: T2–T5 all edit `api/_lib/resume-source.ts` and form a data
chain (rank → select → summary → assemble), so they are sequential. The genuine
parallelism is the two lanes in waves 1–2. T9 integrates both lanes.

---

## GLOBAL_MANIFEST

```yaml
GLOBAL_MANIFEST:
  repo_root: /Users/jeremycapps/Dev/portfolio
  detailed_plan: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md

  toolchain:
    node: use repo default
    test_one: "npx vitest run <path>"        # single file
    test_all: "npm test"                      # full suite (test:app + test:facia)
    typecheck: "npx tsc --noEmit"
    build: "npx vite build"

  invariants:                                 # every task inherits these
    - "Resume BODY text is source-verbatim: bullet/skill/education/project text is emitted exactly as stored in the corpus, never mutated. Only the summary paragraph may be model-authored."
    - "The model returns bullet IDs only for selection and ONE paragraph for the summary — never rewritten bullet text."
    - "Every model operation degrades to a deterministic fallback on missing key, network error, empty output, or parse failure. A resume always renders."
    - "jobDescription max length: 20000 chars. Request size cap: 20000 bytes."
    - "Follow existing patterns: response envelopes mirror api/_lib/answer-core.ts; client wrappers mirror src/lib/answer.ts; Vercel handlers mirror api/answer.ts; generated data modules mirror api/_lib/profile.generated.ts."
    - "Component tests render with renderToStaticMarkup from react-dom/server and assert on substrings. @testing-library/react is NOT available."
    - "checkRateLimit(request, opts={}, scope='chat') — pass scope 'resume'."

  shared_contract:                            # keeps parallel lanes from drifting
    response_envelope: "{ protocol: 'portfolio.resume/1', view: ResumeView, provenance: ResumeProvenance }"
    ResumeView: "{ header: { name: string; contacts: string[] }; summary: { text: string; engine: 'model'|'deterministic' }; experience: Array<{ organization: string; roleContext: string[]; timePeriod: string; bullets: string[]; sourceRefs: string[] }>; skills: Array<{ group: string; items: string[] }>; education: Array<{ degree: string }>; projects: Array<{ id: string; name: string; text: string; sourceRefs: string[] }> }"
    ResumeProvenance: "{ deterministicPct: number; modelPct: number; operations: Array<{ kind: string; engine: 'deterministic'|'model'; detail: string }> }"
    note: "Server types live in api/_lib/resume-source.ts (T2-T5); client re-declares the SAME shapes verbatim in src/lib/resume.ts (T7), matching the existing answer.ts duplication pattern. If a worker's types diverge from this block, it is wrong."

  corpus_source: "../claude-job-application/corus-data-v2/  (sibling repo, read-only, used by the T1 converter only)"

  forbidden_paths:                            # never modified by any task
    - eval/
    - packages/facia-core/
    - api/chat.ts
    - api/answer.ts
    - api/_lib/answer-core.ts
    - api/_lib/chat-core.ts
    - "../claude-job-application/**  (READ-only via converter; never write)"
    - "any file not in a task's allowed_files"

  git_policy:
    branch: "current branch (main) — matches existing repo workflow"
    commits: "one commit per task, using the exact message in that task's final plan step"
    no_force: true

  repair_policy:
    max_rounds: 2
    on_exhausted: "emit status: blocked with reason; stop the lane"

  escalation:
    - "T1: sibling repo ../claude-job-application/corus-data-v2/engagements.yaml absent or unreadable → BLOCK the epic (nothing downstream can proceed)."
    - "Any worker whose types would diverge from shared_contract → BLOCK, do not guess."
    - "A steps_ref line range that does not resolve → BLOCK that task."

  child_roles:
    implementor:
      gets: [ "this TASK_PACKET", "path to detailed_plan" ]
      never_gets: [ "spec", "sibling tasks", "this epic in full", "orchestrator reasoning" ]
      does: "Read the steps_ref slice. Execute its checkbox steps in order (TDD: write failing test, confirm red, implement, confirm green, commit). Obey invariants + allowed_files + forbidden_paths."
      reports: "output_schema below."
    validator:
      gets: [ "acceptance block of this TASK_PACKET", "path to repo" ]
      never_gets: [ "steps_ref", "the implementation code", "the implementor's report", "the detailed plan slice" ]
      does: "Run the acceptance commands against the working tree. Assert changed files ⊆ allowed_files and none under forbidden_paths (via `git show --stat HEAD` / `git diff`). Report pass|fail with evidence."
      reports: "{ verdict: pass|fail, evidence: <command output summary>, offending_files?: [...] }"

  output_schema:                              # implementor report
    status: "done | blocked"
    files_changed: [ "path", "..." ]
    commit: "<sha or 'none'>"
    tests_run: "<command>"
    tests_result: "pass | fail"
    notes: "<short>"
    blocked_reason: "<present only when status=blocked>"
```

---

## TASK_PACKETS

Each packet's `steps_ref` addresses a contiguous slice of the detailed plan. The
implementor reads that slice and executes it. `allowed_files` is the whole write
scope; anything else is forbidden.

```yaml
# ================= WAVE 1 =================

TASK_PACKET T1:
  title: "Resume corpus — converter, baked snapshot, loader, shape guard"
  wave: 1
  depends_on: []
  steps_ref: { file: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md, lines: 27-195 }
  objective: "Produce a loadable, shape-valid baked corpus snapshot from the sibling Corus v2 repo, plus its typed loader and a shape-guard test."
  allowed_files:
    - scripts/build-resume-corpus.mjs
    - api/_lib/resume-corpus.ts
    - api/_lib/resume-corpus.generated.ts
    - api/_lib/resume-corpus.test.ts
    - package.json
    - package-lock.json
  forbidden_paths: [ "see GLOBAL_MANIFEST.forbidden_paths" ]
  constraints:
    - "Converter reads ../claude-job-application/corus-data-v2/engagements.yaml. If absent → status: blocked (escalation)."
    - "May run `npm i -D yaml` if the yaml package is missing."
    - "Bullet ids must be unique and stable (`<engagementId>.b<n>`)."
  acceptance:                                 # validator-visible only
    - "Run: npx vitest run api/_lib/resume-corpus.test.ts  → PASS"
    - "File api/_lib/resume-corpus.generated.ts exists and exports RESUME_CORPUS with >0 engagements."
    - "git show --stat HEAD: changed files ⊆ allowed_files; none under forbidden_paths."
  implementor: { role: implementor, packet: T1 }
  validator:   { role: validator, packet: T1, criteria_from: acceptance }

TASK_PACKET T7:
  title: "Client wrapper for /api/resume"
  wave: 1
  depends_on: []
  steps_ref: { file: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md, lines: 1009-1144 }
  objective: "Create the client fetch wrapper and re-declare the response types verbatim from GLOBAL_MANIFEST.shared_contract."
  allowed_files:
    - src/lib/resume.ts
    - src/lib/resume.test.ts
  forbidden_paths: [ "see GLOBAL_MANIFEST.forbidden_paths" ]
  constraints:
    - "ResumeView / ResumeProvenance / ResumeResponse shapes MUST match GLOBAL_MANIFEST.shared_contract exactly."
    - "Mirror src/lib/answer.ts structure (ResumeApiError with code+status)."
  acceptance:
    - "Run: npx vitest run src/lib/resume.test.ts  → PASS"
    - "git show --stat HEAD: changed files ⊆ allowed_files."
  implementor: { role: implementor, packet: T7 }
  validator:   { role: validator, packet: T7, criteria_from: acceptance }

# ================= WAVE 2 =================

TASK_PACKET T2:
  title: "Deterministic pre-rank"
  wave: 2
  depends_on: [ T1 ]
  steps_ref: { file: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md, lines: 196-318 }
  objective: "Create api/_lib/resume-source.ts with tokenize() + prerank() scoring bullets by theme/role_fit/keyword overlap."
  allowed_files:
    - api/_lib/resume-source.ts
    - api/_lib/resume-source.test.ts
  forbidden_paths: [ "see GLOBAL_MANIFEST.forbidden_paths" ]
  constraints:
    - "prerank returns every bullet exactly once, sorted by score desc (stable)."
    - "Imports ResumeCorpus type from ./resume-corpus (produced by T1)."
  acceptance:
    - "Run: npx vitest run api/_lib/resume-source.test.ts  → PASS"
    - "git show --stat HEAD: changed files ⊆ allowed_files."
  implementor: { role: implementor, packet: T2 }
  validator:   { role: validator, packet: T2, criteria_from: acceptance }

TASK_PACKET T8:
  title: "ResumeSurface component + provenance badge + styles"
  wave: 2
  depends_on: [ T7 ]
  steps_ref: { file: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md, lines: 1145-1351 }
  objective: "Build the ResumeSurface renderer (header, summary with model-authored marker, experience/skills/education/projects) + expandable provenance badge + CSS."
  allowed_files:
    - src/components/facia/resume-surface.tsx
    - src/components/facia/resume-surface.test.tsx
    - src/index.css
  forbidden_paths: [ "see GLOBAL_MANIFEST.forbidden_paths" ]
  constraints:
    - "Consumes ResumeView + ResumeProvenance from @/lib/resume (produced by T7)."
    - "Test uses renderToStaticMarkup + substring assertions (no @testing-library/react)."
  acceptance:
    - "Run: npx vitest run src/components/facia/resume-surface.test.tsx  → PASS"
    - "git show --stat HEAD: changed files ⊆ allowed_files."
  implementor: { role: implementor, packet: T8 }
  validator:   { role: validator, packet: T8, criteria_from: acceptance }

# ================= WAVE 3 =================

TASK_PACKET T3:
  title: "collectChat helper + model op A (selection)"
  wave: 3
  depends_on: [ T2 ]
  steps_ref: { file: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md, lines: 319-483 }
  objective: "Add collectChat to provider.ts; add parseIdList + selectBullets (ids-only selection, deterministic fallback) to resume-source.ts."
  allowed_files:
    - api/_lib/provider.ts
    - api/_lib/resume-source.ts
    - api/_lib/resume-source.test.ts
  forbidden_paths: [ "see GLOBAL_MANIFEST.forbidden_paths" ]
  constraints:
    - "selectBullets filters to known corpus ids, dedupes, engine='model'; empty/garbage/throw/no-key → deterministic pre-rank order, engine='deterministic'."
  acceptance:
    - "Run: npx vitest run api/_lib/resume-source.test.ts  → PASS"
    - "git show --stat HEAD: changed files ⊆ allowed_files."
  implementor: { role: implementor, packet: T3 }
  validator:   { role: validator, packet: T3, criteria_from: acceptance }

# ================= WAVE 4 =================

TASK_PACKET T4:
  title: "Model op B (summary)"
  wave: 4
  depends_on: [ T3 ]
  steps_ref: { file: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md, lines: 484-588 }
  objective: "Add summarize() to resume-source.ts: one tailored paragraph via model, deterministic source-assembled fallback."
  allowed_files:
    - api/_lib/resume-source.ts
    - api/_lib/resume-source.test.ts
  forbidden_paths: [ "see GLOBAL_MANIFEST.forbidden_paths" ]
  constraints:
    - "engine='model' only when model returns non-empty text; else engine='deterministic'."
  acceptance:
    - "Run: npx vitest run api/_lib/resume-source.test.ts  → PASS"
    - "git show --stat HEAD: changed files ⊆ allowed_files."
  implementor: { role: implementor, packet: T4 }
  validator:   { role: validator, packet: T4, criteria_from: acceptance }

# ================= WAVE 5 =================

TASK_PACKET T5:
  title: "Assemble the view + provenance metric"
  wave: 5
  depends_on: [ T4 ]
  steps_ref: { file: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md, lines: 589-801 }
  objective: "Add buildExperience + computeProvenance + assembleResume to resume-source.ts, producing ResumeView + ResumeProvenance."
  allowed_files:
    - api/_lib/resume-source.ts
    - api/_lib/resume-source.test.ts
  forbidden_paths: [ "see GLOBAL_MANIFEST.forbidden_paths" ]
  constraints:
    - "VERBATIM GUARANTEE: every rendered bullet text === a corpus bullet text (asserted by test)."
    - "deterministicPct + modelPct === 100; no-model path === 100 deterministic; summary is the only model-authored text."
    - "Produced ResumeView/ResumeProvenance shapes MUST match GLOBAL_MANIFEST.shared_contract."
  acceptance:
    - "Run: npx vitest run api/_lib/resume-source.test.ts  → PASS"
    - "git show --stat HEAD: changed files ⊆ allowed_files."
  implementor: { role: implementor, packet: T5 }
  validator:   { role: validator, packet: T5, criteria_from: acceptance }

# ================= WAVE 6 =================

TASK_PACKET T6:
  title: "API endpoint (resume-core + Vercel handler)"
  wave: 6
  depends_on: [ T5, T1 ]
  steps_ref: { file: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md, lines: 802-1008 }
  objective: "Create api/_lib/resume-core.ts (validate, rate-limit scope 'resume', size/JSON checks, assemble, envelope) and api/resume.ts (Vercel adapter)."
  allowed_files:
    - api/_lib/resume-core.ts
    - api/resume.ts
    - api/_lib/resume-core.test.ts
  forbidden_paths: [ "see GLOBAL_MANIFEST.forbidden_paths" ]
  constraints:
    - "Response 200 body === GLOBAL_MANIFEST.shared_contract.response_envelope."
    - "Error codes mirror answer-core: METHOD_NOT_ALLOWED, RATE_LIMITED, REQUEST_TOO_LARGE, INVALID_JSON, INVALID_REQUEST, plus RESUME_ASSEMBLY_FAILED (500)."
  acceptance:
    - "Run: npx vitest run api/_lib/resume-core.test.ts  → PASS"
    - "git show --stat HEAD: changed files ⊆ allowed_files."
  implementor: { role: implementor, packet: T6 }
  validator:   { role: validator, packet: T6, criteria_from: acceptance }

# ================= WAVE 7 =================

TASK_PACKET T9:
  title: "Frontend resume-mode wiring"
  wave: 7
  depends_on: [ T6, T8 ]
  steps_ref: { file: docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md, lines: 1352-1499 }
  objective: "Wire the 'Generate a resume' chip to arm resume mode, route the next composer submit to /api/resume, and render ResumeSurface with the badge."
  allowed_files:
    - src/App.tsx
    - src/components/prompt-starters.tsx
  forbidden_paths: [ "see GLOBAL_MANIFEST.forbidden_paths" ]
  constraints:
    - "Remove the now-unused RESUME_KICKOFF constant; add onArmResume prop to PromptStarters."
    - "New chat / reset clears resumeResult and resumeMode."
  acceptance:
    - "Run: npx tsc --noEmit  → no errors"
    - "Run: npm test  → all suites PASS"
    - "Run: npx vite build  → succeeds"
    - "git show --stat HEAD: changed files ⊆ allowed_files."
  implementor: { role: implementor, packet: T9 }
  validator:   { role: validator, packet: T9, criteria_from: acceptance }
```

---

## Final gate (root, after T9)

After the T9 validator passes, the root runs a whole-epic check and reports up:

```
npm test && npx tsc --noEmit && npx vite build
```

Then a manual smoke (optional, human): "Generate a resume" → paste a job
description → `ResumeSurface` renders with the provenance badge; with no
`OPENROUTER_API_KEY` the badge reads 100% deterministic; spot-check a rendered
bullet against `api/_lib/resume-corpus.generated.ts` (must match verbatim).
```
