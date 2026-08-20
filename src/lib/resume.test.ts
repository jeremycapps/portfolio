import { afterEach, describe, expect, it, vi } from 'vitest';
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
};

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

  it('throws INVALID_RESPONSE when the body is not JSON', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('<html>gateway</html>', { status: 502, headers: { 'content-type': 'text/html' } }),
    );

    await expect(sendResumeRequest('x')).rejects.toMatchObject({ code: 'INVALID_RESPONSE', status: 502 });
  });
});
