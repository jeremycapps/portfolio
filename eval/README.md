# Coverage harness — producer (v1)

Runs curated questions through the production chat pipeline and appends each
conversation to a timestamped transcript. Single- and multi-turn questions are
both supported: a multi-turn entry runs as a real conversation where each user
turn sees the assistant's replies from the prior turns. Judging and coverage
scoring are a later cycle; saved records can be judged repeatedly without
regenerating answers.

## Estimate before running

```bash
npm run eval -- --dry-run
npm run eval -- --filter recruiter --samples 3 --dry-run
```

The estimate uses characters divided by four for prompt tokens and reports the
hard maximum completion tokens. It is directional, not provider billing data.

## Run

```bash
export OPENROUTER_API_KEY=...
npm run eval
```

In a Cyboflow linked worktree, the runner automatically reads the primary
portfolio worktree's `.env` when no worktree-local `.env` exists. Existing shell
variables always take precedence.

Useful cost controls:

- `--samples <n>` overrides `EVAL_SAMPLES` (default `1`).
- `--limit <n>` runs only the first `n` matching questions.
- `--filter <persona|id>` selects a persona or exact question id.
- `CHAT_MAX_OUTPUT_TOKENS` controls the shared production/harness output ceiling
  (default `400`).

Records are appended to `eval/reports/<timestamp>.jsonl`, so completed calls
survive a later provider failure. Each record includes a clearly labeled token
estimate. The reports directory is gitignored.

## Add questions

Edit `eval/questions.yaml`. Each entry has an `id`, a `persona` (`recruiter`,
`peer`, or `curious`), one to ten `turns`, and optional `notes`. A multi-turn
entry runs as a real conversation and is recorded as one transcript record whose
`turns` array holds each user turn paired with its response. Every turn is a
separate provider call, so a ten-turn entry costs ten calls and its prompt
regrows each turn.
