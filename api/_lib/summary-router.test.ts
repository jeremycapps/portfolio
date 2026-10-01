import { describe, expect, it } from 'vitest';
import { matchSummary, routeSummary } from './summary-router';

describe('routing a JD to the nearest tailored summary', () => {
  const cases: [string, string][] = [
    ['Senior Frontend Engineer on our AI observability and evaluation platform. Build developer-facing product surfaces in TypeScript and React for tracing and evaluating LLM agents.', 'frontend-design-systems'],
    ['Implementation Engineer. Integrate our payments API end to end with technical customers: authentication, data mapping, testing, go-live support across external systems.', 'integration-engineer'],
    ['Special Projects Lead in the founder office. Take ambiguous 0-to-1 problems from first principles to shipped, build internal AI tooling, high agency.', 'zero-to-one-generalist'],
    ['Forward Deployed Engineer. Own technical delivery for customers: API integrations, MCP servers, large-scale data migration, explain tradeoffs to stakeholders.', 'forward-deployed-solutions'],
    ['Applied AI Engineer. Make agents reliable: evaluation harnesses, agent runtimes, LangGraph orchestration, measure unsupported claims.', 'applied-ai-agents'],
  ];

  it('routes each representative JD to the summary written for that kind of role', () => {
    for (const [jd, expected] of cases) {
      expect(matchSummary(jd)?.id, jd.slice(0, 40)).toBe(expected);
    }
  });

  it('returns the winner with a clear margin over the runner-up', () => {
    const ranked = routeSummary(cases[1][0]).ranked;
    expect(ranked[0].score).toBeGreaterThan(ranked[1].score * 1.5);
  });

  it('declines a JD unlike anything in the corpus, so the caller can fall back', () => {
    const ml = 'Research Scientist. Train large models with JAX and PyTorch on distributed GPU clusters; publish at NeurIPS; CUDA kernel optimization.';
    const result = routeSummary(ml);
    expect(result.match).toBeNull(); // below threshold — no honest match
  });
});

describe('a routed application carries its per-role titles', () => {
  it('exposes the single tailored title per organization', () => {
    const m = matchSummary('Implementation Engineer. Payments API integration end to end with technical customers: authentication, data mapping, go-live.');
    expect(m?.id).toBe('integration-engineer');
    expect(m?.roles.Aroko).toBe('Technical Director, Client Web Work');
    expect(m?.roles.Zocdoc).toBe('Design Systems Engineer');
  });

  it('titles the same role differently for a different job', () => {
    const generalist = matchSummary('Special Projects Lead, founder office. Ambiguous 0-to-1, internal AI tooling, high agency, first principles.');
    expect(generalist?.roles.Aroko).toBe('Head of Operations');
  });
});
