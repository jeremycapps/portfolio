import { markdownAssistantInstructions, portfolioGrounding } from './config';
import { jsonError } from './http';
import { streamChat } from './provider';
import { checkRateLimit } from './rate-limit';
import { planContextQuery } from './context-query-planner';
import { retrieveContext } from './context-retrieval-client';
import { buildEvidenceBlock, retrieveEvidence } from './evidence';
import type { CatalogRow, ContextQueryKind, ContextRow } from './context-index';
import type { ChatMessage, ChatRole } from './types';

const MAX_MESSAGES = 40;
const MAX_CHARS = 8000;
const CLIENT_ROLES: ChatRole[] = ['user', 'assistant'];

const CONTEXT_BLOCK_INSTRUCTIONS = [
  "The material below is dated working context drawn from Jeremy's own development",
  'history (past AI chat transcripts and code). It may be exploratory, superseded, or',
  'informal. Treat it as evidence of current or past thinking, never as more',
  'authoritative than the canonical profile above. Cite it as "as of <date>" when you',
  'draw on it.',
].join('\n');

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

function formatContextRow(row: ContextRow | CatalogRow): string {
  const body = 'text' in row ? row.text : row.summary;
  return `[${row.project}, ${row.date}, ${row.filePath}] ${body}`;
}

function buildContextBlock(rows: Array<ContextRow | CatalogRow>): string {
  return [CONTEXT_BLOCK_INSTRUCTIONS, '', ...rows.map(formatContextRow)].join('\n');
}

export type ContextSource = 'evidence' | 'transcripts';

/**
 * Evidence (claims extracted and gated by the observation pipeline) is the default.
 * Raw transcript retrieval stays available only when CONTEXT_SOURCE=transcripts.
 */
export function resolveContextSource(env: Record<string, string | undefined> = process.env): ContextSource {
  return env.CONTEXT_SOURCE === 'transcripts' ? 'transcripts' : 'evidence';
}

export interface ContextRetrievalOutcome {
  source?: ContextSource;
  status: 'hit' | 'none' | 'error';
  count?: number;
  term?: string;
  kind?: ContextQueryKind;
  planMs: number;
  retrievalMs?: number;
}

export interface BuildMessagesDeps {
  plan?: typeof planContextQuery;
  retrieve?: typeof retrieveContext;
  retrieveEvidence?: typeof retrieveEvidence;
  source?: ContextSource;
}

function systemMessage(contextBlock: string | null): ChatMessage {
  const systemParts = [portfolioGrounding()];
  if (contextBlock) systemParts.push(contextBlock);
  systemParts.push(markdownAssistantInstructions());
  return { role: 'system', content: systemParts.join('\n\n') };
}

async function buildEvidenceMessages(
  userMessages: ChatMessage[],
  retrieve: typeof retrieveEvidence,
): Promise<BuildMessagesResult> {
  // the previous user turn carries the topic of follow-ups like "why did he change that?"
  const userTurns = userMessages.filter((m) => m.role === 'user').slice(-2);
  const question = userTurns.map((m) => m.content).join('\n');
  const started = Date.now();
  let contextBlock: string | null = null;
  let outcome: ContextRetrievalOutcome;
  try {
    const items = await retrieve(question);
    const retrievalMs = Date.now() - started;
    if (items.length > 0) contextBlock = buildEvidenceBlock(items);
    outcome = { source: 'evidence', status: items.length > 0 ? 'hit' : 'none', count: items.length, planMs: 0, retrievalMs };
  } catch (error) {
    console.error('evidence retrieval failed:', error);
    outcome = { source: 'evidence', status: 'error', planMs: 0, retrievalMs: Date.now() - started };
  }
  return { messages: [systemMessage(contextBlock), ...userMessages], outcome };
}

export interface BuildMessagesResult {
  messages: ChatMessage[];
  outcome: ContextRetrievalOutcome;
}

export async function buildMessages(
  userMessages: ChatMessage[],
  origin: string,
  deps: BuildMessagesDeps = {},
): Promise<BuildMessagesResult> {
  if ((deps.source ?? resolveContextSource()) === 'evidence') {
    return buildEvidenceMessages(userMessages, deps.retrieveEvidence ?? retrieveEvidence);
  }
  const plan = deps.plan ?? planContextQuery;
  const retrieve = deps.retrieve ?? retrieveContext;
  const question = userMessages[userMessages.length - 1]?.content ?? '';
  const history = userMessages.slice(0, -1);

  const planStarted = Date.now();
  const decision = await plan(question, history);
  const planMs = Date.now() - planStarted;

  let contextBlock: string | null = null;
  let outcome: ContextRetrievalOutcome = { status: 'none', planMs };

  if (decision.needed) {
    const retrievalStarted = Date.now();
    try {
      const rows = await retrieve(decision.query, origin);
      const retrievalMs = Date.now() - retrievalStarted;
      if (rows.length > 0) {
        contextBlock = buildContextBlock(rows);
        outcome = {
          status: 'hit',
          count: rows.length,
          term: decision.query.term,
          kind: decision.query.kind,
          planMs,
          retrievalMs,
        };
      } else {
        outcome = {
          status: 'none',
          term: decision.query.term,
          kind: decision.query.kind,
          planMs,
          retrievalMs,
        };
      }
    } catch (error) {
      console.error('context retrieval failed:', error);
      outcome = {
        status: 'error',
        term: decision.query.term,
        kind: decision.query.kind,
        planMs,
        retrievalMs: Date.now() - retrievalStarted,
      };
    }
  }

  return { messages: [systemMessage(contextBlock), ...userMessages], outcome: { source: 'transcripts', ...outcome } };
}

function logContextRetrievalOutcome(outcome: ContextRetrievalOutcome): void {
  const line = {
    route: 'chat',
    ...(outcome.source !== undefined ? { contextSource: outcome.source } : {}),
    contextRetrieval: outcome.status,
    ...(outcome.kind !== undefined ? { kind: outcome.kind } : {}),
    ...(outcome.term !== undefined ? { term: outcome.term } : {}),
    ...(outcome.count !== undefined ? { resultCount: outcome.count } : {}),
    planMs: outcome.planMs,
    ...(outcome.retrievalMs !== undefined ? { retrievalMs: outcome.retrievalMs } : {}),
  };
  if (outcome.status === 'error') console.error(JSON.stringify(line));
  else console.log(JSON.stringify(line));
}

export async function handleChatRequest(
  request: Request,
  deps: {
    stream?: typeof streamChat;
    checkLimit?: typeof checkRateLimit;
    plan?: typeof planContextQuery;
    retrieve?: typeof retrieveContext;
    retrieveEvidence?: typeof retrieveEvidence;
    source?: ContextSource;
  } = {},
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

  const origin = new URL(request.url).origin;
  const { messages, outcome } = await buildMessages(valid.messages, origin, {
    plan: deps.plan,
    retrieve: deps.retrieve,
    retrieveEvidence: deps.retrieveEvidence,
    source: deps.source,
  });
  logContextRetrievalOutcome(outcome);

  const stream = deps.stream ?? streamChat;
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

  const headers: Record<string, string> = {
    'content-type': 'text/plain; charset=utf-8',
    'cache-control': 'no-store',
    'x-context-retrieval': outcome.status,
  };
  if (outcome.source) headers['x-context-source'] = outcome.source;
  if (outcome.status === 'hit' && outcome.count !== undefined) {
    headers['x-context-retrieval-count'] = String(outcome.count);
  }

  return new Response(readable, { status: 200, headers });
}
