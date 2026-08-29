import type { CatalogRow, ContextQuery, ContextRow } from './context-index';

export interface ContextRetrievalDeps {
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  apiKey?: string;
}

const RETRIEVAL_TIMEOUT_MS = 4_000;

export class ContextRetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContextRetrievalError';
  }
}

export async function retrieveContext(
  query: ContextQuery,
  origin: string,
  deps: ContextRetrievalDeps = {},
): Promise<Array<ContextRow | CatalogRow>> {
  const apiKey = deps.apiKey ?? process.env.CONTEXT_QUERY_API_KEY;
  if (!apiKey) {
    throw new ContextRetrievalError('CONTEXT_QUERY_API_KEY is not configured.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(new DOMException('Context retrieval timed out.', 'TimeoutError')),
    deps.timeoutMs ?? RETRIEVAL_TIMEOUT_MS,
  );
  try {
    const response = await (deps.fetchImpl ?? fetch)(`${origin}/api/context-query`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(query),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new ContextRetrievalError(`context-query request failed with status ${response.status}.`);
    }
    const body = (await response.json()) as { results?: Array<ContextRow | CatalogRow> };
    return body.results ?? [];
  } finally {
    clearTimeout(timeout);
  }
}
