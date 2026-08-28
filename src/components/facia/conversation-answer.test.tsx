import { resolveAnswerSet } from '@facia/core';
import type { ComponentRecipe, DisclosureDepth } from '@facia/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { tensionAnswerSet } from '../../../api/_lib/tension-answer-source';
import { adaptModelOperation, type ModelOperation } from '../../../api/_lib/model-operation';
import { careerHistoryAnswerSet } from '../../../api/_lib/portfolio-answer-source';
import { ConversationAnswer } from './conversation-answer';

const DEPTHS: DisclosureDepth[] = ['glance', 'inspect', 'focus', 'audit'];
function byDepth(answer: Parameters<typeof resolveAnswerSet>[0]): Record<DisclosureDepth, ComponentRecipe> {
  const out = {} as Record<DisclosureDepth, ComponentRecipe>;
  for (const d of DEPTHS) {
    const r = resolveAnswerSet(answer, { depth: d });
    if (!r.ok) throw new Error('unresolved');
    out[d] = r.recipe;
  }
  return out;
}
const render = (answer: Parameters<typeof resolveAnswerSet>[0]) => {
  const rbd = byDepth(answer);
  return renderToStaticMarkup(<ConversationAnswer recipe={rbd.focus} recipesByDepth={rbd} />);
};

describe('ConversationAnswer', () => {
  it('renders a verdict as a sentence, not a chip in a card', () => {
    const html = render(tensionAnswerSet('Does Jeremy have backend and API experience, or is he frontend-only?')!);
    expect(html).toContain('Backend and API');
    expect(html).toContain('REST wrapper libraries'); // the basis, inline
    expect(html.toLowerCase()).toContain('rather than frontend only'); // ruled-out alternative, woven in
    expect(html).not.toContain('semantic-single'); // no structured card
    expect(html).not.toContain('Inspect'); // no depth-control vocabulary
  });

  it('leads an operation with the relation and cites its grounding', () => {
    const op: ModelOperation = {
      schema: 'portfolio.model-operation/1', refusal: null,
      input: { claim: 'Owned and migrated shared design-system components at Zocdoc.', evidenceRefs: ['profile.zocdoc'] },
      relation: 'The ownership-and-migration discipline transfers to a fintech component library.',
      output: 'Building a component library at a fintech',
      caution: 'Jeremy has not worked in fintech; the transfer is by shape of problem.',
    };
    const html = render(adaptModelOperation('q', op));
    expect(html).toContain('discipline transfers to a fintech');
    expect(html).toContain('Owned and migrated shared design-system components'); // grounding shown
    expect(html).toContain('has not worked in fintech'); // caution surfaced as an aside
    expect(html).not.toContain('Inspect');
  });

  it('renders the career answer as a structured timeline, its one genuinely structured case', () => {
    const html = render(careerHistoryAnswerSet());
    expect(html).toContain('conversation-timeline');
    expect(html).toContain('Head of Operations');
    expect(html).toContain('Aroko');
  });
});
