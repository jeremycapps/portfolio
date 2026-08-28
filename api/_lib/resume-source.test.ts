import { afterEach, describe, it, expect, vi } from 'vitest';
import {
  assembleResume,
  buildDeterministicShortlist,
  buildSummaryEvidence,
  computeProvenance,
  prerank,
  recencyKey,
  RESUME_PROVIDER_DEADLINE_MS,
  RESUME_SHORTLIST_LIMIT,
  SUMMARY_EVIDENCE_LIMIT,
  summarize,
  tokenize,
  type RankedBullet,
  type ResumeView,
} from './resume-source';
import { loadResumeCorpus } from './resume-corpus';
import type { ResumeCorpus } from './resume-corpus';

// A job with no overlap with the tailored-summary corpus, so retrieval misses
// and the model / deterministic fallback path under test actually runs.
const UNMATCHED_JOB = 'archivist at a regional museum, cataloguing rare manuscripts';

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

function largeCorpus(): ResumeCorpus {
  return {
    header: { name: 'Large Fixture', contacts: [] },
    engagements: Array.from({ length: 12 }, (_, engagementIndex) => ({
      id: `engagement-${engagementIndex}`,
      organization: `Employer ${engagementIndex}`,
      roleContext: [`Role ${engagementIndex}`],
      timePeriod: `${2014 + engagementIndex}`,
      themes: engagementIndex === 0 ? ['priority'] : [],
      roleFit: { strongest: [], secondary: [] },
      caution: [],
      bullets: Array.from(
        { length: engagementIndex === 11 ? 4 : 5 },
        (_, bulletIndex) => ({
          id: `engagement-${engagementIndex}.b${bulletIndex}`,
          text: `Claim ${engagementIndex}-${bulletIndex}`,
          evidenceRefs: [],
          sourceRefs: [`source-${engagementIndex}-${bulletIndex}`],
        }),
      ),
    })),
    skills: [],
    education: [],
    projects: [],
  };
}

afterEach(() => {
  vi.useRealTimers();
});

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

describe('buildDeterministicShortlist', () => {
  const ranked = prerank('anything', CORPUS);

  it('uses deterministic ranked order', () => {
    const result = buildDeterministicShortlist(CORPUS, ranked);
    expect(result.engine).toBe('deterministic');
    expect(result.orderedBulletIds).toEqual(ranked.map((bullet) => bullet.bulletId));
  });

  it('drops duplicate and unknown ids and remains within the named budget', () => {
    const expanded = [
      ...ranked,
      ranked[0],
      { ...ranked[0], bulletId: 'unknown' },
      ...Array.from({ length: 30 }, (_, index) => ({
        ...ranked[index % ranked.length],
        bulletId: `unknown-${index}`,
      })),
    ];
    const result = buildDeterministicShortlist(CORPUS, expanded);
    expect(result.orderedBulletIds).toEqual(['ops.b1', 'fe.b1']);
    expect(result.orderedBulletIds.length).toBeLessThanOrEqual(RESUME_SHORTLIST_LIMIT);
  });

  it('bounds the observed 59-bullet corpus shape', () => {
    const corpus = largeCorpus();
    const result = buildDeterministicShortlist(corpus, prerank('priority', corpus));
    expect(corpus.engagements.flatMap((engagement) => engagement.bullets)).toHaveLength(59);
    expect(result.orderedBulletIds).toHaveLength(RESUME_SHORTLIST_LIMIT);
  });
});

