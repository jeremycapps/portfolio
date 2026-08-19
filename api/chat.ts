import { handleChatRequest } from './_lib/chat-core.ts';

export const config = { runtime: 'edge' };

export default function handler(request: Request): Promise<Response> {
  return handleChatRequest(request);
}
