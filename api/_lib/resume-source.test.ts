import { describe, it, expect } from 'vitest';
import {
  assembleResume,
  computeProvenance,
  parseIdList,
  prerank,
  selectBullets,
  summarize,
  tokenize,
  type RankedBullet,
  type ResumeView,
} from './resume-source';
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

describe('parseIdList', () => {
  it('parses a JSON array of strings, ignoring surrounding prose', () => {
    expect(parseIdList('Here you go: ["ops.b1", "fe.b1"] done')).toEqual(['ops.b1', 'fe.b1']);
  });

  it('returns an empty list on garbage', () => {
    expect(parseIdList('no json here')).toEqual([]);
  });
});

describe('selectBullets', () => {
  const ranked = prerank('anything', CORPUS);

  it('uses deterministic order when no model is configured', async () => {
    const result = await selectBullets('job', CORPUS, ranked, { hasModel: false });
    expect(result.engine).toBe('deterministic');
    expect(result.orderedBulletIds).toEqual(ranked.map((bullet) => bullet.bulletId));
  });

  it('honors model-returned known ids and marks engine model', async () => {
    const result = await selectBullets('job', CORPUS, ranked, {
      hasModel: true,
      collect: async () => '["fe.b1", "ops.b1"]',
    });
    expect(result).toEqual({ orderedBulletIds: ['fe.b1', 'ops.b1'], engine: 'model' });
  });

  it('drops unknown ids and deduplicates', async () => {
    const result = await selectBullets('job', CORPUS, ranked, {
      hasModel: true,
      collect: async () => '["fe.b1", "fe.b1", "nope"]',
    });
    expect(result).toEqual({ orderedBulletIds: ['fe.b1'], engine: 'model' });
  });

  it('falls back to deterministic order on empty or garbage model output', async () => {
    const result = await selectBullets('job', CORPUS, ranked, {
      hasModel: true,
      collect: async () => 'sorry, no ids',
    });
    expect(result.engine).toBe('deterministic');
    expect(result.orderedBulletIds).toEqual(ranked.map((bullet) => bullet.bulletId));
  });

  it('falls back to deterministic order when the model call throws', async () => {
    const result = await selectBullets('job', CORPUS, ranked, {
      hasModel: true,
      collect: async () => {
        throw new Error('network');
      },
    });
    expect(result.engine).toBe('deterministic');
  });
});

describe('summarize', () => {
  const selected = prerank('anything', CORPUS);

  it('assembles from source when no model is configured', async () => {
    const result = await summarize('job', selected, { hasModel: false });
    expect(result.engine).toBe('deterministic');
    expect(result.text.length).toBeGreaterThan(0);
  });

  it('uses trimmed model text when configured', async () => {
    const result = await summarize('job', selected, {
      hasModel: true,
      collect: async () => '  Tailored summary paragraph.  ',
    });
    expect(result).toEqual({ text: 'Tailored summary paragraph.', engine: 'model' });
  });

  it('falls back to deterministic on empty model output', async () => {
    const result = await summarize('job', selected, {
      hasModel: true,
      collect: async () => '   ',
    });
    expect(result.engine).toBe('deterministic');
  });

  it('falls back to deterministic when the model throws', async () => {
    const result = await summarize('job', selected, {
      hasModel: true,
      collect: async () => {
        throw new Error('network');
      },
    });
    expect(result.engine).toBe('deterministic');
  });
});

describe('assembleResume', () => {
  it('keeps every rendered bullet verbatim from the corpus', async () => {
    const corpusBullets = new Set(
      CORPUS.engagements.flatMap((engagement) => engagement.bullets.map((bullet) => bullet.text)),
    );
    const { view } = await assembleResume('operations job', CORPUS, { hasModel: false });
    const rendered = view.experience.flatMap((experience) => experience.bullets);
    expect(rendered.length).toBeGreaterThan(0);
    for (const text of rendered) expect(corpusBullets.has(text)).toBe(true);
  });

  it('groups bullets under their engagement in selection order', async () => {
    const { view } = await assembleResume('react frontend', CORPUS, { hasModel: false });
    expect(view.experience[0].organization).toBe('Zocdoc');
  });

  it('is 100% deterministic with no model', async () => {
    const { provenance } = await assembleResume('job', CORPUS, { hasModel: false });
    expect(provenance.deterministicPct).toBe(100);
    expect(provenance.modelPct).toBe(0);
    expect(provenance.operations.every((operation) => operation.engine === 'deterministic')).toBe(true);
  });

  it('attributes model summary text and reports a split', async () => {
    const collect = async (messages: { content: string }[]) =>
      messages.some((message) => message.content.includes('professional-summary'))
        ? 'A tailored summary.'
        : '["ops.b1", "fe.b1"]';
    const { provenance, view } = await assembleResume('job', CORPUS, { hasModel: true, collect });
    expect(view.summary.engine).toBe('model');
    expect(provenance.modelPct).toBeGreaterThan(0);
    expect(provenance.deterministicPct + provenance.modelPct).toBe(100);
    expect(provenance.operations.find((operation) => operation.kind === 'summary')?.engine).toBe('model');
  });
});

describe('computeProvenance', () => {
  it('is 100% deterministic when the summary is source-assembled', () => {
    const view: ResumeView = {
      header: { name: 'X', contacts: ['a'] },
      summary: { text: 'body body', engine: 'deterministic' },
      experience: [
        {
          organization: 'O',
          roleContext: ['R'],
          timePeriod: '2024',
          bullets: ['did a thing'],
          sourceRefs: ['s'],
        },
      ],
      skills: [],
      education: [],
      projects: [],
    };
    const provenance = computeProvenance(
      view,
      { orderedBulletIds: [], engine: 'deterministic' },
      view.summary,
    );
    expect(provenance.deterministicPct).toBe(100);
  });
});
