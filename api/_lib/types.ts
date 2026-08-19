export type ChatRole = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface StreamDeps {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}
