import { resolveAnswerSet } from '@facia/core';
import { verdictTensions } from './tension-answer-source';
import { describe, expect, it } from 'vitest';
import { ModelAnswerContractError } from './model-answer';
import {
  answerPortfolioQuestion,
  careerHistoryAnswerSet,
  generatePortfolioAnswer,
  liberaStartPrecision,
  supportsCareerQuestion,
  supportsPortfolioQuestion,
  supportsTechnologiesQuestion,
} from './portfolio-answer-source';

describe('Libera start-date precision', () => {
  it('answers the supported year and refuses to invent a month', async () => {
    const unreachable = async () => {
      throw new Error('the provider must not be reached for a grounded date question');
    };

    const year = await generatePortfolioAnswer(
      'When did he first start working on Libera?',
      unreachable,
    );
    const month = await generatePortfolioAnswer(
      'What month did he start working on Libera?',
      unreachable,
    );

    expect(year.items[0].payload.title).toBe('2026');
    expect(month.items[0].payload.title).toBe('Month not specified');
    expect(month.items[0].payload.contribution).toContain('does not specify a month');
  });

  it('resolves “what month?” from the preceding Libera start-date turn', async () => {
    const history = [
      { role: 'user' as const, content: 'When did he first start working on Libera?' },
      { role: 'assistant' as const, content: '2026.' },
    ];
    expect(liberaStartPrecision('What month?', history)).toBe('month');

    const answer = await generatePortfolioAnswer(
      'What month?',
      async () => { throw new Error('provider should not be called'); },
      undefined,
      history,
    );
    expect(answer.items[0].payload.title).toBe('Month not specified');
  });

  it('does not attach an unrelated month follow-up to Libera', () => {
    expect(liberaStartPrecision('What month?', [
      { role: 'user', content: 'When did Jeremy join Aroko?' },
    ])).toBeNull();
  });
});

