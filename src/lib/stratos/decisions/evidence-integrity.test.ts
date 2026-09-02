import { describe, expect, it } from 'vitest';

import { TARGET_CANADA } from '../cases';
import type { DecisionInput, DecisionPoint } from './decision-point';
import { admitInput } from './decision-point';
import { resolveDecisionPoint, validateDecisionPoint } from './evidence-integrity';
import { TARGET_CANADA_AUGUST_2013_DECISION_POINT } from './fixtures/target-canada-august-2013';

const CUTOFF = '2013-08-21';

describe('admitInput', () => {
  it('keeps the authored epistemic state when the source predates the cutoff', () => {
    expect(admitInput('OBSERVED', '2013-08-21', CUTOFF)).toBe('OBSERVED');
    expect(admitInput('ESTIMATED', '2013-01-02', CUTOFF)).toBe('ESTIMATED');
  });

  it('derives HINDSIGHT when the source postdates the cutoff', () => {
    expect(admitInput('OBSERVED', '2014-02-26', CUTOFF)).toBe('HINDSIGHT');
    expect(admitInput('ESTIMATED', '2015-01-15', CUTOFF)).toBe('HINDSIGHT');
  });

  it('treats an unplaceable input as FOG at every cutoff, since it cites nothing to postdate it', () => {
    expect(admitInput('FOG', undefined, CUTOFF)).toBe('FOG');
    expect(admitInput('FOG', '2015-01-15', CUTOFF)).toBe('FOG');
  });

  it('leaves an input without a publication date at its authored state', () => {
    expect(admitInput('OBSERVED', undefined, CUTOFF)).toBe('OBSERVED');
  });

  it('reads the same claim differently at two cutoffs, which is the point', () => {
    const publishedAt = '2014-02-26';
    expect(admitInput('OBSERVED', publishedAt, '2013-08-21')).toBe('HINDSIGHT');
    expect(admitInput('OBSERVED', publishedAt, '2014-06-30')).toBe('OBSERVED');
  });
});

describe('decision packet admission', () => {
  it('derives a display state for every resolved input', () => {
    const packet = resolveDecisionPoint(TARGET_CANADA_AUGUST_2013_DECISION_POINT, TARGET_CANADA);

    expect(packet.contemporaneousInputs.every((input) => input.displayState !== 'HINDSIGHT')).toBe(true);
    expect(packet.hindsightInputs.every((input) => input.displayState === 'HINDSIGHT')).toBe(true);
    expect(packet.hindsightInputs.map(({ id }) => id)).toContain('full-year-outcome-hindsight');
  });

  it('resolves publishedAt from the cited source when the input omits it', () => {
    const packet = resolveDecisionPoint(TARGET_CANADA_AUGUST_2013_DECISION_POINT, TARGET_CANADA);
    const exitOutcome = packet.hindsightInputs.find(({ id }) => id === 'exit-outcome-hindsight');

    expect(exitOutcome).toMatchObject({ publishedAt: '2015-01-15', displayState: 'HINDSIGHT' });
  });
});

describe('cutoff integrity', () => {
  const withInput = (input: DecisionInput): DecisionPoint => ({
    ...TARGET_CANADA_AUGUST_2013_DECISION_POINT,
    materialUnknowns: [...TARGET_CANADA_AUGUST_2013_DECISION_POINT.materialUnknowns, input],
  });

  it('refuses a contemporaneous input whose source postdates the cutoff', () => {
    const leaked = withInput({
      id: 'leaked-input',
      label: 'A later result smuggled into the contemporaneous packet',
      epistemicState: 'OBSERVED',
      materiality: 'material',
      factRef: 'canada-ebit-2013',
      evidence: { sourceId: 'target-results-2013', locator: 'Canadian Segment Results' },
      assumptionRefs: [],
    });

    expect(validateDecisionPoint(leaked, TARGET_CANADA)).toContainEqual(
      expect.objectContaining({
        code: 'FND-02',
        message: expect.stringContaining('belongs in the hindsight layer'),
      }),
    );
  });

  it('refuses a hindsight input whose source predates the cutoff', () => {
    const demoted: DecisionPoint = {
      ...TARGET_CANADA_AUGUST_2013_DECISION_POINT,
      hindsight: [
        ...TARGET_CANADA_AUGUST_2013_DECISION_POINT.hindsight,
        {
          id: 'needlessly-demoted',
          label: 'Admissible evidence parked in the hindsight layer',
          epistemicState: 'OBSERVED',
          materiality: 'context',
          factRef: 'canada-stores-operating-q2',
          evidence: { sourceId: 'target-q2-results-2013', locator: 'Release highlights, Canadian store openings' },
          assumptionRefs: [],
        },
      ],
    };

    expect(validateDecisionPoint(demoted, TARGET_CANADA)).toContainEqual(
      expect.objectContaining({
        code: 'FND-02',
        message: expect.stringContaining('was admissible at'),
      }),
    );
  });

  it('still requires a visible calculation for an estimated input', () => {
    const uncalculated = withInput({
      id: 'uncalculated-estimate',
      label: 'An estimate with no shown work',
      epistemicState: 'ESTIMATED',
      materiality: 'material',
      assumptionRefs: [],
    });

    expect(validateDecisionPoint(uncalculated, TARGET_CANADA)).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('visible calculation') }),
    );
  });

  it('still refuses a FOG input that carries a placed metric', () => {
    const placed = withInput({
      id: 'placed-fog',
      label: 'A FOG input pretending to be placed',
      epistemicState: 'FOG',
      materiality: 'material',
      metric: { value: 12, unit: 'stores' },
      assumptionRefs: [],
    });

    expect(validateDecisionPoint(placed, TARGET_CANADA)).toContainEqual(
      expect.objectContaining({ message: expect.stringContaining('must remain unplaced') }),
    );
  });
});
