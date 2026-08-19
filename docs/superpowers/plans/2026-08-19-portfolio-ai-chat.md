# Portfolio AI Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Replit-extracted `Context` UI into a standalone, deployable portfolio whose chat streams real answers about Jeremy from an open-weights model via OpenRouter.

**Architecture:** A Vite + React + TypeScript SPA calls a single streaming endpoint `POST /api/chat`. A framework-agnostic core (`handleChatRequest(Request) → Response`) is served two ways: a Vercel **Edge** function in production, and a **Vite dev middleware** locally (so `npm run dev` streams chat with no Vercel CLI). The core prepends a system prompt built from `content/profile.md` (compiled to a TS string module, since Edge has no `fs`), then streams text deltas from a pluggable provider. The default provider talks to OpenRouter over plain `fetch`/SSE behind a `streamChat()` interface, so Claude or any OpenAI-compatible host drops in later.

**Tech Stack:** Vite, React 18, TypeScript, Tailwind v4, Radix UI, Vercel Edge Functions, OpenRouter (OpenAI-compatible), Vitest.

**Spec:** `docs/superpowers/specs/2026-08-19-portfolio-ai-chat-design.md`

## Global Constraints

- Runs standalone: `npm install && npm run dev` works with **no** Replit env vars (`PORT`/`BASE_PATH` no longer required).
- No pnpm `catalog:` versions anywhere in `package.json`; all deps are concrete.
- **The provider API key is server-side only** (`OPENROUTER_API_KEY`); it must never reach the client bundle or logs.
- Provider is swappable via `CHAT_PROVIDER` (default `openrouter`); model via `CHAT_MODEL` (default `meta-llama/llama-3.3-70b-instruct`).
- Grounding content lives in `content/profile.md`; server code consumes the generated `api/_lib/profile.generated.ts`, never re-reads the `.md` at runtime.
- Preserve existing `data-testid` attributes in `src/App.tsx`; add new ones for chat messages.
- TypeScript strict; `npm run typecheck` and `npm run build` must pass at the end of every task that touches code.

---

## File Structure

**Created:**
- `scripts/gen-profile.mjs` — compiles `content/profile.md` → `api/_lib/profile.generated.ts`
- `api/_lib/profile.generated.ts` — generated `export const PROFILE: string`
- `api/_lib/config.ts` — reads env (`CHAT_PROVIDER`, `CHAT_MODEL`, `OPENROUTER_API_KEY`) + builds system prompt
- `api/_lib/types.ts` — `ChatMessage`, `ChatRole`, provider/stream types
- `api/_lib/provider.ts` — `streamChat()` dispatcher + provider selection
- `api/_lib/openrouter.ts` — OpenRouter SSE implementation of `streamChat`
- `api/_lib/chat-core.ts` — `validateChatBody`, `buildMessages`, `handleChatRequest`
- `api/chat.ts` — Vercel Edge entrypoint (adapts to `handleChatRequest`)
- `src/lib/chat.ts` — client `sendChat()` + `readTextStream()`
- `src/components/chat-view.tsx` — transcript/message list component
- `vercel.json`, `.env.example`
- Test files: `api/_lib/openrouter.test.ts`, `api/_lib/chat-core.test.ts`, `src/lib/chat.test.ts`, `vitest.config.ts`

**Modified:**
- `package.json` — de-catalog deps, add scripts + Vitest + Vercel types
- `vite.config.ts` — drop Replit plugins + PORT/BASE_PATH; add dev API middleware
- `tsconfig.json` — self-contained (no missing `extends`/`references`)
- `src/App.tsx` — wire composer to `/api/chat`, render transcript, error states
- `README.md` — standalone run + deploy instructions

---

## Task 1: De-Replit dependencies and scripts

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: a `package.json` with concrete versions, npm scripts `dev`/`build`/`preview`/`typecheck`/`test`/`gen:profile`/`predev`/`prebuild`, and a committed `package-lock.json`.

- [ ] **Step 1: Remove Replit + catalog deps and add scripts.** Edit `package.json`: delete the three `@replit/vite-plugin-*` devDependencies. Replace the `scripts` block with:

