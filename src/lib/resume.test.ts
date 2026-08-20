import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ResumeProvenance, ResumeResponse, ResumeView } from './resume';
import { ResumeApiError, sendResumeRequest } from './resume';

afterEach(() => vi.restoreAllMocks());

const okBody = {
  protocol: 'portfolio.resume/1',
  view: {
    header: { name: 'Jeremy', contacts: [] },
    summary: { text: 's', engine: 'deterministic' },
    experience: [],
    skills: [],
    education: [],
    projects: [],
  },
  provenance: { deterministicPct: 100, modelPct: 0, operations: [] },
} satisfies ResumeResponse;

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('sendResumeRequest', () => {
  it('posts the job description and returns the parsed response', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(okBody), { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    const res = await sendResumeRequest('ops role');

    expect(res.view.header.name).toBe('Jeremy');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/resume');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(String(init?.body))).toEqual({ jobDescription: 'ops role' });
  });

  it('sends the JSON content-type header so the endpoint parses the body', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(okBody), { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    await sendResumeRequest('ops role');

    const [, init] = fetchMock.mock.calls[0];
    // Normalize: headers may be a plain record or a Headers instance.
    const headers = new Headers(init?.headers);
    expect(headers.get('content-type')).toBe('application/json');
  });

  it('forwards the abort signal to fetch and rejects when it aborts', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) {
            reject(signal.reason);
            return;
          }
          signal?.addEventListener('abort', () => reject(signal.reason));
          // Otherwise never settles: only the abort can end this request.
        }),
      );

    const controller = new AbortController();
    const pending = sendResumeRequest('ops role', controller.signal);

    const [, init] = fetchMock.mock.calls[0];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.signal).toBe(controller.signal);

    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('throws ResumeApiError with the server code on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ error: 'nope', code: 'RESUME_ASSEMBLY_FAILED' }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(sendResumeRequest('x')).rejects.toMatchObject({ code: 'RESUME_ASSEMBLY_FAILED', status: 500 });
    await expect(sendResumeRequest('x')).rejects.toBeInstanceOf(ResumeApiError);
  });

  it('falls back to RESUME_REQUEST_FAILED when a failing body omits error and code', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(jsonResponse({}, 503));

    await expect(sendResumeRequest('x')).rejects.toMatchObject({
      name: 'ResumeApiError',
      message: 'The resume service is unavailable.',
      code: 'RESUME_REQUEST_FAILED',
      status: 503,
    });
  });

  it('ignores non-string error and code fields and uses the fallbacks', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      jsonResponse({ error: { message: 'structured' }, code: 42 }, 400),
    );

    await expect(sendResumeRequest('x')).rejects.toMatchObject({
      message: 'The resume service is unavailable.',
      code: 'RESUME_REQUEST_FAILED',
      status: 400,
    });
  });

  it('throws INVALID_RESPONSE when the body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>gateway</html>', { status: 502, headers: { 'content-type': 'text/html' } }),
    );

    await expect(sendResumeRequest('x')).rejects.toMatchObject({ code: 'INVALID_RESPONSE', status: 502 });
  });
});

/**
 * Compile-time guard: the exported client types must stay structurally identical
 * to the shared contract in
 * docs/superpowers/plans/2026-08-20-deterministic-resume-surface.md (Task 7).
 * The contract below is transcribed from the plan; `tsc --noEmit` fails if the
 * exported types drift in either direction.
 */
interface ContractResumeView {
  header: { name: string; contacts: string[] };
  summary: { text: string; engine: 'model' | 'deterministic' };
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
}

interface ContractResumeProvenance {
  deterministicPct: number;
  modelPct: number;
  operations: Array<{ kind: string; engine: 'deterministic' | 'model'; detail: string }>;
}

interface ContractResumeResponse {
  protocol: 'portfolio.resume/1';
  view: ContractResumeView;
  provenance: ContractResumeProvenance;
}

type MutuallyAssignable<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

describe('resume contract types', () => {
  it('exports view, provenance and response types matching the plan contract', () => {
    const viewMatches: MutuallyAssignable<ResumeView, ContractResumeView> = true;
    const provenanceMatches: MutuallyAssignable<ResumeProvenance, ContractResumeProvenance> = true;
    const responseMatches: MutuallyAssignable<ResumeResponse, ContractResumeResponse> = true;

    expect([viewMatches, provenanceMatches, responseMatches]).toEqual([true, true, true]);
  });

  it('types sendResumeRequest as returning the contract response shape', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(okBody), { status: 200, headers: { 'content-type': 'application/json' } }),
    );

    const res: ContractResumeResponse = await sendResumeRequest('ops role');

    expect(res).toEqual(okBody);
    expect(res.protocol).toBe('portfolio.resume/1');
  });
});
