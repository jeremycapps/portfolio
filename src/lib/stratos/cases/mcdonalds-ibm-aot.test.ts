import { describe, expect, it } from 'vitest';

import { validateCaseProfile } from './profile';
import { MCDONALDS_IBM_AOT } from './mcdonalds-ibm-aot';

describe("McDonald's × IBM AOT case profile", () => {
  it('is provenance-complete and cutoff-safe', () => {
    expect(validateCaseProfile(MCDONALDS_IBM_AOT)).toEqual([]);
  });

  it('places the 2022 warning against the contemporaneous accuracy report', () => {
    const warning = MCDONALDS_IBM_AOT.snapshots.find(({ id }) => id === 'accuracy-warning-2022-06-23');
    expect(warning?.constraints.risk.factRefs).toEqual([
      'mcd-aot-low-80s-accuracy',
      'mcd-aot-95-percent-gate',
    ]);
    expect(MCDONALDS_IBM_AOT.sources.find(({ id }) => id === 'restaurant-dive-aot-accuracy-2022')?.publishedAt)
      .toBe('2022-06-23');
  });

  it('keeps absent financial disclosure as fog instead of a zero-dollar fact', () => {
    expect(MCDONALDS_IBM_AOT.facts.some((fact) => (
      'metric' in fact && fact.metric?.unit.startsWith('USD')
    ))).toBe(false);
    for (const snapshot of MCDONALDS_IBM_AOT.snapshots) {
      expect(snapshot.constraints.finance.status).toBe('insufficient-evidence');
    }
  });

  it('separates ending the IBM path from rejecting voice ordering as a category', () => {
    expect(MCDONALDS_IBM_AOT.facts.find(({ id }) => id === 'mcd-aot-partnership-ended')?.statement)
      .toContain('other voice-ordering solutions');
    expect(MCDONALDS_IBM_AOT.facts.find(({ id }) => id === 'mcd-voice-ordering-still-valued')?.statement)
      .toContain('confidence');
  });
});
