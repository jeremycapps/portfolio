import { PROFILE } from './profile.generated';

export interface AppConfig {
  provider: string;
  model: string;
  openRouterKey: string | undefined;
  maxOutputTokens: number;
}

const DEFAULT_MAX_OUTPUT_TOKENS = 400;

function positiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined || !/^[1-9]\d*$/.test(value)) return fallback;
  return Number(value);
}

export function getConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    provider: env.CHAT_PROVIDER ?? 'openrouter',
    model: env.CHAT_MODEL ?? 'meta-llama/llama-3.3-70b-instruct',
    openRouterKey: env.OPENROUTER_API_KEY,
    maxOutputTokens: positiveInteger(env.CHAT_MAX_OUTPUT_TOKENS, DEFAULT_MAX_OUTPUT_TOKENS),
  };
}

export function systemPrompt(): string {
  return PROFILE;
}
