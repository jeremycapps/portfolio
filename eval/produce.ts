import type { ChatMessage } from '../api/_lib/types';
import { estimateUsage } from './tokens';
import type { Question, TokenUsageEstimate, TranscriptRecord, TurnRecord } from './types';

export interface ProduceDeps {
  questions: Question[];
  chat: (messages: ChatMessage[]) => Promise<string>;
  groundingPrompt: string;
  model: string;
  samples: number;
  now?: () => Date;
  onRecord?: (record: TranscriptRecord) => void | Promise<void>;
}

/**
 * Render the prompt a given turn actually sees: the grounding corpus followed
 * by the conversation so far (interleaved user/assistant messages). Used only
 * for the directional token estimate — the live provider prepends its own
 * system prompt via buildMessages.
 */
export function transcriptPrompt(groundingPrompt: string, messages: ChatMessage[]): string {
  const rendered = messages.map((message) => `[${message.role}] ${message.content}`).join('\n');
  return `${groundingPrompt}\n\n${rendered}`;
}

function sumUsage(turns: TurnRecord[]): TokenUsageEstimate {
  return turns.reduce<TokenUsageEstimate>(
    (total, turn) => ({
      promptTokens: total.promptTokens + turn.usageEstimate.promptTokens,
      completionTokens: total.completionTokens + turn.usageEstimate.completionTokens,
      totalTokens: total.totalTokens + turn.usageEstimate.totalTokens,
      method: 'chars-div-4',
    }),
    { promptTokens: 0, completionTokens: 0, totalTokens: 0, method: 'chars-div-4' },
  );
}

export async function produceRecords(deps: ProduceDeps): Promise<TranscriptRecord[]> {
  if (!Number.isInteger(deps.samples) || deps.samples < 1) {
    throw new Error('samples must be a positive integer');
  }

  const now = deps.now ?? (() => new Date());
  const records: TranscriptRecord[] = [];

  for (const question of deps.questions) {
    for (let index = 0; index < deps.samples; index += 1) {
      const messages: ChatMessage[] = [];
      const turns: TurnRecord[] = [];

      for (const userTurn of question.turns) {
        messages.push({ role: 'user', content: userTurn });
        const prompt = transcriptPrompt(deps.groundingPrompt, messages);
        const response = await deps.chat([...messages]);
        messages.push({ role: 'assistant', content: response });
        turns.push({ user: userTurn, response, usageEstimate: estimateUsage(prompt, response) });
      }

      const record: TranscriptRecord = {
        id: question.id,
        producer: 'curated',
        persona: question.persona,
        model: deps.model,
        sample: index + 1,
        timestamp: now().toISOString(),
        turns,
        usageEstimate: sumUsage(turns),
      };
      records.push(record);
      await deps.onRecord?.(record);
    }
  }

  return records;
}