```json
"scripts": {
  "gen:profile": "node scripts/gen-profile.mjs",
  "predev": "npm run gen:profile",
  "dev": "vite",
  "prebuild": "npm run gen:profile",
  "build": "vite build",
  "preview": "vite preview",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
}
```

- [ ] **Step 2: Resolve all `catalog:` versions by reinstalling.** Every dependency whose version is the string `"catalog:"` must become concrete. Run this from the repo root (this rewrites `package.json` with real versions and creates `package-lock.json`):

```bash
cd /Users/jeremycapps/Dev/portfolio
npm install react@^18 react-dom@^18 \
  @types/react@^18 @types/react-dom@^18 @types/node@^22 \
  vite@^6 @vitejs/plugin-react@^4 \
  tailwindcss@^4 @tailwindcss/vite@^4 \
  @tanstack/react-query@^5 framer-motion@^11 lucide-react@latest \
  clsx@latest class-variance-authority@latest tailwind-merge@latest zod@^3
```

- [ ] **Step 3: Add dev tooling (Vitest + Vercel types).** Run:

```bash
cd /Users/jeremycapps/Dev/portfolio
npm install -D vitest@^2 @vercel/node@^5
```

- [ ] **Step 4: Verify no `catalog:` remains.** Run:

```bash
cd /Users/jeremycapps/Dev/portfolio && ! grep -q '"catalog:"' package.json && echo "clean"
```

Expected: prints `clean` (no catalog refs left).

- [ ] **Step 5: Commit.**

```bash
cd /Users/jeremycapps/Dev/portfolio
git add package.json package-lock.json
git commit -m "build: de-Replit deps, pin versions, add scripts"
```

---

## Task 2: Standalone Vite + TypeScript config

**Files:**
- Modify: `vite.config.ts`
- Modify: `tsconfig.json`

**Interfaces:**
- Produces: a `vite.config.ts` that builds with no env vars and mounts nothing yet beyond React + Tailwind (dev API middleware is added in Task 7); a self-contained `tsconfig.json` with the `@/*` alias.

- [ ] **Step 1: Rewrite `vite.config.ts`** to remove the Replit plugins and the `PORT`/`BASE_PATH` requirements:

```ts
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: { outDir: 'dist', emptyOutDir: true },
  server: { port: Number(process.env.PORT) || 5173 },
});
```

- [ ] **Step 2: Rewrite `tsconfig.json`** to be self-contained (no `extends` of a missing parent, no cross-package `references`):

```json
{
  "include": ["src", "api", "scripts", "vite.config.ts"],
  "exclude": ["node_modules", "dist"],
  "compilerOptions": {
    "target": "esnext",
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "lib": ["esnext", "dom", "dom.iterable"],
    "types": ["node", "vite/client"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```

- [ ] **Step 3: Fix the `main.tsx` router base if needed.** `src/App.tsx` uses `import.meta.env.BASE_URL`; that still works. No change needed — just confirm the file still compiles in Step 4 of Task 3.

- [ ] **Step 4: Commit.**

```bash
cd /Users/jeremycapps/Dev/portfolio
git add vite.config.ts tsconfig.json
git commit -m "build: standalone vite + tsconfig, drop Replit env requirements"
```

---

## Task 3: Verify the standalone app builds and runs

**Files:** none (validation task)

**Interfaces:**
- Consumes: Tasks 1–2.
- Produces: confidence that the de-Replit foundation works before backend work.

- [ ] **Step 1: Typecheck.** Note: this will fail if `api/**` is referenced but absent — at this point `api/` is empty, so temporarily narrow `include` is unnecessary because tsc only checks existing files. Run:

```bash
cd /Users/jeremycapps/Dev/portfolio && npm run typecheck
```

Expected: PASS (no errors). If errors reference `@assets` or Replit banner imports, remove those leftover references.

- [ ] **Step 2: Build.** Run:

```bash
cd /Users/jeremycapps/Dev/portfolio && npm run gen:profile 2>/dev/null; npx vite build
```

Note: `gen:profile` doesn't exist yet as a working script until Task 4 — if `prebuild` fails, run `npx vite build` directly for this check. Expected: build completes, `dist/` produced.

