import { resolveAnswerSet } from '@facia/core';
import { describe, expect, it } from 'vitest';
import { ModelAnswerContractError } from './model-answer';
import {
  answerPortfolioQuestion,
  careerHistoryAnswerSet,
  generatePortfolioAnswer,
  supportsCareerQuestion,
  supportsPortfolioQuestion,
  supportsTechnologiesQuestion,
} from './portfolio-answer-source';

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
