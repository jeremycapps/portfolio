import { PROFILE } from './profile.generated';

export interface AppConfig {
  provider: string;
  model: string;
  openRouterKey: string | undefined;
  maxOutputTokens: number;
  answerTimeoutMs: number;
}

const DEFAULT_MAX_OUTPUT_TOKENS = 400;
const DEFAULT_ANSWER_TIMEOUT_MS = 15_000;

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
    answerTimeoutMs: positiveInteger(env.ANSWER_TIMEOUT_MS, DEFAULT_ANSWER_TIMEOUT_MS),
  };
}

export function systemPrompt(): string {
  return PROFILE;
}

export function answerSystemPrompt(): string {
  return `${PROFILE}\n\n## Answer format\n\nReturn only the completed reader-facing answer in Markdown. You may use paragraphs, headings, ordered and unordered lists, emphasis, inline code, fenced code blocks, blockquotes, and links. Do not include Facia metadata, provenance labels, pattern or density names, model tags, or an added Scope section. Use links only when their destination is an HTTPS or mailto URL. Do not emit raw HTML.`;
}
