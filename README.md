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
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (optional) — enable rate
  limiting.

## Rate limiting

`/api/chat` is a public, metered endpoint. To cap abuse, set both Upstash Redis
REST vars (free tier at [console.upstash.com](https://console.upstash.com)) — the
chat is then limited to **20 sends/min per client IP** (sliding window) and
returns `429` with a `Retry-After` header when exceeded. When the vars are unset,
rate limiting is **off** (fail-open), so local dev works with no extra setup.

## Grounding content

Edit `content/profile.md`, then `npm run gen:profile` (runs automatically on
`predev`/`prebuild`).

## Deploy (Vercel)

Import the repo in Vercel, add `OPENROUTER_API_KEY` (and optional
`CHAT_MODEL`/`CHAT_PROVIDER`) as Environment Variables, and deploy. The chat
runs as an Edge Function at `/api/chat`.
