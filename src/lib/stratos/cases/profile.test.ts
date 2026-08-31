import { describe, expect, it } from 'vitest';
import { STRATOS_CASE_PROFILES } from './index';
import { CONSTRAINT_IDS, SYSTEM_IDS, validateCaseProfile, type CaseFact, type CaseProfile } from './profile';

describe('StratOS public-company case profiles', () => {
  it('passes provenance and temporal-cutoff validation', () => {
    for (const profile of STRATOS_CASE_PROFILES) {
      expect(validateCaseProfile(profile), profile.id).toEqual([]);
    }
  });

  it('uses unique case identifiers', () => {
    const ids = STRATOS_CASE_PROFILES.map((profile) => profile.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('makes every system and shared constraint explicit at every snapshot', () => {
    for (const profile of STRATOS_CASE_PROFILES) {
      for (const snapshot of profile.snapshots) {
        expect(Object.keys(snapshot.systems).sort()).toEqual([...SYSTEM_IDS].sort());
        expect(Object.keys(snapshot.constraints).sort()).toEqual([...CONSTRAINT_IDS].sort());
      }
    }
  });

  it('keeps completed outcomes separate from ongoing cases', () => {
    for (const profile of STRATOS_CASE_PROFILES) {
      const phases = profile.snapshots.map((snapshot) => snapshot.phase);
      if (profile.case.status === 'completed') {
        expect(phases, profile.id).toContain('outcome');
      } else {
        expect(phases, profile.id).toContain('ongoing');
        expect(phases, profile.id).not.toContain('outcome');
      }
    }
  });

  it('links every evidence profile to a versioned scorecard with an explicit evidence scope', () => {
    for (const profile of STRATOS_CASE_PROFILES) {
      expect(profile.scoring).toMatchObject({
        status: 'scored',
        rubricVersion: '0.2.0',
      });
      expect([
        'commitment-date-public-desk',
        'outcome-calibrated-retrodiction',
        'latest-evidence-calibration',
      ]).toContain(profile.scoring.scope);
      expect('score' in profile.scoring).toBe(false);
    }
  });

  it('discloses the arithmetic behind the Domino’s endpoint comparison', () => {
    const dominos = STRATOS_CASE_PROFILES.find((profile) => profile.id === 'dominos-growth-2018-2025');
    expect(dominos).toBeDefined();

    const storeAttainment = dominos!.facts.find((fact) => fact.id === 'store-target-attainment');
    const salesAttainment = dominos!.facts.find((fact) => fact.id === 'sales-target-attainment');

    expect(storeAttainment).toMatchObject({ origin: 'derived', metric: { value: 88.568 } });
    expect(storeAttainment?.calculation).toContain('22,142');
    expect(salesAttainment).toMatchObject({ origin: 'derived', metric: { value: 80.5072 } });
    expect(salesAttainment?.calculation).toContain('$20.1268 billion');
  });

  it('builds the Target outcome backcast from explicit observed and derived quantities', () => {
    const target = STRATOS_CASE_PROFILES.find((profile) => profile.id === 'target-canada-2012-2015');
    expect(target).toBeDefined();
    const facts = new Map<string, CaseFact>(target!.facts.map((fact) => [fact.id, fact]));

    expect(facts.get('planned-opening-window-months')?.metric).toEqual({ low: 9, high: 10, unit: 'months' });
    expect(facts.get('required-store-opening-rate')?.metric).toEqual({
      low: 12.5,
      high: 13.8889,
      unit: 'stores per month',
    });
    expect(facts.get('employees-per-store-at-exit')?.metric).toEqual({
      value: 132.3308,
      unit: 'employees per store',
    });
    expect(facts.get('workforce-equivalent-125-stores')?.metric).toEqual({ value: 16541.35, unit: 'employees' });
    expect(facts.get('estimated-people-load-range')?.metric).toEqual({
      low: 15000,
      high: 18000,
      unit: 'employees',
    });
    expect(facts.get('gross-profit-2013')?.metric).toEqual({
      value: 196.233,
      unit: 'USD millions gross profit',
    });
    expect(facts.get('ebit-loss-share-of-sales')?.metric).toEqual({
      value: -71.4503,
      unit: 'percent EBIT margin proxy',
    });
    expect(facts.get('exit-charge-per-store')?.metric).toEqual({
      value: 38.3835,
      unit: 'USD millions exit charge per store',
    });
    expect(facts.get('operational-time-fit-upper-bound')?.metric).toEqual({
      value: -11,
      unit: 'months, strict upper bound',
    });
  });

  it('derives comparable outcome quantities for Adobe, Domino’s, and Ford', () => {
    const profileById = new Map<string, CaseProfile>(STRATOS_CASE_PROFILES.map((profile) => [profile.id, profile]));
    const facts = (id: string) => new Map<string, CaseFact>(profileById.get(id)!.facts.map((fact) => [fact.id, fact]));

    const adobe = facts('adobe-creative-cloud-2012-2016');
    expect(adobe.get('paid-subscriber-increase-2013')?.metric).toEqual({
      value: 1.1,
      unit: 'million paid subscriptions increase',
    });
    expect(adobe.get('subscription-majority-surplus-2016')?.metric).toEqual({
      value: 28,
      unit: 'percentage points above 50% revenue share',
    });
    expect(adobe.get('transition-duration-months')?.metric).toEqual({
      value: 55,
      unit: 'months, approximate observed transition duration',
    });

    const dominos = facts('dominos-growth-2018-2025');
    expect(dominos.get('store-target-shortfall')?.metric).toEqual({ value: -2858, unit: 'stores versus target' });
    expect(dominos.get('sales-target-shortfall')?.metric).toEqual({
      value: -4.8732,
      unit: 'USD billions global retail sales versus target',
    });

    const ford = facts('ford-model-e-2022-2026');
    expect(ford.get('model-e-margin-gap-2024')?.metric).toEqual({
      value: -139.8,
      unit: 'percentage points versus 8% EBIT-margin target',
    });
    expect(ford.get('model-e-ebit-per-wholesale-2024')?.metric).toEqual({
      value: -48342.86,
      unit: 'USD EBIT per wholesale unit',
    });
  });
});
