import { describe, expect, it, vi } from 'vitest';
import { handleResumeRequest, validateResumeBody } from './resume-core';
import type { ResumeAssembly } from './resume-source';

const okLimit = async () => ({ ok: true as const });
const stubAssembly: ResumeAssembly = {
  view: {
    header: { name: 'Jeremy', contacts: [] },
    summary: { text: 's', engine: 'deterministic' },
    experience: [],
    skills: [],
    education: [],
    projects: [],
    awards: [],
  },
  provenance: { deterministicPct: 100, modelPct: 0, operations: [] },
  diagnostics: {
    selectionMs: 1,
    summaryMs: 2,
    shortlistCount: 3,
    summaryEvidenceCount: 3,
    summaryEngine: 'deterministic',
    fallbackReason: 'no_model',
  },
};

function post(body: unknown): Request {
  return new Request('https://example.com/api/resume', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('validateResumeBody', () => {
  it('rejects a missing job description', () => {
    expect(validateResumeBody({})).toEqual({ ok: false, error: expect.any(String) });
  });

  it('trims and accepts a job description', () => {
    expect(validateResumeBody({ jobDescription: '  operations role  ' })).toEqual({
      ok: true,
      value: { jobDescription: 'operations role' },
    });
  });

  it('rejects an over-long job description', () => {
    expect(validateResumeBody({ jobDescription: 'x'.repeat(20_001) }).ok).toBe(false);
  });

  it('rejects non-object bodies', () => {
    expect(validateResumeBody(null).ok).toBe(false);
    expect(validateResumeBody([]).ok).toBe(false);
  });
});

describe('handleResumeRequest', () => {
  it('rejects non-POST requests', async () => {
    const response = await handleResumeRequest(
      new Request('https://example.com/api/resume'),
      { checkLimit: okLimit },
    );
    expect(response.status).toBe(405);
  });

  it('returns the assembled view and provenance', async () => {
    const assemble = vi.fn(async () => stubAssembly);
    const logDiagnostic = vi.fn();
    const response = await handleResumeRequest(post({ jobDescription: 'ops role' }), {
      checkLimit: okLimit,
      assemble,
      logDiagnostic,
    });
    expect(response.status).toBe(200);
    expect(assemble).toHaveBeenCalledWith('ops role');
    await expect(response.json()).resolves.toMatchObject({
      protocol: 'portfolio.resume/1',
      view: { header: { name: 'Jeremy' } },
      provenance: { deterministicPct: 100 },
    });
    expect(logDiagnostic).toHaveBeenCalledOnce();
    expect(logDiagnostic).toHaveBeenCalledWith({
      event: 'resume_assembly',
      diagnostics: stubAssembly.diagnostics,
    });
  });

  it('does not expose diagnostics in the public response', async () => {
    const response = await handleResumeRequest(post({ jobDescription: 'ops role' }), {
      checkLimit: okLimit,
      assemble: async () => stubAssembly,
      logDiagnostic: vi.fn(),
    });
    expect(await response.json()).not.toHaveProperty('diagnostics');
  });

  it('keeps a successful response successful when diagnostic logging throws', async () => {
    const response = await handleResumeRequest(post({ jobDescription: 'private sentinel jd' }), {
      checkLimit: okLimit,
      assemble: async () => stubAssembly,
      logDiagnostic: () => {
        throw new Error('logger unavailable');
      },
    });
    expect(response.status).toBe(200);
  });

  it('keeps job, source, contact, and model text out of diagnostics', async () => {
    const logDiagnostic = vi.fn();
    const privateAssembly: ResumeAssembly = {
      ...stubAssembly,
      view: {
        ...stubAssembly.view,
        header: { name: 'Jeremy', contacts: ['private-contact-sentinel'] },
        summary: { text: 'private-model-sentinel', engine: 'model' },
        experience: [{
          organization: 'Private Org',
          roleContext: ['Private Role'],
          timePeriod: '2026',
          bullets: ['private-source-sentinel'],
          sourceRefs: ['private-ref-sentinel'],
        }],
      },
    };
    const response = await handleResumeRequest(
      post({ jobDescription: 'private-jd-sentinel' }),
      {
        checkLimit: okLimit,
        assemble: async () => privateAssembly,
        logDiagnostic,
      },
    );

    expect(response.status).toBe(200);
    const serialized = JSON.stringify(logDiagnostic.mock.calls);
    expect(serialized).not.toContain('private-jd-sentinel');
    expect(serialized).not.toContain('private-source-sentinel');
    expect(serialized).not.toContain('private-contact-sentinel');
    expect(serialized).not.toContain('private-model-sentinel');
  });

  it('rejects an invalid body', async () => {
    const response = await handleResumeRequest(post({}), { checkLimit: okLimit });
    expect(response.status).toBe(400);
  });

  it('rejects invalid JSON', async () => {
    const request = new Request('https://example.com/api/resume', {
      method: 'POST',
      body: '{',
    });
    const response = await handleResumeRequest(request, { checkLimit: okLimit });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ code: 'INVALID_JSON' });
  });

  it('returns retry-after when rate limited', async () => {
    const response = await handleResumeRequest(post({ jobDescription: 'ops role' }), {
      checkLimit: async () => ({ ok: false, retryAfter: 12 }),
    });
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('12');
  });

  it('rejects a request whose declared body is too large', async () => {
    const request = post({ jobDescription: 'ops role' });
    request.headers.set('content-length', '25001');
    const response = await handleResumeRequest(request, { checkLimit: okLimit });
    expect(response.status).toBe(413);
  });

  it('returns a stable error envelope when assembly fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const response = await handleResumeRequest(post({ jobDescription: 'ops role' }), {
      checkLimit: okLimit,
      assemble: async () => {
        throw new Error('boom');
      },
    });
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({ code: 'RESUME_ASSEMBLY_FAILED' });
    consoleError.mockRestore();
  });
});