describe('portfolio answer source', () => {
  it('routes only declared Zocdoc question shapes', () => {
    expect(supportsPortfolioQuestion('What did Jeremy build at Zocdoc?')).toBe(true);
    expect(supportsPortfolioQuestion('Tell me about Aroko')).toBe(false);
    expect(supportsPortfolioQuestion('Did Jeremy enjoy Zocdoc?')).toBe(false);
  });

  it('emits a valid v2 AnswerSet with honest source framing', () => {
    const answer = answerPortfolioQuestion('What accessibility work did Jeremy do at Zocdoc?');
    const result = resolveAnswerSet(answer, { depth: 'audit', audience: 'human' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.answer.schema).toBe('facia.answer-set/2');
    expect(result.recipe.answer.items).toHaveLength(3);
    expect(result.recipe.visibleFields[0].fields).toContainEqual(expect.objectContaining({
      key: 'evidenceTier',
      value: 'profile-grounded',
    }));
  });

  it('uses a valid model collection and retains only host-owned provenance', async () => {
    const answer = await generatePortfolioAnswer('Tell me about Zocdoc', async () => ({
      schema: 'portfolio.model-answer/1',
      refusal: null,
      items: [{
        title: 'Header migration',
        contribution: 'Applied the existing experiment framework.',
        outcome: null,
        scope: 'Did not design the company-wide framework.',
        evidenceRefs: ['profile.zocdoc'],
      }],
    }));

    expect(answer.items[0].evidence).toEqual(expect.objectContaining({
      sourceRefs: ['content/profile.md#career-history'],
    }));
  });

  it('forwards prior conversation turns to the structured provider', async () => {
    const history = [
      { role: 'user' as const, content: 'What is Facia?' },
      { role: 'assistant' as const, content: 'It turns answers into UI recipes.' },
    ];
    let receivedHistory: Array<{ role: string; content: string }> | undefined;
    await generatePortfolioAnswer(
      'How is that used here?',
      async (_question, _deps, received) => {
        receivedHistory = received;
        return {
          schema: 'portfolio.model-answer/1',
          refusal: null,
          items: [{
            title: 'Portfolio rendering',
            contribution: 'Facia renders structured answers on the portfolio.',
            outcome: null,
            scope: null,
            evidenceRefs: ['profile.facia'],
          }],
        };
      },
      undefined,
      history,
    );

    expect(receivedHistory).toEqual(history);
  });

  it('uses the Zocdoc fixture only for provider availability failures', async () => {
    const unavailable = async () => {
      throw new ModelAnswerContractError('MODEL_PROVIDER_TIMEOUT', 'late');
    };
    const invalid = async () => {
      throw new ModelAnswerContractError('MODEL_SCHEMA_INVALID', 'bad schema');
    };

    await expect(generatePortfolioAnswer('What did Jeremy do at Zocdoc?', unavailable))
      .resolves.toEqual(expect.objectContaining({ schema: 'facia.answer-set/2' }));
    await expect(generatePortfolioAnswer('What did Jeremy do at Zocdoc?', invalid))
      .rejects.toEqual(expect.objectContaining({ code: 'MODEL_SCHEMA_INVALID' }));
  });
});

describe('career history answer source', () => {
  it('routes whole-career questions but not Zocdoc-scoped or unrelated ones', () => {
    expect(supportsCareerQuestion("What is Jeremy's career history?")).toBe(true);
    expect(supportsCareerQuestion('Walk me through his experience')).toBe(true);
    expect(supportsCareerQuestion('current role and last one')).toBe(true);
    expect(supportsCareerQuestion('What did Jeremy do at Zocdoc?')).toBe(false);
    expect(supportsCareerQuestion('How do I contact Jeremy?')).toBe(false);
  });

  it('resolves to the timeline pattern from a temporal sequence at every depth', () => {
    const answer = careerHistoryAnswerSet();
    for (const depth of ['glance', 'inspect', 'focus', 'audit'] as const) {
      const result = resolveAnswerSet(answer, { depth, audience: 'human' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.pattern).toBe('timeline');
      expect(result.recipe.components.map((c) => c.id)).toContain('Timeline');
      expect(result.recipe.answer.items).toHaveLength(4);
    }
  });

  it('discloses more fields as depth deepens, ending with audit provenance', () => {
    const answer = careerHistoryAnswerSet();
    const keysAt = (depth: 'glance' | 'inspect' | 'focus' | 'audit') => {
      const result = resolveAnswerSet(answer, { depth });
      if (!result.ok) throw new Error('resolution failed');
      return new Set(result.recipe.visibleFields[0].fields.map((f) => f.key));
    };
    const glance = keysAt('glance');
    expect(glance).toEqual(new Set(['role', 'organization', 'period']));
    expect(keysAt('inspect').has('focus')).toBe(true);
    expect(keysAt('focus').has('highlight')).toBe(true);
    expect(keysAt('audit').has('source')).toBe(true);
  });

  it('is served deterministically without touching the structured provider', async () => {
    const provider = async () => {
      throw new Error('provider should not be called for career questions');
    };
    const answer = await generatePortfolioAnswer("What's your career history?", provider);
    expect(answer.structure).toBe('sequence');
    expect(answer.sequenceKind).toBe('temporal');
  });
});

describe('technologies answer source', () => {
  it('routes technology questions but not unrelated or Zocdoc-scoped work questions', () => {
    expect(supportsTechnologiesQuestion('What technologies has Jeremy worked with?')).toBe(true);
    expect(supportsTechnologiesQuestion('Which languages does Jeremy know?')).toBe(true);
    expect(supportsTechnologiesQuestion("What's Jeremy's tech stack?")).toBe(true);
    expect(supportsTechnologiesQuestion('Tell me about Aroko')).toBe(false);
    expect(supportsTechnologiesQuestion('How do I contact Jeremy?')).toBe(false);
  });

  it('leaves the Zocdoc work question on the Zocdoc route', () => {
    const zocdoc = answerPortfolioQuestion('What did Jeremy build at Zocdoc?');
    expect(zocdoc?.trace?.kind).toBe('direct');
    if (zocdoc?.trace?.kind !== 'direct') return;
    expect(zocdoc.trace.id).toBe('portfolio.zocdoc-work.v1');
  });

  it('emits a valid v2 collection with a grounded repo link on exactly one item', () => {
    const answer = answerPortfolioQuestion('What technologies has Jeremy worked with?');
    expect(answer).not.toBeNull();
    const result = resolveAnswerSet(answer, { depth: 'audit', audience: 'human' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const repoFields = result.recipe.visibleFields
      .flatMap((item) => item.fields)
      .filter((field) => field.key === 'repo');
    expect(repoFields).toHaveLength(1);
    expect(repoFields[0].value).toBe('https://github.com/jeremycapps/corus');
  });

  it('surfaces the repo link at glance depth so the chip is reachable without expanding', () => {
    const answer = answerPortfolioQuestion('What languages has Jeremy used?');
    const result = resolveAnswerSet(answer, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const hasRepoAtGlance = result.recipe.visibleFields
      .flatMap((item) => item.fields)
      .some((field) => field.key === 'repo');
    expect(hasRepoAtGlance).toBe(true);
  });
});

describe('two-pole questions route by role, not by keyword', () => {
  it('no longer answers a two-pole question with the career timeline', async () => {
    const misrouted: string[] = [];
    for (const t of verdictTensions()) {
      const answer = await generatePortfolioAnswer(t.question, async () => {
        throw new Error('the provider must not be reached for a tension question');
      });
      if (answer.question !== t.question) misrouted.push(`${t.id} → "${answer.question}"`);
    }
    expect(misrouted).toEqual([]);
  });

  it('answers them as verdicts rather than values', async () => {
    const roles = new Set<string>();
    for (const t of verdictTensions()) {
      const answer = await generatePortfolioAnswer(t.question, async () => {
        throw new Error('unreachable');
      });
      roles.add(answer.answerType);
    }
    expect([...roles]).toEqual(['verdict']);
  });

  it('still routes a genuine career question to the career spine', async () => {
    const answer = await generatePortfolioAnswer("What is Jeremy's career history?", async () => {
      throw new Error('unreachable');
    });
    expect(answer.answerType).toBe('value');
    expect(answer.structure).toBe('sequence');
  });
});

describe('the career matcher claims only value questions', () => {
  // The career spine answers "what is his history" — a value/timeline. It must
  // not claim a verdict, operation, or convergence question on a shared keyword
  // like "experience", "roles", or "worked".
  it('declines a two-pole verdict question that mentions experience', () => {
    expect(supportsCareerQuestion('Does Jeremy have backend and API experience, or is he frontend-only?')).toBe(false);
  });

  it('declines a relational operation question that mentions experience', () => {
    expect(supportsCareerQuestion("How would Jeremy's design-system experience apply to building a component library at a fintech?")).toBe(false);
  });

  it('declines a convergence question that mentions roles', () => {
    expect(supportsCareerQuestion('Across his roles, is Jeremy more of a specialist or a broad generalist?')).toBe(false);
  });

  it('still claims a genuine value/history question', () => {
    expect(supportsCareerQuestion("What is Jeremy's career history?")).toBe(true);
    expect(supportsCareerQuestion('Walk me through his experience')).toBe(true);
    expect(supportsCareerQuestion("What was Jeremy's title and how long was he at Zocdoc?")).toBe(true);
  });
});

describe('relational questions route to grounded composition', () => {
  const fakeOperation = async () => ({
    schema: 'portfolio.model-operation/1' as const,
    refusal: null,
    input: {
      claim: 'Owned and migrated shared TypeScript/React design-system components at Zocdoc.',
      evidenceRefs: ['profile.zocdoc' as const],
    },
    relation: 'The ownership-and-migration discipline transfers to a fintech component library, a shared surface under compliance pressure.',
    output: 'Building a component library at a fintech',
    caution: 'Jeremy has not worked in fintech; the transfer is by shape of problem.',
  });

  it('composes an operation answer instead of falling through to the value model', async () => {
    const answer = await generatePortfolioAnswer(
      "How would Jeremy's design-system experience apply to building a component library at a fintech?",
      async () => { throw new Error('the value provider must not be reached for an operation question'); },
      fakeOperation,
    );
    expect(answer.answerType).toBe('operation');
    const item = answer.items[0];
    if (item.type !== 'Operation') throw new Error('expected an operation item');
    expect(item.output).toBe('Building a component library at a fintech');
    expect((item.evidence as { status: string }).status).toBe('composed');
  });

  it('leaves a value question on the value path', async () => {
    const answer = await generatePortfolioAnswer(
      'What did Jeremy work on at Zocdoc?',
      async () => ({ schema: 'portfolio.model-answer/1', refusal: null, items: [
        { title: 'x', contribution: 'y', outcome: null, scope: null, evidenceRefs: ['profile.zocdoc'] },
      ] }),
      async () => { throw new Error('the operation provider must not be reached for a value question'); },
    );
    expect(answer.answerType).toBe('value');
  });
});
