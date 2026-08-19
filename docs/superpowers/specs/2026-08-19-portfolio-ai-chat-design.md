# Portfolio AI Chat — Design

**Date:** 2026-08-19
**Status:** Approved for planning
**Author:** Jeremy Capps (with Claude)

## Goal

Turn the `Context` chatbot UI (a Replit-extracted Vite/React prototype) into a
real, deployable portfolio site whose chat actually answers questions about
Jeremy — grounded in his real background — powered by Claude to start, with a
clean path to swap in an open-source model later. Deploy to Vercel.

## Current state

The repo (`github.com/jeremycapps/portfolio`) is a single package carved out of
a Replit pnpm **monorepo**. It is well-built (React 18 + TypeScript + Vite +
Tailwind + Radix), but **does not install, build, or run standalone** because:

- Dependencies use the pnpm `catalog:` protocol (e.g. `"react": "catalog:"`),
  which only resolves inside the Replit workspace.
- `tsconfig.json` extends `../../tsconfig.base.json` and references
  `../../lib/api-client-react` — parent files absent from this repo.
- `vite.config.ts` hard-requires `PORT` and `BASE_PATH` env vars and imports
  three Replit-only plugins (`@replit/vite-plugin-*`, also `catalog:`).

Functionally the UI is a pure prototype: the composer, file attach, mic,
Slack/Google connectors, and document cards all fire fake toasts. Nothing calls
a backend. The composer has no transcript/message area.

## Non-goals (YAGNI)

- **No vector DB / embeddings / RAG.** A portfolio's worth of bio fits easily in
  Claude's context. Grounding is done via a structured system prompt with prompt
  caching. Content is structured so RAG *could* be added later, but we don't
  build it now.
- **Slack/Google connectors and document cards stay static showcase.** They read
  as portfolio content; wiring real OAuth backends is out of scope.
- **No auth, no accounts, no persistence of conversations** server-side.

## Architecture

Five workstreams, in dependency order.

### 1. De-Replit into a standalone app

- Replace every `catalog:` version in `package.json` with a real pinned version.
- Remove the three `@replit/vite-plugin-*` deps and their usage in
  `vite.config.ts`. Drop the mandatory `PORT`/`BASE_PATH` throws; use Vite's
  normal defaults (`base: '/'`, dev port 5173) with optional env overrides.
- Rewrite `tsconfig.json` to be self-contained (no `extends` of a missing
  parent, no cross-package `references`). Keep the `@/*` path alias.
- Add a lockfile via a clean `npm install` and confirm `npm run dev`,
  `npm run build`, and `npm run typecheck` all pass.
- Keep `@assets` alias only if used; otherwise remove.

**Outcome:** `git clone && npm install && npm run dev` works with no Replit env.

### 2. Chat backend — Vercel serverless function

- New `api/chat.ts` (Vercel Function). Accepts `POST` with
  `{ messages: {role, content}[] }`, returns a **streamed** text response.
- Uses the official `@anthropic-ai/sdk` with `client.messages.stream(...)`.
- **API key lives only in the Vercel env var `ANTHROPIC_API_KEY`** — never
  shipped to the browser.
- Model is read from env `CHAT_MODEL`, defaulting to `claude-haiku-4-5`
  (fast + cheap for a public bio-Q&A demo; bump to Sonnet/Opus by changing one
  env var).
- The system prompt (Jeremy's bio, see §4) is sent with `cache_control:
  {type: 'ephemeral'}` so the fixed bio prefix is cached across requests.
- Basic guardrails: cap request message count / length, cap `max_tokens`,
  return typed errors as JSON. Light in-memory rate note only (no store).

### 3. Provider abstraction (Claude now, OSS later)

- A small server-side module `api/_lib/provider.ts` exporting an interface:
  `streamChat(messages, opts): AsyncIterable<string>` (yields text deltas).
- One implementation now: `claude.ts` (wraps the Anthropic SDK).
- Selection via env `CHAT_PROVIDER` (default `claude`). Adding an OSS provider
  later (Ollama / Groq / Together / self-hosted OpenAI-compatible endpoint) means
  adding one file that implements the same interface and setting
  `CHAT_PROVIDER` + its endpoint/key env vars. No route or UI changes.
- The system prompt and message shaping live in provider-neutral code so both
  providers share grounding.

### 4. Grounding content — "Ask me about Jeremy"

- A single source-of-truth content file, `content/profile.md` (Markdown), holding
  Jeremy's bio, experience, selected projects, skills, and "how to talk about
  me" tone notes.
- At build/runtime the backend composes the system prompt from this file:
  persona + guardrails ("only answer about Jeremy and his work; if asked
  something off-topic, redirect warmly") + the profile content.
- **Content sourcing is a required input from Jeremy** — provided by pasting a
  bio/resume, or drafted by Claude from his existing resume knowledge base and
  then edited. Ships with a clearly-marked placeholder until real content lands,
  so the app is testable before the copy is final.

### 5. Wire the UI + add a transcript

- Connect the composer `onSubmit` in `src/App.tsx` to `POST /api/chat`, reading
  the stream and appending assistant text as it arrives.
- Add a message/transcript view above (or replacing) the current hero once a
  conversation starts: user + assistant bubbles, streaming indicator, error
  state, "new chat" reset.
- Keep the empty/landing state (hero + composer + showcase) as the first screen;
  transition to the conversation view on first send.
- Preserve existing `data-testid` hooks; add new ones for messages.
- Slack/Google/doc-card buttons keep their current tasteful demo behavior.

### 6. Deploy to Vercel

- `vercel.json` (or framework-detected) config: static build from Vite,
  `api/` as functions.
- `ANTHROPIC_API_KEY` + optional `CHAT_MODEL`/`CHAT_PROVIDER` set as Vercel env
  vars (Jeremy adds the key in the Vercel dashboard — Claude never handles it).
- Confirm production build, then hook up a custom domain (later, optional).

## Data flow

```
Browser (composer) --POST /api/chat {messages}--> Vercel Function
   Function: build system prompt (profile.md, cached) + messages
             -> provider.streamChat() -> Anthropic SDK stream
   <---------------- streamed text deltas ----------------
Browser: append deltas to transcript in real time
```

## Error handling

- Client: network failure / non-200 -> inline error bubble + retry affordance;
  never leave the UI in a stuck "thinking" state.
- Server: validate payload shape; most-specific-first catch on Anthropic errors
  (rate limit vs. 4xx vs. connection); return `{ error }` JSON with an
  appropriate status; never leak the API key or stack traces.
- Missing `ANTHROPIC_API_KEY` -> clear 500 with a developer-facing message in
  logs and a friendly message to the user.

## Testing

- **De-Replit:** `npm run typecheck` + `npm run build` pass; dev server serves
  the app with no Replit env vars.
- **Backend:** unit-test the provider interface with a stubbed stream; test the
  route's payload validation and error mapping. A local smoke test with a real
  key confirms streaming end-to-end.
- **UI:** the composer sends, streams, renders a transcript, and handles an
  error response gracefully (manual + component-level where practical).
- Follow TDD where it fits (provider/route logic especially).

## Security & privacy

- API key server-side only, in an env var; never in client bundle or logs.
- No user data persisted server-side; conversation lives in browser memory.
- CORS/route scoped to same-origin (Vercel default).

## Open inputs from Jeremy

1. **Profile content** — paste, or approve drafting from the resume knowledge
   base. (Blocks §4 final copy, not the build.)
2. Model default confirmed as `claude-haiku-4-5` unless changed.
3. Custom domain — later.
