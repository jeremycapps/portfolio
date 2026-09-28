#!/usr/bin/env node
/**
 * CLI wrapper over the GitHub activity sync core (api/_lib/github-sync.ts) for local runs
 * and testing. In production the same core runs as a Vercel Cron route
 * (api/cron/github-sync.ts, scheduled in vercel.json).
 *
 * Usage:
 *   node --import tsx scripts/github-activity-sync.ts            # fetch + upload to R2
 *   node --import tsx scripts/github-activity-sync.ts --dry-run  # fetch + print, no upload
 *   node --import tsx scripts/github-activity-sync.ts --out=feed.json  # also write locally
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildFeed, feedBody, uploadFeed } from '../api/_lib/github-sync';

const handle = process.env.GITHUB_HANDLE ?? 'jeremycapps';
const token = process.env.GH_ACTIVITY_TOKEN ?? process.env.GITHUB_TOKEN;
const dryRun = process.argv.includes('--dry-run');
const outArg = process.argv.find((a) => a.startsWith('--out='))?.slice('--out='.length);

async function main(): Promise<void> {
  const doc = await buildFeed({ handle, token });
  if (outArg) writeFileSync(path.resolve(outArg), feedBody(doc));
  if (dryRun) {
    console.log(JSON.stringify({ dry_run: true, repos: doc.items.length, generated_at: doc.generated_at }));
    console.log(doc.items.map((i) => `${i.repo}${i.framing ? ` (${i.framing})` : ''} — ${i.activity.length} events`).join('\n'));
    return;
  }
  const key = await uploadFeed(doc);
  console.log(JSON.stringify({ uploaded: key, repos: doc.items.length, generated_at: doc.generated_at }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
