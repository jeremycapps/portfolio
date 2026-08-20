import { handleAnswerRequest } from './_lib/answer-core';
import { withApiLogging } from './_lib/http';

export const config = { runtime: 'edge' };

export default withApiLogging('api/answer', handleAnswerRequest);
