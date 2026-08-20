import { handleResumeRequest } from './_lib/resume-core';
import { withApiLogging } from './_lib/http';

export const config = { runtime: 'edge' };

const loggedResumeHandler = withApiLogging('api/resume', handleResumeRequest);

export default function handler(request: Request): Promise<Response> {
  return loggedResumeHandler(request);
}