describe('buildSummaryEvidence', () => {
  it('includes only rendered claim ids, in deterministic relevance order', () => {
    const ranked = prerank('priority', largeCorpus());
    const renderedIds = [ranked[12].bulletId, ranked[2].bulletId, ranked[8].bulletId];
    expect(buildSummaryEvidence(ranked, renderedIds).map((bullet) => bullet.bulletId)).toEqual([
      ranked[2].bulletId,
      ranked[8].bulletId,
      ranked[12].bulletId,
    ]);
  });

  it('caps evidence at the named summary budget', () => {
    const ranked = prerank('priority', largeCorpus());
    expect(buildSummaryEvidence(ranked, ranked.map((bullet) => bullet.bulletId))).toHaveLength(
      SUMMARY_EVIDENCE_LIMIT,
    );
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
    const result = await summarize(UNMATCHED_JOB, selected, {
      hasModel: true,
      collect: async () => {
        throw new Error('network');
      },
    });
    expect(result.engine).toBe('deterministic');
  });

  it('returns a non-empty deterministic summary with no evidence', async () => {
    const result = await summarize(UNMATCHED_JOB, [], { hasModel: false });
    expect(result.engine).toBe('deterministic');
    expect(result.text).toContain('Systems-oriented'); // the canonical summary floor
  });
});

