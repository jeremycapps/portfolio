import { describe, expect, it } from 'vitest';

import { validateDecisionPoint } from './evidence-integrity';
import { CALIBRATED_COMMITMENT_EXPERIENCES } from './fixtures';
import { createDecisionExperienceViewModel, decisionRecommendation } from './presentation';

const mcdonalds = CALIBRATED_COMMITMENT_EXPERIENCES.filter(({ profile }) => (
  profile.id === 'mcdonalds-ibm-aot-2021-2024'
));

describe("McDonald's × IBM AOT decision experience", () => {
  it('registers three valid cutoff-safe packets', () => {
    expect(mcdonalds.map(({ decisionPoint }) => decisionPoint.sequence)).toEqual(['T0', 'T1', 'T2']);
    for (const experience of mcdonalds) {
      expect(validateDecisionPoint(experience.decisionPoint, experience.profile)).toEqual([]);
    }
  });

  it('renders the intended warning arc through the shared presentation path', () => {
    expect(mcdonalds.map(({ decisionPoint }) => (
      createDecisionExperienceViewModel(decisionPoint.id).verdict
    ))).toEqual(['FOG', 'FOG', 'COLLISION']);
  });

  it('routes the terminal operational floor to the restaurant-operations owner', () => {
    const view = createDecisionExperienceViewModel('mcdonalds-ibm-aot-t2-2024-06-17');
    expect(view.cause.kind).toBe('risk-floor');
    expect(view.bindingDimensions).toEqual([]);
    expect(decisionRecommendation(view)).toMatchObject({
      verb: 'HOLD',
      owner: 'the restaurant-operations lead',
    });
  });

  it('exposes no cost figures because no AOT dollars were disclosed', () => {
    for (const { decisionPoint } of mcdonalds) {
      expect(createDecisionExperienceViewModel(decisionPoint.id).cost).toEqual([]);
    }
  });
});
