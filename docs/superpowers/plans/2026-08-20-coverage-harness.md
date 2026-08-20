# Coverage Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an on-demand harness that fires a curated set of questions at the real chat pipeline, judges each answer for grounding, and reports grounded-coverage % plus per-question gap categories.

**Architecture:** A new top-level `eval/` directory. The runner exercises the production chat pipeline **in-process** (imports `buildMessages` + `systemPrompt` + `streamChat` from `api/_lib`), samples each question N times, and writes `(prompt, response)` records to a transcript log under `eval/reports/`. An LLM judge (a stronger, separately-configured model) grades each record against the grounding corpus the model was given. Pure logic (loading, parsing, aggregation, formatting, orchestration) is unit-tested with injected mocks; the live end-to-end run is manual via `npm run eval`.

**Tech Stack:** TypeScript (strict, ESM), Vitest, OpenRouter (reused via existing `api/_lib`), `js-yaml` for the question file, `tsx` to run the TS entry.

**Spec:** `docs/superpowers/specs/2026-08-20-coverage-harness-design.md`

## Global Constraints

- **TypeScript strict + `verbatimModuleSyntax: true`** — every type-only import MUST use `import type { … }`. Copy this idiom from `api/_lib/*.ts`.
- **Extensionless relative imports** (e.g. `from './config'`), matching the existing `api/_lib` code — do not add `.ts` extensions.
- **Reuse the production pipeline, never re-implement it.** The chat-under-test MUST go through `buildMessages` (`api/_lib/chat-core`) + `streamChat` (`api/_lib/provider`) so the harness tests the exact production prompt. The grounding corpus passed to the judge MUST be `systemPrompt()` (`api/_lib/config`).
- **Do not change production chat behavior.** No edits to `api/chat.ts` or the request handlers in this plan.
- **Judge model is separate from the model under test.** Chat-under-test uses `CHAT_MODEL` (existing). Judge uses `EVAL_JUDGE_MODEL` (new). Never share them.
- **The live run costs API calls.** `npm run eval` is manual and never part of the default `vitest` run. The harness's own pure logic IS unit-tested in the default `vitest` run.
- **Sampling default = 3**, overridable by `EVAL_SAMPLES` env and `--samples` flag.
- Node ESM: `import yaml from 'js-yaml'` (esModuleInterop is on).

---

## File Structure

```
eval/
  questions.yaml     # curated seed set (data)
  types.ts           # shared types: Question, TranscriptRecord, JudgeVerdict, JudgedRecord, QuestionResult, RunReport
  config.ts          # evalConfig(): judgeModel + samples from env
  questions.ts       # loadQuestions(yamlText): Question[] + validation
  complete.ts        # complete(messages, opts): non-streaming OpenRouter completion (judge calls)
  judge.ts           # parseJudgeVerdict, buildJudgePrompt, judgeAnswer
  aggregate.ts       # aggregateQuestion, buildReport (coverage math, category counts)
  report.ts          # formatMarkdown, formatConsole
  orchestrate.ts     # runEval(deps): pure orchestration returning { report, records }
  run.ts             # entry: wires real chat/judge/fs, writes eval/reports/*.{json,md}
  reports/           # gitignored output
  *.test.ts          # colocated unit tests (run in default vitest)
```

Shared types live in `eval/types.ts` and are consumed by every module below. They are reproduced in Task 2 and referenced verbatim thereafter.

---

### Task 1: Project wiring, shared types, eval config

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Modify: `tsconfig.json:1` (add `eval` to `include`)
- Modify: `vitest.config.ts:6` (add `eval/**/*.test.ts` to `include`)
- Modify: `.gitignore` (ignore `eval/reports/`)
- Create: `eval/config.ts`
- Test: `eval/config.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `interface EvalConfig { judgeModel: string; samples: number }` and `evalConfig(env?: Record<string, string | undefined>): EvalConfig`. Defaults: `judgeModel = 'anthropic/claude-3.5-sonnet'`, `samples = 3`. Env overrides: `EVAL_JUDGE_MODEL`, `EVAL_SAMPLES` (parsed as a positive integer; falls back to 3 if unset or non-positive).

- [ ] **Step 1: Install the two new dev dependencies**

Run:
```bash
npm install -D js-yaml @types/js-yaml tsx
```
Expected: `js-yaml`, `@types/js-yaml`, `tsx` appear under `devDependencies` in `package.json`.

- [ ] **Step 2: Add scripts to `package.json`**

In the `"scripts"` block, add:
```json
"preeval": "npm run gen:profile",
"eval": "tsx eval/run.ts"
```
(`preeval` regenerates `api/_lib/profile.generated.ts` so the grounding corpus is current before a run.)

- [ ] **Step 3: Add `eval` to `tsconfig.json` include and reports to `.gitignore`**

In `tsconfig.json`, change the `include` array to:
```json
"include": ["src", "api", "scripts", "eval", "vite.config.ts"],
```
Append to `.gitignore`:
```
eval/reports/
```

- [ ] **Step 4: Add eval tests to `vitest.config.ts`**

Change the `include` array to:
```ts
include: ['api/**/*.test.ts', 'src/**/*.test.{ts,tsx}', 'eval/**/*.test.ts'],
```

- [ ] **Step 5: Write the failing test** — `eval/config.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { evalConfig } from './config';

