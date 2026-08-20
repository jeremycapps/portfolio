# Coverage harness — producer (v1)

Runs curated, single-turn questions through the production chat pipeline and
appends each prompt/response record to a timestamped transcript. Judging and
coverage scoring are a later cycle; saved records can be judged repeatedly
without regenerating answers.

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

Useful cost controls:

- `--samples <n>` overrides `EVAL_SAMPLES` (default `1`).
- `--limit <n>` runs only the first `n` eligible questions.
- `--filter <persona|id>` selects a persona or exact question id.
- `CHAT_MAX_OUTPUT_TOKENS` controls the shared production/harness output ceiling
  (default `400`).

Records are appended to `eval/reports/<timestamp>.jsonl`, so completed calls
survive a later provider failure. Each record includes a clearly labeled token
estimate. The reports directory is gitignored.

## Add questions

Edit `eval/questions.yaml`. Each entry has an `id`, a `persona` (`recruiter`,
`peer`, or `curious`), one to five `turns`, and optional `notes`. Multi-turn
entries are accepted and reported as skipped in v1.
