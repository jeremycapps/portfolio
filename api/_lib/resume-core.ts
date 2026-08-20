import { getConfig } from './config';
import { collectChat } from './provider';
import { checkRateLimit } from './rate-limit';
import { loadResumeCorpus } from './resume-corpus';
import { assembleResume, type ResumeAssembly } from './resume-source';

const MAX_JOB_CHARS = 20_000;
const MAX_REQUEST_BYTES = 25_000;

type ValidResult =
  | { ok: true; value: { jobDescription: string } }
  | { ok: false; error: string };

type ResumeAssembler = (job: string) => Promise<ResumeAssembly>;
type RateLimitCheck = (request: Request) => ReturnType<typeof checkRateLimit>;

export function validateResumeBody(body: unknown): ValidResult {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, error: 'Request must be a JSON object.' };
  }

  const candidate = body as Record<string, unknown>;
  const jobDescription =
    typeof candidate.jobDescription === 'string' ? candidate.jobDescription.trim() : '';
  if (!jobDescription) {
    return { ok: false, error: 'jobDescription must be a non-empty string.' };
  }
  if (jobDescription.length > MAX_JOB_CHARS) {
    return { ok: false, error: 'jobDescription is too long.' };
  }
  return { ok: true, value: { jobDescription } };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function defaultAssemble(job: string): Promise<ResumeAssembly> {
  return assembleResume(job, loadResumeCorpus(), {
    hasModel: Boolean(getConfig().openRouterKey),
    collect: (messages) => collectChat(messages),
  });
}

export async function handleResumeRequest(
  request: Request,
  deps: { assemble?: ResumeAssembler; checkLimit?: RateLimitCheck } = {},
): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.', code: 'METHOD_NOT_ALLOWED' }, 405);
  }

  const limit = await (
    deps.checkLimit ?? ((candidate) => checkRateLimit(candidate, {}, 'resume'))
  )(request);
  if (!limit.ok) {
    const response = json(
      { error: 'Too many requests — please slow down.', code: 'RATE_LIMITED' },
      429,
    );
    response.headers.set('retry-after', String(limit.retryAfter));
    return response;
  }

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return json({ error: 'Request too large.', code: 'REQUEST_TOO_LARGE' }, 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.', code: 'INVALID_JSON' }, 400);
  }

  const validation = validateResumeBody(body);
  if (!validation.ok) {
    return json({ error: validation.error, code: 'INVALID_REQUEST' }, 400);
  }

  try {
    const { view, provenance } = await (deps.assemble ?? defaultAssemble)(
      validation.value.jobDescription,
    );
    return json({ protocol: 'portfolio.resume/1', view, provenance }, 200);
  } catch (error) {
    console.error('Resume assembly failed:', error);
    return json(
      { error: 'The resume could not be assembled.', code: 'RESUME_ASSEMBLY_FAILED' },
      500,
    );
  }
}
