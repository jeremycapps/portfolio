import { describe, expect, it } from 'vitest';

import { TARGET_CANADA, VA_EHR_MODERNIZATION, WATSON_MD_ANDERSON } from '../cases';
import type { CaseFact } from '../cases/profile';
import { costSeries, formatUsdMillions, resolveCostFigure, usdMillions } from './cost';
import { createDecisionExperienceViewModel, decisionRecommendation } from './presentation';

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
      kind: 'realized', factRef: 'canada-ebit-2013', basis: 'segment loss', accrual: 'adds',
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

  it('carries Watson contract and realized-spend anchors on the terminal packet', () => {
    expect(costOf('watson-md-anderson-t1-2014-02-06')).toMatchObject([
      { kind: 'committed', usdMillions: 15 },
    ]);
    expect(costOf('watson-md-anderson-t2-2017-02-19')).toMatchObject([
      { kind: 'realized', usdMillions: 62.1135 },
      { kind: 'committed', usdMillions: 51.4 },
    ]);
    expect(usdMillions(fact(WATSON_MD_ANDERSON.facts, 'oea-total-spend'))).toBe(62.1135);
  });

  it('turns the verdict adverse before any money is on the books', () => {
    const adverse = createDecisionExperienceViewModel('va-ehr-t1-2020-10-24');
    expect(adverse.verdict).not.toBe('FOG');
    expect(adverse.cost).toEqual([]);
  });
});

describe('the running total and its slope', () => {
  const series = (company: string) => {
    const options = createDecisionExperienceViewModel().timeline.options
      .filter((option) => option.companyName === company)
      .sort((a, b) => a.decisionDate.localeCompare(b.decisionDate));
    return costSeries(options.map((option) => ({
      id: option.id,
      sequence: option.sequence,
      decisionDate: option.decisionDate,
      cost: option.cost,
      adverse: createDecisionExperienceViewModel(option.id).verdict !== 'FOG',
    })));
  };

  it('does not count a quarter twice inside the year that contains it', () => {
    const [t0, t2, t3] = series('Target Corporation');
    expect(t0.total).toBe(2692);
    // Q2's $169M adds to the capital placed.
    expect(t2.total).toBe(2861);
    // The full year supersedes that quarter rather than adding to it, so the
    // total moves by the year's figure, not by the year plus the quarter.
    expect(t3.total).toBe(2692 + 941);
  });

  it('replaces the ceiling with the lifecycle estimate that contains it', () => {
    const va = series('U.S. Department of Veterans Affairs');
    expect(va[0].total).toBe(10_000);
    expect(va.at(-1)!.total).toBe(49_800);
  });

  it('places an unreported date on the line rather than holding it flat', () => {
    const [t0, t1, t2, t3] = series('U.S. Department of Veterans Affairs');
    expect([t1, t2].map(({ implied }) => implied)).toEqual([true, true]);
    // Between the two reported anchors, and in order, rather than both pinned
    // to the earlier one. Money left continuously; only the reporting was lumpy.
    expect(t1.total).toBeGreaterThan(t0.total);
    expect(t2.total).toBeGreaterThan(t1.total);
    expect(t2.total).toBeLessThan(t3.total);
  });

  it('spends at one rate across a stretch nobody reported', () => {
    const [, t1, t2, t3] = series('U.S. Department of Veterans Affairs');
    // A straight line between two anchors has a constant slope, so the implied
    // segments inside it must match rather than spike at the end.
    expect(t2.ratePerMonth).toBeCloseTo(t1.ratePerMonth, 6);
    expect(t3.ratePerMonth).toBeCloseTo(t1.ratePerMonth, 6);
  });

  it('reads the burn rate accelerating across Target’s operating years', () => {
    const [, t2, t3] = series('Target Corporation');
    expect(t2.ratePerMonth).toBeGreaterThan(0);
    expect(t3.ratePerMonth).toBeGreaterThan(t2.ratePerMonth * 5);
    // Every Target date reports a figure, so none of them is read off the line.
    expect(series('Target Corporation').every(({ implied }) => !implied)).toBe(true);
  });

  it('never lets the running total fall', () => {
    for (const company of ['Target Corporation', 'U.S. Department of Veterans Affairs']) {
      const totals = series(company).map(({ total }) => total);
      expect(totals).toEqual([...totals].sort((a, b) => a - b));
    }
  });

  it('does not backfill a later money anchor into Watson’s launch decision', () => {
    const watson = series('The University of Texas MD Anderson Cancer Center');
    expect(watson[0]).toMatchObject({ total: 0, implied: true });
    expect(watson[1].total).toBe(15);
    expect(watson[2].total).toBe(62.1135);
  });
});

describe('the decision recommendation', () => {
  const rec = (id: string) => decisionRecommendation(createDecisionExperienceViewModel(id));

  it('names the verb from the cause, not the verdict token', () => {
    expect(rec('target-canada-t4-2015-02-25').verb).toBe('EXIT');   // value floor
    expect(rec('va-ehr-t1-2020-10-24').verb).toBe('HOLD');          // risk floor
    expect(rec('target-canada-t3-2014-02-26').verb).toBe('TRIM');   // capacity collision
    expect(rec('target-canada-t0-2012-07-12').verb).toBe('WAIT');   // fog
  });

  it('points the move at the owner of wherever the uncertainty sits', () => {
    expect(rec('va-ehr-t1-2020-10-24').owner).toBe('the delivery lead');
    expect(rec('target-canada-t3-2014-02-26').owner).toBe('the CFO');
    expect(rec('va-ehr-t1-2020-10-24').move).toMatch(/delivery lead.*before the next release/);
  });

  it('gives EXIT no owner, because there is no read left to get', () => {
    const exit = rec('target-canada-t4-2015-02-25');
    expect(exit.owner).toBeUndefined();
    expect(exit.move).toMatch(/wind-down/);
  });

  it('reads the reset as one open line, not a stop', () => {
    // Every readiness leg clears; only budget is unpriced. The instrument at its
    // best: not "stop", but "here is the single number left to get".
    const reset = rec('va-ehr-t3-2023-04-21');
    expect(reset.verb).toBe('WAIT');
    expect(reset.gap).toMatch(/every condition clears/);
    expect(reset.focus?.label).toBe('Budget');
    expect(reset.owner).toBe('the CFO');
  });

  it('states the gap as a sentence, joining what breaks', () => {
    expect(rec('va-ehr-t1-2020-10-24').gap)
      .toBe('Infrastructure readiness, Capability availability and People fall short');
    expect(rec('target-canada-t0-2012-07-12').gap).toBe('nothing is proven yet');
  });
});
