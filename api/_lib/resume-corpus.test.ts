import { describe, it, expect } from 'vitest';
import { loadResumeCorpus } from './resume-corpus';
import { RESUME_CORPUS } from './resume-corpus.generated';

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

  it('returns the baked snapshot itself', () => {
    expect(loadResumeCorpus()).toBe(RESUME_CORPUS);
  });

  it('returns a stable value across calls', () => {
    expect(loadResumeCorpus()).toBe(loadResumeCorpus());
  });

  it('exposes every top-level section with the documented types', () => {
    const corpus = loadResumeCorpus();
    expect(Object.keys(corpus).sort()).toEqual([
      'education',
      'engagements',
      'header',
      'projects',
      'skills',
    ]);
    expect(typeof corpus.header.name).toBe('string');
    expect(Array.isArray(corpus.header.contacts)).toBe(true);
    expect(corpus.header.contacts.length).toBeGreaterThan(0);
    for (const contact of corpus.header.contacts) {
      expect(typeof contact).toBe('string');
      expect(contact.trim().length).toBeGreaterThan(0);
    }
    expect(Array.isArray(corpus.engagements)).toBe(true);
    // skills/projects are curated by hand and intentionally empty for v1, but
    // must still be arrays so downstream consumers can iterate unconditionally.
    expect(Array.isArray(corpus.skills)).toBe(true);
    expect(Array.isArray(corpus.projects)).toBe(true);
    expect(Array.isArray(corpus.education)).toBe(true);
    expect(corpus.education.length).toBeGreaterThan(0);
    for (const entry of corpus.education) {
      expect(typeof entry.degree).toBe('string');
      expect(entry.degree.trim().length).toBeGreaterThan(0);
    }
  });

  it('is non-trivial: many engagements and at least one bullet', () => {
    const corpus = loadResumeCorpus();
    expect(corpus.engagements.length).toBeGreaterThan(1);
    const bullets = corpus.engagements.flatMap((e) => e.bullets);
    expect(bullets.length).toBeGreaterThan(0);
    expect(corpus.engagements.some((e) => e.bullets.length > 0)).toBe(true);
  });

  it('has unique engagement ids', () => {
    const ids = loadResumeCorpus().engagements.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('derives bullet ids as <engagementId>.b<n>, 1-based and contiguous', () => {
    for (const eng of loadResumeCorpus().engagements) {
      const expected = eng.bullets.map((_, i) => `${eng.id}.b${i + 1}`);
      expect(eng.bullets.map((b) => b.id)).toEqual(expected);
      for (const b of eng.bullets) {
        expect(b.id).toMatch(/^[a-z0-9_]+\.b[1-9][0-9]*$/);
      }
    }
  });

  it('fills every engagement field, with array fields always arrays', () => {
    for (const eng of loadResumeCorpus().engagements) {
      expect(typeof eng.id).toBe('string');
      expect(typeof eng.organization).toBe('string');
      expect(typeof eng.timePeriod).toBe('string');
      for (const list of [eng.roleContext, eng.themes, eng.caution]) {
        expect(Array.isArray(list)).toBe(true);
        for (const item of list) expect(typeof item).toBe('string');
      }
      expect(eng.roleFit).toBeTruthy();
      expect(Array.isArray(eng.roleFit.strongest)).toBe(true);
      expect(Array.isArray(eng.roleFit.secondary)).toBe(true);
      for (const item of [...eng.roleFit.strongest, ...eng.roleFit.secondary]) {
        expect(typeof item).toBe('string');
      }
    }
  });

  it('carries substantive engagement metadata for pre-ranking', () => {
    const engagements = loadResumeCorpus().engagements;
    for (const eng of engagements) {
      expect(eng.organization.trim().length).toBeGreaterThan(0);
      expect(eng.timePeriod.trim().length).toBeGreaterThan(0);
      expect(eng.themes.length).toBeGreaterThan(0);
    }
    expect(engagements.some((e) => e.roleFit.strongest.length > 0)).toBe(true);
    expect(engagements.some((e) => e.roleContext.length > 0)).toBe(true);
  });

  it('keeps bullet text verbatim-clean (no surrounding whitespace)', () => {
    for (const eng of loadResumeCorpus().engagements) {
      for (const b of eng.bullets) {
        expect(typeof b.text).toBe('string');
        expect(b.text).toBe(b.text.trim());
        expect(b.text.length).toBeGreaterThan(0);
      }
    }
  });

  it('attributes every bullet to its own engagement in engagements.yaml', () => {
    for (const eng of loadResumeCorpus().engagements) {
      for (const b of eng.bullets) {
        expect(Array.isArray(b.evidenceRefs)).toBe(true);
        expect(b.sourceRefs.length).toBeGreaterThan(0);
        expect(b.sourceRefs).toContain(`engagements.yaml#${eng.id}`);
        for (const ref of b.sourceRefs) {
          expect(ref).toBe(`engagements.yaml#${eng.id}`);
        }
      }
    }
  });

  it('attributes the operating-plan and composable-costing claims to Aroko, not Freelance', () => {
    const corpus = loadResumeCorpus();
    expect(
      corpus.engagements.some((engagement) =>
        /independent\s*\/\s*freelance/i.test(engagement.organization),
      ),
    ).toBe(false);

    const corrected = corpus.engagements.find(
      (engagement) => engagement.id === 'aroko_design_program_management',
    );
    expect(corrected?.organization).toBe('Aroko');
    expect(corrected?.bullets.map((bullet) => bullet.text)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('90-day operating plan for Aroko'),
        expect.stringContaining('Composable Costing methodology at Aroko'),
      ]),
    );
  });
});
