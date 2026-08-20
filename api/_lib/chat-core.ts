import { systemPrompt } from './config';
import { jsonError } from './http';
import { streamChat } from './provider';
import { checkRateLimit } from './rate-limit';
import type { ChatMessage, ChatRole } from './types';

const MAX_MESSAGES = 40;
const MAX_CHARS = 8000;
const CLIENT_ROLES: ChatRole[] = ['user', 'assistant'];

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
      !CLIENT_ROLES.includes((m as ChatMessage).role) ||
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

export async function handleChatRequest(
  request: Request,
  deps: { stream?: typeof streamChat; checkLimit?: typeof checkRateLimit } = {},
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError('Method not allowed.', 'METHOD_NOT_ALLOWED', 405);
  }

  const checkLimit = deps.checkLimit ?? checkRateLimit;
  const limit = await checkLimit(request);
  if (!limit.ok) {
    return jsonError(
      'Too many requests — please slow down.',
      'RATE_LIMITED',
      429,
      limit.retryAfter === undefined ? {} : { 'retry-after': String(limit.retryAfter) },
    );
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 100_000) {
    return jsonError('Request too large.', 'REQUEST_TOO_LARGE', 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON.', 'INVALID_JSON', 400);
  }

  const valid = validateChatBody(body);
  if (!valid.ok) return jsonError(valid.error, 'INVALID_REQUEST', 400);

  const stream = deps.stream ?? streamChat;
  const messages = buildMessages(valid.messages);
  const iterator = stream(messages)[Symbol.asyncIterator]();

  let first: IteratorResult<string>;
  try {
    first = await iterator.next();
  } catch (err) {
    console.error('chat provider setup error:', err);
    return jsonError('The assistant is unavailable right now.', 'PROVIDER_UNAVAILABLE', 502);
  }

  const encoder = new TextEncoder();
  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done && first.value) controller.enqueue(encoder.encode(first.value));
        while (true) {
          const { done, value } = await iterator.next();
          if (done) break;
          if (value) controller.enqueue(encoder.encode(value));
        }
      } catch (err) {
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
