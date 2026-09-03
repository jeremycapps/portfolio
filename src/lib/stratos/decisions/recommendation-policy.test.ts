import { describe, expect, it } from 'vitest';

import { compileMacroOperation, type FamiliarMacro } from '../judgment/contract';
import { validateRecommendationPair, type JudgmentVerdict } from './judgment';
import {
  generateRecommendations,
  type RecommendationAuthoring,
  type RecommendationPolicyInput,
} from './recommendation-policy';
import { VALIDATED_SCALE_NOT_DETERMINED, type VerdictMappingResult } from './verdict-adapter';

const evidence = [{ sourceId: 'decision-packet', locator: 'release review' }] as const;

function assessment(
  verdict: JudgmentVerdict,
  validatedScale = verdict === 'FIT' ? '12-store release cohort' : VALIDATED_SCALE_NOT_DETERMINED,
): VerdictMappingResult {
  return {
    verdict,
    validatedScale,
    bindingDimensions: verdict === 'COLLISION' ? ['time', 'finance'] : [],
    materialUnknowns: verdict === 'FOG' ? ['Inventory readiness'] : [],
    cause: {
      kind: verdict === 'FIT' ? 'fit' : verdict === 'FOG' ? 'material-uncertainty' : 'capacity',
      summary: `${verdict} cause`,
      evidenceRefs: evidence,
    },
  };
}

function authoring(object: string): RecommendationAuthoring {
  return {
    object,
    owner: 'Operating lead',
    authorityStatus: 'inside-boundary',
    authorizationReason: 'The operation follows the documented decision boundary.',
    evidenceRefs: evidence,
    assumptionRefs: ['assumption-1'],
    boundary: {
      time: '30 days',
      exposure: 'No more than one release cohort',
      expiryOrReturnCondition: 'Return at the next release review.',
    },
    gate: {
      conditions: ['The release evidence is documented.'],
      evidenceStatus: 'mixed',
    },
    reassessment: {
      trigger: 'At the next release review',
      ifImproving: 'Continue inside the current boundary.',
      ifIneffective: 'Change the path.',
      ifBoundaryExhausted: 'Return the decision to its owner.',
    },
  };
}

function input(verdict: JudgmentVerdict): RecommendationPolicyInput {
  return {
    assessment: assessment(verdict),
    irreversibility: 'medium',
    commitmentState: 'active',
    requestedScale: '56-store rollout',
    smallerScale: '12-store release cohort',
    pathState: 'missing',
    commitment: authoring('remaining rollout tranche'),
    path: authoring('rollout validation path'),
  };
}

