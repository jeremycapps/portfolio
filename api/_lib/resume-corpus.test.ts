import { describe, it, expect } from 'vitest';
import { loadResumeCorpus } from './resume-corpus';

describe('resume corpus snapshot', () => {
  it('loads a non-empty, well-formed corpus', () => {
    const corpus = loadResumeCorpus();
    expect(corpus.header.name).toBeTruthy();
    expect(corpus.engagements.length).toBeGreaterThan(0);
    for (const eng of corpus.engagements) {
      expect(eng.id).toBeTruthy();
      expect(Array.isArray(eng.bullets)).toBe(true);
      for (const b of eng.bullets) {
        expect(b.id).toBeTruthy();
        expect(b.text.trim().length).toBeGreaterThan(0);
        expect(Array.isArray(b.sourceRefs)).toBe(true);
      }
    }
  });

  it('has unique bullet ids', () => {
    const corpus = loadResumeCorpus();
    const ids = corpus.engagements.flatMap((e) => e.bullets.map((b) => b.id));
    expect(new Set(ids).size).toBe(ids.length);
  });
});
