import { describe, expect, it } from 'vitest';

import { TARGET_CANADA, VA_EHR_MODERNIZATION } from '../cases';
import type { CaseFact } from '../cases/profile';
import { formatUsdMillions, resolveCostFigure, usdMillions } from './cost';
import { createDecisionExperienceViewModel } from './presentation';

const costOf = (id: string) => createDecisionExperienceViewModel(id).cost;

/** The profiles are `as const`, so a lookup narrows to one literal fact type. */
const fact = (facts: readonly CaseFact[], id: string): CaseFact => facts.find((f) => f.id === id)!;

describe('cost normalisation', () => {
  it('reads billions and millions onto one scale', () => {
    expect(usdMillions(fact(TARGET_CANADA.facts, 'canada-ebit-2013'))).toBe(941);
    expect(usdMillions(fact(TARGET_CANADA.facts, 'exit-charge-2014'))).toBe(5105);
    expect(usdMillions(fact(VA_EHR_MODERNIZATION.facts, 'va-contract-ceiling-2018'))).toBe(10_000);
  });

  it('refuses a unit it cannot read rather than plotting the wrong magnitude', () => {
    expect(() => usdMillions(fact(TARGET_CANADA.facts, 'planned-stores-2013')))
      .toThrow(/unrecognised money unit/);
  });

  it('refuses a range, which has no single point to plot', () => {
    expect(() => usdMillions(fact(TARGET_CANADA.facts, 'estimated-people-load-range')))
      .toThrow(/carries a range/);
  });

  it('carries magnitude, so an authorization and a loss are not put on opposite sides of zero', () => {
    const loss = resolveCostFigure(TARGET_CANADA, {
      kind: 'realized', factRef: 'canada-ebit-2013', basis: 'segment loss',
    });
    expect(loss.usdMillions).toBe(941);
    expect(fact(TARGET_CANADA.facts, 'canada-ebit-2013').metric).toMatchObject({ value: -941 });
  });

  it('formats to the width a phone axis has', () => {
    expect(formatUsdMillions(941)).toBe('$941M');
    expect(formatUsdMillions(5105)).toBe('$5.1B');
    expect(formatUsdMillions(49_800)).toBe('$49.8B');
  });
});

describe('what each case can say about money', () => {
  it('places Target capital at the commitment and losses after it', () => {
    expect(costOf('target-canada-t0-2012-07-12')).toMatchObject([{ kind: 'committed', usdMillions: 2692 }]);
    expect(costOf('target-canada-t2-2013-08-21')).toMatchObject([{ kind: 'realized', usdMillions: 169 }]);
    expect(costOf('target-canada-t3-2014-02-26')).toMatchObject([{ kind: 'realized', usdMillions: 941 }]);
    expect(costOf('target-canada-t4-2015-02-25')).toMatchObject([{ kind: 'realized', usdMillions: 5105 }]);
  });

  it('shows the realized charge overtaking the capital placed at the commitment', () => {
    const [committed] = costOf('target-canada-t0-2012-07-12');
    const [exit] = costOf('target-canada-t4-2015-02-25');
    expect(exit.usdMillions).toBeGreaterThan(committed.usdMillions);
  });

  it('holds VA’s eventual cost as hindsight, because no decision could use it', () => {
    expect(costOf('va-ehr-t0-2018-05-17')).toMatchObject([{ kind: 'committed', usdMillions: 10_000 }]);
    const [lifecycle] = costOf('va-ehr-t3-2023-04-21');
    expect(lifecycle).toMatchObject({ kind: 'hindsight', usdMillions: 49_800 });
    // Published 2023-05-18, after the 2023-04-21 decision it is attached to.
    expect(VA_EHR_MODERNIZATION.sources.find(({ id }) => id === 'gao-management-challenges-2023')!.publishedAt)
      .toBe('2023-05-18');
  });

  it('reports no figure where the packet reported none, rather than a zero', () => {
    // The two VA release decisions are the pair the cost view cannot price, and
    // that is the finding: the verdict went adverse while the books stayed quiet.
    expect(costOf('va-ehr-t1-2020-10-24')).toEqual([]);
    expect(costOf('va-ehr-t2-2022-03-26')).toEqual([]);
  });

  it('turns the verdict adverse before any money is on the books', () => {
    const adverse = createDecisionExperienceViewModel('va-ehr-t1-2020-10-24');
    expect(adverse.verdict).not.toBe('FOG');
    expect(adverse.cost).toEqual([]);
  });
});
