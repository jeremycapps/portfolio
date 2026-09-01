import { describe, expect, it } from 'vitest';
import {
  authorizeCommitment,
  CANONICAL_OPERATIONS,
  compileMacro,
  validateEvaluation,
  type CommitmentJudgmentInput,
} from './contract';
import { ILLUSTRATIVE_TARGET_EVALUATION, ILLUSTRATIVE_TARGET_INPUT } from './illustrative-target';

describe('StratOS commitment judgment contract', () => {
  it('uses one six-operation grammar for both recommendation planes', () => {
    expect(CANONICAL_OPERATIONS).toEqual([
      'START', 'END', 'CONTINUE', 'CHANGE', 'EXCEPTION', 'ESCALATE',
    ]);
    expect(ILLUSTRATIVE_TARGET_EVALUATION.recommendations.commitment).toMatchObject({
      plane: 'commitment',
      operation: 'CHANGE',
      object: 'store_release',
      parameters: { release_rate: 0 },
      displayMacro: 'HOLD',
    });
    expect(ILLUSTRATIVE_TARGET_EVALUATION.recommendations.path).toMatchObject({
      plane: 'path',
      operation: 'CHANGE',
      object: 'rollout_configuration',
      parameters: { next_form: 'bounded operating cohort' },
      displayMacro: 'REDESIGN',
    });
  });

  it('selects the Target fixture collision without letting non-material fog override it', () => {
    expect(ILLUSTRATIVE_TARGET_EVALUATION.verdict).toEqual({
      overall: 'COLLISION',
      bindingDimensions: ['operations', 'learning_time'],
      cause: expect.stringContaining('requested release rate'),
    });
    expect(validateEvaluation(ILLUSTRATIVE_TARGET_EVALUATION)).toEqual([]);
  });

  it('turns only material uncertainty into a blocking FOG verdict', () => {
    const fogInput: CommitmentJudgmentInput = {
      ...ILLUSTRATIVE_TARGET_INPUT,
      dimensions: ILLUSTRATIVE_TARGET_INPUT.dimensions.map((dimension) => ({
        ...dimension,
        verdict: 'FOG',
        material: dimension.dimension === 'operations',
      })),
      pathState: 'missing',
      pathPolicy: {
        ...ILLUSTRATIVE_TARGET_INPUT.pathPolicy,
        options: {
          ...ILLUSTRATIVE_TARGET_INPUT.pathPolicy.options,
          START: {
            object: 'readiness_validation',
            parameters: { metric: 'inventory_accuracy' },
            label: 'Start bounded validation',
            authorization: 'The material unknown can change the release decision.',
            owner: 'Operations lead',
            displayMacro: 'LEARN',
          },
        },
      },
    };
    const evaluation = authorizeCommitment(fogInput);

    expect(evaluation.verdict).toMatchObject({ overall: 'FOG', bindingDimensions: ['operations'] });
    expect(evaluation.recommendations.commitment.operation).toBe('CHANGE');
    expect(evaluation.recommendations.path.operation).toBe('START');
  });

  it('compiles familiar interface terms instead of adding top-level verbs', () => {
    expect(compileMacro('HOLD')).toMatchObject({
      plane: 'commitment', operation: 'CHANGE', parameters: { release_rate: 0 },
    });
    expect(compileMacro('LEARN')).toMatchObject({ plane: 'path', operation: 'START' });
    expect(compileMacro('LEARN', { existingPath: true })).toMatchObject({ plane: 'path', operation: 'CHANGE' });
    expect(compileMacro('ROUTE_BACK', { ownershipResolved: false })).toMatchObject({
      plane: 'path', operation: 'ESCALATE', object: 'ownership',
    });
  });

  it('escalates only the plane whose required operation exceeds current authority', () => {
    const evaluation = authorizeCommitment({
      ...ILLUSTRATIVE_TARGET_INPUT,
      commitmentPolicy: { ...ILLUSTRATIVE_TARGET_INPUT.commitmentPolicy, hasAuthority: false },
    });

    expect(evaluation.recommendations.commitment.operation).toBe('ESCALATE');
    expect(evaluation.recommendations.path.operation).toBe('CHANGE');
    expect(validateEvaluation(evaluation)).toEqual([]);
  });

  it('requires every FIT result to name its validated scale', () => {
    const evaluation = authorizeCommitment({
      ...ILLUSTRATIVE_TARGET_INPUT,
      dimensions: ILLUSTRATIVE_TARGET_INPUT.dimensions.map((dimension) => ({
        ...dimension,
        verdict: 'FIT',
        material: false,
      })),
      commitmentPolicy: {
        ...ILLUSTRATIVE_TARGET_INPUT.commitmentPolicy,
        options: {
          ...ILLUSTRATIVE_TARGET_INPUT.commitmentPolicy.options,
          CONTINUE: {
            object: 'store_release',
            parameters: { rate: 'validated_rate' },
            label: 'Continue at the validated rate',
            authorization: 'All critical dimensions remain inside the demonstrated envelope.',
            owner: 'Canada executive sponsor',
            displayMacro: 'ADVANCE',
          },
        },
      },
      pathState: 'improving',
      pathPolicy: {
        ...ILLUSTRATIVE_TARGET_INPUT.pathPolicy,
        options: {
          ...ILLUSTRATIVE_TARGET_INPUT.pathPolicy.options,
          CONTINUE: {
            object: 'readiness_path',
            parameters: { cadence: 'current' },
            label: 'Continue the readiness path',
            authorization: 'The intervention is converging inside its boundary.',
            owner: 'Canada operations lead',
          },
        },
      },
      validatedScale: undefined,
    });

    expect(evaluation.verdict.overall).toBe('FIT');
    expect(validateEvaluation(evaluation)).toContainEqual({
      path: 'validatedScale',
      message: 'FIT must name the scale at which fit was demonstrated.',
    });
  });
});
