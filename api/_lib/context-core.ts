import { jsonError, jsonResponse } from './http.js';
import {
  resolveR2Config,
  type ContextExpansion,
  type ContextQuery,
  type ContextQueryKind,
  type ContextQueryResult,
} from './context-index.js';
import { getContextRuntime } from './context-runtime.js';

const MAX_TERM_CHARS = 500;
const MAX_REQUEST_BYTES = 5_000;
const VALID_KINDS = new Set<ContextQueryKind>(['catalog', 'prose', 'code']);
const VALID_EXPANSIONS = new Set<ContextExpansion>(['none', 'neighbors', 'exchange']);

type ValidResult = { ok: true; value: ContextQuery } | { ok: false; error: string };

export function validateContextQueryBody(body: unknown): ValidResult {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request must be a JSON object.' };
  }
  const candidate = body as Record<string, unknown>;

  const term = typeof candidate.term === 'string' ? candidate.term.trim() : '';
  if (!term) return { ok: false, error: 'term must be a non-empty string.' };
  if (term.length > MAX_TERM_CHARS) return { ok: false, error: 'term is too long.' };

  if (typeof candidate.kind !== 'string' || !VALID_KINDS.has(candidate.kind as ContextQueryKind)) {
    return { ok: false, error: 'kind must be one of "catalog", "prose", or "code".' };
  }
  const kind = candidate.kind as ContextQueryKind;

  let expansion: ContextExpansion | undefined;
  if (candidate.expansion !== undefined) {
    if (
      typeof candidate.expansion !== 'string' ||
      !VALID_EXPANSIONS.has(candidate.expansion as ContextExpansion)
    ) {
      return { ok: false, error: 'expansion must be one of "none", "neighbors", or "exchange".' };
    }
    expansion = candidate.expansion as ContextExpansion;
  }

  let limit: number | undefined;
  if (candidate.limit !== undefined) {
    if (typeof candidate.limit !== 'number' || !Number.isFinite(candidate.limit)) {
      return { ok: false, error: 'limit must be a number.' };
    }
    limit = candidate.limit;
  }

  return { ok: true, value: { term, kind, expansion, limit } };
}

type QueryRunner = (query: ContextQuery) => Promise<ContextQueryResult>;

async function defaultRunQuery(query: ContextQuery): Promise<ContextQueryResult> {
  const config = resolveR2Config();
  if (!config) throw new Error('context index storage is not configured');
  const runtime = await getContextRuntime(config);
  return runtime.runQuery(query);
}

export async function handleContextQueryRequest(
  request: Request,
  deps: { runQuery?: QueryRunner } = {},
): Promise<Response> {
  if (request.method !== 'POST') {
    return jsonError('Method not allowed.', 'METHOD_NOT_ALLOWED', 405);
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return jsonError('Request too large.', 'REQUEST_TOO_LARGE', 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError('Invalid JSON.', 'INVALID_JSON', 400);
  }

  const validation = validateContextQueryBody(body);
  if (!validation.ok) {
    return jsonError(validation.error, 'INVALID_REQUEST', 400);
  }

  try {
    const result = await (deps.runQuery ?? defaultRunQuery)(validation.value);
    return jsonResponse({ protocol: 'portfolio.context-query/1', ...result });
  } catch (error) {
    console.error('Context query failed:', error);
    return jsonError('The context index could not be queried.', 'CONTEXT_QUERY_FAILED', 500);
  }
}
