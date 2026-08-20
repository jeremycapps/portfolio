import { describe, expect, it } from 'vitest';
import { produceRecords } from './produce';
import type { Question, TranscriptRecord } from './types';

const questions: Question[] = [
  { id: 'single', persona: 'peer', turns: ['what?'] },
  { id: 'multi', persona: 'peer', turns: ['a', 'b'] },
];

describe('produceRecords', () => {
  it('samples single-turn questions, skips multi-turn, and persists each record', async () => {
    let calls = 0;
    const persisted: TranscriptRecord[] = [];
    const records = await produceRecords({
      questions,
      chat: async () => `answer ${++calls}`,
      groundingPrompt: 'CORPUS',
      model: 'chat-model',
      samples: 3,
      now: () => new Date('2026-08-20T12:00:00Z'),
      onRecord: (record) => { persisted.push(record); },
    });

    expect(calls).toBe(3);
    expect(records).toHaveLength(3);
    expect(persisted).toEqual(records);
    expect(records[0]).toMatchObject({
      id: 'single',
      producer: 'curated',
      persona: 'peer',
      model: 'chat-model',
      prompt: 'CORPUS\n\n[user] what?',
      question: 'what?',
      response: 'answer 1',
      sample: 1,
      timestamp: '2026-08-20T12:00:00.000Z',
    });
    expect(records[0].usageEstimate.totalTokens).toBeGreaterThan(0);
  });

  it('returns no records when every question is multi-turn', async () => {
    const records = await produceRecords({
      questions: [questions[1]],
      chat: async () => { throw new Error('must not be called'); },
      groundingPrompt: 'CORPUS',
      model: 'chat-model',
      samples: 2,
    });
    expect(records).toEqual([]);
  });

  it('rejects invalid sample counts before making calls', async () => {
    await expect(produceRecords({
      questions,
      chat: async () => 'answer',
      groundingPrompt: 'CORPUS',
      model: 'chat-model',
      samples: 0,
    })).rejects.toThrow(/positive integer/i);
  });
});
