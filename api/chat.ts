import { handleChatRequest } from './_lib/chat-core';
import { withApiLogging } from './_lib/http';

export const config = { runtime: 'edge' };

export default withApiLogging('api/chat', handleChatRequest);
