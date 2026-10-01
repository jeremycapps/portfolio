import { resolveAnswerSet } from '@facia/core';
import type { ComponentRecipe, DisclosureDepth } from '@facia/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { currentWorkAnswerSet } from '../../../api/_lib/github-answer-source';
import { tensionAnswerSet } from '../../../api/_lib/tension-answer-source';
import {
  arokoAnswerSet,
  careerHistoryAnswerSet,
  lookingForAnswerSet,
  technologiesAnswerSet,
} from '../../../api/_lib/portfolio-answer-source';
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
    expect(html).toContain('Head of Operations');
    expect(html).toContain('Aroko');
  });

  // Regression: the list renderer read only title/contribution/outcome, so the
  // target-roles and technologies answers rendered as empty rows.
  it('renders every list answer from its own fields, not only the work-item shape', () => {
    const roles = render(lookingForAnswerSet());
    expect(roles).toContain('<strong>Forward Deployed Engineer.</strong>');
    expect(roles).toContain('<strong>Member of Technical Staff.</strong>');
    expect(roles).toContain('Works directly with the people who own the problem');

    const tech = render(technologiesAnswerSet());
    expect(tech).not.toMatch(/<p class="conversation-list-item"><\/p>/);

    const aroko = render(arokoAnswerSet());
    expect(aroko).toContain('conversation-aside');
    expect(aroko).not.toMatch(/<p class="conversation-list-item"><\/p>/);
  });

  // Regression: the timeline read only the career shape (role/organization/period/focus),
  // so the GitHub current-work card — also a temporal sequence — rendered as empty rows.
  it('renders the GitHub current-work timeline from its own fields', () => {
    const repo = (name: string, framing: string, at: string) => ({
      repo: name,
      repoId: name.length,
      framing,
      lastActive: at,
      activity: [{ kind: 'pull_request' as const, at, title: 'Ship it', number: 7, state: 'merged' }],
    });
    const html = render(
      currentWorkAnswerSet({
        generated_at: '2026-09-29T06:00:00Z',
        handle: 'jeremycapps',
        items: [
          repo('jeremycapps/portfolio', 'a production-grade RAG agent', '2026-09-29T05:00:00Z'),
          repo('deeplethe/utopia', 'evaluation tooling', '2026-09-28T05:00:00Z'),
        ],
      })!,
    );
    expect(html).toContain('conversation-timeline');
    expect(html).toContain('jeremycapps/portfolio');
    expect(html).toContain('a production-grade RAG agent');
    expect(html).toContain('deeplethe/utopia');
  });
});
