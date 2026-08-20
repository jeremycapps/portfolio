import type { TokenUsageEstimate } from './types';

export function estimateTokens(text: string): number {
  if (text.length === 0) return 0;
  return Math.ceil(text.length / 4);
}

export function estimateUsage(prompt: string, completion: string): TokenUsageEstimate {
  const promptTokens = estimateTokens(prompt);
  const completionTokens = estimateTokens(completion);
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    method: 'chars-div-4',
  };
}
