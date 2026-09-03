export interface ResumeView {
  header: { name: string; contacts: string[] };
  summary: { text: string; engine: 'model' | 'deterministic' | 'retrieved' };
  experience: Array<{
    organization: string;
    roleContext: string[];
    timePeriod: string;
    bullets: string[];
    sourceRefs: string[];
  }>;
  skills: Array<{ group: string; items: string[] }>;
  education: Array<{ degree: string }>;
  projects: Array<{ id: string; name: string; text: string; sourceRefs: string[] }>;
  awards: Array<{ name: string; year: number }>;
}

export interface ResumeProvenance {
  deterministicPct: number;
  modelPct: number;
  operations: Array<{ kind: string; engine: 'deterministic' | 'model' | 'retrieved'; detail: string }>;
}

export interface ResumeResponse {
  protocol: 'portfolio.resume/1';
  view: ResumeView;
  provenance: ResumeProvenance;
}

export class ResumeApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ResumeApiError';
  }
}

export async function sendResumeRequest(
  jobDescription: string,
  signal?: AbortSignal,
): Promise<ResumeResponse> {
  const response = await fetch('/api/resume', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jobDescription }),
    signal,
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ResumeApiError('The resume service returned an unreadable response.', 'INVALID_RESPONSE', response.status);
  }

  if (!response.ok) {
    const error = body as { error?: unknown; code?: unknown };
    throw new ResumeApiError(
      typeof error.error === 'string' ? error.error : 'The resume service is unavailable.',
      typeof error.code === 'string' ? error.code : 'RESUME_REQUEST_FAILED',
      response.status,
    );
  }

  return body as ResumeResponse;
}