describe('evalConfig', () => {
  it('defaults judgeModel and samples when env is empty', () => {
    const cfg = evalConfig({});
    expect(cfg.judgeModel).toBe('anthropic/claude-3.5-sonnet');
    expect(cfg.samples).toBe(3);
  });

  it('reads overrides from env', () => {
    const cfg = evalConfig({ EVAL_JUDGE_MODEL: 'openai/gpt-4o', EVAL_SAMPLES: '5' });
    expect(cfg.judgeModel).toBe('openai/gpt-4o');
    expect(cfg.samples).toBe(5);
  });

  it('falls back to 3 samples on non-positive or garbage values', () => {
    expect(evalConfig({ EVAL_SAMPLES: '0' }).samples).toBe(3);
    expect(evalConfig({ EVAL_SAMPLES: 'abc' }).samples).toBe(3);
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run eval/config.test.ts`
Expected: FAIL — cannot find module `./config`.

- [ ] **Step 7: Write `eval/config.ts`**

```ts
export interface EvalConfig {
  judgeModel: string;
  samples: number;
}

export function evalConfig(env: Record<string, string | undefined> = process.env): EvalConfig {
  const parsed = Number.parseInt(env.EVAL_SAMPLES ?? '', 10);
  const samples = Number.isInteger(parsed) && parsed > 0 ? parsed : 3;
  return {
    judgeModel: env.EVAL_JUDGE_MODEL ?? 'anthropic/claude-3.5-sonnet',
    samples,
  };
}
```

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run eval/config.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json vitest.config.ts .gitignore eval/config.ts eval/config.test.ts
git commit -m "feat(eval): scaffold coverage-harness wiring and config"
```

---

### Task 2: Shared types + question loader + seed questions

**Files:**
- Create: `eval/types.ts`
- Create: `eval/questions.ts`
- Create: `eval/questions.yaml`
- Test: `eval/questions.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `eval/types.ts` — all shared types (below). Every later task imports from here.
  - `loadQuestions(yamlText: string): Question[]` — parses YAML, validates, throws `Error` with a clear message on invalid input.

- [ ] **Step 1: Create `eval/types.ts`** (no test of its own — exercised by later tasks). This file imports nothing; it only exports types.

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
  prompt: string;    // assembled system prompt + user turn(s), serialized
  question: string;  // the final user turn text
  response: string;
  sample: number;    // 1-based index within the N samples
  timestamp: string; // ISO 8601
}

export type VerdictCategory = 'ok' | 'breadth-gap' | 'freshness-gap' | 'hallucination';

export interface JudgeVerdict {
  grounded: 0 | 1 | 2;
  answered: 0 | 1 | 2;
  hallucination: boolean;
  category: VerdictCategory;
  rationale: string;
}

export interface JudgedRecord {
  record: TranscriptRecord;
  verdict: JudgeVerdict;
}

export type QuestionStatus = 'pass' | 'fail' | 'skipped-multiturn';

export interface QuestionResult {
  id: string;
  persona: Persona;
  status: QuestionStatus;
  flaky: boolean;             // non-unanimous pass/fail across samples
  passedSamples: number;
  totalSamples: number;
  dominantCategory: VerdictCategory | null; // null when skipped
  sampleRationale: string;    // one representative rationale ('' when skipped)
}

export interface RunReport {
  coverage: number;           // passing / evaluated, 0..1 (0 when evaluated === 0)
  evaluated: number;          // questions actually run (excludes skipped multiturn)
  passing: number;
  skippedMultiturn: number;
  categoryCounts: Record<VerdictCategory, number>;
  results: QuestionResult[];  // failures first, then flaky passes, then clean passes, then skipped
  generatedAt: string;        // ISO 8601
}
```

- [ ] **Step 2: Write the failing test** — `eval/questions.test.ts`

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

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run eval/questions.test.ts`
Expected: FAIL — cannot find module `./questions`.

- [ ] **Step 4: Write `eval/questions.ts`**

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

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run eval/questions.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Create the seed `eval/questions.yaml`**

```yaml
# Curated coverage set. Each entry is 1-5 turns; single-turn is one item.
# Grow this file freely — it is data, not code.
- id: zocdoc-work
  persona: recruiter
  turns:
    - "What did Jeremy work on at Zocdoc?"
- id: accessibility-scope
  persona: recruiter
  notes: must not overclaim leadership of the a11y program
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
  notes: multi-turn — skipped in v1, exercised in phase 2
  turns:
    - "What is Jeremy building right now?"
    - "How does Facia relate to that?"
```

- [ ] **Step 7: Commit**

```bash
git add eval/types.ts eval/questions.ts eval/questions.test.ts eval/questions.yaml
git commit -m "feat(eval): shared types, question loader, and seed question set"
```

---

### Task 3: Judge verdict parsing (pure)

**Files:**
- Create: `eval/judge.ts` (parse function only in this task)
- Test: `eval/judge.test.ts`

**Interfaces:**
- Consumes: `JudgeVerdict`, `VerdictCategory` from `eval/types`.
- Produces: `parseJudgeVerdict(text: string): JudgeVerdict` — extracts the JSON object from the model's reply (tolerates surrounding prose / ```json fences), validates every field, and throws `Error` on anything malformed or out of range.

- [ ] **Step 1: Write the failing test** — `eval/judge.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { parseJudgeVerdict } from './judge';

const good = JSON.stringify({
  grounded: 2, answered: 2, hallucination: false, category: 'ok', rationale: 'supported by profile',
});

describe('parseJudgeVerdict', () => {
  it('parses a clean JSON verdict', () => {
    expect(parseJudgeVerdict(good)).toEqual({
      grounded: 2, answered: 2, hallucination: false, category: 'ok', rationale: 'supported by profile',
    });
  });

  it('extracts JSON from a fenced code block with prose around it', () => {
    const wrapped = 'Here is my verdict:\n```json\n' + good + '\n```\nDone.';
    expect(parseJudgeVerdict(wrapped).category).toBe('ok');
  });

  it('throws on non-JSON', () => {
    expect(() => parseJudgeVerdict('no json here')).toThrow(/no json|parse/i);
  });

  it('throws on an out-of-range score', () => {
    const bad = JSON.stringify({ grounded: 5, answered: 2, hallucination: false, category: 'ok', rationale: 'x' });
    expect(() => parseJudgeVerdict(bad)).toThrow(/grounded/i);
  });

  it('throws on an unknown category', () => {
    const bad = JSON.stringify({ grounded: 2, answered: 2, hallucination: false, category: 'nope', rationale: 'x' });
    expect(() => parseJudgeVerdict(bad)).toThrow(/category/i);
  });

  it('throws when hallucination is not a boolean', () => {
    const bad = JSON.stringify({ grounded: 2, answered: 2, hallucination: 'yes', category: 'ok', rationale: 'x' });
    expect(() => parseJudgeVerdict(bad)).toThrow(/hallucination/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run eval/judge.test.ts`
Expected: FAIL — `parseJudgeVerdict` is not exported.

- [ ] **Step 3: Write `parseJudgeVerdict` in `eval/judge.ts`**

```ts
import type { JudgeVerdict, VerdictCategory } from './types';

const CATEGORIES: readonly VerdictCategory[] = ['ok', 'breadth-gap', 'freshness-gap', 'hallucination'];

function extractJson(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) throw new Error('judge reply has no JSON object');
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new Error('judge reply JSON failed to parse');
  }
}

function score(v: unknown, field: string): 0 | 1 | 2 {
  if (v === 0 || v === 1 || v === 2) return v;
  throw new Error(`judge verdict: ${field} must be 0, 1, or 2`);
}

export function parseJudgeVerdict(text: string): JudgeVerdict {
  const obj = extractJson(text) as Record<string, unknown>;
  const grounded = score(obj.grounded, 'grounded');
  const answered = score(obj.answered, 'answered');
  if (typeof obj.hallucination !== 'boolean') throw new Error('judge verdict: hallucination must be a boolean');
  if (typeof obj.category !== 'string' || !CATEGORIES.includes(obj.category as VerdictCategory)) {
    throw new Error(`judge verdict: category must be one of ${CATEGORIES.join(', ')}`);
  }
  const rationale = typeof obj.rationale === 'string' ? obj.rationale : '';
  return { grounded, answered, hallucination: obj.hallucination, category: obj.category as VerdictCategory, rationale };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run eval/judge.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add eval/judge.ts eval/judge.test.ts
git commit -m "feat(eval): parse and validate LLM judge verdicts"
```

---

### Task 4: Non-streaming completion + judge call

**Files:**
- Create: `eval/complete.ts`
- Modify: `eval/judge.ts` (add `buildJudgePrompt` + `judgeAnswer`)
- Test: `eval/complete.test.ts`
- Test: `eval/judge.test.ts` (append `judgeAnswer` cases)

**Interfaces:**
- Consumes: `ChatMessage` from `api/_lib/types`; `JudgeVerdict` from `eval/types`; `parseJudgeVerdict` from Task 3.
- Produces:
  - `type CompleteFn = (messages: ChatMessage[], opts: CompleteOpts) => Promise<string>` and `interface CompleteOpts { model: string; temperature: number; apiKey?: string; json?: boolean; fetchImpl?: typeof fetch }`; `complete: CompleteFn` (non-streaming OpenRouter call returning the full message content).
  - `buildJudgePrompt(question: string, answer: string, groundingCorpus: string): ChatMessage[]`.
  - `judgeAnswer(input: { question: string; answer: string; groundingCorpus: string }, deps: { complete: CompleteFn; model: string }): Promise<JudgeVerdict>` — calls `complete` at temperature 0 with `json: true`, parses the reply; on a parse/validation error retries **once**, then rethrows.

- [ ] **Step 1: Write the failing test** — `eval/complete.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { complete } from './complete';

function jsonResponse(content: string): Response {
  return new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status: 200 });
}

describe('complete', () => {
  it('returns the assistant message content', async () => {
    const fetchImpl = (async () => jsonResponse('hello world')) as unknown as typeof fetch;
    const out = await complete([{ role: 'user', content: 'hi' }], { model: 'm', temperature: 0, fetchImpl });
    expect(out).toBe('hello world');
  });

  it('sends model, temperature, and json response_format', async () => {
    let sentBody: any;
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      sentBody = JSON.parse(init.body as string);
      return jsonResponse('{}');
    }) as unknown as typeof fetch;
    await complete([{ role: 'user', content: 'hi' }], { model: 'judge-x', temperature: 0, json: true, fetchImpl });
    expect(sentBody.model).toBe('judge-x');
    expect(sentBody.temperature).toBe(0);
    expect(sentBody.response_format).toEqual({ type: 'json_object' });
    expect(sentBody.stream).toBe(false);
  });

  it('throws a friendly error on non-200', async () => {
    const fetchImpl = (async () => new Response('nope', { status: 500 })) as unknown as typeof fetch;
    await expect(complete([{ role: 'user', content: 'hi' }], { model: 'm', temperature: 0, fetchImpl }))
      .rejects.toThrow(/judge completion failed: 500/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run eval/complete.test.ts`
Expected: FAIL — cannot find module `./complete`.

- [ ] **Step 3: Write `eval/complete.ts`**

```ts
import type { ChatMessage } from '../api/_lib/types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface CompleteOpts {
  model: string;
  temperature: number;
  apiKey?: string;
  json?: boolean;
  fetchImpl?: typeof fetch;
}

export type CompleteFn = (messages: ChatMessage[], opts: CompleteOpts) => Promise<string>;

export const complete: CompleteFn = async (messages, opts) => {
  const doFetch = opts.fetchImpl ?? fetch;
  const body: Record<string, unknown> = {
    model: opts.model,
    messages,
    temperature: opts.temperature,
    stream: false,
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  const res = await doFetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey ?? process.env.OPENROUTER_API_KEY ?? ''}`,
      'HTTP-Referer': 'https://jeremycapps.com',
      'X-Title': 'Jeremy Capps Portfolio Eval',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`judge completion failed: ${res.status}`);
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run eval/complete.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Append `judgeAnswer` tests to `eval/judge.test.ts`**

Add these imports at the top of the file (alongside the existing import):
```ts
import { buildJudgePrompt, judgeAnswer } from './judge';
import type { CompleteFn } from './complete';
```
Append inside the file:
```ts
describe('buildJudgePrompt', () => {
  it('includes the question, answer, and grounding corpus', () => {
    const msgs = buildJudgePrompt('Q?', 'A.', 'CORPUS-TEXT');
    const joined = msgs.map((m) => m.content).join('\n');
    expect(joined).toContain('Q?');
    expect(joined).toContain('A.');
    expect(joined).toContain('CORPUS-TEXT');
  });
});

describe('judgeAnswer', () => {
  const goodReply = JSON.stringify({ grounded: 2, answered: 2, hallucination: false, category: 'ok', rationale: 'ok' });

  it('returns a parsed verdict on first success', async () => {
    const complete: CompleteFn = async () => goodReply;
    const v = await judgeAnswer({ question: 'q', answer: 'a', groundingCorpus: 'c' }, { complete, model: 'j' });
    expect(v.category).toBe('ok');
  });

  it('retries once on a malformed reply, then succeeds', async () => {
    let calls = 0;
    const complete: CompleteFn = async () => (++calls === 1 ? 'garbage' : goodReply);
    const v = await judgeAnswer({ question: 'q', answer: 'a', groundingCorpus: 'c' }, { complete, model: 'j' });
    expect(calls).toBe(2);
    expect(v.grounded).toBe(2);
  });

  it('throws after two malformed replies', async () => {
    const complete: CompleteFn = async () => 'garbage';
    await expect(judgeAnswer({ question: 'q', answer: 'a', groundingCorpus: 'c' }, { complete, model: 'j' }))
      .rejects.toThrow(/judge/i);
  });
});
```

- [ ] **Step 6: Run tests to verify the new cases fail**

Run: `npx vitest run eval/judge.test.ts`
Expected: FAIL — `buildJudgePrompt` / `judgeAnswer` not exported.

- [ ] **Step 7: Add `buildJudgePrompt` and `judgeAnswer` to `eval/judge.ts`**

Add these imports at the top of `eval/judge.ts`:
```ts
import type { ChatMessage } from '../api/_lib/types';
import type { CompleteFn } from './complete';
```
Append to the file:
```ts
export function buildJudgePrompt(question: string, answer: string, groundingCorpus: string): ChatMessage[] {
  const system = [
    'You grade whether an AI answer about a person is GROUNDED in the provided source material.',
    'A fluent answer that asserts anything the source does not support is a hallucination and must score poorly.',
    'Return ONLY a JSON object with these fields:',
    '- grounded: 0 (unsupported) | 1 (partly supported) | 2 (fully supported)',
    '- answered: 0 (evades) | 1 (partial) | 2 (answers the question)',
    '- hallucination: boolean (asserts something the source does not support)',
    '- category: "ok" | "breadth-gap" (source lacks the material) | "freshness-gap" (source is settled but question is about current work) | "hallucination"',
    '- rationale: one short sentence',
  ].join('\n');

  const user = [
    '=== SOURCE MATERIAL (the only ground truth) ===',
    groundingCorpus,
    '',
    '=== QUESTION ===',
    question,
    '',
    '=== ANSWER TO GRADE ===',
    answer,
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export async function judgeAnswer(
  input: { question: string; answer: string; groundingCorpus: string },
  deps: { complete: CompleteFn; model: string },
): Promise<JudgeVerdict> {
  const messages = buildJudgePrompt(input.question, input.answer, input.groundingCorpus);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    const reply = await deps.complete(messages, { model: deps.model, temperature: 0, json: true });
    try {
      return parseJudgeVerdict(reply);
    } catch (err) {
      lastErr = err;
    }
  }
  throw new Error(`judge failed to return a valid verdict after retry: ${String(lastErr)}`);
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run eval/judge.test.ts eval/complete.test.ts`
Expected: PASS (all judge + complete cases).

- [ ] **Step 9: Commit**

```bash
git add eval/complete.ts eval/complete.test.ts eval/judge.ts eval/judge.test.ts
git commit -m "feat(eval): non-streaming completion and grounding judge with retry"
```

---

### Task 5: Aggregation and report model (pure)

**Files:**
- Create: `eval/aggregate.ts`
- Test: `eval/aggregate.test.ts`

**Interfaces:**
- Consumes: `Question`, `JudgedRecord`, `QuestionResult`, `RunReport`, `VerdictCategory` from `eval/types`.
- Produces:
  - `aggregateQuestion(question: Question, judged: JudgedRecord[]): QuestionResult`. A **sample passes** iff `grounded >= 1 && answered >= 1 && hallucination === false`. The question **passes** iff a strict majority of samples pass. `flaky` is true when samples are non-unanimous (some pass, some fail). `dominantCategory` is the most frequent verdict category across samples (ties broken by the `CATEGORIES` order used elsewhere). `sampleRationale` is the rationale of the first failing sample, or the first sample if all pass. A question with `turns.length > 1` **must** be passed an empty `judged` array and yields `status: 'skipped-multiturn'`, `dominantCategory: null`, `sampleRationale: ''`.
  - `buildReport(results: QuestionResult[], generatedAt: string): RunReport`. `evaluated` excludes skipped; `coverage = evaluated === 0 ? 0 : passing / evaluated`. `results` are ordered failures → flaky passes → clean passes → skipped. `categoryCounts` counts `dominantCategory` across non-skipped results, initialized to 0 for every category.

- [ ] **Step 1: Write the failing test** — `eval/aggregate.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { aggregateQuestion, buildReport } from './aggregate';
import type { JudgedRecord, Question, TranscriptRecord, JudgeVerdict, QuestionResult } from './types';

const rec: TranscriptRecord = {
  id: 'q', producer: 'curated', persona: 'peer', model: 'm',
  prompt: 'p', question: 'q?', response: 'r', sample: 1, timestamp: 't',
};
function judged(v: Partial<JudgeVerdict>): JudgedRecord {
  return { record: rec, verdict: { grounded: 2, answered: 2, hallucination: false, category: 'ok', rationale: 'r', ...v } };
}
const single: Question = { id: 'q', persona: 'peer', turns: ['q?'] };

describe('aggregateQuestion', () => {
  it('passes when a majority of samples pass', () => {
    const r = aggregateQuestion(single, [judged({}), judged({}), judged({ grounded: 0 })]);
    expect(r.status).toBe('pass');
    expect(r.passedSamples).toBe(2);
    expect(r.totalSamples).toBe(3);
    expect(r.flaky).toBe(true);
  });

  it('fails when a majority of samples fail (hallucination fails a sample)', () => {
    const r = aggregateQuestion(single, [judged({ hallucination: true }), judged({ hallucination: true }), judged({})]);
    expect(r.status).toBe('fail');
    expect(r.flaky).toBe(true);
  });

  it('is not flaky when unanimous', () => {
    const r = aggregateQuestion(single, [judged({}), judged({})]);
    expect(r.status).toBe('pass');
    expect(r.flaky).toBe(false);
  });

  it('reports a skipped result for multi-turn questions', () => {
    const multi: Question = { id: 'm', persona: 'peer', turns: ['a', 'b'] };
    const r = aggregateQuestion(multi, []);
    expect(r.status).toBe('skipped-multiturn');
    expect(r.dominantCategory).toBeNull();
    expect(r.totalSamples).toBe(0);
  });

  it('picks the dominant category across samples', () => {
    const r = aggregateQuestion(single, [
      judged({ hallucination: true, category: 'hallucination' }),
      judged({ category: 'breadth-gap', grounded: 0 }),
      judged({ category: 'breadth-gap', grounded: 0 }),
    ]);
    expect(r.dominantCategory).toBe('breadth-gap');
  });
});

describe('buildReport', () => {
  it('computes coverage over evaluated questions only', () => {
    const results: QuestionResult[] = [
      { id: 'a', persona: 'peer', status: 'pass', flaky: false, passedSamples: 3, totalSamples: 3, dominantCategory: 'ok', sampleRationale: '' },
      { id: 'b', persona: 'peer', status: 'fail', flaky: false, passedSamples: 0, totalSamples: 3, dominantCategory: 'breadth-gap', sampleRationale: 'x' },
      { id: 'c', persona: 'peer', status: 'skipped-multiturn', flaky: false, passedSamples: 0, totalSamples: 0, dominantCategory: null, sampleRationale: '' },
    ];
    const report = buildReport(results, '2026-08-20T00:00:00Z');
    expect(report.evaluated).toBe(2);
    expect(report.passing).toBe(1);
    expect(report.coverage).toBe(0.5);
    expect(report.skippedMultiturn).toBe(1);
    expect(report.categoryCounts['breadth-gap']).toBe(1);
    expect(report.categoryCounts.ok).toBe(1);
    expect(report.results[0].status).toBe('fail'); // failures first
  });

  it('reports zero coverage when nothing is evaluated', () => {
    const report = buildReport([], '2026-08-20T00:00:00Z');
    expect(report.coverage).toBe(0);
    expect(report.evaluated).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run eval/aggregate.test.ts`
Expected: FAIL — cannot find module `./aggregate`.

- [ ] **Step 3: Write `eval/aggregate.ts`**

```ts
import type { JudgedRecord, Question, QuestionResult, RunReport, VerdictCategory } from './types';

const CATEGORIES: readonly VerdictCategory[] = ['ok', 'breadth-gap', 'freshness-gap', 'hallucination'];

function samplePasses(j: JudgedRecord): boolean {
  const v = j.verdict;
  return v.grounded >= 1 && v.answered >= 1 && v.hallucination === false;
}

function dominant(judged: JudgedRecord[]): VerdictCategory {
  const counts = new Map<VerdictCategory, number>();
  for (const j of judged) counts.set(j.verdict.category, (counts.get(j.verdict.category) ?? 0) + 1);
  let best: VerdictCategory = CATEGORIES[0];
  let bestN = -1;
  for (const cat of CATEGORIES) {
    const n = counts.get(cat) ?? 0;
    if (n > bestN) { best = cat; bestN = n; }
  }
  return best;
}

export function aggregateQuestion(question: Question, judged: JudgedRecord[]): QuestionResult {
  if (question.turns.length > 1) {
    return {
      id: question.id, persona: question.persona, status: 'skipped-multiturn',
      flaky: false, passedSamples: 0, totalSamples: 0, dominantCategory: null, sampleRationale: '',
    };
  }

  const total = judged.length;
  const passed = judged.filter(samplePasses).length;
  const status = passed * 2 > total ? 'pass' : 'fail';
  const flaky = passed !== 0 && passed !== total;

  const firstFail = judged.find((j) => !samplePasses(j));
  const sampleRationale = (firstFail ?? judged[0])?.verdict.rationale ?? '';

  return {
    id: question.id, persona: question.persona, status,
    flaky, passedSamples: passed, totalSamples: total,
    dominantCategory: dominant(judged), sampleRationale,
  };
}

const ORDER: Record<QuestionResult['status'], number> = { fail: 0, pass: 1, 'skipped-multiturn': 2 };

export function buildReport(results: QuestionResult[], generatedAt: string): RunReport {
  const evaluatedResults = results.filter((r) => r.status !== 'skipped-multiturn');
  const evaluated = evaluatedResults.length;
  const passing = evaluatedResults.filter((r) => r.status === 'pass').length;
  const skippedMultiturn = results.length - evaluated;

  const categoryCounts = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<VerdictCategory, number>;
  for (const r of evaluatedResults) if (r.dominantCategory) categoryCounts[r.dominantCategory] += 1;

  const ordered = [...results].sort((a, b) => {
    const byStatus = ORDER[a.status] - ORDER[b.status];
    if (byStatus !== 0) return byStatus;
    return Number(b.flaky) - Number(a.flaky); // flaky before clean within the same status
  });

  return {
    coverage: evaluated === 0 ? 0 : passing / evaluated,
    evaluated, passing, skippedMultiturn, categoryCounts,
    results: ordered, generatedAt,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run eval/aggregate.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add eval/aggregate.ts eval/aggregate.test.ts
git commit -m "feat(eval): sample aggregation and coverage report model"
```

---

### Task 6: Report formatting (pure)

**Files:**
- Create: `eval/report.ts`
- Test: `eval/report.test.ts`

**Interfaces:**
- Consumes: `RunReport` from `eval/types`.
- Produces:
  - `formatConsole(report: RunReport): string` — a compact multi-line summary: coverage %, evaluated/passing counts, skipped count, and category counts.
  - `formatMarkdown(report: RunReport): string` — a full markdown report: a summary header plus a table with columns `Question | Persona | Status | Flaky | Samples | Category | Rationale`, rows already ordered by `report.results` (failures first).

- [ ] **Step 1: Write the failing test** — `eval/report.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { formatConsole, formatMarkdown } from './report';
import type { RunReport } from './types';

const report: RunReport = {
  coverage: 0.5, evaluated: 2, passing: 1, skippedMultiturn: 1,
  categoryCounts: { ok: 1, 'breadth-gap': 1, 'freshness-gap': 0, hallucination: 0 },
  generatedAt: '2026-08-20T00:00:00Z',
  results: [
    { id: 'b', persona: 'peer', status: 'fail', flaky: false, passedSamples: 0, totalSamples: 3, dominantCategory: 'breadth-gap', sampleRationale: 'not in profile' },
    { id: 'a', persona: 'recruiter', status: 'pass', flaky: false, passedSamples: 3, totalSamples: 3, dominantCategory: 'ok', sampleRationale: '' },
    { id: 'c', persona: 'peer', status: 'skipped-multiturn', flaky: false, passedSamples: 0, totalSamples: 0, dominantCategory: null, sampleRationale: '' },
  ],
};

describe('formatConsole', () => {
  it('shows coverage percent and category counts', () => {
    const out = formatConsole(report);
    expect(out).toContain('50%');
    expect(out).toContain('breadth-gap: 1');
    expect(out).toContain('skipped');
  });
});

describe('formatMarkdown', () => {
  it('renders a table with failures first', () => {
    const out = formatMarkdown(report);
    expect(out).toContain('| Question | Persona | Status');
    const bIndex = out.indexOf('| b |');
    const aIndex = out.indexOf('| a |');
    expect(bIndex).toBeGreaterThan(-1);
    expect(bIndex).toBeLessThan(aIndex); // failure row before pass row
    expect(out).toContain('50%');
    expect(out).toContain('not in profile');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run eval/report.test.ts`
Expected: FAIL — cannot find module `./report`.

- [ ] **Step 3: Write `eval/report.ts`**

```ts
import type { RunReport } from './types';

function pct(coverage: number): string {
  return `${Math.round(coverage * 100)}%`;
}

function categoryLine(report: RunReport): string {
  return Object.entries(report.categoryCounts).map(([cat, n]) => `${cat}: ${n}`).join(', ');
}

export function formatConsole(report: RunReport): string {
  return [
    `Coverage: ${pct(report.coverage)}  (${report.passing}/${report.evaluated} passing)`,
    `Skipped (multi-turn): ${report.skippedMultiturn}`,
    `Categories: ${categoryLine(report)}`,
  ].join('\n');
}

function cell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function formatMarkdown(report: RunReport): string {
  const header = [
    `# Coverage report — ${report.generatedAt}`,
    '',
    `- **Coverage:** ${pct(report.coverage)} (${report.passing}/${report.evaluated} passing)`,
    `- **Skipped (multi-turn):** ${report.skippedMultiturn}`,
    `- **Categories:** ${categoryLine(report)}`,
    '',
    '| Question | Persona | Status | Flaky | Samples | Category | Rationale |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  const rows = report.results.map((r) => {
    const samples = r.status === 'skipped-multiturn' ? '—' : `${r.passedSamples}/${r.totalSamples}`;
    const flaky = r.flaky ? 'yes' : '';
    const category = r.dominantCategory ?? '—';
    return `| ${cell(r.id)} | ${r.persona} | ${r.status} | ${flaky} | ${samples} | ${category} | ${cell(r.sampleRationale)} |`;
  });
  return [...header, ...rows, ''].join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run eval/report.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add eval/report.ts eval/report.test.ts
