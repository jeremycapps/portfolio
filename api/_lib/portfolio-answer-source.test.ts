import { resolveAnswerSet } from '@facia/core';
import { describe, expect, it } from 'vitest';
import { answerPortfolioQuestion, supportsPortfolioQuestion } from './portfolio-answer-source';

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
});
