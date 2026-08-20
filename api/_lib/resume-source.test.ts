import { describe, it, expect } from 'vitest';
import { prerank, tokenize, type RankedBullet } from './resume-source';
import { loadResumeCorpus } from './resume-corpus';
import type { ResumeCorpus } from './resume-corpus';

const CORPUS: ResumeCorpus = {
  header: { name: 'Test', contacts: [] },
  engagements: [
    {
      id: 'ops', organization: 'Aroko', roleContext: ['Head of Operations'], timePeriod: '2024',
      themes: ['project_operations', 'budgeting'], roleFit: { strongest: ['Product Operations'], secondary: [] },
      caution: [],
      bullets: [{ id: 'ops.b1', text: 'Built a budgeting and operations system', evidenceRefs: [], sourceRefs: ['s'] }],
    },
    {
      id: 'fe', organization: 'Zocdoc', roleContext: ['Frontend Engineer'], timePeriod: '2021',
      themes: ['react', 'design_systems'], roleFit: { strongest: ['Frontend Engineer'], secondary: [] },
      caution: [],
      bullets: [{ id: 'fe.b1', text: 'Migrated React design system components', evidenceRefs: [], sourceRefs: ['s'] }],
    },
  ],
  skills: [], education: [], projects: [],
};

describe('tokenize', () => {
  it('lowercases and splits on non-alphanumerics', () => {
    expect(tokenize('Product-Operations!')).toEqual(['product', 'operations']);
  });

  it('returns an empty list when there is nothing tokenizable', () => {
    expect(tokenize('   —  ')).toEqual([]);
  });

  it('keeps digits as tokens', () => {
    expect(tokenize('React 18 / Node_20')).toEqual(['react', '18', 'node', '20']);
  });
});

describe('prerank', () => {
  it('ranks the operations bullet first for an operations job', () => {
    const ranked = prerank('Seeking a product operations lead for budgeting', CORPUS);
    expect(ranked[0].bulletId).toBe('ops.b1');
  });

  it('ranks the frontend bullet first for a react job', () => {
    const ranked = prerank('Frontend engineer, React design systems', CORPUS);
    expect(ranked[0].bulletId).toBe('fe.b1');
  });

  it('includes every bullet exactly once', () => {
    const ranked: RankedBullet[] = prerank('anything', CORPUS);
    expect(ranked.map((r) => r.bulletId).sort()).toEqual(['fe.b1', 'ops.b1']);
  });

  it('carries the engagement id, verbatim bullet text, and a numeric score', () => {
    const ranked = prerank('operations', CORPUS);
    const ops = ranked.find((r) => r.bulletId === 'ops.b1');
    expect(ops).toEqual({
      engagementId: 'ops',
      bulletId: 'ops.b1',
      text: 'Built a budgeting and operations system',
      score: expect.any(Number),
    });
  });

  it('keeps corpus order for ties', () => {
    const ranked = prerank('nothing here matches the corpus', CORPUS);
    expect(ranked.map((r) => r.score)).toEqual([0, 0]);
    expect(ranked.map((r) => r.bulletId)).toEqual(['ops.b1', 'fe.b1']);
  });

  it('sorts by descending score', () => {
    const scores = prerank('product operations budgeting react', CORPUS).map((r) => r.score);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('is deterministic for the same input', () => {
    const job = 'Frontend engineer, React design systems';
    expect(prerank(job, CORPUS)).toEqual(prerank(job, CORPUS));
  });

  it('covers the baked corpus without dropping or duplicating bullets', () => {
    const corpus = loadResumeCorpus();
    const expected = corpus.engagements.flatMap((e) => e.bullets.map((b) => b.id));
    const ranked = prerank('Technical Operations Manager for an internal budgeting product', corpus);
    expect(ranked).toHaveLength(expected.length);
    expect(ranked.map((r) => r.bulletId).sort()).toEqual([...expected].sort());
  });

  it('leaves baked-corpus bullet text source-verbatim', () => {
    const corpus = loadResumeCorpus();
    const byId = new Map(corpus.engagements.flatMap((e) => e.bullets.map((b) => [b.id, b.text] as const)));
    for (const r of prerank('operations', corpus)) {
      expect(r.text).toBe(byId.get(r.bulletId));
    }
  });
});
