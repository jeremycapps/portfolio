import { describe, expect, it } from 'vitest';

import { validateCaseProfile } from './profile';
import { WATSON_MD_ANDERSON } from './watson-md-anderson';

describe('Watson × MD Anderson case profile', () => {
  it('validates every reference and cutoff', () => {
    expect(validateCaseProfile(WATSON_MD_ANDERSON)).toEqual([]);
  });

  it('uses a contemporaneous Regents decision for the middle snapshot', () => {
    const snapshot = WATSON_MD_ANDERSON.snapshots.find(({ id }) => id === 'phase-1a-2014-02-06');
    expect(snapshot?.factRefs).toContain('oea-phase-1a-authorization');
    expect(snapshot?.factRefs).toContain('oea-community-adoption-unproven');
    expect(snapshot?.factRefs).not.toContain('oea-contract-extensions');
  });

  it('shows the arithmetic behind the terminal spend comparison', () => {
    const fact = WATSON_MD_ANDERSON.facts.find(({ id }) => id === 'oea-spend-overshoot');
    expect(fact).toMatchObject({
      origin: 'derived',
      metric: { value: 10.7135, unit: 'USD millions above reviewed awards' },
    });
    const calculation = fact && 'calculation' in fact ? fact.calculation : undefined;
    expect(calculation).toContain('$62.1135 million');
    expect(calculation).toContain('$51.4 million');
  });

  it('keeps the adjacent Watson for Oncology safety claims out of this case', () => {
    expect(WATSON_MD_ANDERSON.facts.some(({ id }) => id.includes('unsafe'))).toBe(false);
    expect(WATSON_MD_ANDERSON.facts.some(({ statement }) => statement.includes('incorrect treatment'))).toBe(false);
  });
});