describe('assembleResume', () => {
  it('makes no model call without a configured model', async () => {
    const collect = vi.fn(async () => 'unused');
    const result = await assembleResume('priority', largeCorpus(), {
      hasModel: false,
      collect,
    });
    expect(collect).not.toHaveBeenCalled();
    expect(result.diagnostics.fallbackReason).toBe('no_model');
  });

  it('makes one model call maximum and sends no more than eight rendered claims', async () => {
    const collect = vi.fn(async (_messages: { content: string }[]) => 'Tailored model summary.');
    const corpus = largeCorpus();
    const result = await assembleResume('priority', corpus, { hasModel: true, collect });

    expect(collect).toHaveBeenCalledOnce();
    expect(result.diagnostics.shortlistCount).toBe(RESUME_SHORTLIST_LIMIT);
    expect(result.diagnostics.summaryEvidenceCount).toBe(SUMMARY_EVIDENCE_LIMIT);
    expect(result.diagnostics.fallbackReason).toBe('none');
    const messages = collect.mock.calls[0][0];
    const prompt = messages.map((message) => message.content).join('\n');
    expect(prompt.match(/\n  - /g)).toHaveLength(SUMMARY_EVIDENCE_LIMIT);

    const rendered = new Set(result.view.experience.flatMap((entry) => entry.bullets));
    const promptedClaims = corpus.engagements
      .flatMap((engagement) => engagement.bullets)
      .filter((bullet) => prompt.includes(bullet.text));
    expect(promptedClaims).toHaveLength(SUMMARY_EVIDENCE_LIMIT);
    expect(promptedClaims.every((bullet) => rendered.has(bullet.text))).toBe(true);
  });

  it('does not leak high-ranked claims removed by experience display caps into the prompt', async () => {
    const corpus = largeCorpus();
    corpus.engagements[0].bullets = Array.from({ length: 20 }, (_, index) => ({
      id: `priority.b${index}`,
      text: `Priority claim ${index}`,
      evidenceRefs: [],
      sourceRefs: [`priority-source-${index}`],
    }));
    let prompt = '';
    const { view } = await assembleResume('priority', corpus, {
      hasModel: true,
      collect: async (messages) => {
        prompt = messages.map((message) => message.content).join('\n');
        return 'Summary.';
      },
    });
    const firstEmployer = view.experience.find((entry) => entry.organization === 'Employer 0')!;
    expect(firstEmployer.bullets).toHaveLength(5);
    expect(firstEmployer.bullets).toContain('Priority claim 4');
    expect(prompt).not.toContain('Priority claim 5');
    expect(prompt).not.toContain('Priority claim 19');
  });

  it('keeps identical claim text attributed by source identity', async () => {
    const corpus: ResumeCorpus = {
      header: { name: 'Test', contacts: [] },
      engagements: [
        {
          id: 'org-a', organization: 'Org A', roleContext: ['Role A'], timePeriod: '2025',
          themes: [], roleFit: { strongest: [], secondary: [] }, caution: [],
          bullets: [{ id: 'org-a.b1', text: 'Shared claim text.', evidenceRefs: [], sourceRefs: ['a'] }],
        },
        {
          id: 'org-b', organization: 'Org B', roleContext: ['Role B'], timePeriod: '2024',
          themes: [], roleFit: { strongest: [], secondary: [] }, caution: [],
          bullets: [{ id: 'org-b.b1', text: 'Shared claim text.', evidenceRefs: [], sourceRefs: ['b'] }],
        },
      ],
      skills: [], education: [], projects: [],
    };
    let prompt = '';
    await assembleResume('unmatched', corpus, {
      hasModel: true,
      collect: async (messages) => {
        prompt = messages.map((message) => message.content).join('\n');
        return 'Summary.';
      },
    });

    expect(prompt).toContain('[CAREER EXPERIENCE] Org A — Role A (2025)');
    expect(prompt).toContain('[CAREER EXPERIENCE] Org B — Role B (2024)');
    expect(prompt.match(/Shared claim text\./g)).toHaveLength(2);
  });

  it('keeps every employer visible when all top claims belong to one organization', async () => {
    const corpus = largeCorpus();
    corpus.engagements[0].bullets = Array.from({ length: 20 }, (_, index) => ({
      id: `priority.b${index}`,
      text: `Priority claim ${index}`,
      evidenceRefs: [],
      sourceRefs: [`priority-source-${index}`],
    }));
    const { view } = await assembleResume('priority', corpus, { hasModel: false });
    expect(view.experience).toHaveLength(corpus.engagements.length);
    expect(view.experience.every((entry) => entry.bullets.length > 0)).toBe(true);
  });

  it('returns deterministic body sections for repeated inputs and corpus versions', async () => {
    const corpus = largeCorpus();
    const first = await assembleResume('priority operator', corpus, { hasModel: false });
    const second = await assembleResume('priority operator', corpus, { hasModel: false });
    expect({
      experience: first.view.experience,
      projects: first.view.projects,
      awards: first.view.awards,
      skills: first.view.skills,
      education: first.view.education,
    }).toEqual({
      experience: second.view.experience,
      projects: second.view.projects,
      awards: second.view.awards,
      skills: second.view.skills,
      education: second.view.education,
    });
  });

  it('uses a deterministic summary after empty model output', async () => {
    const result = await assembleResume(UNMATCHED_JOB, CORPUS, {
      hasModel: true,
      collect: async () => '   ',
    });
    expect(result.view.summary.engine).toBe('deterministic');
    expect(result.view.summary.text.length).toBeGreaterThan(0);
    expect(result.diagnostics.fallbackReason).toBe('empty_output');
  });

  it('uses a deterministic summary after a provider error', async () => {
    const result = await assembleResume(UNMATCHED_JOB, CORPUS, {
      hasModel: true,
      collect: async () => {
        throw new Error('provider unavailable');
      },
    });
    expect(result.view.summary.engine).toBe('deterministic');
    expect(result.view.summary.text.length).toBeGreaterThan(0);
    expect(result.diagnostics.fallbackReason).toBe('provider_error');
  });

  it('aborts a hanging provider at the deadline and clears the timeout', async () => {
    vi.useFakeTimers();
    let receivedSignal: AbortSignal | undefined;
    const pending = assembleResume(UNMATCHED_JOB, CORPUS, {
      hasModel: true,
      collect: async (_messages, deps) => {
        receivedSignal = deps?.signal;
        await new Promise(() => undefined);
        return 'unreachable';
      },
    });

    await vi.advanceTimersByTimeAsync(RESUME_PROVIDER_DEADLINE_MS);
    const result = await pending;
    expect(receivedSignal?.aborted).toBe(true);
    expect(result.view.summary.engine).toBe('deterministic');
    expect(result.diagnostics.fallbackReason).toBe('timeout');
    expect(result.diagnostics.summaryMs).toBe(RESUME_PROVIDER_DEADLINE_MS);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears the provider deadline timer after a fast model response', async () => {
    vi.useFakeTimers();
    let receivedSignal: AbortSignal | undefined;
    const result = await assembleResume(UNMATCHED_JOB, CORPUS, {
      hasModel: true,
      collect: async (_messages, deps) => {
        receivedSignal = deps?.signal;
        return 'Fast summary.';
      },
    });
    expect(result.view.summary).toEqual({ text: 'Fast summary.', engine: 'model' });
    expect(receivedSignal).toBeInstanceOf(AbortSignal);
    expect(receivedSignal?.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('accepts a final model result just before the deadline and clears both timers', async () => {
    vi.useFakeTimers();
    const pending = assembleResume(UNMATCHED_JOB, CORPUS, {
      hasModel: true,
      collect: async () => new Promise<string>((resolve) => {
        setTimeout(() => resolve('Just-in-time summary.'), RESUME_PROVIDER_DEADLINE_MS - 1);
      }),
    });

    await vi.advanceTimersByTimeAsync(RESUME_PROVIDER_DEADLINE_MS - 1);
    const result = await pending;
    expect(result.view.summary).toEqual({ text: 'Just-in-time summary.', engine: 'model' });
    expect(result.diagnostics.fallbackReason).toBe('none');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps every rendered bullet verbatim from the corpus', async () => {
    const corpusBullets = new Set(
      CORPUS.engagements.flatMap((engagement) => engagement.bullets.map((bullet) => bullet.text)),
    );
    const { view } = await assembleResume('operations job', CORPUS, { hasModel: false });
    const rendered = view.experience.flatMap((experience) => experience.bullets);
    expect(rendered.length).toBeGreaterThan(0);
    for (const text of rendered) expect(corpusBullets.has(text)).toBe(true);
  });

  it('keeps every employer even when relevance concentrates elsewhere', async () => {
    // Every employer must still appear with its own evidence and recency order.
    const collect = async () => 'A tailored summary.';
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
    const collect = async () => 'A tailored summary.';
    const { provenance, view } = await assembleResume('job', CORPUS, { hasModel: true, collect });
    expect(view.summary.engine).toBe('model');
    expect(provenance.modelPct).toBeGreaterThan(0);
    expect(provenance.deterministicPct + provenance.modelPct).toBe(100);
    expect(provenance.operations.find((operation) => operation.kind === 'summary')?.engine).toBe('model');
  });

  it('surfaces NEW INC as an award, never as experience or summary evidence', async () => {
    let prompt = '';
    const { view } = await assembleResume('NEW INC social architecture fellowship', loadResumeCorpus(), {
      hasModel: true,
      collect: async (messages) => {
        prompt = messages.map((message) => message.content).join('\n');
        return 'Summary.';
      },
    });
    expect(view.experience.some((experience) => /new inc/i.test(experience.organization))).toBe(false);
    expect(prompt).not.toContain('[CAREER EXPERIENCE] NEW INC');
    expect(prompt).not.toContain('[INDEPENDENT PROJECT] NEW INC');
    expect(view.awards).toEqual([
      { name: 'NEW INC Fellowship, Social Architecture', year: 2025 },
    ]);
  });

  it('renders the corrected operating-plan and costing claims under Aroko, never Freelance', async () => {
    const { view } = await assembleResume(
      'Aroko 90-day operating plan Figma design system Composable Costing project quoting',
      loadResumeCorpus(),
      { hasModel: false },
    );

    expect(
      view.experience.some((experience) =>
        /independent\s*\/\s*freelance/i.test(experience.organization),
      ),
    ).toBe(false);
    const aroko = view.experience.find((experience) => experience.organization === 'Aroko');
    expect(aroko?.bullets).toEqual(
      expect.arrayContaining([
        expect.stringContaining('90-day operating plan for Aroko'),
        expect.stringContaining('Composable Costing methodology at Aroko'),
      ]),
    );
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