git commit -m "feat(eval): console and markdown report formatting"
```

---

### Task 7: Orchestration (pure, injected IO)

**Files:**
- Create: `eval/orchestrate.ts`
- Test: `eval/orchestrate.test.ts`

**Interfaces:**
- Consumes: `Question`, `JudgedRecord`, `TranscriptRecord`, `JudgeVerdict`, `RunReport` from `eval/types`; `aggregateQuestion` + `buildReport` from Task 5.
- Produces:
  - `interface RunDeps { questions: Question[]; chat: (turns: string[]) => Promise<string>; judge: (input: { question: string; answer: string; groundingCorpus: string }) => Promise<JudgeVerdict>; groundingCorpus: string; model: string; samples: number; now?: () => Date }`.
  - `runEval(deps: RunDeps): Promise<{ report: RunReport; records: JudgedRecord[] }>`. For each question: if `turns.length > 1`, skip (no `chat`/`judge` calls) and aggregate as skipped. Otherwise call `chat(turns)` `samples` times, build a `TranscriptRecord` per sample (`producer: 'curated'`, `question` = last turn, `sample` = 1-based), `judge` each, aggregate. `records` is the flat list of every judged single-turn sample.

- [ ] **Step 1: Write the failing test** — `eval/orchestrate.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { runEval } from './orchestrate';
import type { JudgeVerdict, Question } from './types';

