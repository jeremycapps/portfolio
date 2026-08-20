import { handleResumeRequest } from './_lib/resume-core';

export const config = { runtime: 'edge' };

export default async function handler(request: Request): Promise<Response> {
  const startedAt = Date.now();
  console.info(`[api/resume] ${request.method} request`);
  const response = await handleResumeRequest(request);
  console.info(
    `[api/resume] ${request.method} ${response.status} ${Date.now() - startedAt}ms`,
  );
  return response;
}