describe('bounded recommendation policy', () => {
  it.each([
    ['FOG', 'high', 'missing', 'HOLD', 'LEARN'],
    ['FOG', 'low', 'ineffective', 'STAGE', 'LEARN'],
    ['COLLISION', 'medium', 'missing', 'STAGE', 'ADD'],
    ['COLLISION', 'medium', 'ineffective', 'STAGE', 'REDESIGN'],
  ] as const)(
    'reuses the macro compiler for %s/%s recommendations',
    (verdict, irreversibility, pathState, commitmentMacro, pathMacro) => {
      const recommendations = generateRecommendations({
        ...input(verdict),
        irreversibility,
        pathState,
      });
      const expectedOperation = (macro: FamiliarMacro, existingPath: boolean) =>
        compileMacroOperation(macro, { existingPath });

      expect(recommendations[0]).toMatchObject({
        displayLabel: commitmentMacro,
        operation: expectedOperation(commitmentMacro, false),
      });
      expect(recommendations[1]).toMatchObject({
        displayLabel: pathMacro,
        operation: expectedOperation(pathMacro, pathState === 'ineffective'),
      });
    },
  );

  it.each([
    ['not-started', 'START', 'START'],
    ['active', 'CONTINUE', 'ADVANCE'],
  ] as const)('bounds FIT for a %s commitment at evidenced scale', (state, operation, displayLabel) => {
    const candidate = { ...input('FIT'), commitmentState: state };
    const recommendations = generateRecommendations(candidate);

    expect(recommendations[0]).toMatchObject({
      plane: 'commitment',
      operation,
      displayLabel,
      parameters: { authorizedScale: '12-store release cohort' },
    });
    expect(recommendations[0].parameters).not.toHaveProperty('authorizedScale', '56-store rollout');
    expect(recommendations[1]).toMatchObject({
      plane: 'path',
      operation: 'START',
      parameters: { purpose: 'assurance' },
    });
    expect(validateRecommendationPair(recommendations)).toEqual([]);
  });

  it('rejects FIT without an evidenced validated scale', () => {
    expect(() => generateRecommendations({
      ...input('FIT'),
      assessment: assessment('FIT', VALIDATED_SCALE_NOT_DETERMINED),
    })).toThrow('FIT requires an evidenced validated scale');
  });

  it('holds a highly irreversible FOG commitment and starts bounded learning', () => {
    const recommendations = generateRecommendations({ ...input('FOG'), irreversibility: 'high' });
    expect(recommendations).toMatchObject([
      {
        plane: 'commitment',
        operation: 'CHANGE',
        displayLabel: 'HOLD',
        parameters: { releaseRate: 0 },
      },
      {
        plane: 'path',
        operation: 'START',
        displayLabel: 'LEARN',
        parameters: { purpose: 'uncertainty-resolution' },
      },
    ]);
  });

  it('allows only an explicitly smaller bounded experiment for low-irreversibility FOG', () => {
    const recommendations = generateRecommendations({ ...input('FOG'), irreversibility: 'low' });
    expect(recommendations[0]).toMatchObject({
      operation: 'CHANGE',
      displayLabel: 'STAGE',
      parameters: { authorizedScale: '12-store release cohort', experiment: true },
    });
    expect(recommendations[0].parameters).not.toContain('56-store rollout');
  });

  it('rejects a purported experiment equal to the unresolved full increment', () => {
    expect(() => generateRecommendations({
      ...input('FOG'),
      irreversibility: 'low',
      smallerScale: '56-store rollout',
    })).toThrow('must be smaller');
  });

  it('changes a repairable collision and starts corrective remediation', () => {
    const recommendations = generateRecommendations(input('COLLISION'));
    expect(recommendations).toMatchObject([
      {
        plane: 'commitment',
        operation: 'CHANGE',
        parameters: { authorizedScale: '12-store release cohort' },
      },
      { plane: 'path', operation: 'START', parameters: { purpose: 'remediation' } },
    ]);
    expect(recommendations.some(({ operation }) => operation === 'END')).toBe(false);
  });

  it('holds a repairable collision when no smaller safe scale is supplied', () => {
    const recommendations = generateRecommendations({ ...input('COLLISION'), smallerScale: undefined });
    expect(recommendations[0]).toMatchObject({
      operation: 'CHANGE',
      displayLabel: 'HOLD',
      parameters: { releaseRate: 0 },
    });
  });

  it('does not let authored parameters override a policy scale boundary', () => {
    const recommendations = generateRecommendations({
      ...input('FOG'),
      irreversibility: 'low',
      commitment: {
        ...authoring('remaining rollout tranche'),
        parameters: { authorizedScale: '56-store rollout', experiment: false },
      },
    });
    expect(recommendations[0].parameters).toMatchObject({
      authorizedScale: '12-store release cohort',
      experiment: true,
    });
  });

  it.each([
    'value-breach',
    'intolerable-risk',
    'unrepairable-collision',
    'exhausted-learning',
    'recovery-cost-exceeds-value',
  ] as const)('ends a commitment only for documented terminal condition %s', (terminalCondition) => {
    const recommendations = generateRecommendations({
      ...input('COLLISION'),
      terminalCondition,
      pathState: terminalCondition === 'exhausted-learning' ? 'exhausted' : 'ineffective',
    });
    expect(recommendations[0]).toMatchObject({
      operation: 'END',
      parameters: { terminalCondition },
    });
    if (terminalCondition === 'exhausted-learning') {
      expect(recommendations[1].operation).toBe('END');
    }
  });

  it.each([
    ['converging', 'CONTINUE'],
    ['ineffective', 'CHANGE'],
    ['exhausted', 'CHANGE'],
  ] as const)('responds to an existing %s FIT path with %s', (pathState, operation) => {
    const recommendations = generateRecommendations({ ...input('FIT'), pathState });
    expect(recommendations[1].operation).toBe(operation);
  });

  it.each(['commitment', 'path'] as const)('applies authority overrun last on the %s plane', (plane) => {
    const recommendations = generateRecommendations({
      ...input('COLLISION'),
      authorityOverrun: {
        plane,
        unresolvedDecision: 'Whether to authorize the next release.',
        authorityRequired: 'Investment committee',
      },
    });
    const escalated = recommendations[plane === 'commitment' ? 0 : 1];
    expect(escalated).toMatchObject({
      plane,
      operation: 'ESCALATE',
      displayLabel: 'ROUTE_BACK',
      escalation: {
        unresolvedDecision: 'Whether to authorize the next release.',
        authorityRequired: 'Investment committee',
      },
    });
    expect(validateRecommendationPair(recommendations)).toEqual([]);
  });

  it('fails closed when supplied operation context is unbounded', () => {
    const unboundedPath = {
      ...authoring('rollout validation path'),
      boundary: { expiryOrReturnCondition: 'When complete.' },
    };
    expect(() => generateRecommendations({ ...input('FOG'), path: unboundedPath })).toThrow(
      'recommendations.1.boundary',
    );
  });

  it('returns deep-equal ordered recommendations for identical inputs', () => {
    const stableInput = input('COLLISION');
    const first = generateRecommendations(stableInput);
    const second = generateRecommendations(stableInput);
    expect(first).toEqual(second);
    expect(first.map(({ plane }) => plane)).toEqual(['commitment', 'path']);
  });
});
