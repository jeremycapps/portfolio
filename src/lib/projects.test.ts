import { describe, expect, it } from 'vitest';
import { EXPLAIN_PROJECT_CHOICES, PORTFOLIO_PROJECTS } from './projects';

describe('project explanation picker', () => {
  it('offers every supported project, including StratOS', () => {
    expect(EXPLAIN_PROJECT_CHOICES.map((choice) => choice.label)).toEqual([
      'Libera',
      'Facia',
      'StratOS',
    ]);
    expect(EXPLAIN_PROJECT_CHOICES.at(-1)?.prompt).toContain(
      'Explain the StratOS project in depth',
    );
  });

  it('presents the three public product expressions in market-legible language', () => {
    expect(PORTFOLIO_PROJECTS.map((project) => project.name)).toEqual([
      'Libera',
      'Facia',
      'StratOS',
    ]);
    expect(PORTFOLIO_PROJECTS[0].description).toContain('reusable software context');
    expect(PORTFOLIO_PROJECTS[1].description).toContain('reusable interface recipe');
    expect(PORTFOLIO_PROJECTS[2]).toMatchObject({
      category: 'Decision infrastructure',
      pageUrl: '/stratos-v2',
    });
  });
});