- [ ] **Step 3: Dev smoke test.** Run the dev server briefly and confirm it serves HTML:

```bash
cd /Users/jeremycapps/Dev/portfolio && (npx vite --port 5173 &) && sleep 3 && curl -s http://localhost:5173/ | grep -q '<div id="root"' && echo "serves" ; pkill -f "vite --port 5173"
```

Expected: prints `serves`.

- [ ] **Step 4: Commit (only if leftover fixes were needed).** If you changed files to make it build:

```bash
cd /Users/jeremycapps/Dev/portfolio
git add -A && git commit -m "build: fix standalone build leftovers"
```

---

## Task 4: Profile content codegen

**Files:**
- Create: `scripts/gen-profile.mjs`
- Create: `api/_lib/profile.generated.ts` (produced by the script)
- Modify: `.gitignore` (optional — we commit the generated file)

**Interfaces:**
- Produces: `export const PROFILE: string` in `api/_lib/profile.generated.ts`, regenerated by `npm run gen:profile`.

- [ ] **Step 1: Write the generator.** Create `scripts/gen-profile.mjs`:

```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'content/profile.md');
const out = resolve(root, 'api/_lib/profile.generated.ts');

const md = readFileSync(src, 'utf8');
// JSON.stringify safely escapes backticks, backslashes, and newlines.
const body = `// AUTO-GENERATED from content/profile.md by scripts/gen-profile.mjs. Do not edit.\nexport const PROFILE = ${JSON.stringify(md)};\n`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, body, 'utf8');
console.log(`gen-profile: wrote ${out} (${md.length} chars)`);
```

- [ ] **Step 2: Run it.**

```bash
cd /Users/jeremycapps/Dev/portfolio && node scripts/gen-profile.mjs
```

Expected: prints `gen-profile: wrote .../api/_lib/profile.generated.ts (NNNN chars)`.

- [ ] **Step 3: Verify the generated module imports cleanly.**

```bash
cd /Users/jeremycapps/Dev/portfolio && node -e "import('./api/_lib/profile.generated.ts').catch(()=>{}); const s=require('fs').readFileSync('api/_lib/profile.generated.ts','utf8'); if(!s.includes('export const PROFILE')) throw new Error('bad gen'); console.log('ok')"
```

Expected: prints `ok`.

- [ ] **Step 4: Commit** (commit the generated file so imports resolve even before a build runs):

```bash
cd /Users/jeremycapps/Dev/portfolio
git add scripts/gen-profile.mjs api/_lib/profile.generated.ts
git commit -m "build: codegen profile.md into a TS string module"
```

---

## Task 5: Provider layer (types + OpenRouter streaming)

**Files:**
- Create: `api/_lib/types.ts`
- Create: `api/_lib/config.ts`
- Create: `api/_lib/provider.ts`
- Create: `api/_lib/openrouter.ts`
- Test: `api/_lib/openrouter.test.ts`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces:
  - `type ChatRole = 'system' | 'user' | 'assistant'`
  - `interface ChatMessage { role: ChatRole; content: string }`
  - `interface StreamDeps { fetchImpl?: typeof fetch; signal?: AbortSignal }`
  - `function streamChat(messages: ChatMessage[], deps?: StreamDeps): AsyncGenerator<string>` (in `provider.ts`, dispatches by `CHAT_PROVIDER`)
  - `function streamOpenRouter(messages: ChatMessage[], deps?: StreamDeps): AsyncGenerator<string>` (in `openrouter.ts`)
  - `getConfig()` returning `{ provider, model, openRouterKey }` from env (in `config.ts`)

- [ ] **Step 1: Add `vitest.config.ts`.**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: { environment: 'node', include: ['**/*.test.ts'] },
});
```

- [ ] **Step 2: Write `api/_lib/types.ts`.**

```ts
export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface StreamDeps {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}
```

- [ ] **Step 3: Write `api/_lib/config.ts`.**

