import type { VercelRequest, VercelResponse } from '@vercel/node';
import { handleResumeRequest } from './_lib/resume-core';

function requestBody(request: VercelRequest): BodyInit | undefined {
  if (request.body === undefined) return undefined;
  return typeof request.body === 'string' ? request.body : JSON.stringify(request.body);
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const method = request.method ?? 'GET';
  const host = request.headers.host ?? 'localhost';
  const fetchRequest = new Request(`https://${host}${request.url ?? '/api/resume'}`, {
    method,
    headers: request.headers as HeadersInit,
    body: method === 'GET' || method === 'HEAD' ? undefined : requestBody(request),
  });
  const fetchResponse = await handleResumeRequest(fetchRequest);
  response.status(fetchResponse.status);
  fetchResponse.headers.forEach((value, key) => response.setHeader(key, value));
  response.send(Buffer.from(await fetchResponse.arrayBuffer()));
}
