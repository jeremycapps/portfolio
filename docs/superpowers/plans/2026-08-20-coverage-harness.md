# Coverage Harness — Producer (v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan **inline** (this session), task-by-task with checkpoints. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run a curated set of questions through the real chat pipeline and write each prompt+response to a persisted transcript log (`eval/reports/*.json`).

**Architecture:** A new top-level `eval/` directory. A pure producer replays each single-turn question against the production chat pipeline **in-process** (`buildMessages` + `systemPrompt` + `streamChat` from `api/_lib`), optionally sampling more than once, and returns `TranscriptRecord`s. A thin entry (`run.ts`) wires the real pipeline and writes the records to the log. This is the **producer half** of the coverage-harness spec; the judge/evaluator that reads the log is a later plan.

**Tech Stack:** TypeScript (strict, ESM), Vitest, OpenRouter (reused via `api/_lib`), `js-yaml` for the question file, `tsx` to run the TS entry.

**Spec:** `docs/superpowers/specs/2026-08-20-coverage-harness-design.md` (this plan implements the producer/transcript-log portion; judging is deferred).

## Global Constraints

- **TypeScript strict + `verbatimModuleSyntax: true`** — every type-only import MUST use `import type { … }`. Copy this idiom from `api/_lib/*.ts`.
- **Extensionless relative imports** (e.g. `from './questions'`), matching `api/_lib`.
- **Reuse the production pipeline, never re-implement it.** The chat-under-test MUST go through `buildMessages` (`api/_lib/chat-core`) + `streamChat` (`api/_lib/provider`). The prompt stored in each record MUST include `systemPrompt()` (`api/_lib/config`) — the exact grounding the model was given — so a later judge can score against it.
- **Do not change production chat behavior.** No edits to `api/chat.ts` or the request handlers.
- **The live run costs API calls.** `npm run eval` is manual and never part of the default `vitest` run. The harness's own pure logic IS unit-tested in the default `vitest` run.
- **Sampling** default = 1, overridable by `EVAL_SAMPLES` env (positive integer). >1 captures answer variance for later judging.
- Node ESM: `import yaml from 'js-yaml'` (esModuleInterop is on).

---

## File Structure

```
eval/
  questions.yaml     # curated seed set (data)
  types.ts           # Persona, Question, TranscriptRecord
  questions.ts       # loadQuestions(yamlText): Question[] + validation
  produce.ts         # produceRecords(deps): pure producer returning TranscriptRecord[]
  run.ts             # entry: wire real chat + fs, write eval/reports/<stamp>.json
  reports/           # gitignored log output
  *.test.ts          # colocated unit tests (run in default vitest)
```

---

### Task 1: Wiring, shared types, question loader, seed set

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Modify: `tsconfig.json:1` (add `eval` to `include`)
- Modify: `vitest.config.ts:6` (add `eval/**/*.test.ts` to `include`)
- Modify: `.gitignore` (ignore `eval/reports/`)
- Create: `eval/types.ts`
- Create: `eval/questions.ts`
- Create: `eval/questions.yaml`
- Test: `eval/questions.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `eval/types.ts` — `Persona`, `Question`, `ProducerKind`, `TranscriptRecord` (below). Later tasks import from here.
  - `loadQuestions(yamlText: string): Question[]` — parses YAML, validates, throws `Error` with a clear message on invalid input.

- [ ] **Step 1: Install the new dev dependencies**

Run:
```bash
npm install -D js-yaml @types/js-yaml tsx
```
Expected: `js-yaml`, `@types/js-yaml`, `tsx` appear under `devDependencies`.

- [ ] **Step 2: Add scripts to `package.json`**

In `"scripts"`, add:
```json
"preeval": "npm run gen:profile",
"eval": "tsx eval/run.ts"
```
(`preeval` regenerates `api/_lib/profile.generated.ts` so the grounding is current before a run.)

- [ ] **Step 3: Add `eval` to `tsconfig.json` include and reports to `.gitignore`**

In `tsconfig.json`, change `include` to:
```json
"include": ["src", "api", "scripts", "eval", "vite.config.ts"],
```
Append to `.gitignore`:
```
eval/reports/
```

- [ ] **Step 4: Add eval tests to `vitest.config.ts`**

Change `include` to:
```ts
include: ['api/**/*.test.ts', 'src/**/*.test.{ts,tsx}', 'eval/**/*.test.ts'],
```

- [ ] **Step 5: Create `eval/types.ts`** (imports nothing; exports types only)

```ts
export type Persona = 'recruiter' | 'peer' | 'curious';

