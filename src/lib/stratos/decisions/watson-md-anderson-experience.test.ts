import { describe, expect, it } from 'vitest';

import { validateDecisionPoint } from './evidence-integrity';
import { CALIBRATED_COMMITMENT_EXPERIENCES } from './fixtures';
import { createDecisionExperienceViewModel, decisionRecommendation } from './presentation';

const watson = CALIBRATED_COMMITMENT_EXPERIENCES.filter(({ profile }) => (
  profile.id === 'watson-md-anderson-2013-2017'
));

describe('Watson × MD Anderson decision experience', () => {
  it('registers three valid dated packets', () => {
    expect(watson.map(({ decisionPoint }) => decisionPoint.sequence)).toEqual(['T0', 'T1', 'T2']);
    for (const experience of watson) {
      expect(validateDecisionPoint(experience.decisionPoint, experience.profile)).toEqual([]);
    }
  });

  it('renders the intended verdict arc from the shared presentation path', () => {
    expect(watson.map(({ decisionPoint }) => (
      createDecisionExperienceViewModel(decisionPoint.id).verdict
    ))).toEqual(['FOG', 'FOG', 'COLLISION']);
  });

  it('exits on the terminal value floor without a fabricated capacity break', () => {
    const view = createDecisionExperienceViewModel('watson-md-anderson-t2-2017-02-19');
    expect(view.cause.kind).toBe('value-floor');
    expect(view.bindingDimensions).toEqual([]);
    expect(decisionRecommendation(view)).toMatchObject({ verb: 'EXIT' });
  });

  it('exposes the $51.4M commitment and $62.1M realized spend together', () => {
    const view = createDecisionExperienceViewModel('watson-md-anderson-t2-2017-02-19');
    expect(view.cost).toMatchObject([
      { kind: 'realized', usdMillions: 62.1135 },
      { kind: 'committed', usdMillions: 51.4 },
    ]);
  });
});
