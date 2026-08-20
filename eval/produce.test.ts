import { describe, expect, it } from 'vitest';
import type { ChatMessage } from '../api/_lib/types';
import { produceRecords, transcriptPrompt } from './produce';
import type { Question, TranscriptRecord } from './types';

const questions: Question[] = [
  { id: 'single', persona: 'peer', turns: ['what?'] },
  { id: 'multi', persona: 'peer', turns: ['first', 'second'] },
];

describe('transcriptPrompt', () => {
  it('renders the grounding corpus followed by the conversation so far', () => {
    const prompt = transcriptPrompt('CORPUS', [
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'reply' },
      { role: 'user', content: 'second' },
    ]);
    expect(prompt).toBe('CORPUS\n\n[user] first\n[assistant] reply\n[user] second');
  });
});

describe('produceRecords', () => {
  it('samples each question and persists one record per conversation', async () => {
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

    // single: 1 turn × 3 samples = 3 calls; multi: 2 turns × 3 samples = 6 calls
    expect(calls).toBe(9);
    expect(records).toHaveLength(6); // 2 questions × 3 samples
    expect(persisted).toEqual(records);

    const single = records[0];
    expect(single).toMatchObject({
      id: 'single',
      producer: 'curated',
      persona: 'peer',
      model: 'chat-model',
      sample: 1,
      timestamp: '2026-08-20T12:00:00.000Z',
    });
    expect(single.turns).toHaveLength(1);
    expect(single.turns[0].user).toBe('what?');
    expect(single.turns[0].response).toMatch(/^answer /);
    expect(single.usageEstimate.totalTokens).toBeGreaterThan(0);

    const multi = records.find((record) => record.id === 'multi' && record.sample === 1)!;
    expect(multi.turns.map((turn) => turn.user)).toEqual(['first', 'second']);
    expect(multi.usageEstimate.totalTokens).toBe(
      multi.turns[0].usageEstimate.totalTokens + multi.turns[1].usageEstimate.totalTokens,
    );
  });

  it('feeds each turn the assistant replies from prior turns', async () => {
    const seen: ChatMessage[][] = [];
    await produceRecords({
      questions: [{ id: 'multi', persona: 'peer', turns: ['first', 'second'] }],
      chat: async (messages) => { seen.push(messages); return `reply-${messages.length}`; },
      groundingPrompt: 'CORPUS',
      model: 'chat-model',
      samples: 1,
    });

    expect(seen).toHaveLength(2);
    expect(seen[0]).toEqual([{ role: 'user', content: 'first' }]);
    expect(seen[1]).toEqual([
      { role: 'user', content: 'first' },
      { role: 'assistant', content: 'reply-1' },
      { role: 'user', content: 'second' },
    ]);
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
