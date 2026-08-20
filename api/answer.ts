import { handleAnswerRequest } from './_lib/answer-core';
import { withApiLogging } from './_lib/http';

export const config = { runtime: 'edge' };

const loggedAnswerHandler = withApiLogging('api/answer', handleAnswerRequest);

export default function handler(request: Request): Promise<Response> {
  return loggedAnswerHandler(request);
}
