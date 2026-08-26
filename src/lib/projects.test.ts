import { describe, expect, it } from 'vitest';
import { EXPLAIN_PROJECT_CHOICES } from './projects';

describe('project explanation picker', () => {
  it('offers every supported project, including StratOS', () => {
    expect(EXPLAIN_PROJECT_CHOICES.map((choice) => choice.label)).toEqual([
      'Libera',
      'Facia',
      'Domain & Corus',
      'StratOS',
    ]);
    expect(EXPLAIN_PROJECT_CHOICES.at(-1)?.prompt).toContain(
      'Explain the StratOS project in depth',
    );
  });
});
