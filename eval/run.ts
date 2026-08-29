import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildMessages } from '../api/_lib/chat-core';
import { getConfig, systemPrompt } from '../api/_lib/config';
import { streamChat } from '../api/_lib/provider';
import type { ChatMessage } from '../api/_lib/types';
import { loadSharedEnv } from '../scripts/worktree-env';
import { produceRecords } from './produce';
import { loadQuestions } from './questions';
import { estimateRunCost, parseRunOptions, selectQuestions } from './run-options';

const here = dirname(fileURLToPath(import.meta.url));

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

function usage(): string {
  return [
    'Usage: npm run eval -- [options]',
    '',
    '  --samples <n>          Samples per eligible question (default: EVAL_SAMPLES or 1)',
    '  --limit <n>            Run only the first n eligible questions',
    '  --filter <persona|id>  Select questions by persona or exact id',
    '  --dry-run              Print the call/token estimate without calling the provider',
    '  --help                 Show this help',
  ].join('\n');
}

async function main(): Promise<void> {
  loadSharedEnv(resolve(here, '..'));
  const options = parseRunOptions(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }

  const yamlText = readFileSync(resolve(here, 'questions.yaml'), 'utf8');
  const questions = loadQuestions(yamlText);
  const selection = selectQuestions(questions, options);
  const groundingPrompt = systemPrompt();
  const config = getConfig();
  const estimate = estimateRunCost(
    selection.selected,
    groundingPrompt,
    options.samples,
    config.maxOutputTokens,
  );

  const turnCount = selection.selected.reduce((total, question) => total + question.turns.length, 0);

  console.log([
    `eval plan: ${selection.selected.length} question(s), ${turnCount} turn(s) × ${options.samples} sample(s) = ${estimate.calls} call(s)`,
    `estimated prompt tokens: ${estimate.promptTokens.toLocaleString()} (characters ÷ 4, includes per-turn regrowth)`,
    `maximum completion tokens: ${estimate.maxCompletionTokens.toLocaleString()} (${config.maxOutputTokens}/call)`,
  ].join('\n'));

  if (options.dryRun) return;
  if (estimate.calls > 0 && config.provider === 'openrouter' && !config.openRouterKey) {
    throw new Error('OPENROUTER_API_KEY is required for a live eval run');
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = resolve(here, 'reports');
  const outPath = resolve(outDir, `${stamp}.jsonl`);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outPath, '', 'utf8');
  console.log(`transcript: eval/reports/${stamp}.jsonl`);

  const records = await produceRecords({
    questions: selection.selected,
    chat,
    groundingPrompt,
    model: config.model,
    samples: options.samples,
    onRecord: (record) => appendFileSync(outPath, `${JSON.stringify(record)}\n`, 'utf8'),
  });

  const estimatedTotal = records.reduce(
    (total, record) => total + record.usageEstimate.totalTokens,
    0,
  );
  console.log(`eval complete: wrote ${records.length} record(s); estimated actual tokens: ${estimatedTotal.toLocaleString()}`);
}

main().catch((error) => {
  console.error(`eval failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
