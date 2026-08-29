import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleContextQueryRequest } from './_lib/context-core.js';
import { withApiLogging } from './_lib/http.js';

// No `runtime: 'edge'` here, unlike the other routes: this needs @duckdb/node-api's
// native bindings, which only run in a Node.js function.
const loggedContextQueryHandler = withApiLogging('api/context-query', handleContextQueryRequest);

export function handleFetchRequest(request: Request): Promise<Response> {
  return loggedContextQueryHandler(request);
}

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toFetchRequest(request: VercelRequest): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) {
      for (const item of value) headers.append(name, item);
    } else if (value !== undefined) {
      headers.set(name, value);
    }
  }

  const protocol = firstHeader(request.headers['x-forwarded-proto']) ?? 'https';
  const host = firstHeader(request.headers.host) ?? 'localhost';
  const method = request.method ?? 'GET';
  const canHaveBody = method !== 'GET' && method !== 'HEAD';
  const body = canHaveBody && request.body !== undefined
    ? typeof request.body === 'string' || Buffer.isBuffer(request.body)
      ? request.body.toString()
      : JSON.stringify(request.body)
    : undefined;

  return new Request(new URL(request.url ?? '/', `${protocol}://${host}`), {
    method,
    headers,
    body,
  });
}

async function sendFetchResponse(response: VercelResponse, result: Response): Promise<void> {
  response.statusCode = result.status;
  result.headers.forEach((value, name) => response.setHeader(name, value));
  response.end(Buffer.from(await result.arrayBuffer()));
}

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
): Promise<void> {
  await sendFetchResponse(response, await handleFetchRequest(toFetchRequest(request)));
}
