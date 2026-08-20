import { handleResumeRequest } from './_lib/resume-core';
import { withApiLogging } from './_lib/http';

export const config = { runtime: 'edge' };

export default withApiLogging('api/resume', handleResumeRequest);
