export interface ApiErrorBody {
  error: string;
  code: string;
}

export type ApiHandler = (request: Request) => Promise<Response>;

type ApiLogger = Pick<Console, 'info' | 'error'>;

export function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

export function jsonError(
  error: string,
  code: string,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return jsonResponse({ error, code } satisfies ApiErrorBody, status, headers);
}

export function withApiLogging(
  route: string,
  handler: ApiHandler,
  logger: ApiLogger = console,
): ApiHandler {
  return async (request) => {
    const startedAt = Date.now();
    logger.info(`[${route}] ${request.method} request`);

    try {
      const response = await handler(request);
      logger.info(`[${route}] ${request.method} ${response.status} ${Date.now() - startedAt}ms`);
      return response;
    } catch (error) {
      logger.error(
        `[${route}] ${request.method} unhandled error after ${Date.now() - startedAt}ms`,
        error,
      );
      throw error;
    }
  };
}
