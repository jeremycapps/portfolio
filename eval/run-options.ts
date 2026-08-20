import type { ChatMessage } from '../api/_lib/types';
import { transcriptPrompt } from './produce';
import { estimateTokens } from './tokens';
import type { Question } from './types';

export interface RunOptions {
  samples: number;
  limit?: number;
  filter?: string;
  dryRun: boolean;
  help: boolean;
}

export interface QuestionSelection {
  selected: Question[];
  matched: number;
}

export interface RunCostEstimate {
  calls: number;
  promptTokens: number;
  maxCompletionTokens: number;
  maxTotalTokens: number;
}

function positiveInteger(value: string | undefined, name: string): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) {
    throw new Error(`${name} must be a positive integer`);
  }
  return Number(value);
}

export function parseRunOptions(
  args: string[],
  env: Record<string, string | undefined> = process.env,
): RunOptions {
  const options: RunOptions = {
    samples: env.EVAL_SAMPLES === undefined
      ? 1
      : positiveInteger(env.EVAL_SAMPLES, 'EVAL_SAMPLES'),
    dryRun: false,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--dry-run') options.dryRun = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--samples') options.samples = positiveInteger(args[++index], '--samples');
    else if (arg === '--limit') options.limit = positiveInteger(args[++index], '--limit');
    else if (arg === '--filter') {
      const filter = args[++index];
      if (filter === undefined || filter.trim() === '') throw new Error('--filter needs a persona or id');
      options.filter = filter;
    } else {
      throw new Error(`unknown option: ${arg}`);
    }
  }

  return options;
}

export function selectQuestions(questions: Question[], options: RunOptions): QuestionSelection {
  const matching = options.filter === undefined
    ? questions
    : questions.filter((question) => question.id === options.filter || question.persona === options.filter);

  if (options.filter !== undefined && matching.length === 0) {
    throw new Error(`filter matched no questions: ${options.filter}`);
  }

  return {
    selected: options.limit === undefined ? matching : matching.slice(0, options.limit),
    matched: matching.length,
  };
}

/**
 * Directional token estimate for a run. Each conversation turn is one provider
 * call whose prompt is the grounding corpus plus the whole conversation so far,
 * so prompts regrow every turn. Prior assistant replies are unknown ahead of
 * time and bounded here at maxOutputTokens each — an upper bound, not billing.
 */
export function estimateRunCost(
  questions: Question[],
  groundingPrompt: string,
  samples: number,
  maxOutputTokens: number,
): RunCostEstimate {
  let perSamplePromptTokens = 0;
  let perSampleTurns = 0;

  for (const question of questions) {
    const userSoFar: ChatMessage[] = [];
    question.turns.forEach((turn, turnIndex) => {
      userSoFar.push({ role: 'user', content: turn });
      perSamplePromptTokens += estimateTokens(transcriptPrompt(groundingPrompt, userSoFar))
        + turnIndex * maxOutputTokens;
      perSampleTurns += 1;
    });
  }

  const calls = perSampleTurns * samples;
  const promptTokens = perSamplePromptTokens * samples;
  const maxCompletionTokens = calls * maxOutputTokens;
  return {
    calls,
    promptTokens,
    maxCompletionTokens,
    maxTotalTokens: promptTokens + maxCompletionTokens,
  };
}
