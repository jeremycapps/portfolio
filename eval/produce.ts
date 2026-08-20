import { estimateUsage } from './tokens';
import type { Question, TranscriptRecord } from './types';

export interface ProduceDeps {
  questions: Question[];
  chat: (turns: string[]) => Promise<string>;
  groundingPrompt: string;
  model: string;
  samples: number;
  now?: () => Date;
  onRecord?: (record: TranscriptRecord) => void | Promise<void>;
}

export function transcriptPrompt(groundingPrompt: string, turns: string[]): string {
  return `${groundingPrompt}\n\n[user] ${turns.join('\n[user] ')}`;
}

export async function produceRecords(deps: ProduceDeps): Promise<TranscriptRecord[]> {
  if (!Number.isInteger(deps.samples) || deps.samples < 1) {
    throw new Error('samples must be a positive integer');
  }

  const now = deps.now ?? (() => new Date());
  const records: TranscriptRecord[] = [];

  for (const question of deps.questions) {
    if (question.turns.length > 1) continue;
    const finalTurn = question.turns[question.turns.length - 1];
    const prompt = transcriptPrompt(deps.groundingPrompt, question.turns);

    for (let index = 0; index < deps.samples; index += 1) {
      const response = await deps.chat(question.turns);
      const record: TranscriptRecord = {
        id: question.id,
        producer: 'curated',
        persona: question.persona,
        model: deps.model,
        prompt,
        question: finalTurn,
        response,
        sample: index + 1,
        timestamp: now().toISOString(),
        usageEstimate: estimateUsage(prompt, response),
      };
      records.push(record);
      await deps.onRecord?.(record);
    }
  }

  return records;
}
