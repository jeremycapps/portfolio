import { z } from 'zod';
import type { AnswerSetV2, FieldInfoV2, JsonObject, ValueAnswerV2 } from '@facia/core';
import { EVIDENCE_IDS, PORTFOLIO_EVIDENCE, type EvidenceId } from './portfolio-evidence';

export const MODEL_ANSWER_PROTOCOL = 'portfolio.model-answer/1' as const;

const evidenceIdSchema = z.enum(EVIDENCE_IDS as [EvidenceId, ...EvidenceId[]]);
const itemSchema = z.object({
  title: z.string().trim().min(1).max(120),
  contribution: z.string().trim().min(1).max(800),
  outcome: z.string().trim().min(1).max(600).nullable(),
  scope: z.string().trim().min(1).max(600).nullable(),
  evidenceRefs: z.array(evidenceIdSchema).min(1).max(3).refine(
    (refs) => new Set(refs).size === refs.length,
    'evidenceRefs must be unique.',
  ),
}).strict();

export const modelAnswerSchema = z.object({
  schema: z.literal(MODEL_ANSWER_PROTOCOL),
  refusal: z.string().trim().min(1).max(300).nullable(),
  items: z.array(itemSchema).max(6),
}).strict().superRefine((answer, context) => {
  if (answer.refusal === null && answer.items.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['items'], message: 'An answer requires at least one item.' });
  }
  if (answer.refusal !== null && answer.items.length !== 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['items'], message: 'A refusal cannot include answer items.' });
  }
});

export type ModelAnswer = z.infer<typeof modelAnswerSchema>;

export const MODEL_ANSWER_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['schema', 'refusal', 'items'],
  properties: {
    schema: { type: 'string', const: MODEL_ANSWER_PROTOCOL },
    refusal: { anyOf: [{ type: 'string', minLength: 1, maxLength: 300 }, { type: 'null' }] },
    items: {
      type: 'array',
      maxItems: 6,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'contribution', 'outcome', 'scope', 'evidenceRefs'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 120 },
          contribution: { type: 'string', minLength: 1, maxLength: 800 },
          outcome: { anyOf: [{ type: 'string', minLength: 1, maxLength: 600 }, { type: 'null' }] },
          scope: { anyOf: [{ type: 'string', minLength: 1, maxLength: 600 }, { type: 'null' }] },
          evidenceRefs: {
            type: 'array',
            minItems: 1,
            maxItems: 3,
            uniqueItems: true,
            items: { type: 'string', enum: EVIDENCE_IDS },
          },
        },
      },
    },
  },
} as const satisfies Record<string, unknown>;

export function parseModelAnswer(raw: string): ModelAnswer {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ModelAnswerContractError('MODEL_MALFORMED_JSON', 'The model returned malformed JSON.');
  }
  const result = modelAnswerSchema.safeParse(parsed);
  if (!result.success) {
    throw new ModelAnswerContractError('MODEL_SCHEMA_INVALID', 'The model answer did not match the closed contract.');
  }
  if (result.data.refusal !== null) {
    throw new ModelAnswerContractError('MODEL_REFUSED', result.data.refusal);
  }
  return result.data;
}

export type ModelAnswerErrorCode =
  | 'MODEL_MALFORMED_JSON'
  | 'MODEL_SCHEMA_INVALID'
  | 'MODEL_REFUSED'
  | 'MODEL_PROVIDER_UNAVAILABLE'
  | 'MODEL_PROVIDER_TIMEOUT';

export class ModelAnswerContractError extends Error {
  constructor(readonly code: ModelAnswerErrorCode, message: string) {
    super(message);
    this.name = 'ModelAnswerContractError';
  }
}

const fields: FieldInfoV2 = {
  priority: {
    primary: ['title', 'contribution'],
    secondary: ['outcome'],
    supporting: ['scope'],
    audit: ['evidenceTier', 'source'],
  },
};

export function adaptModelAnswer(question: string, answer: ModelAnswer): AnswerSetV2 {
  const items = answer.items.map((item) => {
    const resolved = item.evidenceRefs.map((id) => PORTFOLIO_EVIDENCE[id]);
    const sources = [...new Set(resolved.map((evidence) => evidence.source))];
    const payload: JsonObject = {
      title: item.title,
      contribution: item.contribution,
      outcome: item.outcome,
      scope: item.scope,
      evidenceTier: resolved.every((evidence) => evidence.tier === 'profile-grounded')
        ? 'profile-grounded'
        : 'mixed',
      source: sources.join(', '),
    };
    return {
      type: 'Value' as const,
      payload,
      value: item.title,
      evidence: {
        status: payload.evidenceTier,
        sourceRefs: sources,
        evidenceIds: item.evidenceRefs,
      },
      fields,
    };
  }) satisfies ValueAnswerV2[];

  if (items.length === 0) {
    throw new ModelAnswerContractError('MODEL_SCHEMA_INVALID', 'An answer requires at least one item.');
  }

  return {
    schema: 'facia.answer-set/2',
    question,
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [items[0], ...items.slice(1)],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.model-answer.v1',
      entries: [
        { step: 'model.contract', value: MODEL_ANSWER_PROTOCOL },
        { step: 'evidence.resolved', value: items.length },
      ],
    },
  };
}
