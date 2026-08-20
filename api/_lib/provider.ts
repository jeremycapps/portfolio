import { getConfig } from './config';
import { streamOpenRouter } from './openrouter';
import type { ChatMessage, StreamDeps } from './types';

export function streamChat(messages: ChatMessage[], deps?: StreamDeps): AsyncGenerator<string> {
  const { provider } = getConfig();
  switch (provider) {
    case 'openrouter':
      return streamOpenRouter(messages, deps);
    default:
      throw new Error(`unknown CHAT_PROVIDER: ${provider}`);
  }
}
