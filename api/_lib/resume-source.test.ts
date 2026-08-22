import { describe, it, expect } from 'vitest';
import {
  assembleResume,
  computeProvenance,
  parseIdList,
  prerank,
  recencyKey,
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
      organization: 'Aroko',
      roleContext: ['Head of Operations'],
      timePeriod: '2024',
      kind: 'experience',
      caution: [],
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

  it('labels independent projects and passes their cautions to the summary model', async () => {
    const projectCorpus: ResumeCorpus = {
      header: { name: 'Test', contacts: [] },
      engagements: [
        {
          id: 'domain',
          organization: 'Independent / Domain',
          roleContext: ['Independent runtime project'],
          timePeriod: '2026',
          themes: ['agents'],
          roleFit: { strongest: [], secondary: [] },
          caution: ['No client deployment or external users.'],
          bullets: [
            {
              id: 'domain.b1',
              text: 'Built a deterministic runtime.',
              evidenceRefs: [],
              sourceRefs: ['s'],
            },
          ],
        },
      ],
      skills: [], education: [], projects: [],
    };
    const selected = prerank('agents', projectCorpus);
    let prompt = '';
    await summarize('job', selected, {
      hasModel: true,
      collect: async (messages) => {
        prompt = messages.map((message) => message.content).join('\n');
        return 'Independent project work demonstrates runtime design.';
      },
    });

    expect(prompt).toContain('[INDEPENDENT PROJECT]');
    expect(prompt).toContain('No client deployment or external users.');
    expect(prompt).toContain('Never describe an independent project as employment');
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

  it('keeps every employer even when the model selects none of its bullets', async () => {
    // Model returns only the Zocdoc bullet; Aroko must still appear (its own
    // bullet as fallback) and lead on recency.
    const collect = async (messages: { content: string }[]) =>
      messages.some((message) => message.content.includes('professional-summary'))
        ? 'A tailored summary.'
        : '["fe.b1"]';
    const { view } = await assembleResume('frontend', CORPUS, { hasModel: true, collect });
    const orgs = view.experience.map((experience) => experience.organization);
    expect(orgs).toEqual(['Aroko', 'Zocdoc']);
    const aroko = view.experience.find((experience) => experience.organization === 'Aroko')!;
    expect(aroko.bullets).toEqual(['Built a budgeting and operations system']);
  });

  it('orders experience by most recent year, newest first', async () => {
    // Aroko (2024–Present) outranks Zocdoc (2021) even on a frontend job that
    // ranks Zocdoc's bullet higher — recency, not relevance, drives section order.
    const { view } = await assembleResume('react frontend', CORPUS, { hasModel: false });
    expect(view.experience.map((experience) => experience.organization)).toEqual([
      'Aroko',
      'Zocdoc',
    ]);
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

  it('surfaces NEW INC as an award, never as an experience entry', async () => {
    const { view } = await assembleResume('anything', loadResumeCorpus(), { hasModel: false });
    expect(view.experience.some((experience) => /new inc/i.test(experience.organization))).toBe(false);
    expect(view.awards).toEqual([
      { name: 'NEW INC Fellowship, Social Architecture', year: 2025 },
    ]);
  });
});

describe('recencyKey', () => {
  it('sorts "Present"/"Current" newest', () => {
    expect(recencyKey('2024–Present')).toBe(Number.POSITIVE_INFINITY);
    expect(recencyKey('2026 current')).toBe(Number.POSITIVE_INFINITY);
  });

  it('takes the most recent year in a range', () => {
    expect(recencyKey('2019–2021')).toBe(2021);
    expect(recencyKey('2026-03 – 2026-07 (re-inspected 2026-08-02)')).toBe(2026);
  });

  it('returns 0 when no year is present', () => {
    expect(recencyKey('recently')).toBe(0);
  });
});

describe('project split', () => {
  const CORPUS_WITH_PROJECT: ResumeCorpus = {
    header: { name: 'Test', contacts: [] },
    engagements: [
      {
        id: 'aroko', organization: 'Aroko', roleContext: ['Head of Operations'], timePeriod: '2024–Present',
        themes: ['operations'], roleFit: { strongest: [], secondary: [] }, caution: [],
        bullets: [{ id: 'aroko.b1', text: 'Built operations tooling.', evidenceRefs: [], sourceRefs: ['s'] }],
      },
      {
        id: 'aroko-web', organization: 'Aroko', roleContext: ['Technical Director'], timePeriod: '2024–Present',
        themes: ['web'], roleFit: { strongest: [], secondary: [] }, caution: [],
        bullets: [{ id: 'aroko-web.b1', text: 'Led client web delivery.', evidenceRefs: [], sourceRefs: ['s2'] }],
      },
      {
        id: 'freelance', organization: 'Independent / Freelance', roleContext: ['Freelance Developer'], timePeriod: '2020–2025',
        themes: ['design'], roleFit: { strongest: [], secondary: [] }, caution: [],
        bullets: [{ id: 'freelance.b1', text: 'Shipped client sites.', evidenceRefs: [], sourceRefs: ['s'] }],
      },
      {
        id: 'domain', organization: 'Independent / Domain', roleContext: ['Sole architect'], timePeriod: '2026',
        themes: ['agents'], roleFit: { strongest: [], secondary: [] }, caution: [],
        bullets: [
          { id: 'domain.b1', text: 'Built an LLM orchestration system.', evidenceRefs: [], sourceRefs: ['s'] },
          { id: 'domain.b2', text: 'Added an evaluation harness.', evidenceRefs: [], sourceRefs: ['s'] },
          { id: 'domain.b3', text: 'Wrote an MCP server.', evidenceRefs: [], sourceRefs: ['s'] },
        ],
      },
    ],
    skills: [], education: [], projects: [],
  };

  it('routes Independent Domain/Tempo work to projects and keeps freelance under experience', async () => {
    const { view } = await assembleResume('job', CORPUS_WITH_PROJECT, { hasModel: false });
    expect(view.experience.map((experience) => experience.organization)).toEqual([
      'Aroko',
      'Independent / Freelance',
    ]);
    expect(view.projects.map((project) => project.id)).toEqual(['domain']);
  });

  it('merges multiple source engagements for the same employer', async () => {
    const { view } = await assembleResume('job', CORPUS_WITH_PROJECT, { hasModel: false });
    const aroko = view.experience.find((experience) => experience.organization === 'Aroko');
    expect(aroko?.roleContext).toEqual(['Head of Operations', 'Technical Director']);
    expect(aroko?.bullets).toEqual(['Built operations tooling.', 'Led client web delivery.']);
    expect(view.experience.filter((experience) => experience.organization === 'Aroko')).toHaveLength(1);
  });

  it('condenses projects to at most two bullets of source text', async () => {
    const { view } = await assembleResume('job', CORPUS_WITH_PROJECT, { hasModel: false });
    expect(view.projects[0].text).toBe('Built an LLM orchestration system. Added an evaluation harness.');
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
      awards: [],
    };
    const provenance = computeProvenance(
      view,
      { orderedBulletIds: [], engine: 'deterministic' },
      view.summary,
    );
    expect(provenance.deterministicPct).toBe(100);
  });
});
