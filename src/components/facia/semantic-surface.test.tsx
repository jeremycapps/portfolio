import { ANSWER_SET_SCHEMA_PIN, resolveAnswerSet } from '@facia/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { answerPortfolioQuestion } from '../../../api/_lib/portfolio-answer-source';
import { ChatView } from '../chat-view';
import { SemanticSurface } from './semantic-surface';

describe('SemanticSurface', () => {
  it('renders a Facia list recipe without re-resolving its presentation pattern', () => {
    const answer = answerPortfolioQuestion('What did Jeremy work on at Zocdoc?');
    const result = resolveAnswerSet(answer, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} onDepthChange={() => undefined} />,
    );

    expect(html).toContain('What did Jeremy work on at Zocdoc?');
    expect(html).toContain('Accessible design-system migration');
    expect(html).toContain('data-testid="semantic-list"');
    expect(html).not.toContain('Evidence and trace');
    expect(html).not.toContain('PATTERN_COLLECTION_LIST');
    expect(html).not.toContain('derived density');
  });

  it('renders mixed Markdown and Facia turns inside normal assistant bubbles', () => {
    const answer = answerPortfolioQuestion('What did Jeremy work on at Zocdoc?');
    const glance = resolveAnswerSet(answer, { depth: 'glance' });
    const inspect = resolveAnswerSet(answer, { depth: 'inspect' });
    const focus = resolveAnswerSet(answer, { depth: 'focus' });
    const audit = resolveAnswerSet(answer, { depth: 'audit' });
    expect(glance.ok && inspect.ok && focus.ok && audit.ok).toBe(true);
    if (!glance.ok || !inspect.ok || !focus.ok || !audit.ok) return;
    const recipesByDepth = {
      glance: glance.recipe,
      inspect: inspect.recipe,
      focus: focus.recipe,
      audit: audit.recipe,
    };

    const html = renderToStaticMarkup(<ChatView
      messages={[
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: { kind: 'markdown', markdown: 'Hi there.' } },
        { role: 'user', content: 'What about Zocdoc?' },
        {
          role: 'assistant',
          content: {
            kind: 'facia',
            question: 'What about Zocdoc?',
            answer: {
              protocol: 'portfolio.answer/1',
              schemaPin: ANSWER_SET_SCHEMA_PIN,
              recipe: recipesByDepth.glance,
              recipesByDepth,
            },
          },
        },
      ]}
      streaming={false}
      error={null}
    />);

    expect(html).toContain('Hello');
    expect(html).toContain('Hi there.');
    expect(html).toContain('What about Zocdoc?');
    expect(html).toContain('chat-bubble-assistant');
    expect(html).toContain('semantic-surface-conversation');
    expect(html).toContain('Accessible design-system migration');
    expect(html).not.toContain('facia.answer-set/2');
    expect(html).not.toContain('PATTERN_COLLECTION_LIST');
  });
});
