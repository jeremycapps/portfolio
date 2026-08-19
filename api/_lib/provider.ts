import { getConfig } from './config.ts';
import { streamOpenRouter } from './openrouter.ts';
import type { ChatMessage, StreamDeps } from './types.ts';

export function streamChat(messages: ChatMessage[], deps?: StreamDeps): AsyncGenerator<string> {
  const { provider } = getConfig();
  switch (provider) {
    case 'openrouter':
      return streamOpenRouter(messages, deps);
    default:
      throw new Error(`unknown CHAT_PROVIDER: ${provider}`);
  }
}
