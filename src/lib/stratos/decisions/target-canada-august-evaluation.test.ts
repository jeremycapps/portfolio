import { describe, expect, it } from 'vitest';

import { EXPOSURE_CATEGORIES } from './decision-point';
import { validateJudgmentResult } from './judgment';
import {
  TARGET_CANADA_AUGUST_2013_ASSESSMENT,
  TARGET_CANADA_AUGUST_2013_COMPARISON,
  TARGET_CANADA_AUGUST_2013_EXPOSURE_COMPARISON,
  TARGET_CANADA_AUGUST_2013_JUDGMENT,
  TARGET_CANADA_AUGUST_2013_RECOMMENDATIONS,
} from './target-canada-august-evaluation';

describe('Target Canada bounded August judgment', () => {
  it('reuses the engine to produce exact ordered CHANGE recommendations under FOG', () => {
    expect(TARGET_CANADA_AUGUST_2013_ASSESSMENT.verdict).toBe('FOG');
    expect(TARGET_CANADA_AUGUST_2013_RECOMMENDATIONS).toMatchObject([
      { plane: 'commitment', operation: 'CHANGE', displayLabel: 'HOLD' },
      { plane: 'path', operation: 'CHANGE', displayLabel: 'LEARN' },
    ]);
    expect(TARGET_CANADA_AUGUST_2013_JUDGMENT.recommendations)
      .toBe(TARGET_CANADA_AUGUST_2013_RECOMMENDATIONS);
    expect(validateJudgmentResult(TARGET_CANADA_AUGUST_2013_JUDGMENT)).toEqual([]);
  });

  it('bounds both operations with analytical gates and reassessment behavior', () => {
    for (const recommendation of TARGET_CANADA_AUGUST_2013_RECOMMENDATIONS) {
      expect(recommendation.boundary.time).toContain('2013-12-31');
      expect(recommendation.boundary.expiryOrReturnCondition).toBeTruthy();
      expect(recommendation.gate).toMatchObject({ evidenceStatus: 'analytical' });
      expect(recommendation.gate.conditions.length).toBeGreaterThan(0);
      expect(Object.values(recommendation.reassessment).every(Boolean)).toBe(true);
      expect(recommendation.assumptionRefs.length).toBeGreaterThan(0);
    }
    expect(TARGET_CANADA_AUGUST_2013_RECOMMENDATIONS[1].parameters).toMatchObject({
      stagedTrancheQuantity: 'not-determined',
      proposedGateProvenance: 'analytical',
    });
  });

  it('keeps all exposure categories separate and statused', () => {
    expect(Object.keys(TARGET_CANADA_AUGUST_2013_EXPOSURE_COMPARISON).sort())
      .toEqual([...EXPOSURE_CATEGORIES].sort());
    for (const category of EXPOSURE_CATEGORIES) {
      const comparison = TARGET_CANADA_AUGUST_2013_EXPOSURE_COMPARISON[category];
      expect(comparison.category).toBe(category);
      expect(['OBSERVED', 'ESTIMATED', 'FOG']).toContain(comparison.actualIntent.status);
      expect(['OBSERVED', 'ESTIMATED', 'FOG']).toContain(comparison.stratosScenario.status);
    }
    expect(TARGET_CANADA_AUGUST_2013_EXPOSURE_COMPARISON.storeActivation.stratosScenario)
      .toMatchObject({
        status: 'ESTIMATED',
        metric: { low: 0, high: 56, unit: 'store activations not released before reassessment' },
        calculation: expect.stringContaining('maximum scenario bound of 56'),
        assumption: expect.stringContaining('not a documented Target action'),
      });
    for (const category of EXPOSURE_CATEGORIES.filter((item) => item !== 'storeActivation')) {
      expect(TARGET_CANADA_AUGUST_2013_EXPOSURE_COMPARISON[category].stratosScenario.status).toBe('FOG');
    }
  });

  it('limits the comparison interval and avoids causal or obligation-avoidability claims', () => {
    expect(TARGET_CANADA_AUGUST_2013_COMPARISON.period).toMatchObject({
      startsAt: '2013-08-21',
      endsAt: '2013-12-31',
    });
    expect(TARGET_CANADA_AUGUST_2013_COMPARISON.period.endBasis).toContain('earlier release decision');
    const output = JSON.stringify(TARGET_CANADA_AUGUST_2013_COMPARISON);
    expect(output).toContain('does not claim that the alternative would have made Target Canada succeed');
    expect(output).toContain('does not claim that every unreleased obligation was avoidable');
    expect(output).not.toMatch(/would have succeeded|would succeed|all obligations were avoidable/i);
  });

  it('keeps post-August evidence out of verdict and recommendation evidence', () => {
    const datedOutput = JSON.stringify({
      assessment: TARGET_CANADA_AUGUST_2013_ASSESSMENT,
      judgment: TARGET_CANADA_AUGUST_2013_JUDGMENT,
    });
    expect(datedOutput).not.toMatch(/target-q3-results-2013|target-results-2013|target-exit-2015|target-results-2014/);
    expect(datedOutput).not.toMatch(/2013-11-21|2014-02-26|2015-01-15|2015-02-25/);
  });
});