```ts
import { PROFILE } from './profile.generated.ts';

export interface AppConfig {
  provider: string;
  model: string;
  openRouterKey: string | undefined;
}

export function getConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    provider: env.CHAT_PROVIDER ?? 'openrouter',
    model: env.CHAT_MODEL ?? 'meta-llama/llama-3.3-70b-instruct',
    openRouterKey: env.OPENROUTER_API_KEY,
  };
}

export function systemPrompt(): string {
  return PROFILE;
}
```

- [ ] **Step 4: Write the failing test** `api/_lib/openrouter.test.ts` (drives the SSE parser via a stubbed `fetch`):

```ts
import { describe, it, expect } from 'vitest';
import { streamOpenRouter } from './openrouter.ts';
import type { ChatMessage } from './types.ts';

function sseResponse(chunks: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      const enc = new TextEncoder();
      for (const c of chunks) controller.enqueue(enc.encode(c));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

const msgs: ChatMessage[] = [{ role: 'user', content: 'hi' }];

describe('streamOpenRouter', () => {
  it('yields concatenated content deltas from SSE frames', async () => {
    const fetchImpl = (async () =>
      sseResponse([
        'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
        'data: [DONE]\n\n',
      ])) as unknown as typeof fetch;

    const out: string[] = [];
    for await (const d of streamOpenRouter(msgs, { fetchImpl })) out.push(d);
    expect(out.join('')).toBe('Hello');
  });

  it('throws a friendly error on non-200', async () => {
    const fetchImpl = (async () =>
      new Response('nope', { status: 401 })) as unknown as typeof fetch;
    await expect(async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _ of streamOpenRouter(msgs, { fetchImpl })) { /* drain */ }
    }).rejects.toThrow(/provider request failed: 401/i);
  });
});
```

- [ ] **Step 5: Run the test to verify it fails.**

```bash
cd /Users/jeremycapps/Dev/portfolio && npx vitest run api/_lib/openrouter.test.ts
```

Expected: FAIL (`streamOpenRouter` not found).

- [ ] **Step 6: Write `api/_lib/openrouter.ts`.**

```ts
import { getConfig } from './config.ts';
import type { ChatMessage, StreamDeps } from './types.ts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function* streamOpenRouter(
  messages: ChatMessage[],
  deps: StreamDeps = {},
): AsyncGenerator<string> {
  const cfg = getConfig();
  const doFetch = deps.fetchImpl ?? fetch;

  const res = await doFetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.openRouterKey ?? ''}`,
      'HTTP-Referer': 'https://jeremycapps.com',
      'X-Title': 'Jeremy Capps Portfolio',
    },
    body: JSON.stringify({ model: cfg.model, messages, stream: true }),
    signal: deps.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`provider request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }
}
```

- [ ] **Step 7: Write `api/_lib/provider.ts`.**

```ts
import { getConfig } from './config.ts';
import { streamOpenRouter } from './openrouter.ts';
import type { ChatMessage, StreamDeps } from './types.ts';

export function streamChat(messages: ChatMessage[], deps?: StreamDeps): AsyncGenerator<string> {
  const { provider } = getConfig();
  switch (provider) {
    case 'openrouter':
      return streamOpenRouter(messages, deps);
    default:
      throw new Error(`unknown CHAT_PROVIDER: ${provider}`);
  }
}
```

- [ ] **Step 8: Run the tests to verify they pass.**

```bash
cd /Users/jeremycapps/Dev/portfolio && npx vitest run api/_lib/openrouter.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 9: Commit.**

```bash
cd /Users/jeremycapps/Dev/portfolio
git add api/_lib/types.ts api/_lib/config.ts api/_lib/provider.ts api/_lib/openrouter.ts api/_lib/openrouter.test.ts vitest.config.ts
git commit -m "feat: provider layer with OpenRouter SSE streaming"
```

---

## Task 6: Chat core (validation, message build, request handler)

**Files:**
- Create: `api/_lib/chat-core.ts`
- Test: `api/_lib/chat-core.test.ts`

**Interfaces:**
- Consumes: `ChatMessage`/`StreamDeps` (Task 5), `streamChat`, `systemPrompt()`.
- Produces:
  - `function validateChatBody(body: unknown): { ok: true; messages: ChatMessage[] } | { ok: false; error: string }`
  - `function buildMessages(userMessages: ChatMessage[]): ChatMessage[]` (prepends the system prompt)
  - `function handleChatRequest(request: Request, deps?: { stream?: typeof streamChat }): Promise<Response>` — returns a streaming `text/plain` `Response`, or a JSON error with the right status.

- [ ] **Step 1: Write the failing test** `api/_lib/chat-core.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { validateChatBody, buildMessages, handleChatRequest } from './chat-core.ts';
import type { ChatMessage } from './types.ts';

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
});

