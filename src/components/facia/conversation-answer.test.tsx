import { resolveAnswerSet } from '@facia/core';
import type { ComponentRecipe, DisclosureDepth } from '@facia/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { tensionAnswerSet } from '../../../api/_lib/tension-answer-source';
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
    expect(html).toContain('Backend and API'); // the answer, as a sentence lead
    expect(html).toContain('REST wrapper libraries'); // the basis, flowing on
    expect(html).not.toContain('semantic-single'); // no structured card
    expect(html).not.toContain('Inspect'); // no depth-control vocabulary
  });

  it('renders a both-placement as prose that holds the duality', () => {
    const html = render(tensionAnswerSet('Is Jeremy currently in a hands-on engineering role or an operations role?')!);
    expect(html).toContain('Both');
    expect(html).toContain('Head of Operations'); // the basis carries the how
  });

  it('renders the career answer as a structured timeline, its one genuinely structured case', () => {
    const html = render(careerHistoryAnswerSet());
    expect(html).toContain('conversation-timeline');
    expect(html).toContain('Strategic Projects Lead');
    expect(html).toContain('Aroko');
  });
});
