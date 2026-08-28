import { ANSWER_SET_SCHEMA_PIN, resolveAnswerSet } from '@facia/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ComponentRecipe, DisclosureDepth } from '@facia/core';
import {
  answerPortfolioQuestion,
  careerHistoryAnswerSet,
} from '../../../api/_lib/portfolio-answer-source';
import { tensionAnswerSet } from '../../../api/_lib/tension-answer-source';
import { adaptModelOperation, type ModelOperation } from '../../../api/_lib/model-operation';
import { ChatView } from '../chat-view';
import { nextElementDepth, SemanticSurface, updateElementDepth } from './semantic-surface';

describe('SemanticSurface', () => {
  it('renders a Facia list recipe without re-resolving its presentation pattern', () => {
    const answer = answerPortfolioQuestion('What did Jeremy work on at Zocdoc?');
    const result = resolveAnswerSet(answer, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} />,
    );

    expect(html).toContain('What did Jeremy work on at Zocdoc?');
    expect(html).toContain('Accessible design-system migration');
    expect(html).toContain('data-testid="semantic-list"');
    expect(html).not.toContain('Evidence and trace');
    expect(html).not.toContain('PATTERN_COLLECTION_LIST');
    expect(html).not.toContain('derived density');
    expect(html).toContain('data-testid="button-item-0-inspect"');
  });

  it('renders a temporal-sequence as a timeline, not the unsupported fallback', () => {
    const answer = careerHistoryAnswerSet();
    const depths: DisclosureDepth[] = ['glance', 'inspect', 'focus', 'audit'];
    const recipesByDepth = {} as Record<DisclosureDepth, ComponentRecipe>;
    for (const depth of depths) {
      const result = resolveAnswerSet(answer, { depth });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      recipesByDepth[depth] = result.recipe;
    }

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={recipesByDepth.glance} recipesByDepth={recipesByDepth} />,
    );

    expect(html).toContain('data-testid="semantic-timeline"');
    expect(html).not.toContain('does not support');
    expect(html).toContain('data-testid="timeline-entry-0"');
    // Identity plus focus and highlight — the whole content of a timeline entry.
    expect(html).toContain('Head of Operations');
    expect(html).toContain('Aroko');
    expect(html).toContain('2024–present');
    expect(html).toContain('Leads operations and client web delivery');
    expect(html).toContain('90-day operating plan');
    // No Facia tags: no control buttons, no field labels, no audit/provenance.
    expect(html).not.toContain('button-item-0-inspect');
    expect(html).not.toContain('button-affordance-audit');
    expect(html).not.toContain('semantic-inspection-controls');
    expect(html).not.toContain('Evidence Tier');
    expect(html).not.toContain('content/profile.md');
    expect(html).not.toMatch(/<dt>/);
  });

  it('maps inspect and expand affordances to element-owned depth transitions', () => {
    expect(nextElementDepth('glance', 'inspect')).toBe('inspect');
    expect(nextElementDepth('inspect', 'inspect')).toBe('glance');
    expect(nextElementDepth('inspect', 'expand')).toBe('focus');
    expect(nextElementDepth('focus', 'expand')).toBe('inspect');
    expect(nextElementDepth('glance', 'drill-down')).toBe('focus');

    const current = { 0: 'glance', 1: 'glance' } as const;
    expect(updateElementDepth(current, 1, 'inspect')).toEqual({ 0: 'glance', 1: 'inspect' });
    expect(current).toEqual({ 0: 'glance', 1: 'glance' });
  });

  it('renders focus collection controls from inspectionControls', () => {
    const answer = answerPortfolioQuestion('What did Jeremy work on at Zocdoc?');
    const glance = resolveAnswerSet(answer, { depth: 'glance' });
    const inspect = resolveAnswerSet(answer, { depth: 'inspect' });
    const focus = resolveAnswerSet(answer, { depth: 'focus' });
    const audit = resolveAnswerSet(answer, { depth: 'audit' });
    expect(glance.ok && inspect.ok && focus.ok && audit.ok).toBe(true);
    if (!glance.ok || !inspect.ok || !focus.ok || !audit.ok) return;

    const html = renderToStaticMarkup(<SemanticSurface
      recipe={focus.recipe}
      recipesByDepth={{
        glance: glance.recipe,
        inspect: inspect.recipe,
        focus: focus.recipe,
        audit: audit.recipe,
      }}
    />);

    expect(html).toContain('data-testid="button-affordance-filter"');
    expect(html).toContain('data-testid="button-affordance-sort"');
    expect(html).toContain('data-testid="button-item-0-expand"');
    expect(html).toContain('data-depth="focus"');
  });

  it('keeps audit and trace at page level while evidence remains item-owned', () => {
    const answer = answerPortfolioQuestion('What did Jeremy work on at Zocdoc?');
    const glance = resolveAnswerSet(answer, { depth: 'glance' });
    const inspect = resolveAnswerSet(answer, { depth: 'inspect' });
    const focus = resolveAnswerSet(answer, { depth: 'focus' });
    const audit = resolveAnswerSet(answer, { depth: 'audit' });
    expect(glance.ok && inspect.ok && focus.ok && audit.ok).toBe(true);
    if (!glance.ok || !inspect.ok || !focus.ok || !audit.ok) return;

    const html = renderToStaticMarkup(<SemanticSurface
      recipe={audit.recipe}
      recipesByDepth={{
        glance: glance.recipe,
        inspect: inspect.recipe,
        focus: focus.recipe,
        audit: audit.recipe,
      }}
    />);

    expect(html).toContain('data-testid="button-affordance-audit"');
    expect(html).toContain('Exit audit');
    expect(html).toContain('data-testid="button-affordance-view-trace"');
    expect(html).toContain('data-testid="button-item-0-view-evidence"');
    expect(html).not.toContain('semantic-item-0-evidence');
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
    expect(html).toContain('data-testid="button-item-0-inspect"');
    expect(html).toContain('data-testid="button-affordance-audit"');
    expect(html).not.toContain('button-depth-glance');
    expect(html).not.toContain('facia.answer-set/2');
    expect(html).not.toContain('PATTERN_COLLECTION_LIST');
  });

  it('renders a grounded repo field as a safe external chip link', () => {
    const answer = answerPortfolioQuestion('What technologies has Jeremy worked with?');
    const result = resolveAnswerSet(answer, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} />,
    );

    expect(html).toContain('class="semantic-repo-chip"');
    expect(html).toContain('href="https://github.com/jeremycapps/corus"');
    expect(html).toContain('rel="noreferrer noopener"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('jeremycapps/corus');
  });

  it('renders a plain list item with no chip when the item has no repo', () => {
    const answer = answerPortfolioQuestion('What did Jeremy work on at Zocdoc?');
    const result = resolveAnswerSet(answer, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} />,
    );

    expect(html).not.toContain('semantic-repo-chip');
  });
});

