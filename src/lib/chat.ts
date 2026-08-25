import type { StructuredAnswerResponse } from './answer';

export interface MessageChoice {
  label: string;
  prompt: string;
}

export interface UserClientMessage {
  role: 'user';
  content: string;
}

export type AssistantContent =
  | { kind: 'markdown'; markdown: string }
  | { kind: 'facia'; question: string; answer: StructuredAnswerResponse };

export interface AssistantClientMessage {
  role: 'assistant';
  content: AssistantContent;
  /**
   * UI-only interactive options rendered inside an assistant turn (the Facia
   * pattern, synthesized client-side). Stripped before messages reach the API.
   */
  choices?: MessageChoice[];
}

export type ClientMessage = UserClientMessage | AssistantClientMessage;

export function markdownContent(markdown = ''): AssistantContent {
  return { kind: 'markdown', markdown };
}

export function messageHasVisibleContent(message: ClientMessage): boolean {
  return message.role === 'user'
    ? message.content.length > 0
    : message.content.kind === 'facia' || message.content.markdown.length > 0;
}

export function compactMessageText(message: ClientMessage): string {
  if (message.role === 'user') return message.content;
  if (message.content.kind === 'markdown') return message.content.markdown;

  const answer = message.content.answer.recipe.answer;
  const semanticItems = answer.items.map((item) => {
    const payload = item.payload;
    return ['title', 'contribution', 'outcome', 'scope']
      .flatMap((key) => typeof payload[key] === 'string' ? [`${key}: ${payload[key]}`] : [])
      .join('\n');
  });
  return `Structured answer to: ${message.content.question}\n${semanticItems.join('\n\n')}`;
}

export function consumeChoices(message: ClientMessage): ClientMessage {
  return message.role === 'assistant' && message.choices
    ? { role: 'assistant', content: message.content }
    : message;
}

export async function readTextStream(
  res: Response,
  onDelta: (t: string) => void,
): Promise<void> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onDelta(decoder.decode(value, { stream: true }));
  }
}

export async function sendChat(
  messages: ClientMessage[],
  opts: { onDelta: (t: string) => void; signal?: AbortSignal },
): Promise<void> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    // Recipes and UI-only fields never cross the chat boundary. Structured turns
    // are represented by compact semantic text from the answer payload only.
    body: JSON.stringify({
      messages: messages.map((message) => ({
        role: message.role,
        content: compactMessageText(message),
      })),
    }),
    signal: opts.signal,
  });
  if (!res.ok) {
    let msg = 'The assistant is unavailable right now.';
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch { /* non-JSON */ }
    throw new Error(msg);
  }
  await readTextStream(res, opts.onDelta);
}
