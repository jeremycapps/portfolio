# Portfolio — Context

An interactive AI portfolio. The chat answers questions about Jeremy Capps,
streamed from an open-weights model via OpenRouter, behind a provider-swappable
backend. Declared portfolio questions can also resolve deterministically through
the vendored Facia v2 runtime into evidence-aware component recipes. A separate
`/stratos-v2` hosts the constraint-aware organizational conversion prototype.
The original `/stratos` route remains available as an interactive strategy instrument built on the same
deterministic runtime (see [StratOS instrument](#stratos-instrument-stratos)).

## Run locally

```bash
npm install
cp .env.example .env   # then add your OPENROUTER_API_KEY
npm run dev
```

Cyboflow linked worktrees automatically reuse the primary portfolio worktree's
`.env` when they do not have a local one. Shell variables and a worktree-local
`.env` take precedence.

Open http://localhost:5173. The chat requires `OPENROUTER_API_KEY`; without it
the UI loads and returns a friendly error on send.

The GitHub Actions workflow performs the same clean-install gate used for
release verification: `npm ci`, `npm test`, `npm run typecheck`, and
`npm run build`. It then installs Chromium and runs `npm run test:e2e` for the
StratOS interaction and accessibility checks.

## Configuration

- `OPENROUTER_API_KEY` (required) — server-side only.
- `CHAT_PROVIDER` — default `openrouter`.
- `CHAT_MODEL` — default `meta-llama/llama-3.3-70b-instruct`.
- `CHAT_MAX_OUTPUT_TOKENS` — shared chat/eval output ceiling; default `400`.
- `STRUCTURED_ANSWER_MAX_OUTPUT_TOKENS` — structured Facia answer ceiling; default `1000`.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (optional) — enable rate
  limiting.

## Rate limiting

`/api/chat` and `/api/answer` are public endpoints. To cap abuse, set both
Upstash Redis REST vars (free tier at
[console.upstash.com](https://console.upstash.com)). Each route then has an
independent **20 sends/min per client IP** sliding window and returns `429` with
a `Retry-After` header when exceeded. When the vars are unset, rate limiting is
**off** (fail-open), so local dev works with no extra setup.

## Grounding content

Edit `content/profile.md`, then `npm run gen:profile` (runs automatically on
`predev`/`prebuild`).

## API routes

All routes use the Web Standard `Request` → `Response` contract in Vercel's
Edge runtime. Non-streaming failures return
`{ "error": string, "code": string }`.

- `POST /api/chat` accepts a message history and streams general model-written
  Markdown grounded by `content/profile.md`. Assistant responses render as
  safe Markdown inside their chat bubbles.
- `POST /api/answer` accepts `{ question, depth }` and returns a deterministic
  Facia recipe when the question has a declared portfolio model.
- `POST /api/resume` accepts `{ jobDescription }` and returns a typed resume
  assembled from the baked source corpus with deterministic/model provenance.

The Vite development server registers the same three core handlers used by
Vercel, so local and deployed behavior share validation and response contracts.

## Deterministic answers with Facia

`POST /api/answer` accepts `{ question, depth }`, where depth is `glance`,
`inspect`, `focus`, or `audit`. Modeled questions return a
`portfolio.answer/1` envelope containing the pinned `facia.answer-set/2`
component recipe. Questions without a declared model return
`QUESTION_NOT_MODELED`, allowing the UI to continue through `/api/chat`, where
the streamed assistant response is rendered as safe Markdown in the chat.

Modeled questions currently cover Jeremy's Zocdoc work, the technologies he has
worked with, and his career timeline. Their sources live in
`api/_lib/portfolio-answer-source.ts`; Facia's renderer-independent runtime is
vendored as the `packages/facia-core` workspace at upstream commit `9074a67`.
The pinned schema SHA-256 is
`0fa2230a3db63be2684230c9e8b9da490b8705033974afd155856b28388dc45b`.

## StratOS instrument (`/stratos`)

`/stratos` is a standalone interactive surface: a strategy instrument that makes
strategic tradeoffs explicit across six paired tensions. A user places a
direction on each axis; the instrument resolves that placement into a
pole-specific recommendation, the owning executive function, and a compiled
board agenda, with named source lenses and an audit mode that reveals the
available evidence and the decision trace.

The instrument never runs Facia in the browser. `npm run gen:stratos`
(`scripts/gen-stratos-recipes.ts`) runs the real `@facia/core` resolver over
every `(kind, tension, side, depth)` combination the instrument can reach in
Node, emitting `src/lib/stratos/recipes.generated.ts`; the browser then looks a
resolved recipe up by key. A resolution failure aborts the build, so an
un-groundable answer can never ship. The ontology, source lenses, and citations
live under `src/lib/stratos/`. It is a facilitation and reasoning prototype, not
an objective measurement of strategy.

**Direction.** The shipped instrument is the six-tension facilitation surface
described above. The product direction it is converging toward is capacity-aware
strategy execution — StratOS helps executive teams decide what they can
responsibly commit to, connecting a strategic goal to the operating
architecture, work, decision rights, and capacity required to deliver it — with
the tension instrument as one input rather than the whole product. That is a
next hypothesis, not a shipped pivot.

The `/stratos` routes are served by the SPA through the rewrites in
`vercel.json`.

## StratOS v2 (`/stratos-v2`)

`/stratos-v2` combines the six coupled conversion-system prototype with a
cutoff-safe judgment surface. The default view is Target Canada's August 21,
2013 scaling boundary: 68 operating stores, a requested 56-store increment, a
`FOG` verdict, two bounded recommendations, and a category-specific
actual-versus-StratOS comparison. The decision library also includes Target's
initial 2012 commitment plus commitment-date packets for Adobe Creative Cloud,
Domino's 2025 growth goals, and Ford Model e. Every selection resolves an
authored cutoff-safe packet; later evidence appears only in a separate
hindsight layer.

The judgment layer extends the scoring v0.2 substrate with validated-scale,
material-unknown, authority, operation, gate, and reassessment semantics. It
does not predict success, rank unlike people/time/finance deficits as a
universal score, or claim all exposure was avoidable. Target `T1`/`T2`, proposed
gates, and counterfactual quantities remain labeled analytical, and the public
packet leaves decision authority unknown. See the
[judgment-layer guide](./src/lib/stratos/decisions/README.md) and
[scoring methodology](./src/lib/stratos/scoring/README.md).

The system view still connects all six tensions; each detail view exposes its
pole, observed and prospective cycle times, constraint footprint, and
constraint-aware convergence. The original `/stratos` route is preserved.

## Deploy (Vercel)

Import the repo in Vercel, add `OPENROUTER_API_KEY` (and optional
`CHAT_MODEL`/`CHAT_PROVIDER`) as Environment Variables, and deploy. The chat
runs as an Edge Function at `/api/chat`.
