import { resolveAnswerSet } from '@facia/core';
import { describe, expect, it } from 'vitest';
import {
  adaptModelAnswer,
  MODEL_ANSWER_PROTOCOL,
  ModelAnswerContractError,
  parseModelAnswer,
} from './model-answer';

function validAnswer() {
  return {
    schema: MODEL_ANSWER_PROTOCOL,
    refusal: null,
    items: [
      {
        title: 'Design-system migration',
        contribution: 'Migrated assigned components.',
        outcome: 'Reusable accessible components.',
        scope: null,
        evidenceRefs: ['profile.zocdoc'],
      },
      {
        title: 'Delivery workflow',
        contribution: 'Improved ticket and pull-request workflows.',
        outcome: null,
        scope: 'Contributor leadership, not people management.',
        evidenceRefs: ['profile.zocdoc'],
      },
    ],
  };
}

describe('portfolio.model-answer/1', () => {
  it('fails closed on malformed JSON, missing/extra fields, bad nulls, and unknown evidence', () => {
    const invalid = [
      '{nope',
      JSON.stringify({ ...validAnswer(), extra: true }),
      JSON.stringify({ ...validAnswer(), schema: undefined }),
      JSON.stringify({ ...validAnswer(), items: [{ ...validAnswer().items[0], outcome: 12 }] }),
      JSON.stringify({
        ...validAnswer(),
        items: [{ ...validAnswer().items[0], evidenceRefs: ['profile.untrusted'] }],
      }),
    ];

    for (const raw of invalid) {
      expect(() => parseModelAnswer(raw)).toThrow(ModelAnswerContractError);
    }
  });

  it('treats refusals as bounded non-answers', () => {
    expect(() => parseModelAnswer(JSON.stringify({
      schema: MODEL_ANSWER_PROTOCOL,
      refusal: 'The profile does not cover that.',
      items: [],
    }))).toThrow(expect.objectContaining({ code: 'MODEL_REFUSED' }));
  });

  it('resolves host-owned evidence and lets Facia derive collection/list density 2', () => {
    const answer = parseModelAnswer(JSON.stringify(validAnswer()));
    const answerSet = adaptModelAnswer('What did Jeremy do?', answer);
    const result = resolveAnswerSet(answerSet, { depth: 'glance' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.pattern).toBe('list');
    expect(result.recipe.density).toEqual({ density: 2, source: 'derived' });
    expect(result.recipe.visibleFields[0].fields.map((field) => field.key)).toEqual([
      'title',
      'contribution',
    ]);
    expect(result.recipe.answer.items[0].evidence).toEqual(expect.objectContaining({
      status: 'profile-grounded',
      sourceRefs: ['content/profile.md#career-history'],
    }));
  });
});
