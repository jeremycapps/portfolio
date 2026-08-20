import { describe, expect, it } from 'vitest';
import { estimateRunCost, parseRunOptions, selectQuestions } from './run-options';
import type { Question } from './types';

const questions: Question[] = [
  { id: 'a', persona: 'peer', turns: ['one'] },
  { id: 'b', persona: 'peer', turns: ['two'] },
  { id: 'c', persona: 'curious', turns: ['first', 'second'] },
];

describe('parseRunOptions', () => {
  it('defaults to one sample and reads environment configuration', () => {
    expect(parseRunOptions([], {})).toMatchObject({ samples: 1, dryRun: false });
    expect(parseRunOptions([], { EVAL_SAMPLES: '3' }).samples).toBe(3);
  });

  it('lets CLI options override the environment', () => {
    expect(parseRunOptions(
      ['--samples', '2', '--limit', '1', '--filter', 'peer', '--dry-run'],
      { EVAL_SAMPLES: '3' },
    )).toEqual({ samples: 2, limit: 1, filter: 'peer', dryRun: true, help: false });
  });

  it('rejects malformed and unknown options', () => {
    expect(() => parseRunOptions(['--samples', '0'], {})).toThrow(/positive integer/i);
    expect(() => parseRunOptions(['--samples', '1.5'], {})).toThrow(/positive integer/i);
    expect(() => parseRunOptions(['--wat'], {})).toThrow(/unknown option/i);
  });
});

describe('selectQuestions', () => {
  it('filters and limits questions, including multi-turn entries', () => {
    const selection = selectQuestions(questions, {
      samples: 1,
      limit: 1,
      dryRun: false,
      help: false,
    });
    expect(selection.selected.map((question) => question.id)).toEqual(['a']);
    expect(selection.matched).toBe(3);
  });

  it('accepts either an id or persona filter', () => {
    expect(selectQuestions(questions, {
      samples: 1,
      filter: 'peer',
      dryRun: false,
      help: false,
    }).selected).toHaveLength(2);
    expect(selectQuestions(questions, {
      samples: 1,
      filter: 'c',
      dryRun: false,
      help: false,
    }).selected).toHaveLength(1);
  });
});

describe('estimateRunCost', () => {
  it('scales prompts and bounded completions by questions and samples', () => {
    const estimate = estimateRunCost(questions.slice(0, 2), 'corpus', 3, 400);
    expect(estimate.calls).toBe(6);
    expect(estimate.promptTokens).toBeGreaterThan(0);
    expect(estimate.maxCompletionTokens).toBe(2400);
    expect(estimate.maxTotalTokens).toBe(estimate.promptTokens + 2400);
  });

  it('counts every turn of a multi-turn question as its own call', () => {
    // a (1 turn) + b (1 turn) + c (2 turns) = 4 turns
    const estimate = estimateRunCost(questions, 'corpus', 1, 400);
    expect(estimate.calls).toBe(4);
    expect(estimate.maxCompletionTokens).toBe(1600);
  });
});
