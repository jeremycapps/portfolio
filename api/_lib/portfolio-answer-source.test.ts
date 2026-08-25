import { resolveAnswerSet } from '@facia/core';
import { describe, expect, it } from 'vitest';
import { ModelAnswerContractError } from './model-answer';
import {
  answerPortfolioQuestion,
  generatePortfolioAnswer,
  supportsPortfolioQuestion,
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