describe('singular answers', () => {
  const verdict = tensionAnswerSet('Is Domain/Corus a production system or a prototype?')!;

  it('renders a badge recipe instead of refusing it', () => {
    const result = resolveAnswerSet(verdict, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(<SemanticSurface recipe={result.recipe} />);
    expect(html).not.toContain('does not support');
    expect(html).toContain('state-badge');
    expect(html).toContain('Prototype');
  });

  it('shows the basis and the ruled-out alternative once expanded to focus', () => {
    const result = resolveAnswerSet(verdict, { depth: 'focus' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(<SemanticSurface recipe={result.recipe} />);
    expect(html).not.toContain('does not support');
    expect(html).toContain('no located implementation');
    expect(html).toContain('Production system');
  });

  it('surfaces the corpus caution only at audit depth', () => {
    const focus = resolveAnswerSet(verdict, { depth: 'focus' });
    const audit = resolveAnswerSet(verdict, { depth: 'audit' });
    if (!focus.ok || !audit.ok) throw new Error('unresolved');

    expect(renderToStaticMarkup(<SemanticSurface recipe={focus.recipe} />))
      .not.toContain('never as built or running');
    expect(renderToStaticMarkup(<SemanticSurface recipe={audit.recipe} />))
      .toContain('never as built or running');
  });
});

describe('a composed operation answer', () => {
  const mapping: ModelOperation = {
    schema: 'portfolio.model-operation/1',
    refusal: null,
    input: {
      claim: 'Owned and migrated shared TypeScript/React design-system components across production healthcare surfaces.',
      evidenceRefs: ['profile.zocdoc'],
    },
    relation: 'The same ownership-plus-migration discipline transfers to a fintech component library, a shared surface under compliance pressure.',
    output: 'Building a component library at a fintech',
    caution: null,
  };
  const answer = adaptModelOperation(
    "How would Jeremy's design-system experience apply to building a component library at a fintech?",
    mapping,
  );

  it('renders the mapping instead of refusing the operation-detail recipe', () => {
    const r = resolveAnswerSet(answer, { depth: 'focus' });
    if (!r.ok) throw new Error('unresolved');
    const html = renderToStaticMarkup(<SemanticSurface recipe={r.recipe} />);
    expect(html).not.toContain('does not support');
    // The relation is the headline; its grounding deepens it. The two endpoints
    // are the contract record, not restated as fields.
    expect(html).toContain('ownership-plus-migration discipline transfers');
    expect(html).toContain('production healthcare surfaces');
    expect(html).not.toContain('<dt>to</dt>');
  });
});
