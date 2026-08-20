import { getConfig } from './config';
import type { ChatMessage, StreamDeps } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function* streamOpenRouter(
  messages: ChatMessage[],
  deps: StreamDeps = {},
): AsyncGenerator<string> {
  const cfg = getConfig();
  const doFetch = deps.fetchImpl ?? fetch;

  const res = await doFetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.openRouterKey ?? ''}`,
      'HTTP-Referer': 'https://jeremycapps.com',
      'X-Title': 'Jeremy Capps Portfolio',
    },
    body: JSON.stringify({
      model: cfg.model,
      messages,
      stream: true,
      max_tokens: cfg.maxOutputTokens,
    }),
    signal: deps.signal,
  });

  if (!res.ok || !res.body) {
    throw new Error(`provider request failed: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split('\n\n');
    buffer = frames.pop() ?? '';
    for (const frame of frames) {
      const line = frame.split('\n').find((l) => l.startsWith('data:'));
      if (!line) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        const json = JSON.parse(data);
        const delta: string | undefined = json?.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // ignore keep-alive / partial frames
      }
    }
  }
}
