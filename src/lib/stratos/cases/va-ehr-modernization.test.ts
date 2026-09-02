import { describe, expect, it } from 'vitest';

import { evaluateCapacityPlacement, type CapacityFigure } from '../scoring/rubric';
import { validateCaseProfile, type CaseFact, type CaseSource } from './profile';
import { VA_EHR_MODERNIZATION } from './va-ehr-modernization';

const facts: readonly CaseFact[] = VA_EHR_MODERNIZATION.facts;
const sources: readonly CaseSource[] = VA_EHR_MODERNIZATION.sources;
const fact = (id: string) => facts.find((candidate) => candidate.id === id);
const source = (id: string) => sources.find((candidate) => candidate.id === id);

describe('VA EHR modernization profile', () => {
  it('validates, including the cutoff rule on every snapshot', () => {
    expect(validateCaseProfile(VA_EHR_MODERNIZATION)).toEqual([]);
  });

  it('carries government sources under the audit and agency kinds', () => {
    expect(source('va-oig-access-capabilities-2020')).toMatchObject({
      kind: 'audit-report',
      publishedAt: '2020-04-27',
    });
    expect(source('va-cerner-contract-2018')).toMatchObject({
      kind: 'agency-release',
      publishedAt: '2018-05-17',
    });
  });

  it('shows its work for the one figure the source states imprecisely', () => {
    expect(fact('va-rollout-support-filled-2020')).toMatchObject({
      origin: 'derived',
      metric: { low: 48, high: 60, unit: 'rollout-support positions' },
    });
    expect(fact('va-rollout-support-filled-2020')?.calculation).toContain('a little more than 48');
    expect(fact('va-rollout-support-required-2020')).toMatchObject({
      origin: 'reported',
      metric: { value: 108 },
    });
  });

  it('places the staffing evidence six months before the first release', () => {
    // The whole retrodictive claim rests on this gap: the readiness evidence was
    // public on 2020-04-27, and the release happened on 2020-10-24.
    expect(source('va-oig-access-capabilities-2020')!.publishedAt).toBe('2020-04-27');
    expect(fact('va-go-live-2020')?.observedAt).toBe('2020-10-24');
    expect(source('va-oig-access-capabilities-2020')!.publishedAt < '2020-10-24').toBe(true);
  });

  it('reaches a local staffing collision at desk tier without asserting VA reserve', () => {
    const required = fact('va-rollout-support-required-2020')!.metric as { value: number; unit: string };
    const available = fact('va-rollout-support-filled-2020')!.metric as { low: number; high: number; unit: string };
    const figure = (value: { low: number; high: number }, state: CapacityFigure['state'], sourceRef: string): CapacityFigure => ({
      value,
      unit: 'rollout-support positions',
      state,
      confidence: 0.8,
      asOf: '2020-01-08',
      sourceRef,
      sourceClass: 'A',
    });

    const result = evaluateCapacityPlacement({
      kind: 'evidenced-shortfall',
      scope: 'Mann-Grandstaff EHR rollout-support staffing',
      required: figure(
        { low: required.value, high: required.value },
        'observed',
        'va-oig-access-capabilities-2020',
      ),
      available: figure(
        { low: available.low, high: available.high },
        'estimated',
        'va-oig-access-capabilities-2020',
      ),
    }, 'desk');

    expect(result).toMatchObject({
      status: 'collides',
      fit: { low: -60, high: -48 },
      method: 'evidenced-shortfall',
    });
  });

  it('keeps the post-release ticket evidence out of the first-release snapshot', () => {
    const firstRelease = VA_EHR_MODERNIZATION.snapshots.find(({ id }) => id === 'first-release-2020-10-24');
    expect(firstRelease?.factRefs).not.toContain('va-support-tickets-2021');

    const expansion = VA_EHR_MODERNIZATION.snapshots.find(({ id }) => id === 'expansion-2022-03-26');
    expect(expansion?.factRefs).toContain('va-support-tickets-2021');
  });

  it('states no score, because no scorecard has been authored against it yet', () => {
    expect(VA_EHR_MODERNIZATION.scoring.status).toBe('unscored');
  });
});