const questions: Question[] = [
  { id: 'single', persona: 'peer', turns: ['what?'] },
  { id: 'multi', persona: 'peer', turns: ['a', 'b'] },
];

const okVerdict: JudgeVerdict = { grounded: 2, answered: 2, hallucination: false, category: 'ok', rationale: 'ok' };

describe('runEval', () => {
  it('samples single-turn questions and skips multi-turn', async () => {
    let chatCalls = 0;
    let judgeCalls = 0;
    const { report, records } = await runEval({
      questions,
      chat: async () => { chatCalls++; return 'an answer'; },
      judge: async () => { judgeCalls++; return okVerdict; },
      groundingCorpus: 'corpus',
      model: 'chat-model',
      samples: 3,
      now: () => new Date('2026-08-20T00:00:00Z'),
    });
    expect(chatCalls).toBe(3);   // single-turn only, 3 samples
    expect(judgeCalls).toBe(3);
    expect(records).toHaveLength(3);
    expect(records[0].record.producer).toBe('curated');
    expect(records[0].record.model).toBe('chat-model');
    expect(records[0].record.sample).toBe(1);
    expect(report.evaluated).toBe(1);
    expect(report.skippedMultiturn).toBe(1);
    expect(report.coverage).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run eval/orchestrate.test.ts`
Expected: FAIL — cannot find module `./orchestrate`.

- [ ] **Step 3: Write `eval/orchestrate.ts`**

```ts
import type { JudgedRecord, JudgeVerdict, Question, RunReport, TranscriptRecord } from './types';
import { aggregateQuestion, buildReport } from './aggregate';

export interface RunDeps {
  questions: Question[];
  chat: (turns: string[]) => Promise<string>;
  judge: (input: { question: string; answer: string; groundingCorpus: string }) => Promise<JudgeVerdict>;
  groundingCorpus: string;
  model: string;
  samples: number;
  now?: () => Date;
}

export async function runEval(deps: RunDeps): Promise<{ report: RunReport; records: JudgedRecord[] }> {
  const now = deps.now ?? (() => new Date());
  const allRecords: JudgedRecord[] = [];
  const results = [];

  for (const question of deps.questions) {
    if (question.turns.length > 1) {
      results.push(aggregateQuestion(question, []));
      continue;
    }
    const finalTurn = question.turns[question.turns.length - 1];
    const judged: JudgedRecord[] = [];
    for (let i = 0; i < deps.samples; i++) {
      const answer = await deps.chat(question.turns);
      const record: TranscriptRecord = {
        id: question.id,
        producer: 'curated',
        persona: question.persona,
        model: deps.model,
        prompt: `${deps.groundingCorpus}\n\n[user] ${question.turns.join('\n[user] ')}`,
        question: finalTurn,
        response: answer,
        sample: i + 1,
        timestamp: now().toISOString(),
      };
      const verdict = await deps.judge({ question: finalTurn, answer, groundingCorpus: deps.groundingCorpus });
      judged.push({ record, verdict });
    }
    allRecords.push(...judged);
    results.push(aggregateQuestion(question, judged));
  }

  return { report: buildReport(results, now().toISOString()), records: allRecords };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run eval/orchestrate.test.ts`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add eval/orchestrate.ts eval/orchestrate.test.ts
git commit -m "feat(eval): orchestration wiring chat, judge, and aggregation"
```

---

### Task 8: Runner entry + live wiring + docs

**Files:**
- Create: `eval/run.ts`
- Create: `eval/README.md`
- Test: none (thin IO shell; verified by typecheck + a manual live run)

**Interfaces:**
- Consumes: `loadQuestions` (Task 2), `complete` (Task 4), `judgeAnswer` (Task 4), `runEval` (Task 7), `formatConsole` + `formatMarkdown` (Task 6), `evalConfig` (Task 1); `buildMessages` (`api/_lib/chat-core`), `systemPrompt` (`api/_lib/config`), `streamChat` (`api/_lib/provider`), `getConfig` (`api/_lib/config`).
- Produces: an executable module. `npm run eval` runs it, writing `eval/reports/<timestamp>.json` (all judged records) and `eval/reports/<timestamp>.md` (markdown report), and printing the console summary.

- [ ] **Step 1: Write `eval/run.ts`**

```ts
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMessages } from '../api/_lib/chat-core';
import { systemPrompt, getConfig } from '../api/_lib/config';
import { streamChat } from '../api/_lib/provider';
import type { ChatMessage } from '../api/_lib/types';

import { evalConfig } from './config';
import { loadQuestions } from './questions';
import { complete } from './complete';
import { judgeAnswer } from './judge';
import { runEval } from './orchestrate';
import { formatConsole, formatMarkdown } from './report';

const here = dirname(fileURLToPath(import.meta.url));

async function chat(turns: string[]): Promise<string> {
  const userMessages: ChatMessage[] = turns.map((content) => ({ role: 'user', content }));
  const messages = buildMessages(userMessages);
  let out = '';
  for await (const delta of streamChat(messages)) out += delta;
  return out;
}

async function main(): Promise<void> {
  const cfg = evalConfig();
  const grounding = systemPrompt();
  const model = getConfig().model;

  const yamlText = readFileSync(resolve(here, 'questions.yaml'), 'utf8');
  const questions = loadQuestions(yamlText);

  const { report, records } = await runEval({
    questions,
    chat,
    judge: (input) => judgeAnswer(input, { complete, model: cfg.judgeModel }),
    groundingCorpus: grounding,
    model,
    samples: cfg.samples,
  });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = resolve(here, 'reports');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(resolve(outDir, `${stamp}.json`), JSON.stringify(records, null, 2), 'utf8');
  writeFileSync(resolve(outDir, `${stamp}.md`), formatMarkdown(report), 'utf8');

  console.log(formatConsole(report));
  console.log(`\nReport written to eval/reports/${stamp}.md`);
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
# Coverage harness

Measures how well the chat answers a curated set of questions, grounded in the
material the model is actually given. See the design at
`docs/superpowers/specs/2026-08-20-coverage-harness-design.md`.

## Run

```bash
export OPENROUTER_API_KEY=...        # required
export EVAL_JUDGE_MODEL=...          # optional, defaults to a strong model
export EVAL_SAMPLES=3                # optional
npm run eval
```

Outputs a console summary and `eval/reports/<timestamp>.{md,json}` (gitignored).
The `.json` file is the transcript log (prompt, response, verdict per sample);
the evaluator reads records like these, so live-logged traffic can feed the same
report later without any change here.

## Add questions

Edit `eval/questions.yaml`. Each entry has `id`, `persona`
(`recruiter` | `peer` | `curious`), 1–5 `turns`, and optional `notes`.
Multi-turn questions are accepted but skipped until phase 2.
```

- [ ] **Step 4: Manual live run (requires `OPENROUTER_API_KEY`)**

Run:
```bash
npm run eval
```
Expected: prints a coverage summary and writes `eval/reports/<timestamp>.md` + `.json`. Skip if no API key is available in this environment; note it for the reviewer.

- [ ] **Step 5: Commit**

```bash
git add eval/run.ts eval/README.md
git commit -m "feat(eval): live runner entry and harness docs"
```

---

### Task 9: Full suite green + typecheck

**Files:** none (verification only).

- [ ] **Step 1: Run the full app test suite**

Run: `npm run test:app`
Expected: PASS — all existing tests plus the new `eval/*.test.ts` (config, questions, judge, complete, aggregate, report, orchestrate).

- [ ] **Step 2: Run the typecheck**

Run: `npm run typecheck:app`
Expected: PASS.

- [ ] **Step 3: Commit (only if anything was adjusted)**

```bash
git add -A
git commit -m "chore(eval): full suite green"
```

---

## Self-Review

**Spec coverage:**
- Grounded-coverage metric + quality floor (hallucination fails) → Tasks 3, 5 (`samplePasses`, judge categories).
- In-process pipeline reuse (`buildMessages` + `systemPrompt` + `streamChat`) → Task 8.
- Judge grounds against the assembled prompt → Task 4 (`buildJudgePrompt` takes `groundingCorpus = systemPrompt()`), wired in Task 8.
- Question set schema (1–5 turns, persona, notes) + validation → Task 2.
- Sampling N (default 3, env/flag) → Tasks 1, 7. (Note: `--samples`/`--limit`/`--filter` CLI flags from the spec are **not** implemented in v1; `EVAL_SAMPLES` env covers sampling. See "Deviations" below.)
- Judge: separate stronger model, low temperature, strict JSON, retry-once-then-fail → Tasks 1, 4.
- Aggregation: majority pass, flaky flag, coverage math, category counts, multi-turn skip accounting → Task 5.
- Report: console summary + markdown table failures-first + persisted JSON transcript log → Tasks 6, 8.
- Transcript log as the interface / same record shape for future live logging → Tasks 2 (`TranscriptRecord`), 7, 8 (JSON output), documented in README.
- Testing: pure logic unit-tested in default vitest; live run manual → Tasks 1 (vitest include), 3–7, 8.
- Non-goals (no ingestion, embeddings, generated questions, live logging, UI) → none implemented; multi-turn execution deferred (Task 5/7 skip).

**Deviations from spec (intentional, YAGNI):** The spec lists `--limit`, `--samples`, `--filter` CLI flags. v1 ships `EVAL_SAMPLES` (env) only; the other flags are deferred until the question set is large enough to need them. This keeps `run.ts` a thin IO shell. Flag parsing can be added later without touching `runEval`.

**Placeholder scan:** No TBD/TODO; every code step contains real content.

**Type consistency:** `Question`, `TranscriptRecord`, `JudgeVerdict`, `JudgedRecord`, `QuestionResult`, `RunReport` are defined once in Task 2 and used verbatim in Tasks 5–8. `CompleteFn` defined in Task 4 and consumed in Task 8. `runEval`/`RunDeps` defined in Task 7 and consumed in Task 8. `aggregateQuestion`/`buildReport` defined in Task 5 and consumed in Task 7. Names checked consistent across tasks.
