// Composition: answering a relational question the corpus cannot answer alone.
//
// A question like "how would his design-system experience apply to a fintech?"
// names two terms. One — his experience — is in the corpus. The other — a
// fintech component library — is not, and neither is the mapping between them.
// A verdict is a lookup; this is not retrievable, it has to be composed.
//
// The seam is drawn so grounding survives it. The model supplies ONLY the
// mapping: an `input` claim it must bind to real evidence ids, a `relation`, and
// an `output` target. The host verifies the evidence ids exactly as it does for
// a value answer, and stamps the evidence tier `composed` — grounded input,
// model-authored mapping — so the seam is recorded in the answer rather than
// hidden inside it. The model never names a corpus source path, a renderer, or a
// pattern.

import { z } from 'zod';
import { operationAnswerSet } from '@facia/core/authoring';
import type { JsonObject, OperationAnswerSetV2 } from '@facia/core';
import { EVIDENCE_IDS, PORTFOLIO_EVIDENCE, type EvidenceId } from './portfolio-evidence';

export const MODEL_OPERATION_PROTOCOL = 'portfolio.model-operation/1' as const;

export class ModelOperationContractError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'ModelOperationContractError';
  }
}

const evidenceIdSchema = z.enum(EVIDENCE_IDS as [EvidenceId, ...EvidenceId[]]);

export const modelOperationSchema = z.object({
  schema: z.literal(MODEL_OPERATION_PROTOCOL),
  refusal: z.string().trim().min(1).max(300).nullable(),
  input: z.object({
    claim: z.string().trim().min(1).max(600),
    evidenceRefs: z.array(evidenceIdSchema).min(1).max(3).refine(
      (refs) => new Set(refs).size === refs.length,
      'evidenceRefs must be unique.',
    ),
  }),
  relation: z.string().trim().min(1).max(800),
  output: z.string().trim().min(1).max(300),
  caution: z.string().trim().min(1).max(400).nullable(),
}).strict().superRefine((op, ctx) => {
  // A refusal is a whole-answer verdict; it cannot also carry a mapping. Zod
  // cannot express "these fields are absent when refusal is set" on a closed
  // object, so the mapping fields are always present — the rule is that a
  // refusal must leave them at their sentinel-empty state, which the caller
  // never sends. We enforce the simpler invariant the model can violate: a
  // refusal with a substantive relation is contradictory.
  if (op.refusal !== null && op.relation.trim().length > 0 && op.input.evidenceRefs.length > 0
      && op.relation !== 'n/a') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['refusal'], message: 'A refusal cannot also assert a mapping.' });
  }
});

export type ModelOperation = z.infer<typeof modelOperationSchema>;

export const MODEL_OPERATION_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['schema', 'refusal', 'input', 'relation', 'output', 'caution'],
  properties: {
    schema: { type: 'string', const: MODEL_OPERATION_PROTOCOL },
    refusal: { anyOf: [{ type: 'string', minLength: 1, maxLength: 300 }, { type: 'null' }] },
    input: {
      type: 'object',
      additionalProperties: false,
      required: ['claim', 'evidenceRefs'],
      properties: {
        claim: { type: 'string', minLength: 1, maxLength: 600 },
        evidenceRefs: {
          type: 'array', minItems: 1, maxItems: 3, uniqueItems: true,
          items: { type: 'string', enum: EVIDENCE_IDS },
        },
      },
    },
    relation: { type: 'string', minLength: 1, maxLength: 800 },
    output: { type: 'string', minLength: 1, maxLength: 300 },
    caution: { anyOf: [{ type: 'string', minLength: 1, maxLength: 400 }, { type: 'null' }] },
  },
} as const satisfies Record<string, unknown>;

export function parseModelOperation(raw: string): ModelOperation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ModelOperationContractError('MODEL_SCHEMA_INVALID', 'Model operation was not valid JSON.');
  }
  const result = modelOperationSchema.safeParse(parsed);
  if (!result.success) {
    throw new ModelOperationContractError('MODEL_SCHEMA_INVALID', result.error.message);
  }
  return result.data;
}

/** Build a grounded OperationV2 from a model mapping, verifying its evidence. */
export function adaptModelOperation(question: string, mapping: ModelOperation): OperationAnswerSetV2 {
  const resolved = mapping.input.evidenceRefs.map((id) => {
    const evidence = PORTFOLIO_EVIDENCE[id];
    if (evidence === undefined) {
      throw new ModelOperationContractError('MODEL_EVIDENCE_UNKNOWN', `Unknown evidence id: ${id}`);
    }
    return evidence;
  });
  const sources = [...new Set(resolved.map((e) => e.source))];
  const grounded = resolved.every((e) => e.tier === 'profile-grounded');

  const payload: JsonObject = {
    relation: mapping.relation,
    from: mapping.input.claim,
    to: mapping.output,
    ...(mapping.caution === null ? {} : { caution: mapping.caution }),
  };

  return operationAnswerSet({
    question,
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [{
      type: 'Operation',
      payload,
      operation: { id: 'portfolio.compose.relation', name: 'Compose a grounded relation' },
      input: mapping.input.claim,
      output: mapping.output,
      // The seam, recorded: the input is grounded, the mapping is the model's.
      // `composed` is not `profile-grounded` — an audit reader can tell which
      // part of this answer was retrieved and which was reasoned.
      evidence: {
        status: 'composed',
        groundedInput: grounded,
        sourceRefs: sources,
        evidenceIds: mapping.input.evidenceRefs,
      },
      fields: {
        priority: {
          primary: ['relation'],
          secondary: ['from', 'to'],
          supporting: [],
          audit: mapping.caution === null ? [] : ['caution'],
        },
      },
    }],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.model-operation.v1',
      entries: [
        { step: 'grammar.arity', value: '2·relational' },
        { step: 'input.grounded', value: grounded },
        { step: 'mapping.composed', value: MODEL_OPERATION_PROTOCOL },
      ],
    },
  });
}
