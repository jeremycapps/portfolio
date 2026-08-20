import { handleChatRequest } from './_lib/chat-core';
import { withApiLogging } from './_lib/http';

export const config = { runtime: 'edge' };

const loggedChatHandler = withApiLogging('api/chat', handleChatRequest);

export default function handler(request: Request): Promise<Response> {
  return loggedChatHandler(request);
}