describe('buildMessages', () => {
  it('prepends exactly one system message', () => {
    const built = buildMessages([{ role: 'user', content: 'hi' }]);
    expect(built[0].role).toBe('system');
    expect(built.filter((m) => m.role === 'system')).toHaveLength(1);
    expect(built[built.length - 1]).toEqual({ role: 'user', content: 'hi' });
  });
});

describe('handleChatRequest', () => {
  it('returns 400 JSON on bad body', async () => {
    const req = new Request('http://x/api/chat', { method: 'POST', body: '{}' });
    const res = await handleChatRequest(req);
    expect(res.status).toBe(400);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it('streams provider deltas as the response body', async () => {
    async function* fakeStream(_msgs: ChatMessage[]) {
      yield 'Hi ';
      yield 'there';
    }
    const req = new Request('http://x/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'hi' }] }),
    });
    const res = await handleChatRequest(req, { stream: fakeStream as never });
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('Hi there');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

```bash
cd /Users/jeremycapps/Dev/portfolio && npx vitest run api/_lib/chat-core.test.ts
```

Expected: FAIL (`chat-core` exports not found).

- [ ] **Step 3: Write `api/_lib/chat-core.ts`.**

```ts
import { systemPrompt } from './config.ts';
import { streamChat } from './provider.ts';
import type { ChatMessage, ChatRole } from './types.ts';

const MAX_MESSAGES = 40;
const MAX_CHARS = 8000;
const ROLES: ChatRole[] = ['system', 'user', 'assistant'];

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
      !ROLES.includes((m as ChatMessage).role) ||
      typeof (m as ChatMessage).content !== 'string' ||
      (m as ChatMessage).content.length > MAX_CHARS
    ) {
      return { ok: false, error: 'Each message needs a valid role and content.' };
    }
  }
  return { ok: true, messages: messages as ChatMessage[] };
}

export function buildMessages(userMessages: ChatMessage[]): ChatMessage[] {
  return [{ role: 'system', content: systemPrompt() }, ...userMessages];
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function handleChatRequest(
  request: Request,
  deps: { stream?: typeof streamChat } = {},
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed.', 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON.', 400);
  }

  const valid = validateChatBody(body);
  if (!valid.ok) return jsonError(valid.error, 400);

  const stream = deps.stream ?? streamChat;
  const messages = buildMessages(valid.messages);

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of stream(messages)) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        // Stream already started (200 sent); surface a trailing marker.
        controller.enqueue(encoder.encode('\n\n[error] The assistant hit a snag. Please try again.'));
        console.error('chat stream error:', err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass.**

```bash
cd /Users/jeremycapps/Dev/portfolio && npx vitest run api/_lib/chat-core.test.ts
```

Expected: PASS (all cases).

- [ ] **Step 5: Commit.**

```bash
cd /Users/jeremycapps/Dev/portfolio
git add api/_lib/chat-core.ts api/_lib/chat-core.test.ts
git commit -m "feat: chat-core request handler with validation and streaming"
```

---

## Task 7: Vite dev middleware + Vercel Edge entrypoint

**Files:**
- Modify: `vite.config.ts`
- Create: `api/chat.ts`

**Interfaces:**
- Consumes: `handleChatRequest` (Task 6).
- Produces: `POST /api/chat` served in dev (Vite middleware) and prod (Edge function), both delegating to the same core.

- [ ] **Step 1: Add a dev middleware plugin to `vite.config.ts`.** Insert this plugin (converts Node req → Web `Request`, streams the Web `Response` back) and add it to `plugins`:

```ts
import type { Plugin } from 'vite';

function devChatApi(): Plugin {
  return {
    name: 'dev-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        const { handleChatRequest } = await server.ssrLoadModule('/api/_lib/chat-core.ts');
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const request = new Request('http://localhost/api/chat', {
          method: req.method,
          headers: req.headers as Record<string, string>,
          body: chunks.length ? Buffer.concat(chunks) : undefined,
        });
        const response: Response = await handleChatRequest(request);
        res.statusCode = response.status;
        response.headers.forEach((v, k) => res.setHeader(k, v));
        if (response.body) {
          const reader = response.body.getReader();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(Buffer.from(value));
          }
        }
        res.end();
      });
    },
  };
}
```

Then set `plugins: [react(), tailwindcss(), devChatApi()]`. (Requires `OPENROUTER_API_KEY` in the shell/`.env` for real responses; without it the provider returns a 401 that surfaces as the friendly trailing error.)

- [ ] **Step 2: Write the Edge entrypoint `api/chat.ts`.**

```ts
import { handleChatRequest } from './_lib/chat-core.ts';

export const config = { runtime: 'edge' };

export default function handler(request: Request): Promise<Response> {
  return handleChatRequest(request);
}
```

- [ ] **Step 3: Manual dev smoke test with a stub key.** Confirm the route is wired (validation path needs no real key):

```bash
cd /Users/jeremycapps/Dev/portfolio && (npx vite --port 5174 &) && sleep 3 && \
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5174/api/chat -H 'content-type: application/json' -d '{}' ; \
  pkill -f "vite --port 5174"
```

Expected: prints `400` (validation rejects empty body → route is mounted).

- [ ] **Step 4: Typecheck.**

```bash
cd /Users/jeremycapps/Dev/portfolio && npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
cd /Users/jeremycapps/Dev/portfolio
git add vite.config.ts api/chat.ts
git commit -m "feat: serve /api/chat via Vite dev middleware and Vercel Edge"
```

---

## Task 8: Client chat library

**Files:**
- Create: `src/lib/chat.ts`
- Test: `src/lib/chat.test.ts`

**Interfaces:**
- Produces:
  - `interface ClientMessage { role: 'user' | 'assistant'; content: string }`
  - `async function readTextStream(res: Response, onDelta: (t: string) => void): Promise<void>`
  - `async function sendChat(messages: ClientMessage[], opts: { onDelta: (t: string) => void; signal?: AbortSignal }): Promise<void>`

- [ ] **Step 1: Write the failing test** `src/lib/chat.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readTextStream } from './chat.ts';