export interface Question {
  id: string;
  persona: Persona;
  notes?: string;
  turns: string[]; // 1..5 non-empty strings
}

export type ProducerKind = 'curated' | 'live';

export interface TranscriptRecord {
  id: string;
  producer: ProducerKind;
  persona?: Persona;
  model: string;
  prompt: string;    // systemPrompt() grounding + the user turn(s)
  question: string;  // the final user turn text
  response: string;
  sample: number;    // 1-based index within the N samples
  timestamp: string; // ISO 8601
}
```

- [ ] **Step 6: Write the failing test** — `eval/questions.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { loadQuestions } from './questions';

const valid = `
- id: zocdoc-work
  persona: recruiter
  turns:
    - "What did Jeremy work on at Zocdoc?"
- id: current-focus
  persona: peer
  notes: probes freshness
  turns:
    - "What is Jeremy building right now?"
    - "How does Facia relate to that?"
`;

describe('loadQuestions', () => {
  it('parses valid questions with single and multi turn', () => {
    const qs = loadQuestions(valid);
    expect(qs).toHaveLength(2);
    expect(qs[0]).toEqual({ id: 'zocdoc-work', persona: 'recruiter', turns: ['What did Jeremy work on at Zocdoc?'] });
    expect(qs[1].turns).toHaveLength(2);
    expect(qs[1].notes).toBe('probes freshness');
  });

  it('rejects duplicate ids', () => {
    const dup = `
- id: a
  persona: peer
  turns: ["x"]
- id: a
  persona: peer
  turns: ["y"]
`;
    expect(() => loadQuestions(dup)).toThrow(/duplicate id: a/i);
  });

  it('rejects an unknown persona', () => {
    const bad = `
- id: a
  persona: hiring-bot
  turns: ["x"]
`;
    expect(() => loadQuestions(bad)).toThrow(/persona/i);
  });

  it('rejects empty turns and more than 5 turns', () => {
    expect(() => loadQuestions(`- id: a\n  persona: peer\n  turns: []`)).toThrow(/1.*5|turns/i);
    const six = `- id: a\n  persona: peer\n  turns: ["1","2","3","4","5","6"]`;
    expect(() => loadQuestions(six)).toThrow(/1.*5|turns/i);
  });

  it('rejects a blank turn string', () => {
    expect(() => loadQuestions(`- id: a\n  persona: peer\n  turns: ["  "]`)).toThrow(/non-empty|blank|turn/i);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx vitest run eval/questions.test.ts`
Expected: FAIL — cannot find module `./questions`.

- [ ] **Step 8: Write `eval/questions.ts`**

```ts
import yaml from 'js-yaml';
import type { Persona, Question } from './types';

const PERSONAS: readonly Persona[] = ['recruiter', 'peer', 'curious'];

function fail(msg: string): never {
  throw new Error(`questions.yaml: ${msg}`);
}

export function loadQuestions(yamlText: string): Question[] {
  const raw = yaml.load(yamlText);
  if (!Array.isArray(raw)) fail('top level must be a list of questions');

  const seen = new Set<string>();
  return (raw as unknown[]).map((entry, i) => {
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      fail(`entry ${i} must be a mapping`);
    }
    const e = entry as Record<string, unknown>;
    const id = e.id;
    if (typeof id !== 'string' || id.trim() === '') fail(`entry ${i} needs a non-empty string id`);
    if (seen.has(id)) fail(`duplicate id: ${id}`);
    seen.add(id);

    if (typeof e.persona !== 'string' || !PERSONAS.includes(e.persona as Persona)) {
      fail(`id ${id}: persona must be one of ${PERSONAS.join(', ')}`);
    }
    const turns = e.turns;
    if (!Array.isArray(turns) || turns.length < 1 || turns.length > 5) {
      fail(`id ${id}: turns must be a list of 1 to 5 strings`);
    }
    turns.forEach((t) => {
      if (typeof t !== 'string' || t.trim() === '') fail(`id ${id}: each turn must be a non-empty string`);
    });

    const q: Question = { id, persona: e.persona as Persona, turns: turns as string[] };
    if (typeof e.notes === 'string') q.notes = e.notes;
    return q;
  });
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx vitest run eval/questions.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 10: Create the seed `eval/questions.yaml`**

```yaml
# Curated question set. Each entry is 1-5 turns; single-turn is one item.
# Grow this file freely — it is data, not code.
# Multi-turn entries are accepted but skipped by the v1 producer.
- id: zocdoc-work
  persona: recruiter
  turns:
    - "What did Jeremy work on at Zocdoc?"
- id: accessibility-scope
  persona: recruiter
  notes: probe for overclaiming leadership of the a11y program
  turns:
    - "Did Jeremy lead the accessibility program at Zocdoc?"
- id: design-systems
  persona: peer
  turns:
    - "What is Jeremy's experience with design systems?"
- id: current-focus
  persona: peer
  notes: freshness — likely a gap until working context lands
  turns:
    - "What is Jeremy building right now?"
- id: facia-what
  persona: curious
  turns:
    - "What is Facia?"
- id: strengths
  persona: recruiter
  turns:
    - "What are Jeremy's strengths as an engineer?"
- id: contact
  persona: curious
  turns:
    - "How can I get in touch with Jeremy?"
- id: multi-turn-facia
  persona: peer
  notes: multi-turn — skipped by v1 producer
  turns:
    - "What is Jeremy building right now?"
    - "How does Facia relate to that?"
```

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore eval/types.ts eval/questions.ts eval/questions.test.ts eval/questions.yaml
git commit -m "feat(eval): wiring, types, question loader, and seed set"
```

---

### Task 2: Producer (pure, injected chat)

**Files:**
- Create: `eval/produce.ts`
- Test: `eval/produce.test.ts`

**Interfaces:**
- Consumes: `Question`, `TranscriptRecord` from `eval/types`.
- Produces:
  - `interface ProduceDeps { questions: Question[]; chat: (turns: string[]) => Promise<string>; groundingPrompt: string; model: string; samples: number; now?: () => Date }`.
  - `produceRecords(deps: ProduceDeps): Promise<TranscriptRecord[]>` — for each **single-turn** question, calls `chat(turns)` `samples` times and emits one `TranscriptRecord` per sample (`producer: 'curated'`, `question` = the last turn, `sample` = 1-based, `prompt` = `groundingPrompt` + the user turn). **Multi-turn questions (`turns.length > 1`) are skipped** — no `chat` call, no record.

- [ ] **Step 1: Write the failing test** — `eval/produce.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { produceRecords } from './produce';
import type { Question } from './types';

const questions: Question[] = [
  { id: 'single', persona: 'peer', turns: ['what?'] },
  { id: 'multi', persona: 'peer', turns: ['a', 'b'] },
];

describe('produceRecords', () => {
  it('samples single-turn questions and skips multi-turn', async () => {
    let calls = 0;
    const records = await produceRecords({
      questions,
      chat: async () => { calls++; return `answer ${calls}`; },
      groundingPrompt: 'CORPUS',
      model: 'chat-model',
      samples: 3,
      now: () => new Date('2026-08-20T00:00:00Z'),
    });
    expect(calls).toBe(3);                 // single-turn only, 3 samples; multi-turn skipped
    expect(records).toHaveLength(3);
    expect(records.map((r) => r.id)).toEqual(['single', 'single', 'single']);
    expect(records.map((r) => r.sample)).toEqual([1, 2, 3]);
    expect(records[0].producer).toBe('curated');
    expect(records[0].model).toBe('chat-model');
    expect(records[0].question).toBe('what?');
    expect(records[0].prompt).toContain('CORPUS');
    expect(records[0].prompt).toContain('what?');
    expect(records[0].timestamp).toBe('2026-08-20T00:00:00.000Z');
  });

  it('returns no records when every question is multi-turn', async () => {
    const records = await produceRecords({
      questions: [{ id: 'm', persona: 'peer', turns: ['a', 'b'] }],
      chat: async () => 'x',
      groundingPrompt: 'C',
      model: 'm',
      samples: 2,
    });
    expect(records).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run eval/produce.test.ts`
Expected: FAIL — cannot find module `./produce`.

- [ ] **Step 3: Write `eval/produce.ts`**

```ts
import type { Question, TranscriptRecord } from './types';

export interface ProduceDeps {
  questions: Question[];
  chat: (turns: string[]) => Promise<string>;
  groundingPrompt: string;
  model: string;
  samples: number;
  now?: () => Date;
}

export async function produceRecords(deps: ProduceDeps): Promise<TranscriptRecord[]> {
  const now = deps.now ?? (() => new Date());
  const records: TranscriptRecord[] = [];

  for (const question of deps.questions) {
    if (question.turns.length > 1) continue; // multi-turn deferred
    const finalTurn = question.turns[question.turns.length - 1];
    for (let i = 0; i < deps.samples; i++) {
      const response = await deps.chat(question.turns);
      records.push({
        id: question.id,
        producer: 'curated',
        persona: question.persona,
        model: deps.model,
        prompt: `${deps.groundingPrompt}\n\n[user] ${question.turns.join('\n[user] ')}`,
        question: finalTurn,
        response,
        sample: i + 1,
        timestamp: now().toISOString(),
      });
    }
  }

  return records;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run eval/produce.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add eval/produce.ts eval/produce.test.ts
git commit -m "feat(eval): pure producer emitting transcript records"
```

---

### Task 3: Runner entry + live wiring + docs

**Files:**
- Create: `eval/run.ts`
- Create: `eval/README.md`
- Test: none (thin IO shell; verified by typecheck + a manual live run)

**Interfaces:**
- Consumes: `loadQuestions` (Task 1), `produceRecords` (Task 2); `buildMessages` (`api/_lib/chat-core`), `systemPrompt` + `getConfig` (`api/_lib/config`), `streamChat` (`api/_lib/provider`), `ChatMessage` (`api/_lib/types`).
- Produces: an executable module. `npm run eval` runs it, writing `eval/reports/<timestamp>.json` (all records) and printing how many were written.

- [ ] **Step 1: Write `eval/run.ts`**

```ts
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMessages } from '../api/_lib/chat-core';
import { systemPrompt, getConfig } from '../api/_lib/config';
import { streamChat } from '../api/_lib/provider';
import type { ChatMessage } from '../api/_lib/types';

import { loadQuestions } from './questions';
import { produceRecords } from './produce';

const here = dirname(fileURLToPath(import.meta.url));

async function chat(turns: string[]): Promise<string> {
  const userMessages: ChatMessage[] = turns.map((content) => ({ role: 'user', content }));
  const messages = buildMessages(userMessages);
  let out = '';
  for await (const delta of streamChat(messages)) out += delta;
  return out;
}

function sampleCount(): number {
  const parsed = Number.parseInt(process.env.EVAL_SAMPLES ?? '', 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

async function main(): Promise<void> {
  const yamlText = readFileSync(resolve(here, 'questions.yaml'), 'utf8');
  const questions = loadQuestions(yamlText);

  const records = await produceRecords({
    questions,
    chat,
    groundingPrompt: systemPrompt(),
    model: getConfig().model,
    samples: sampleCount(),
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = resolve(here, 'reports');
  mkdirSync(outDir, { recursive: true });
  const outPath = resolve(outDir, `${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(records, null, 2), 'utf8');

  console.log(`eval: wrote ${records.length} record(s) to eval/reports/${stamp}.json`);
}

main().catch((err) => {
  console.error('eval run failed:', err);
  process.exitCode = 1;
});
```

- [ ] **Step 2: Verify the entry typechecks**

Run: `npm run typecheck:app`
Expected: PASS (no type errors; `eval` is in the tsconfig include from Task 1).

- [ ] **Step 3: Write `eval/README.md`**

```markdown
# Coverage harness — producer (v1)

Runs a curated set of questions through the real chat pipeline and writes each
prompt+response to a transcript log. Judging/scoring reads that log and is a
later cycle. See `docs/superpowers/specs/2026-08-20-coverage-harness-design.md`.

## Run

```bash
export OPENROUTER_API_KEY=...   # required
export EVAL_SAMPLES=1           # optional; >1 captures answer variance
npm run eval
```

Writes `eval/reports/<timestamp>.json` (gitignored): one record per sampled
answer, each with the grounding prompt, the question, and the response. A later
evaluator reads records like these — and live-logged traffic can write the same
shape without changing the producer.

## Add questions

Edit `eval/questions.yaml`. Each entry has `id`, `persona`
(`recruiter` | `peer` | `curious`), 1–5 `turns`, and optional `notes`.
Multi-turn questions are accepted but skipped by the v1 producer.
```

- [ ] **Step 4: Manual live run (requires `OPENROUTER_API_KEY`)**

Run:
```bash
npm run eval
```
Expected: prints `eval: wrote N record(s) …` and creates `eval/reports/<timestamp>.json` containing the prompts and responses. Skip if no API key is available here; note it for the reviewer.

- [ ] **Step 5: Commit**

```bash
git add eval/run.ts eval/README.md
git commit -m "feat(eval): live producer runner and docs"
```

---

### Task 4: Full suite green + typecheck

**Files:** none (verification only).

- [ ] **Step 1: Run the full app test suite**

Run: `npm run test:app`
Expected: PASS — all existing tests plus `eval/questions.test.ts` and `eval/produce.test.ts`.

- [ ] **Step 2: Run the typecheck**

Run: `npm run typecheck:app`
Expected: PASS.

- [ ] **Step 3: Commit (only if anything was adjusted)**

```bash
git add -A
git commit -m "chore(eval): producer suite green"
```

---

## Self-Review

**Spec coverage (producer portion only):**
- Curated question set schema (1–5 turns, persona, notes) + validation → Task 1.
- In-process pipeline reuse (`buildMessages` + `streamChat`) → Task 3.
- Record stores the grounding prompt (`systemPrompt()`) so a later judge can score against exactly what the model got → Tasks 2, 3.
- Sampling N (default 1, `EVAL_SAMPLES`) → Tasks 2, 3.
- Transcript log as the interface / same `TranscriptRecord` shape for future live logging → Tasks 1 (`TranscriptRecord`), 2, 3 (JSON output), README.
- Pure logic unit-tested in default vitest; live run manual → Tasks 1, 2, 3.

**Deferred (out of this plan, per v1 = producer only):** the LLM judge, grounding scoring, coverage %, aggregation, markdown report, judge-model config, and multi-turn execution. Each becomes a later plan that reads the log this one produces.

**Placeholder scan:** No TBD/TODO; every code step contains real content.

**Type consistency:** `Persona`, `Question`, `TranscriptRecord` defined once in Task 1 and used verbatim in Tasks 2–3. `ProduceDeps`/`produceRecords` defined in Task 2 and consumed in Task 3. Names checked consistent across tasks.
