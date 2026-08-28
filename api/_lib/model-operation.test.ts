import { resolveAnswerSet, validateAnswerSet } from '@facia/core';
import { describe, expect, it } from 'vitest';
import {
  adaptModelOperation, ModelOperationContractError, modelOperationSchema, type ModelOperation,
} from './model-operation';

// A grounded mapping the model might return: the input claim is bound to real
// evidence ids; the relation and the output target are the model's contribution.
const goodMapping: ModelOperation = {
  schema: 'portfolio.model-operation/1' as const,
  refusal: null,
  input: {
    claim: 'Owned and migrated shared TypeScript/React design-system components across production healthcare surfaces.',
    evidenceRefs: ['profile.zocdoc'],
  },
  relation: 'The same ownership-plus-migration discipline transfers: a fintech component library is a shared surface under compliance pressure, which is the shape of the Zocdoc work.',
  output: 'Building a component library at a fintech',
  caution: null,
};

describe('the model operation contract', () => {
  it('accepts a well-formed grounded mapping', () => {
    expect(() => modelOperationSchema.parse(goodMapping)).not.toThrow();
  });

  it('rejects a mapping whose input cites nothing', () => {
    const bad = { ...goodMapping, input: { ...goodMapping.input, evidenceRefs: [] } };
    expect(() => modelOperationSchema.parse(bad)).toThrow();
  });

  it('rejects a refusal that also carries a mapping', () => {
    const bad = { ...goodMapping, refusal: 'no grounding for that' };
    expect(() => modelOperationSchema.parse(bad)).toThrow();
  });
});

describe('adapting a mapping into an operation answer', () => {
  const question = 'How would Jeremy\'s design-system experience apply to building a component library at a fintech?';
  const answer = adaptModelOperation(question, goodMapping);

  it('is an operation, not a value', () => {
    expect(answer.answerType).toBe('operation');
  });

  it('is a valid AnswerSet', () => {
    expect(validateAnswerSet(answer).valid).toBe(true);
  });

  it('carries the grounded claim as input and the target as output', () => {
    expect(answer.items[0].input).toContain('design-system components');
    expect(answer.items[0].output).toBe('Building a component library at a fintech');
  });

  it('records the seam: input grounded, mapping composed', () => {
    const ev = answer.items[0].evidence as { status: string; sourceRefs: string[]; groundedInput: boolean };
    expect(ev.status).toBe('composed');
    expect(ev.groundedInput).toBe(true);
    expect(ev.sourceRefs).toContain('content/profile.md#career-history');
  });

  it('rejects a mapping whose input cites an unknown evidence id', () => {
    const bad = { ...goodMapping, input: { ...goodMapping.input, evidenceRefs: ['profile.nonexistent'] } };
    expect(() => adaptModelOperation(question, bad as never)).toThrow(ModelOperationContractError);
  });

  it('resolves to an operation-detail recipe', () => {
    const r = resolveAnswerSet(answer, { depth: 'focus' });
    expect(r.ok && r.recipe.pattern).toBe('operation-detail');
  });

  it('projects the mapping as the primary field and the two terms beneath', () => {
    const r = resolveAnswerSet(answer, { depth: 'focus' });
    if (!r.ok) throw new Error('unresolved');
    const keys = r.recipe.visibleFields[0].fields.map((f) => f.key);
    expect(keys[0]).toBe('relation');
    expect(keys).toContain('from');
    expect(keys).toContain('to');
  });
});
