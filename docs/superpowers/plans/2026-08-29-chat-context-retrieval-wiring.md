# Chat context-retrieval wiring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire `/api/chat` to a query-planning step and the deployed `/api/context-query` DuckDB retrieval endpoint, so chat answers can be grounded in the private context corpus when useful, with a safe silent fallback and production-verifiable observability.

**Architecture:** A new structured-generation call (`planContextQuery`) decides per turn whether to retrieve, reusing the existing OpenRouter structured-generation plumbing. When it decides to, a new same-origin fetch client (`retrieveContext`) calls the already-deployed Node `/api/context-query` endpoint with the server-side bearer key. `chat-core.ts`'s `buildMessages` becomes async, folds any retrieved rows into the system prompt as dated working context, and reports the outcome via a response header and a structured log line. Every failure path collapses to today's profile-only behavior.

**Tech Stack:** TypeScript, Vitest, Zod (JSON-schema validation, matching `model-answer.ts`'s pattern), the existing `generateOpenRouterStructured` structured-generation helper, native `fetch`/`AbortController`.

**Spec:** `docs/superpowers/specs/2026-08-29-chat-context-retrieval-wiring-design.md`

## Global Constraints

- Only `/api/chat` changes. `/api/answer`, Facia, `/api/context-query`, and the DuckDB runtime are untouched.
- Every planning/retrieval failure (refusal, malformed JSON, timeout, missing key, non-200, network error) must fall back to today's profile-only behavior — the chat response must never error or hang because of this feature.
- Reuse the existing `CHAT_MODEL`/structured-generation infrastructure (`generateOpenRouterStructured`) — no new model provider or env var beyond the already-deployed `CONTEXT_QUERY_API_KEY`.
- Planning timeout: 3000ms. Retrieval timeout: 4000ms.
- No query term, row content, or the bearer key may ever appear in a response header. The response headers are `x-context-retrieval: hit|none|error` and, only when `hit`, `x-context-retrieval-count`.
- `x-context-retrieval` is `none` both when the planner decides retrieval isn't needed AND when retrieval succeeds with zero rows. It is `error` only when retrieval was attempted (planner said `needed: true`) and threw.

---

### Task 1: Context query planner

**Files:**
- Create: `api/_lib/context-query-planner.ts`
- Test: `api/_lib/context-query-planner.test.ts`

**Interfaces:**
- Consumes: `generateOpenRouterStructured(request: StructuredGenerationRequest, deps?: StructuredGenerationDeps): Promise<string>` and `StructuredGenerationDeps` from `./structured-openrouter` (`{ fetchImpl?: typeof fetch; signal?: AbortSignal; timeoutMs?: number }`); `ContextQuery`, `ContextQueryKind`, `ContextExpansion` types from `./context-index`; `ChatMessage` from `./types`.
- Produces: `planContextQuery(question: string, history?: ChatMessage[], deps?: StructuredGenerationDeps): Promise<ContextPlanResult>` where `ContextPlanResult = { needed: false } | { needed: true; query: ContextQuery }`. Never throws. Also exports `parseContextPlan(raw: string): ContextPlanResult` and `CONTEXT_PLAN_JSON_SCHEMA` for the test.

- [ ] **Step 1: Write the failing tests**

Create `api/_lib/context-query-planner.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { planContextQuery, parseContextPlan } from './context-query-planner';

afterEach(() => vi.unstubAllEnvs());

describe('parseContextPlan', () => {
  it('parses a valid needed plan into a typed ContextQuery', () => {
    const raw = JSON.stringify({
      schema: 'portfolio.context-plan/1',
      needed: true,
      term: 'kernel evaluate expression',
      kind: 'prose',
      expansion: 'neighbors',
      limit: 5,
    });
    expect(parseContextPlan(raw)).toEqual({
      needed: true,
      query: { term: 'kernel evaluate expression', kind: 'prose', expansion: 'neighbors', limit: 5 },
    });
  });

  it('returns needed:false for a well-formed not-needed plan', () => {
    const raw = JSON.stringify({
      schema: 'portfolio.context-plan/1',
      needed: false,
      term: null,
      kind: null,
      expansion: null,
      limit: null,
    });
    expect(parseContextPlan(raw)).toEqual({ needed: false });
  });

  it('returns needed:false for malformed JSON', () => {
    expect(parseContextPlan('not json')).toEqual({ needed: false });
  });

  it('returns needed:false when a needed plan is missing term or kind', () => {
    const raw = JSON.stringify({
      schema: 'portfolio.context-plan/1',
      needed: true,
      term: null,
      kind: null,
      expansion: null,
      limit: null,
    });
    expect(parseContextPlan(raw)).toEqual({ needed: false });
  });
});

describe('planContextQuery', () => {
  it('returns a typed query when the model plans a retrieval', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const fetchImpl: typeof fetch = vi.fn(async () => Response.json({
      choices: [{
        message: {
          content: JSON.stringify({
            schema: 'portfolio.context-plan/1',
            needed: true,
            term: 'design system migration',
            kind: 'prose',
            expansion: 'none',
            limit: 6,
          }),
        },
      }],
    }));

    const result = await planContextQuery('How did the design system migration actually go?', [], { fetchImpl });

    expect(result).toEqual({
      needed: true,
      query: { term: 'design system migration', kind: 'prose', expansion: 'none', limit: 6 },
    });
  });

  it('returns needed:false when the provider is not configured (no throw)', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', '');
    const result = await planContextQuery('What technologies has Jeremy used?');
    expect(result).toEqual({ needed: false });
  });

  it('returns needed:false when the model refuses', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const fetchImpl: typeof fetch = vi.fn(async () => Response.json({
      choices: [{ message: { refusal: 'cannot plan this' } }],
    }));
    const result = await planContextQuery('anything', [], { fetchImpl });
    expect(result).toEqual({ needed: false });
  });

  it('returns needed:false when generation times out', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    const fetchImpl: typeof fetch = vi.fn((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    const result = await planContextQuery('anything', [], { fetchImpl, timeoutMs: 10 });
    expect(result).toEqual({ needed: false });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run api/_lib/context-query-planner.test.ts`
Expected: FAIL — `Cannot find module './context-query-planner'`.

- [ ] **Step 3: Write the implementation**

Create `api/_lib/context-query-planner.ts`:

```ts
import { z } from 'zod';
import type { ContextExpansion, ContextQuery, ContextQueryKind } from './context-index';
import {
  generateOpenRouterStructured,
  type StructuredGenerationDeps,
} from './structured-openrouter';
import type { ChatMessage } from './types';

export const CONTEXT_PLAN_PROTOCOL = 'portfolio.context-plan/1' as const;

const contextPlanSchema = z.object({
  schema: z.literal(CONTEXT_PLAN_PROTOCOL),
  needed: z.boolean(),
  term: z.string().trim().min(1).max(200).nullable(),
  kind: z.enum(['catalog', 'prose', 'code']).nullable(),
  expansion: z.enum(['none', 'neighbors', 'exchange']).nullable(),
  limit: z.number().int().min(1).max(20).nullable(),
}).strict().superRefine((plan, ctx) => {
  if (plan.needed && (plan.term === null || plan.kind === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['term'],
      message: 'A plan that needs retrieval requires term and kind.',
    });
  }
  if (!plan.needed && (plan.term !== null || plan.kind !== null || plan.expansion !== null || plan.limit !== null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['needed'],
      message: 'A plan that does not need retrieval must leave term, kind, expansion, and limit null.',
    });
  }
});

export type ContextPlanResult =
  | { needed: false }
  | { needed: true; query: ContextQuery };

export const CONTEXT_PLAN_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['schema', 'needed', 'term', 'kind', 'expansion', 'limit'],
  properties: {
    schema: { type: 'string', const: CONTEXT_PLAN_PROTOCOL },
    needed: { type: 'boolean' },
    term: { anyOf: [{ type: 'string', minLength: 1, maxLength: 200 }, { type: 'null' }] },
    kind: { anyOf: [{ type: 'string', enum: ['catalog', 'prose', 'code'] }, { type: 'null' }] },
    expansion: { anyOf: [{ type: 'string', enum: ['none', 'neighbors', 'exchange'] }, { type: 'null' }] },
    limit: { anyOf: [{ type: 'integer', minimum: 1, maximum: 20 }, { type: 'null' }] },
  },
} as const satisfies Record<string, unknown>;

export function parseContextPlan(raw: string): ContextPlanResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { needed: false };
  }
  const result = contextPlanSchema.safeParse(parsed);
  if (!result.success || !result.data.needed) return { needed: false };
  const plan = result.data;
  return {
    needed: true,
    query: {
      term: plan.term as string,
      kind: plan.kind as ContextQueryKind,
      expansion: (plan.expansion as ContextExpansion | null) ?? undefined,
      limit: plan.limit ?? undefined,
    },
  };
}

const CONTEXT_PLAN_SYSTEM_PROMPT = [
  "You are a retrieval planner for Jeremy Capps's portfolio chat assistant.",
  'The assistant is already grounded in a curated profile document covering settled',
  "career history, skills, and named projects. A separate private index holds Jeremy's",
  'own past AI chat transcripts and code from his development history — useful for',
  'specific, detailed, or "how did you build/think about X" questions that go beyond',
  'the profile document, but exploratory and sometimes stale.',
  '',
  'Decide whether this question would benefit from searching that index.',
  'Set needed to false for questions the profile document already answers well —',
  'general career, skills, project-summary, or contact questions.',
  'Set needed to true only when the question asks for something more specific or',
  'detailed than the profile document would contain.',
  '',
  'When needed is true, choose:',
  '- term: a short, specific search phrase (not the whole question)',
  '- kind: "prose" for conversational/explanatory material, "code" for source or',
  '  config snippets, "catalog" to find which documents/projects exist on a topic',
  '- expansion: "none" for an isolated match, "neighbors" for surrounding context',
  '  within the same exchange, "exchange" for the whole exchange',
  '- limit: how many rows to retrieve, typically 3-8',
  '',
  'When needed is false, leave term, kind, expansion, and limit as null.',
].join('\n');

const PLAN_TIMEOUT_MS = 3_000;

export async function planContextQuery(
  question: string,
  history: ChatMessage[] = [],
  deps: StructuredGenerationDeps = {},
): Promise<ContextPlanResult> {
  try {
    const content = await generateOpenRouterStructured({
      name: 'portfolio_context_plan_v1',
      schema: CONTEXT_PLAN_JSON_SCHEMA,
      messages: [
        { role: 'system', content: CONTEXT_PLAN_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: question },
      ],
    }, { timeoutMs: PLAN_TIMEOUT_MS, ...deps });
    return parseContextPlan(content);
  } catch {
    return { needed: false };
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run api/_lib/context-query-planner.test.ts`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add api/_lib/context-query-planner.ts api/_lib/context-query-planner.test.ts
git commit -m "feat: add the chat context-query planner"
```

---

### Task 2: Context retrieval client

**Files:**
- Create: `api/_lib/context-retrieval-client.ts`
- Test: `api/_lib/context-retrieval-client.test.ts`

**Interfaces:**
- Consumes: `ContextQuery`, `ContextRow`, `CatalogRow` types from `./context-index`.
- Produces: `retrieveContext(query: ContextQuery, origin: string, deps?: ContextRetrievalDeps): Promise<Array<ContextRow | CatalogRow>>` where `ContextRetrievalDeps = { fetchImpl?: typeof fetch; timeoutMs?: number; apiKey?: string }`. Throws `ContextRetrievalError` on missing key, non-200, network error, or timeout.

- [ ] **Step 1: Write the failing tests**

Create `api/_lib/context-retrieval-client.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { retrieveContext, ContextRetrievalError } from './context-retrieval-client';
import type { ContextQuery } from './context-index';

afterEach(() => vi.unstubAllEnvs());

const query: ContextQuery = { term: 'kernel', kind: 'prose', expansion: 'none', limit: 5 };

describe('retrieveContext', () => {
  it('POSTs to /api/context-query with the bearer key and returns typed rows', async () => {
    let capturedUrl: string | undefined;
    let capturedInit: RequestInit | undefined;
    const fetchImpl: typeof fetch = vi.fn(async (url, init) => {
      capturedUrl = String(url);
      capturedInit = init;
      return Response.json({
        protocol: 'portfolio.context-query/1',
        trace: [],
        results: [{ project: 'libera', fileType: 'transcript', date: '2026-03-01', filePath: 'a.md', tags: [], summary: 'summary' }],
      });
    });

    const rows = await retrieveContext(query, 'https://example.com', { fetchImpl, apiKey: 'test-key' });

    expect(capturedUrl).toBe('https://example.com/api/context-query');
    expect(capturedInit?.method).toBe('POST');
    expect((capturedInit?.headers as Record<string, string>).authorization).toBe('Bearer test-key');
    expect(JSON.parse(String(capturedInit?.body))).toEqual(query);
    expect(rows).toHaveLength(1);
  });

  it('throws without calling fetch when no API key is configured', async () => {
    vi.stubEnv('CONTEXT_QUERY_API_KEY', '');
    const fetchImpl = vi.fn();
    await expect(retrieveContext(query, 'https://example.com', { fetchImpl })).rejects.toThrow(ContextRetrievalError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('throws on a non-200 response', async () => {
    const fetchImpl: typeof fetch = vi.fn(async () => new Response('nope', { status: 500 }));
    await expect(
      retrieveContext(query, 'https://example.com', { fetchImpl, apiKey: 'test-key' }),
    ).rejects.toThrow(ContextRetrievalError);
  });

  it('throws when the request times out', async () => {
    const fetchImpl: typeof fetch = vi.fn((_url, init) => new Promise((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    await expect(
      retrieveContext(query, 'https://example.com', { fetchImpl, apiKey: 'test-key', timeoutMs: 10 }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run api/_lib/context-retrieval-client.test.ts`
Expected: FAIL — `Cannot find module './context-retrieval-client'`.

- [ ] **Step 3: Write the implementation**

Create `api/_lib/context-retrieval-client.ts`:

```ts
import type { CatalogRow, ContextQuery, ContextRow } from './context-index';

export interface ContextRetrievalDeps {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  apiKey?: string;
}

const RETRIEVAL_TIMEOUT_MS = 4_000;

export class ContextRetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContextRetrievalError';
  }
}

export async function retrieveContext(
  query: ContextQuery,
  origin: string,
  deps: ContextRetrievalDeps = {},
): Promise<Array<ContextRow | CatalogRow>> {
  const apiKey = deps.apiKey ?? process.env.CONTEXT_QUERY_API_KEY;
  if (!apiKey) {
    throw new ContextRetrievalError('CONTEXT_QUERY_API_KEY is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException('Context retrieval timed out.', 'TimeoutError')),
    deps.timeoutMs ?? RETRIEVAL_TIMEOUT_MS,
  );
  try {
    const response = await (deps.fetchImpl ?? fetch)(`${origin}/api/context-query`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(query),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ContextRetrievalError(`context-query request failed with status ${response.status}.`);
    }
    const body = (await response.json()) as { results?: Array<ContextRow | CatalogRow> };
    return body.results ?? [];
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run api/_lib/context-retrieval-client.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add api/_lib/context-retrieval-client.ts api/_lib/context-retrieval-client.test.ts
git commit -m "feat: add the chat context-retrieval client"
```

---

### Task 3: Wire planning + retrieval into chat-core

**Files:**
- Modify: `api/_lib/chat-core.ts`
- Modify: `api/_lib/chat-core.test.ts`
- Modify: `eval/run.ts` (the only other caller of `buildMessages`, found by grep — its local `chat()` helper calls `buildMessages(conversation)` synchronously with one argument and must move to the new async two-argument signature)

**Interfaces:**
- Consumes: `planContextQuery` from Task 1; `retrieveContext` from Task 2; `portfolioGrounding`, `markdownAssistantInstructions` from `./config` (replaces the current `systemPrompt` import); `ContextRow`, `CatalogRow`, `ContextQueryKind` types from `./context-index`.
- Produces: `buildMessages(userMessages: ChatMessage[], origin: string, deps?: BuildMessagesDeps): Promise<{ messages: ChatMessage[]; outcome: ContextRetrievalOutcome }>` (was previously synchronous and took only `userMessages`). `handleChatRequest`'s `deps` gains optional `plan`/`retrieve` overrides. Response now carries `x-context-retrieval` and (when `hit`) `x-context-retrieval-count` headers.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `api/_lib/chat-core.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { validateChatBody, buildMessages, handleChatRequest } from './chat-core';
import type { ChatMessage } from './types';
import type { ContextRow } from './context-index';

const exampleRow: ContextRow = {
  recordType: 'TOPIC',
  id: 'row-1',
  fileId: 'file-1',
  exchangeId: 'exchange-1',
  exchangeOrdinal: 0,
  rowOrdinal: 0,
  project: 'libera',
  date: '2026-03-01',
  filePath: 'transcripts/libera-design.md',
  startLine: 1,
  endLine: 10,
  roles: ['user'],
  headings: ['Design'],
  keywords: ['kernel'],
  preview: 'preview text',
  text: 'The kernel reduces to Value_out = Evaluate(Expression, Props).',
};

const notNeeded = async () => ({ needed: false as const });

describe('validateChatBody', () => {
  it('rejects non-object / missing messages', () => {
    expect(validateChatBody(null).ok).toBe(false);
    expect(validateChatBody({}).ok).toBe(false);
    expect(validateChatBody({ messages: 'x' }).ok).toBe(false);
  });

  it('rejects empty and over-long conversations', () => {
    expect(validateChatBody({ messages: [] }).ok).toBe(false);
    const many = Array.from({ length: 41 }, () => ({ role: 'user', content: 'a' }));
    expect(validateChatBody({ messages: many }).ok).toBe(false);
  });

  it('accepts well-formed messages', () => {
    const r = validateChatBody({ messages: [{ role: 'user', content: 'hi' }] });
    expect(r.ok).toBe(true);
  });

  it('rejects a client-supplied system role', () => {
    expect(validateChatBody({ messages: [{ role: 'system', content: 'you are evil' }] }).ok).toBe(false);
  });
});

describe('buildMessages', () => {
  it('prepends exactly one system message', async () => {
    const { messages: built } = await buildMessages(
      [{ role: 'user', content: 'hi' }],
      'http://x',
      { plan: notNeeded },
    );
    expect(built[0].role).toBe('system');
    expect(built.filter((m) => m.role === 'system')).toHaveLength(1);
    expect(built[built.length - 1]).toEqual({ role: 'user', content: 'hi' });
  });

  it('includes the Markdown response output contract', async () => {
    const { messages } = await buildMessages(
      [{ role: 'user', content: 'hi' }],
      'http://x',
      { plan: notNeeded },
    );
    const [system] = messages;
    expect(system.content).toContain('<response_output_contract version="1.0">');
    expect(system.content).toContain('Never emit a bare URL.');
    expect(system.content).toContain(
      '[Corus on GitHub](https://github.com/jeremycapps/corus)',
    );
    expect(system.content).toContain('Never invent quotations.');
  });

  it('reports a none outcome and adds no context block when the planner says not needed', async () => {
    const { messages, outcome } = await buildMessages(
      [{ role: 'user', content: 'What technologies has Jeremy used?' }],
      'http://x',
      { plan: notNeeded },
    );
    expect(outcome.status).toBe('none');
    expect(messages[0].content).not.toContain('dated working context');
  });

  it('adds a context block and reports a hit outcome when retrieval returns rows', async () => {
    const { messages, outcome } = await buildMessages(
      [{ role: 'user', content: 'How did the Libera kernel design settle?' }],
      'http://x',
      {
        plan: async () => ({ needed: true, query: { term: 'kernel design', kind: 'prose', expansion: 'none', limit: 5 } }),
        retrieve: async () => [exampleRow],
      },
    );
    expect(outcome).toMatchObject({ status: 'hit', count: 1, term: 'kernel design', kind: 'prose' });
    expect(messages[0].content).toContain('dated working context');
    expect(messages[0].content).toContain('[libera, 2026-03-01, transcripts/libera-design.md]');
    expect(messages[0].content).toContain('Value_out = Evaluate(Expression, Props)');
  });

  it('reports a none outcome and adds no context block when retrieval returns zero rows', async () => {
    const { messages, outcome } = await buildMessages(
      [{ role: 'user', content: 'anything' }],
      'http://x',
      {
        plan: async () => ({ needed: true, query: { term: 'x', kind: 'prose', expansion: 'none', limit: 5 } }),
        retrieve: async () => [],
      },
    );
    expect(outcome.status).toBe('none');
    expect(messages[0].content).not.toContain('dated working context');
  });

  it('reports an error outcome and adds no context block when retrieval throws', async () => {
    const { messages, outcome } = await buildMessages(
      [{ role: 'user', content: 'anything' }],
      'http://x',
      {
        plan: async () => ({ needed: true, query: { term: 'x', kind: 'prose', expansion: 'none', limit: 5 } }),
        retrieve: async () => { throw new Error('boom'); },
      },
    );
    expect(outcome.status).toBe('error');
    expect(messages[0].content).not.toContain('dated working context');
  });
});

describe('handleChatRequest', () => {
  it('returns 400 JSON on bad body', async () => {
    const req = new Request('http://x/api/chat', { method: 'POST', body: '{}' });
    const res = await handleChatRequest(req);
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
    await expect(res.json()).resolves.toMatchObject({ code: 'INVALID_REQUEST' });
  });

  it('streams provider deltas and sets a none retrieval header by default', async () => {
    async function* fakeStream(_msgs: ChatMessage[]) {
      yield 'Hi ';
      yield 'there';
    }
    const req = new Request('http://x/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    const res = await handleChatRequest(req, { stream: fakeStream as never, plan: notNeeded });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-context-retrieval')).toBe('none');
    expect(res.headers.get('x-context-retrieval-count')).toBeNull();
    expect(await res.text()).toBe('Hi there');
  });

  it('sets a hit retrieval header with a count when retrieval succeeds', async () => {
    async function* fakeStream(_msgs: ChatMessage[]) {
      yield 'answer';
    }
    const req = new Request('http://x/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'How did the Libera kernel settle?' }] }),
    });
    const res = await handleChatRequest(req, {
      stream: fakeStream as never,
      plan: async () => ({ needed: true, query: { term: 'kernel', kind: 'prose', expansion: 'none', limit: 5 } }),
      retrieve: async () => [exampleRow],
    });
    expect(res.headers.get('x-context-retrieval')).toBe('hit');
    expect(res.headers.get('x-context-retrieval-count')).toBe('1');
  });

  it('sets an error retrieval header when retrieval throws, and still streams the answer', async () => {
    async function* fakeStream(_msgs: ChatMessage[]) {
      yield 'answer';
    }
    const req = new Request('http://x/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'anything' }] }),
    });
    const res = await handleChatRequest(req, {
      stream: fakeStream as never,
      plan: async () => ({ needed: true, query: { term: 'x', kind: 'prose', expansion: 'none', limit: 5 } }),
      retrieve: async () => { throw new Error('boom'); },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get('x-context-retrieval')).toBe('error');
    expect(await res.text()).toBe('answer');
  });

  it('returns 502 JSON when the provider fails before streaming', async () => {
    async function* boom(_msgs: ChatMessage[]): AsyncGenerator<string> {
      throw new Error('bad key');
      // eslint-disable-next-line no-unreachable
      yield '';
    }
    const req = new Request('http://x/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    const res = await handleChatRequest(req, { stream: boom as never, plan: notNeeded });
    expect(res.status).toBe(502);
    expect(res.headers.get('content-type')).toContain('application/json');
    await expect(res.json()).resolves.toMatchObject({ code: 'PROVIDER_UNAVAILABLE' });
  });

  it('returns 429 with Retry-After when rate limited', async () => {
    const req = new Request('http://x/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    const res = await handleChatRequest(req, {
      checkLimit: async () => ({ ok: false, retryAfter: 42 }),
    });
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('42');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run api/_lib/chat-core.test.ts`
Expected: FAIL — `buildMessages` is still synchronous and takes one argument; new assertions and the `outcome`/header expectations fail or throw type errors.

- [ ] **Step 3: Write the implementation**

Replace the full contents of `api/_lib/chat-core.ts` with:

```ts
import { markdownAssistantInstructions, portfolioGrounding } from './config';
import { jsonError } from './http';
import { streamChat } from './provider';
import { checkRateLimit } from './rate-limit';
import { planContextQuery } from './context-query-planner';
import { retrieveContext } from './context-retrieval-client';
import type { CatalogRow, ContextQueryKind, ContextRow } from './context-index';
import type { ChatMessage, ChatRole } from './types';

const MAX_MESSAGES = 40;
const MAX_CHARS = 8000;
const CLIENT_ROLES: ChatRole[] = ['user', 'assistant'];

const CONTEXT_BLOCK_INSTRUCTIONS = [
  "The material below is dated working context drawn from Jeremy's own development",
  'history (past AI chat transcripts and code). It may be exploratory, superseded, or',
  'informal. Treat it as evidence of current or past thinking, never as more',
  'authoritative than the canonical profile above. Cite it as "as of <date>" when you',
  'draw on it.',
].join('\n');

type ValidResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; error: string };

export function validateChatBody(body: unknown): ValidResult {
  if (typeof body !== 'object' || body === null || !('messages' in body)) {
    return { ok: false, error: 'Request must include a messages array.' };
  }
  const messages = (body as { messages: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'messages must be a non-empty array.' };
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, error: 'Conversation is too long.' };
  }
  for (const m of messages) {
    if (
      typeof m !== 'object' || m === null ||
      !CLIENT_ROLES.includes((m as ChatMessage).role) ||
      typeof (m as ChatMessage).content !== 'string' ||
      (m as ChatMessage).content.length > MAX_CHARS
    ) {
      return { ok: false, error: 'Each message needs a valid role and content.' };
    }
  }
  return { ok: true, messages: messages as ChatMessage[] };
}

function formatContextRow(row: ContextRow | CatalogRow): string {
  const body = 'text' in row ? row.text : row.summary;
  return `[${row.project}, ${row.date}, ${row.filePath}] ${body}`;
}

function buildContextBlock(rows: Array<ContextRow | CatalogRow>): string {
  return [CONTEXT_BLOCK_INSTRUCTIONS, '', ...rows.map(formatContextRow)].join('\n');
}

export interface ContextRetrievalOutcome {
  status: 'hit' | 'none' | 'error';
  count?: number;
  term?: string;
  kind?: ContextQueryKind;
  planMs: number;
  retrievalMs?: number;
}

export interface BuildMessagesDeps {
  plan?: typeof planContextQuery;
  retrieve?: typeof retrieveContext;
}

export interface BuildMessagesResult {
  messages: ChatMessage[];
  outcome: ContextRetrievalOutcome;
}

export async function buildMessages(
  userMessages: ChatMessage[],
  origin: string,
  deps: BuildMessagesDeps = {},
): Promise<BuildMessagesResult> {
  const plan = deps.plan ?? planContextQuery;
  const retrieve = deps.retrieve ?? retrieveContext;
  const question = userMessages[userMessages.length - 1]?.content ?? '';
  const history = userMessages.slice(0, -1);

  const planStarted = Date.now();
  const decision = await plan(question, history);
  const planMs = Date.now() - planStarted;

  let contextBlock: string | null = null;
  let outcome: ContextRetrievalOutcome = { status: 'none', planMs };

  if (decision.needed) {
    const retrievalStarted = Date.now();
    try {
      const rows = await retrieve(decision.query, origin);
      const retrievalMs = Date.now() - retrievalStarted;
      if (rows.length > 0) {
        contextBlock = buildContextBlock(rows);
        outcome = {
          status: 'hit',
          count: rows.length,
          term: decision.query.term,
          kind: decision.query.kind,
          planMs,
          retrievalMs,
        };
      } else {
        outcome = {
          status: 'none',
          term: decision.query.term,
          kind: decision.query.kind,
          planMs,
          retrievalMs,
        };
      }
    } catch (error) {
      console.error('context retrieval failed:', error);
      outcome = {
        status: 'error',
        term: decision.query.term,
        kind: decision.query.kind,
        planMs,
        retrievalMs: Date.now() - retrievalStarted,
      };
    }
  }

  const systemParts = [portfolioGrounding()];
  if (contextBlock) systemParts.push(contextBlock);
  systemParts.push(markdownAssistantInstructions());

  return {
    messages: [{ role: 'system', content: systemParts.join('\n\n') }, ...userMessages],
    outcome,
  };
}

function logContextRetrievalOutcome(outcome: ContextRetrievalOutcome): void {
  const line = {
    route: 'chat',
    contextRetrieval: outcome.status,
    ...(outcome.kind !== undefined ? { kind: outcome.kind } : {}),
    ...(outcome.term !== undefined ? { term: outcome.term } : {}),
    ...(outcome.count !== undefined ? { resultCount: outcome.count } : {}),
    planMs: outcome.planMs,
    ...(outcome.retrievalMs !== undefined ? { retrievalMs: outcome.retrievalMs } : {}),
  };
  if (outcome.status === 'error') console.error(JSON.stringify(line));
  else console.log(JSON.stringify(line));
}

export async function handleChatRequest(
  request: Request,
  deps: {
    stream?: typeof streamChat;
    checkLimit?: typeof checkRateLimit;
    plan?: typeof planContextQuery;
    retrieve?: typeof retrieveContext;
  } = {},
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError('Method not allowed.', 'METHOD_NOT_ALLOWED', 405);
  }

  const checkLimit = deps.checkLimit ?? checkRateLimit;
  const limit = await checkLimit(request);
  if (!limit.ok) {
    return jsonError(
      'Too many requests — please slow down.',
      'RATE_LIMITED',
      429,
      limit.retryAfter === undefined ? {} : { 'retry-after': String(limit.retryAfter) },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 100_000) {
    return jsonError('Request too large.', 'REQUEST_TOO_LARGE', 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON.', 'INVALID_JSON', 400);
  }

  const valid = validateChatBody(body);
  if (!valid.ok) return jsonError(valid.error, 'INVALID_REQUEST', 400);

  const origin = new URL(request.url).origin;
  const { messages, outcome } = await buildMessages(valid.messages, origin, {
    plan: deps.plan,
    retrieve: deps.retrieve,
  });
  logContextRetrievalOutcome(outcome);

  const stream = deps.stream ?? streamChat;
  const iterator = stream(messages)[Symbol.asyncIterator]();

  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch (err) {
    console.error('chat provider setup error:', err);
    return jsonError('The assistant is unavailable right now.', 'PROVIDER_UNAVAILABLE', 502);
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done && first.value) controller.enqueue(encoder.encode(first.value));
        while (true) {
          const { done, value } = await iterator.next();
          if (done) break;
          if (value) controller.enqueue(encoder.encode(value));
        }
      } catch (err) {
        controller.enqueue(encoder.encode('\n\n[error] The assistant hit a snag. Please try again.'));
        console.error('chat stream error:', err);
      } finally {
        controller.close();
      }
    },
  });

  const headers: Record<string, string> = {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    'x-context-retrieval': outcome.status,
  };
  if (outcome.status === 'hit' && outcome.count !== undefined) {
    headers['x-context-retrieval-count'] = String(outcome.count);
  }

  return new Response(readable, { status: 200, headers });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run api/_lib/chat-core.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Fix the other caller of `buildMessages`**

`eval/run.ts` is the only other place that calls `buildMessages` (found by
`grep -rn "buildMessages" --include="*.ts" .`). Its offline quality-eval
harness calls the real OpenRouter provider directly (no HTTP origin, no live
`/api/context-query` to call), so it must keep using profile-only grounding —
adding retrieval here would silently change the eval's cost/behavior model,
which is out of scope for this feature. Replace lines 16-21 of `eval/run.ts`:

```ts
async function chat(conversation: ChatMessage[]): Promise<string> {
  const messages = buildMessages(conversation);
  let output = '';
  for await (const delta of streamChat(messages)) output += delta;
  return output;
}
```

with:

```ts
async function chat(conversation: ChatMessage[]): Promise<string> {
  // No live deployment to call /api/context-query against here, so retrieval
  // is always declined — the eval measures profile-only grounding quality,
  // unchanged by this feature. The origin is unused in that case.
  const { messages } = await buildMessages(conversation, 'http://eval.local', {
    plan: async () => ({ needed: false }),
  });
  let output = '';
  for await (const delta of streamChat(messages)) output += delta;
  return output;
}
```

- [ ] **Step 6: Run the full test suite and typecheck**

Run: `npm test && npm run typecheck`
Expected: All app + Facia tests pass; no type errors. (`api/chat.test.ts` and `api/answer.test.ts` are unaffected — they don't exercise `buildMessages` directly.)

- [ ] **Step 7: Commit**

```bash
git add api/_lib/chat-core.ts api/_lib/chat-core.test.ts eval/run.ts
git commit -m "feat: wire context-query planning and retrieval into chat"
```

---

### Task 4: Production smoke-test script

**Files:**
- Create: `scripts/verify-chat-context-prod.mjs`
- Modify: `package.json` (add an npm script entry)

**Interfaces:**
- Consumes: nothing from earlier tasks directly — it's a standalone script that talks to the deployed `/api/chat` HTTP endpoint and reads the `x-context-retrieval`/`x-context-retrieval-count` headers Task 3 added.
- Produces: `npm run verify:chat-context-prod -- --url=<deployed chat URL> --question=<corpus-specific question>`. Exits non-zero (via an uncaught thrown `Error`) when the header contract isn't satisfied.

This script has no automated test, matching the existing `scripts/context-*.mjs` scripts (none of which have `.test.ts` files) — it's a manual/on-demand production check, not part of `npm test`.

- [ ] **Step 1: Write the script**

Create `scripts/verify-chat-context-prod.mjs`:

```js
#!/usr/bin/env node
const urlArg = process.argv.find((argument) => argument.startsWith('--url='));
const url = urlArg?.slice('--url='.length) ?? 'https://www.jeremycapps.com/api/chat';

const questionArg = process.argv.find((argument) => argument.startsWith('--question='));
const question = questionArg?.slice('--question='.length)
  ?? 'What did the context-index query planner decide when it has no good match?';

const response = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
});

const contextRetrieval = response.headers.get('x-context-retrieval');
const resultCount = Number(response.headers.get('x-context-retrieval-count') ?? '0');
const answer = await response.text();

if (contextRetrieval !== 'hit' || resultCount <= 0) {
  throw new Error(
    `expected x-context-retrieval: hit with a positive count, got "${contextRetrieval}" / ${resultCount} `
    + `(response status ${response.status}). Try a --question= that is more specific to the private corpus.`,
  );
}

process.stdout.write(`${JSON.stringify({
  url,
  question,
  contextRetrieval,
  resultCount,
  answerPreview: answer.slice(0, 300),
}, null, 2)}\n`);
```

- [ ] **Step 2: Add the npm script**

In `package.json`, in the `"scripts"` object, add this entry after `"context:upload": "node scripts/context-upload.mjs"`:

```json
    "context:upload": "node scripts/context-upload.mjs",
    "verify:chat-context-prod": "node scripts/verify-chat-context-prod.mjs"
```

- [ ] **Step 3: Verify the script runs against local dev**

Run: `npm run dev` in one terminal, then in another:
`npm run verify:chat-context-prod -- --url=http://localhost:5173/api/chat --question="anything"`
Expected: the script either prints the JSON report (if local env vars for `OPENROUTER_API_KEY`/`CONTEXT_QUERY_API_KEY`/R2 are configured and retrieval fires) or throws the descriptive `Error` above (if not configured, or the question didn't need retrieval) — either outcome confirms the script executes and reads the response headers correctly. This step is a manual sanity check, not an automated test; move on once you've observed one of these two outcomes.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-chat-context-prod.mjs package.json
git commit -m "chore: add a production smoke test for chat context retrieval"
```

---

### Task 5: Record the wiring in the context-index docs

**Files:**
- Modify: `docs/context-index.md`

**Interfaces:** None — documentation only.

- [ ] **Step 1: Update the "Not yet done" section**

In `docs/context-index.md`, replace the `## Not yet done` section (from `## Not yet done` to the end of the file) with:

```markdown
## Natural-language orchestration

`/api/chat` now implements the intended boundary end to end:

```text
browser -> POST /api/chat -> query-planning model -> validated ContextQuery JSON
        -> server-side DuckDB retrieval -> answer model -> readable streamed answer
```

`api/_lib/context-query-planner.ts` runs one structured-generation call per chat
turn to decide whether the question benefits from the private corpus, and with
what `term`/`kind`/`expansion`/`limit`. `api/_lib/context-retrieval-client.ts`
makes a same-origin, bearer-authenticated call to this endpoint from the Edge
`/api/chat` function when the planner says so. Any failure at either step —
refusal, malformed JSON, timeout, missing key, non-200, network error — falls
back silently to profile-only grounding; the chat response never errors or
stalls because of this feature. See
`docs/superpowers/specs/2026-08-29-chat-context-retrieval-wiring-design.md` for
the full design.

The response carries `x-context-retrieval: hit|none|error` and, when `hit`,
`x-context-retrieval-count`, so the wiring can be checked after a deploy with
`npm run verify:chat-context-prod -- --url=<deployed chat URL> --question=<corpus-specific question>`,
by inspecting Vercel's function logs for the `{"route":"chat",...}` line each
request emits, or by asking the live chat UI a corpus-specific question
directly. This has not yet been re-run against the current production
deployment after this wiring — do that once this change ships, then record the
result the same way prior context-index milestones were recorded (see git log
for `docs: record production ...` commits).
```

- [ ] **Step 2: Commit**

```bash
git add docs/context-index.md
git commit -m "docs: record that chat context-retrieval wiring is implemented"
```

---

## Not part of this plan (manual, post-deploy)

Deploying to production and running the live verification is an operational
action outside this plan's scope — it should happen as its own explicit,
user-approved step after these tasks land:

1. Deploy (`vercel deploy --prod` or the project's normal deploy path).
2. Run `npm run verify:chat-context-prod -- --url=https://www.jeremycapps.com/api/chat --question=<something only the private corpus would answer well>`.
3. Ask the live chat UI the same kind of question and read the streamed answer.
4. Check Vercel's function logs for the `{"route":"chat","contextRetrieval":...}` line.
5. Commit a short `docs: record production chat-context-retrieval verification` update to `docs/context-index.md`, in the style of the existing `docs: record production ...` commits, replacing the "has not yet been re-run" sentence above with the actual result.
