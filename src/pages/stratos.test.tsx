import type { ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AnswerPanel, agendaTargetId } from './stratos';
import { STRATOS_RECIPES } from '../lib/stratos/recipes.generated';

type AnswerPanelHasLive = 'live' extends keyof ComponentProps<typeof AnswerPanel> ? true : false;
const answerPanelHasLive: AnswerPanelHasLive = false;

const openTrace = { evidence: false, trace: true };

describe('the StratOS trace reveal', () => {
  it('shows only the steps and values that actually resolved', () => {
    expect(answerPanelHasLive).toBe(false);
    const html = renderToStaticMarkup(
      <AnswerPanel elId="advantage" recipe={STRATOS_RECIPES['tension:advantage:l'].audit}
        depth="audit" sideClass="l" reveal={openTrace}
        onToggleReveal={() => {}} />,
    );

    expect(html).toContain('pole.resolved = Controlled value chain');
    expect(html).toContain('owner.resolved = Strategy');
    expect(html).not.toContain('position.declared');
  });
});

describe('array-valued fields', () => {
  it('renders officer questions as distinct list items', () => {
    const html = renderToStaticMarkup(
      <AnswerPanel elId="officer:advantage" recipe={STRATOS_RECIPES['officer:advantage:l'].focus}
        depth="focus" sideClass="l" reveal={{ evidence: false, trace: false }}
        onToggleReveal={() => {}} />,
    );

    expect(html).toContain('<ul class="qs">');
    expect(html.match(/<li>/g)).toHaveLength(3);
    expect(html).toContain('<li>What must the company own for its promise to remain credible?</li>');
    expect(html).toContain('<li>Where is partner dependence becoming concentration risk?</li>');
    expect(html).toContain('<li>Which reusable assets need explicit economic accountability?</li>');
  });
});

describe('agendaTargetId', () => {
  it('maps an agenda operation id to that tension officer element id', () => {
    expect(agendaTargetId('stratos.agenda.advantage')).toBe('officer:advantage');
  });

  it('ignores operation ids that are not agenda operations', () => {
    expect(agendaTargetId('stratos.place.advantage')).toBeNull();
    expect(agendaTargetId('')).toBeNull();
  });
});

describe('the board-agenda affordance', () => {
  it('renders the declared operation as a live control rather than hiding it', () => {
    const recipe = STRATOS_RECIPES['tension:advantage:l'].inspect;
    const html = renderToStaticMarkup(
      <AnswerPanel elId="advantage" recipe={recipe} depth="inspect" sideClass="l"
        reveal={{ evidence: false, trace: false }}
        onAction={() => {}}
        onToggleReveal={() => {}} />,
    );

    expect(html).toContain('data-operation="stratos.agenda.advantage"');
    expect(html).toContain('Carried to the board agenda');
    expect(html).toContain('aff act live');
  });
});