function textStream(parts: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      const enc = new TextEncoder();
      for (const p of parts) c.enqueue(enc.encode(p));
      c.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe('readTextStream', () => {
  it('invokes onDelta for each chunk and accumulates full text', async () => {
    const got: string[] = [];
    await readTextStream(textStream(['Hel', 'lo!']), (t) => got.push(t));
    expect(got.join('')).toBe('Hello!');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails.**

```bash
cd /Users/jeremycapps/Dev/portfolio && npx vitest run src/lib/chat.test.ts
```

Expected: FAIL (`readTextStream` not found).

- [ ] **Step 3: Write `src/lib/chat.ts`.**

```ts
export interface ClientMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function readTextStream(
  res: Response,
  onDelta: (t: string) => void,
): Promise<void> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onDelta(decoder.decode(value, { stream: true }));
  }
}

export async function sendChat(
  messages: ClientMessage[],
  opts: { onDelta: (t: string) => void; signal?: AbortSignal },
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages }),
    signal: opts.signal,
  });
  if (!res.ok) {
    let msg = 'The assistant is unavailable right now.';
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* non-JSON */ }
    throw new Error(msg);
  }
  await readTextStream(res, opts.onDelta);
}
```

- [ ] **Step 4: Run the test to verify it passes.**

```bash
cd /Users/jeremycapps/Dev/portfolio && npx vitest run src/lib/chat.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
cd /Users/jeremycapps/Dev/portfolio
git add src/lib/chat.ts src/lib/chat.test.ts
git commit -m "feat: client chat helper with streaming reader"
```

---

## Task 9: Wire the UI — transcript and streaming composer

**Files:**
- Create: `src/components/chat-view.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `sendChat`, `ClientMessage` (Task 8).
- Produces: a working conversation — first send transitions from the hero to a transcript; assistant text streams in; errors render inline; a "New chat" reset returns to the hero.

- [ ] **Step 1: Create `src/components/chat-view.tsx`** (presentational transcript):

```tsx
import type { ClientMessage } from '@/lib/chat';

interface ChatViewProps {
  messages: ClientMessage[];
  streaming: boolean;
  error: string | null;
}

export function ChatView({ messages, streaming, error }: ChatViewProps) {
  return (
    <div className="chat-view" data-testid="chat-view">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`chat-bubble chat-bubble-${m.role}`}
          data-testid={`chat-message-${m.role}-${i}`}
        >
          {m.content || (streaming && i === messages.length - 1 ? '…' : '')}
        </div>
      ))}
      {error && (
        <div className="chat-error" role="alert" data-testid="chat-error">
          {error}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire state into `src/App.tsx`.** In the `Home` component, add chat state near the other `useState` hooks:

```tsx
import { ChatView } from '@/components/chat-view';
import { sendChat, type ClientMessage } from '@/lib/chat';
// ...
const [messages, setMessages] = useState<ClientMessage[]>([]);
const [streaming, setStreaming] = useState(false);
const [chatError, setChatError] = useState<string | null>(null);
const hasConversation = messages.length > 0;
```

- [ ] **Step 3: Replace the fake `handlePromptSubmit` body** with a real streaming send:

```tsx
const handlePromptSubmit = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault();
  const cleanPrompt = prompt.trim();
  if (!cleanPrompt || streaming) {
    if (!cleanPrompt) {
      setStatusTone('error');
      setStatusMessage('Write a question first, then send it to Context.');
    }
    return;
  }

  setStatusMessage('');
  setChatError(null);
  const next: ClientMessage[] = [...messages, { role: 'user', content: cleanPrompt }];
  // Add an empty assistant message we stream into.
  setMessages([...next, { role: 'assistant', content: '' }]);
  setPrompt('');
  setStreaming(true);

  try {
    await sendChat(next, {
      onDelta: (t) =>
        setMessages((cur) => {
          const copy = cur.slice();
          const last = copy[copy.length - 1];
          copy[copy.length - 1] = { ...last, content: last.content + t };
          return copy;
        }),
    });
  } catch (err) {
    setChatError(err instanceof Error ? err.message : 'Something went wrong.');
    // Drop the empty assistant placeholder on hard failure.
    setMessages((cur) =>
      cur[cur.length - 1]?.content === '' ? cur.slice(0, -1) : cur,
    );
  } finally {
    setStreaming(false);
  }
};
```

- [ ] **Step 4: Render the transcript.** In the JSX, immediately below the `intro` block (the hero), show the transcript once a conversation exists, and add a reset control. Insert:

```tsx
{hasConversation && (
  <>
    <button
      className="chat-reset"
      type="button"
      onClick={() => { setMessages([]); setChatError(null); }}
      data-testid="button-new-chat"
    >
      New chat
    </button>
    <ChatView messages={messages} streaming={streaming} error={chatError} />
  </>
)}
```

Also update the submit button's `disabled` to `disabled={!prompt.trim() || streaming}`.

- [ ] **Step 5: Add minimal styles.** Append to `src/index.css`:

```css
.chat-view { display: flex; flex-direction: column; gap: 0.75rem; margin: 1.5rem 0; }
.chat-bubble { padding: 0.75rem 1rem; border-radius: 0.75rem; max-width: 42rem; white-space: pre-wrap; line-height: 1.5; }
.chat-bubble-user { align-self: flex-end; background: rgba(120,120,140,0.16); }
.chat-bubble-assistant { align-self: flex-start; background: rgba(120,120,140,0.06); }
.chat-error { color: #b4232a; font-size: 0.9rem; }
.chat-reset { align-self: flex-end; background: none; border: 0; cursor: pointer; opacity: 0.7; font: inherit; }
.chat-reset:hover { opacity: 1; }
```

- [ ] **Step 6: Typecheck + build.**

```bash
cd /Users/jeremycapps/Dev/portfolio && npm run typecheck && npx vite build
```

Expected: both PASS.

- [ ] **Step 7: Manual streaming check (needs a real key).** Put `OPENROUTER_API_KEY=...` in `.env`, run `npm run dev`, open the app, ask "What did Jeremy build at Zocdoc?", and confirm text streams into an assistant bubble. (If no key is available, confirm the friendly error path instead.)

- [ ] **Step 8: Commit.**

```bash
cd /Users/jeremycapps/Dev/portfolio
git add src/App.tsx src/components/chat-view.tsx src/index.css
git commit -m "feat: wire composer to streaming chat with transcript view"
```

---

## Task 10: Deploy config and docs

**Files:**
- Create: `vercel.json`
- Create: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Produces: a Vercel-ready project (static Vite build + `api/` Edge function) and accurate run/deploy docs.

- [ ] **Step 1: Write `vercel.json`.**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

- [ ] **Step 2: Write `.env.example`.**

```bash
# Server-side only — never exposed to the browser.
OPENROUTER_API_KEY=your-openrouter-key
# Optional overrides:
# CHAT_PROVIDER=openrouter
# CHAT_MODEL=meta-llama/llama-3.3-70b-instruct
```

- [ ] **Step 3: Confirm `.env` is gitignored.**

```bash
cd /Users/jeremycapps/Dev/portfolio && grep -qx '.env' .gitignore || printf '\n.env\n' >> .gitignore ; grep -q '.env' .gitignore && echo ok
```

Expected: prints `ok`.

- [ ] **Step 4: Rewrite `README.md`** with:

```markdown
# Portfolio — Context

An interactive AI portfolio. The chat answers questions about Jeremy Capps,
streamed from an open-weights model via OpenRouter, behind a provider-swappable
backend.

## Run locally

```bash
npm install
cp .env.example .env   # then add your OPENROUTER_API_KEY
npm run dev
```

Open http://localhost:5173. The chat requires `OPENROUTER_API_KEY`; without it
the UI loads and returns a friendly error on send.

## Configuration

- `OPENROUTER_API_KEY` (required) — server-side only.
- `CHAT_PROVIDER` — default `openrouter`.
- `CHAT_MODEL` — default `meta-llama/llama-3.3-70b-instruct`.

## Grounding content

Edit `content/profile.md`, then `npm run gen:profile` (runs automatically on
`predev`/`prebuild`).

## Deploy (Vercel)

Import the repo in Vercel, add `OPENROUTER_API_KEY` (and optional
`CHAT_MODEL`/`CHAT_PROVIDER`) as Environment Variables, and deploy. The chat
runs as an Edge Function at `/api/chat`.
```

- [ ] **Step 5: Full verification.**

```bash
cd /Users/jeremycapps/Dev/portfolio && npm run test && npm run typecheck && npm run build
```

Expected: tests PASS, typecheck PASS, build succeeds.

- [ ] **Step 6: Commit.**

```bash
cd /Users/jeremycapps/Dev/portfolio
git add vercel.json .env.example .gitignore README.md
git commit -m "chore: Vercel deploy config, env example, and README"
```

---

## Self-Review Notes

- **Spec coverage:** §1 de-Replit → Tasks 1–3; §2 backend → Tasks 5–7; §3 provider abstraction → Task 5 (`provider.ts` dispatch); §4 grounding → Task 4 + `config.ts`; §5 UI/transcript → Tasks 8–9; §6 deploy → Task 10. Error handling (spec) → `chat-core` JSON errors + client error path (Tasks 6, 8, 9). Testing (spec) → Vitest suites in Tasks 5, 6, 8.
- **Type consistency:** `ChatMessage`/`ChatRole`/`StreamDeps` defined in Task 5 `types.ts`, reused unchanged in Tasks 6–7. Client uses its own narrower `ClientMessage` (no `system`) by design; the wire payload still validates server-side.
- **Known follow-ups (out of scope, not blockers):** rate limiting is a single-note guardrail only (no store); `profile.md` still needs Jeremy's contact links before launch; Anthropic/Claude provider is a documented drop-in, not built here.
