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
      'scopeActivation',
      'contracts',
      'capital',
      'inventory',
      'people',
      'cash',
    ]);
    expect(view.evidence.length).toBeGreaterThan(0);
    expect(view.inspectionInputs.some(({ displayState }) => displayState === 'FOG')).toBe(true);
  });

  it('offers authored Target, Adobe, Domino’s, Ford, and VA packets', () => {
    const view = createDecisionExperienceViewModel();

    expect(view.timeline.options).toHaveLength(7);
    expect(view.timeline.options.map(({ id }) => id)).toEqual([
      'target-canada-t0-2012-07-12',
      'target-canada-t2-2013-08-21',
      'adobe-creative-cloud-t0-2013-01-22',
      'dominos-growth-t0-2019-02-21',
      'ford-model-e-t0-2022-07-21',
      'va-ehr-t1-2020-10-24',
      'va-ehr-t3-2023-04-21',
    ]);
    expect(new Set(view.timeline.options.map(({ companyName }) => companyName)).size).toBe(5);
  });

  it('carries two dated decisions for the one case that has them', () => {
    const va = createDecisionExperienceViewModel().timeline.options
      .filter(({ companyName }) => companyName.includes('Veterans Affairs'));

    expect(va.map(({ sequence }) => sequence)).toEqual(['T1', 'T3']);
    expect(va.map(({ knowledgeCutoff }) => knowledgeCutoff)).toEqual(['2020-10-24', '2023-04-21']);
  });

  it('keeps every authored selection cutoff-safe and hindsight structurally separate', () => {
    const options = createDecisionExperienceViewModel().timeline.options;

    for (const option of options) {
      const view = createDecisionExperienceViewModel(option.id);
      expect(view.timeline.selectedId).toBe(view.id);
      expect(view.evidence.every(({ publishedAt }) => publishedAt <= view.cutoff)).toBe(true);
      expect(view.evidence.every(({ displayState }) => displayState !== 'HINDSIGHT')).toBe(true);
      expect(view.hindsight).not.toHaveLength(0);
      expect(view.hindsight.every(({ displayState }) => displayState === 'HINDSIGHT')).toBe(true);
      expect(view.hindsight.every(({ publishedAt }) => publishedAt! > view.cutoff)).toBe(true);
      expect(['FIT', 'FOG', 'COLLISION']).toContain(view.verdict);
      expect(view.recommendations.map(({ plane }) => plane)).toEqual(['commitment', 'path']);
    }
  });

  it('does not return the same verdict for every authored decision', () => {
    // Every commitment-date packet reads FOG, so uniformity held until a case
    // was scored at a release date. VA's first production release is the one
    // decision in the library where the evidence is adverse rather than absent.
    const verdicts = createDecisionExperienceViewModel().timeline.options
      .map((option) => createDecisionExperienceViewModel(option.id))
      .map(({ id, verdict }) => [id, verdict]);

    expect(Object.fromEntries(verdicts)).toMatchObject({
      'target-canada-t0-2012-07-12': 'FOG',
      'va-ehr-t1-2020-10-24': 'COLLISION',
      'va-ehr-t3-2023-04-21': 'FOG',
    });
    expect(new Set(verdicts.map(([, verdict]) => verdict)).size).toBeGreaterThan(1);
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

describe('tension poles', () => {
  it('places poles for a decision whose case carries a scorecard', () => {
    const view = createDecisionExperienceViewModel('target-canada-t0-2012-07-12');

    expect(view.tensions).toBeDefined();
    expect(view.tensions).toHaveLength(6);

    const discernment = view.tensions!.find(({ id }) => id === 'discernment');
    expect(discernment).toMatchObject({
      name: 'Discernment',
      leftLabel: 'Structured conviction',
      rightLabel: 'Open inquiry',
    });
    // A negative position selects the left pole.
    expect(discernment!.position).toBeLessThan(0);
    expect(discernment).toMatchObject({ side: 'l', poleLabel: 'Structured conviction' });
  });

  it('omits poles rather than inventing them when no scorecard places the tensions', () => {
    // A case scored per release date has no scorecard spanning its dates, and a
    // later decision must not borrow the commitment date's placement.
    for (const id of ['target-canada-t2-2013-08-21', 'va-ehr-t1-2020-10-24', 'va-ehr-t3-2023-04-21']) {
      expect(createDecisionExperienceViewModel(id).tensions, id).toBeUndefined();
    }
  });

  it('still renders every other part of a decision that has no poles', () => {
    const va = createDecisionExperienceViewModel('va-ehr-t1-2020-10-24');

    expect(va.tensions).toBeUndefined();
    expect(va.verdict).toBe('COLLISION');
    expect(va.inspectionInputs.length).toBeGreaterThan(0);
    expect(va.hindsight.length).toBeGreaterThan(0);
    expect(va.recommendations).toHaveLength(2);
  });

  it('leaves the pole label off a neutral placement instead of picking a side', () => {
    const view = createDecisionExperienceViewModel('target-canada-t0-2012-07-12');
    for (const tension of view.tensions!) {
      if (tension.side === 'neutral') expect(tension.poleLabel).toBeUndefined();
      else expect(tension.poleLabel).toBeTruthy();
    }
  });
});

describe('judgment cause', () => {
  it('names why a verdict landed, not just what it was', () => {
    const va = createDecisionExperienceViewModel('va-ehr-t1-2020-10-24');

    expect(va.verdict).toBe('COLLISION');
    expect(va.cause).toMatchObject({ kind: 'risk-floor', displayLabel: 'RISK FLOOR' });
    expect(va.cause.summary).toContain('infrastructure');
  });

  it('separates a floor breach from a capacity collision under the same verdict', () => {
    // The display vocabulary has three verdicts and the review has four
    // outcomes, so FLOOR arrives as COLLISION. The cause is what keeps them
    // distinguishable: a breached precondition is not an oversized increment.
    const va = createDecisionExperienceViewModel('va-ehr-t1-2020-10-24');

    expect(va.verdict).toBe('COLLISION');
    expect(va.cause.kind).not.toBe('capacity');
    expect(va.bindingDimensions).toEqual(['people']);
  });

  it('reports material uncertainty for a decision that stalls on absent evidence', () => {
    for (const id of ['target-canada-t2-2013-08-21', 'va-ehr-t3-2023-04-21']) {
      const view = createDecisionExperienceViewModel(id);
      expect(view.verdict, id).toBe('FOG');
      expect(view.cause.kind, id).toBe('material-uncertainty');
      expect(view.cause.displayLabel, id).toBe('MATERIAL UNCERTAINTY');
    }
  });

  it('resolves the cause evidence to titled, dated sources', () => {
    const view = createDecisionExperienceViewModel('va-ehr-t1-2020-10-24');

    expect(view.cause.evidence.length).toBeGreaterThan(0);
    for (const ref of view.cause.evidence) {
      expect(ref.sourceTitle).toBeTruthy();
      expect(ref.locator).toBeTruthy();
      expect(ref.publishedAt <= view.cutoff).toBe(true);
    }
  });

  it('carries a cause on every authored decision', () => {
    for (const option of createDecisionExperienceViewModel().timeline.options) {
      const view = createDecisionExperienceViewModel(option.id);
      expect(view.cause.summary.trim(), option.id).not.toBe('');
      expect(view.cause.displayLabel, option.id).toMatch(/^[A-Z ]+$/);
    }
  });
});
