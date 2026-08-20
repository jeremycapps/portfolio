import { resolveAnswerSet } from '@facia/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { answerPortfolioQuestion } from '../../../api/_lib/portfolio-answer-source';
import { SemanticSurface } from './semantic-surface';

describe('SemanticSurface', () => {
  it('renders a Facia list recipe without re-resolving its presentation pattern', () => {
    const answer = answerPortfolioQuestion('What did Jeremy work on at Zocdoc?');
    const result = resolveAnswerSet(answer, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} onDepthChange={async () => undefined} />,
    );

    expect(html).toContain('Deterministic answer · Facia v2');
    expect(html).toContain('Accessible design-system migration');
    expect(html).toContain('data-testid="semantic-list"');
    expect(html).not.toContain('Evidence and trace');
  });

  it('renders a bounded impact verdict as the Facia detail recipe', () => {
    const answer = answerPortfolioQuestion('Which project had the most impact?');
    const result = resolveAnswerSet(answer, { depth: 'focus' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} onDepthChange={async () => undefined} />,
    );

    expect(html).toContain('data-testid="semantic-detail"');
    expect(html).toContain('No single project can be named responsibly');
    expect(html).toContain('company result');
    expect(html).toContain('button-depth-audit');
  });
});
