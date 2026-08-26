import { describe, expect, it } from 'vitest';
import { TENSIONS, poleSideFor } from './ontology';

describe('StratOS position resolution', () => {
  it('resolves any movement away from zero to a pole', () => {
    expect(poleSideFor(-Number.EPSILON)).toBe('l');
    expect(poleSideFor(0)).toBe('neutral');
    expect(poleSideFor(Number.EPSILON)).toBe('r');
  });

  it('uses the inside-enterprise / boundary polarity convention in every definition', () => {
    for (const tension of TENSIONS) {
      expect(tension.blurbLeft).toContain('inside the enterprise');
      expect(tension.blurbRight).toContain('boundary');
    }
  });
});
