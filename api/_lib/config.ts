import { PROFILE } from './profile.generated';

export interface AppConfig {
  provider: string;
  model: string;
  openRouterKey: string | undefined;
}

export function getConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  return {
    provider: env.CHAT_PROVIDER ?? 'openrouter',
    model: env.CHAT_MODEL ?? 'meta-llama/llama-3.3-70b-instruct',
    openRouterKey: env.OPENROUTER_API_KEY,
  };
}

export function systemPrompt(): string {
  return PROFILE;
}
