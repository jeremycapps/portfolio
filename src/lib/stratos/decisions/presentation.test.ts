import { describe, expect, it } from 'vitest';
import { STRATOS_SYSTEMS, calculateFeasibility } from '../../../pages/stratos-v2';
import {
  DEFAULT_DECISION_EXPERIENCE_ID,
  createDecisionExperienceViewModel,
} from './presentation';

describe('decision experience presentation adapter', () => {
  it('defaults synchronously to the August 21 Target Canada decision', () => {
    const view = createDecisionExperienceViewModel();

    expect(view.id).toBe(DEFAULT_DECISION_EXPERIENCE_ID);
    expect(view.cutoff).toBe('2013-08-21');
    expect(view.currentCohort.metric).toEqual({ value: 68, unit: 'stores operating' });
    expect(view.requestedIncrement.metric).toEqual({ value: 56, unit: 'stores planned to open' });
    expect(view.verdict).toBe('FOG');
    expect(view.validatedScale.status).toBe('not-determined');
    expect(view.validatedScale.value).toBe('not-determined');
  });

  it('provides overview cards, paired actions, evidence, exposure, and comparison data', () => {
    const view = createDecisionExperienceViewModel();

    expect(view.cards.currentCohort).toEqual(view.currentCohort);
    expect(view.cards.requestedIncrement).toEqual(view.requestedIncrement);
    expect(view.cards.cadence.label).toContain('remaining cohort');
    expect(view.bindingDimensions).toEqual([]);
    expect(view.materialUnknowns).toContain('Documented readiness and release gates');
    expect(view.recommendations.map(({ plane, displayLabel }) => [plane, displayLabel])).toEqual([
      ['commitment', 'HOLD'],
      ['path', 'LEARN'],
    ]);
    expect(view.actualComparison.actualOperations).toHaveLength(2);
    expect(view.actualComparison.stratosOperations).toEqual(view.recommendations);
    expect(view.exposures.map(({ category }) => category)).toEqual([
      'storeActivation',
      'leases',
      'capitalRemodeling',
      'inventory',
      'people',
      'cash',
    ]);
    expect(view.evidence.length).toBeGreaterThan(0);
    expect(view.inspectionInputs.some(({ displayState }) => displayState === 'FOG')).toBe(true);
  });

  it('keeps timeline evidence cutoff-safe and hindsight structurally separate', () => {
    const view = createDecisionExperienceViewModel(viewId());

    expect(view.timeline.selectedId).toBe(view.id);
    expect(view.timeline.options).toEqual([
      expect.objectContaining({ id: view.id, knowledgeCutoff: '2013-08-21' }),
    ]);
    expect(view.evidence.every(({ publishedAt }) => publishedAt <= view.cutoff)).toBe(true);
    expect(view.evidence.every(({ displayState }) => displayState !== 'HINDSIGHT')).toBe(true);
    expect(view.hindsight).not.toHaveLength(0);
    expect(view.hindsight.every(({ displayState }) => displayState === 'HINDSIGHT')).toBe(true);
    expect(view.hindsight.every(({ publishedAt }) => publishedAt! > view.cutoff)).toBe(true);
  });

  it('keeps assumption labels persistent and produces deterministic fresh results', () => {
    const first = createDecisionExperienceViewModel();
    const second = createDecisionExperienceViewModel();

    expect(first.assumptions).not.toHaveLength(0);
    expect(first.assumptions.every(({ displayLabel }) => displayLabel === 'ASSUMPTION')).toBe(true);
    expect(first.constructs.every(({ displayLabel }) => displayLabel === 'ANALYTICAL')).toBe(true);
    expect(first.constructs.map(({ label }) => label)).toEqual(expect.arrayContaining([
      'T1: pilot/readiness review',
      'T2: 68-store scaling boundary',
      'Proposed readiness release gates',
    ]));
    expect(second).toEqual(first);
    expect(second).not.toBe(first);
    expect(second.evidence).not.toBe(first.evidence);
  });

  it('leaves the six-system feasibility model available and unchanged', () => {
    expect(STRATOS_SYSTEMS).toHaveLength(6);
    expect(calculateFeasibility(STRATOS_SYSTEMS[3], 12.8)).toEqual(expect.objectContaining({
      calendarPass: true,
      constraintPass: false,
    }));
  });

  it('rejects a timeline selection without an authored cutoff-safe packet', () => {
    expect(() => createDecisionExperienceViewModel('not-an-authored-decision')).toThrow(
      'Unknown decision experience selection',
    );
  });
});

function viewId(): string {
  return createDecisionExperienceViewModel().timeline.options[0].id;
}
