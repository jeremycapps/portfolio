import { systemPrompt } from './config.ts';
import { streamChat } from './provider.ts';
import type { ChatMessage, ChatRole } from './types.ts';

const MAX_MESSAGES = 40;
const MAX_CHARS = 8000;
const ROLES: ChatRole[] = ['system', 'user', 'assistant'];

type ValidResult =
  | { ok: true; messages: ChatMessage[] }
  | { ok: false; error: string };

export function validateChatBody(body: unknown): ValidResult {
  if (typeof body !== 'object' || body === null || !('messages' in body)) {
    return { ok: false, error: 'Request must include a messages array.' };
  }
  const messages = (body as { messages: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return { ok: false, error: 'messages must be a non-empty array.' };
  }
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, error: 'Conversation is too long.' };
  }
  for (const m of messages) {
    if (
      typeof m !== 'object' || m === null ||
      !ROLES.includes((m as ChatMessage).role) ||
      typeof (m as ChatMessage).content !== 'string' ||
      (m as ChatMessage).content.length > MAX_CHARS
    ) {
      return { ok: false, error: 'Each message needs a valid role and content.' };
    }
  }
  return { ok: true, messages: messages as ChatMessage[] };
}

export function buildMessages(userMessages: ChatMessage[]): ChatMessage[] {
  return [{ role: 'system', content: systemPrompt() }, ...userMessages];
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function handleChatRequest(
  request: Request,
  deps: { stream?: typeof streamChat } = {},
): Promise<Response> {
  if (request.method !== 'POST') return jsonError('Method not allowed.', 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON.', 400);
  }

  const valid = validateChatBody(body);
  if (!valid.ok) return jsonError(valid.error, 400);

  const stream = deps.stream ?? streamChat;
  const messages = buildMessages(valid.messages);

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of stream(messages)) {
          controller.enqueue(encoder.encode(delta));
        }
      } catch (err) {
        // Stream already started (200 sent); surface a trailing marker.
        controller.enqueue(encoder.encode('\n\n[error] The assistant hit a snag. Please try again.'));
        console.error('chat stream error:', err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    status: 200,
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}
