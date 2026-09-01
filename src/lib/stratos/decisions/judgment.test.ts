import { describe, expect, it } from 'vitest';

import {
  CANONICAL_OPERATIONS,
  DISPLAY_ACTION_MACROS,
  serializeJudgmentResult,
  validateJudgmentResult,
  type JudgmentResult,
  type Operation,
  type OperationRecommendation,
  type RecommendationPlane,
} from './judgment';

const evidence = [{ sourceId: 'source-1', locator: 'section 2' }] as const;

function recommendation(
  plane: RecommendationPlane,
  operation: Operation = 'CHANGE',
): OperationRecommendation {
  return {
    plane,
    operation,
    object: plane === 'commitment' ? 'remaining rollout tranche' : 'rollout validation',
    parameters: { trancheSize: 12, analytical: true },
    displayLabel: operation === 'CHANGE' ? 'STAGE' : operation,
    authorizationReason: 'The requested action remains inside the stated limit.',
    owner: 'Operating lead',
    authorityStatus: 'inside-boundary',
    evidenceRefs: evidence,
    assumptionRefs: ['assumption-1'],
    boundary: {
      time: '30 days',
      expiryOrReturnCondition: 'Return at the next release review.',
    },
    gate: {
      conditions: ['Readiness evidence is documented.'],
      evidenceStatus: 'mixed',
    },
    reassessment: {
      trigger: 'At the next release review',
      ifImproving: 'Continue inside the validated tranche.',
      ifIneffective: 'Change the validation path.',
      ifBoundaryExhausted: 'Return the commitment decision to the owner.',
    },
    ...(operation === 'EXCEPTION'
      ? {
          exception: {
            violatedRule: 'No release before readiness review.',
            authorizer: 'Executive sponsor',
            expiry: '2026-10-01',
            returnCondition: 'Resume the standard release gate.',
          },
        }
      : {}),
    ...(operation === 'ESCALATE'
      ? {
          escalation: {
            unresolvedDecision: 'Whether to authorize the next tranche.',
            authorityRequired: 'Investment committee',
          },
        }
      : {}),
  };
}

function result(
  commitmentOperation: Operation = 'CHANGE',
  pathOperation: Operation = 'START',
): JudgmentResult {
  return {
    verdict: 'FOG',
    validatedScale: 'Current 68-store cohort only',
    bindingDimensions: ['operating readiness'],
    materialUnknowns: ['Inventory accuracy at the requested scale'],
    cause: {
      kind: 'material-uncertainty',
      summary: 'A material readiness input is unknown.',
      evidenceRefs: evidence,
    },
    recommendations: [
      recommendation('commitment', commitmentOperation),
      recommendation('path', pathOperation),
    ],
    nextSafeCommitment: {
      status: 'not-determined',
      description: 'Determine a bounded tranche after the validation gate.',
      evidenceRefs: evidence,
      assumptionRefs: ['assumption-1'],
    },
    evidenceRefs: evidence,
    assumptionRefs: ['assumption-1'],
  };
}

function mutableCopy(value: JudgmentResult): Record<string, any> {
  return structuredClone(value) as Record<string, any>;
}

describe('judgment operation contract', () => {
  it.each(CANONICAL_OPERATIONS)('accepts %s as a canonical operation', (operation) => {
    const candidate = result(operation, operation);
    expect(validateJudgmentResult(candidate)).toEqual([]);
  });

  it.each(DISPLAY_ACTION_MACROS)('rejects display macro %s as a top-level operation', (macro) => {
    const candidate = mutableCopy(result());
    candidate.recommendations[0].operation = macro;
    expect(validateJudgmentResult(candidate)).toContainEqual(expect.objectContaining({
      path: 'recommendations.0.operation',
    }));
  });

  it.each([
    ['fewer than two', [recommendation('commitment')]],
    ['more than two', [recommendation('commitment'), recommendation('path'), recommendation('path')]],
  ])('rejects %s recommendations', (_label, recommendations) => {
    const candidate = mutableCopy(result());
    candidate.recommendations = recommendations;
    expect(validateJudgmentResult(candidate)).toContainEqual({
      path: 'recommendations',
      message: 'Exactly two recommendations are required.',
    });
  });

  it.each([
    ['duplicate commitment planes', ['commitment', 'commitment']],
    ['duplicate path planes', ['path', 'path']],
    ['reversed planes', ['path', 'commitment']],
    ['missing commitment plane', ['unknown', 'path']],
    ['missing path plane', ['commitment', 'unknown']],
  ])('rejects %s', (_label, planes) => {
    const candidate = mutableCopy(result());
    candidate.recommendations[0].plane = planes[0];
    candidate.recommendations[1].plane = planes[1];
    expect(validateJudgmentResult(candidate).some((issue) => issue.path.endsWith('.plane'))).toBe(true);
  });

  it.each([
    ['object', 'object'],
    ['owner', 'owner'],
    ['authority status', 'authorityStatus'],
    ['authorization reason', 'authorizationReason'],
    ['boundary', 'boundary'],
    ['gate', 'gate'],
    ['reassessment rule', 'reassessment'],
  ])('rejects an operation without its %s', (_label, field) => {
    const candidate = mutableCopy(result());
    delete candidate.recommendations[0][field];
    expect(validateJudgmentResult(candidate).some((issue) => (
      issue.path.startsWith(`recommendations.0.${field}`)
    ))).toBe(true);
  });

  it('rejects a path without a concrete time, finance, exposure, or attempt limit', () => {
    const candidate = mutableCopy(result());
    candidate.recommendations[1].boundary = {
      expiryOrReturnCondition: 'Return when someone decides the work is complete.',
    };
    expect(validateJudgmentResult(candidate)).toContainEqual(expect.objectContaining({
      path: 'recommendations.1.boundary',
      message: expect.stringContaining('limit'),
    }));
  });

  it('rejects FOG without a material unknown', () => {
    const candidate = mutableCopy(result());
    candidate.materialUnknowns = [];
    expect(validateJudgmentResult(candidate)).toContainEqual(expect.objectContaining({
      path: 'materialUnknowns',
      message: expect.stringContaining('FOG'),
    }));
  });

  it.each(['violatedRule', 'authorizer', 'expiry', 'returnCondition']) (
    'rejects EXCEPTION without %s',
    (field) => {
      const candidate = mutableCopy(result('EXCEPTION'));
      delete candidate.recommendations[0].exception[field];
      expect(validateJudgmentResult(candidate)).toContainEqual(expect.objectContaining({
        path: `recommendations.0.exception.${field}`,
      }));
    },
  );

  it.each(['unresolvedDecision', 'authorityRequired'])(
    'rejects ESCALATE without %s',
    (field) => {
      const candidate = mutableCopy(result('ESCALATE'));
      delete candidate.recommendations[0].escalation[field];
      expect(validateJudgmentResult(candidate)).toContainEqual(expect.objectContaining({
        path: `recommendations.0.escalation.${field}`,
      }));
    },
  );

  it('serializes a valid result with commitment first and path second', () => {
    const serialized = serializeJudgmentResult(result());
    const parsed = JSON.parse(serialized) as JudgmentResult;
    expect(parsed.recommendations.map(({ plane }) => plane)).toEqual(['commitment', 'path']);
  });
});

