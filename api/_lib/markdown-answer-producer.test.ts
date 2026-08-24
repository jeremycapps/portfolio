import { resolveAnswerSet } from '@facia/core';
import { describe, expect, it } from 'vitest';
import { produceMarkdownAnswer } from './markdown-answer-producer';

describe('produceMarkdownAnswer', () => {
  it('creates a singular resolvable detail answer with internal model provenance', () => {
    const answer = produceMarkdownAnswer('How does it work?', '# Answer\n\nIt works.');
    const result = resolveAnswerSet(answer, { depth: 'glance', audience: 'human' });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.pattern).toBe('detail');
    expect(result.recipe.visibleFields).toHaveLength(1);
    expect(result.recipe.visibleFields[0].fields).toEqual([
      expect.objectContaining({ key: 'markdown', value: '# Answer\n\nIt works.' }),
    ]);
    expect(answer.items[0].payload._provenance).toEqual({
      engine: 'model',
      operation: 'portfolio.answer.markdown.v1',
    });
  });
});
