import { handleContextQueryRequest } from './_lib/context-core';
import { withApiLogging } from './_lib/http';

// No `runtime: 'edge'` here, unlike the other routes: this needs @duckdb/node-api's
// native bindings, which only run in a Node.js function.
const loggedContextQueryHandler = withApiLogging('api/context-query', handleContextQueryRequest);

export default function handler(request: Request): Promise<Response> {
  return loggedContextQueryHandler(request);
}
