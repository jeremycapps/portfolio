import { z } from 'zod';
import type { ContextExpansion, ContextQuery, ContextQueryKind } from './context-index';
import {
  generateOpenRouterStructured,
  type StructuredGenerationDeps,
} from './structured-openrouter';
import type { ChatMessage } from './types';

export const CONTEXT_PLAN_PROTOCOL = 'portfolio.context-plan/1' as const;

const contextPlanSchema = z.object({
  schema: z.literal(CONTEXT_PLAN_PROTOCOL),
  needed: z.boolean(),
  term: z.string().trim().min(1).max(200).nullable(),
  kind: z.enum(['catalog', 'prose', 'code']).nullable(),
  expansion: z.enum(['none', 'neighbors', 'exchange']).nullable(),
  limit: z.number().int().min(1).max(20).nullable(),
}).strict().superRefine((plan, ctx) => {
  if (plan.needed && (plan.term === null || plan.kind === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['term'],
      message: 'A plan that needs retrieval requires term and kind.',
    });
  }
  if (!plan.needed && (plan.term !== null || plan.kind !== null || plan.expansion !== null || plan.limit !== null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['needed'],
      message: 'A plan that does not need retrieval must leave term, kind, expansion, and limit null.',
    });
  }
});

export type ContextPlanResult =
  | { needed: false }
  | { needed: true; query: ContextQuery };

export const CONTEXT_PLAN_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['schema', 'needed', 'term', 'kind', 'expansion', 'limit'],
  properties: {
    schema: { type: 'string', const: CONTEXT_PLAN_PROTOCOL },
    needed: { type: 'boolean' },
    term: { anyOf: [{ type: 'string', minLength: 1, maxLength: 200 }, { type: 'null' }] },
    kind: { anyOf: [{ type: 'string', enum: ['catalog', 'prose', 'code'] }, { type: 'null' }] },
    expansion: { anyOf: [{ type: 'string', enum: ['none', 'neighbors', 'exchange'] }, { type: 'null' }] },
    limit: { anyOf: [{ type: 'integer', minimum: 1, maximum: 20 }, { type: 'null' }] },
  },
} as const satisfies Record<string, unknown>;

export function parseContextPlan(raw: string): ContextPlanResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { needed: false };
  }
  const result = contextPlanSchema.safeParse(parsed);
  if (!result.success || !result.data.needed) return { needed: false };
  const plan = result.data;
  return {
    needed: true,
    query: {
      term: plan.term as string,
      kind: plan.kind as ContextQueryKind,
      expansion: (plan.expansion as ContextExpansion | null) ?? undefined,
      limit: plan.limit ?? undefined,
    },
  };
}

const CONTEXT_PLAN_SYSTEM_PROMPT = [
  "You are a retrieval planner for Jeremy Capps's portfolio chat assistant.",
  'The assistant is already grounded in a curated profile document covering settled',
  "career history, skills, and named projects. A separate private index holds Jeremy's",
  'own past AI chat transcripts and code from his development history — useful for',
  'specific, detailed, or "how did you build/think about X" questions that go beyond',
  'the profile document, but exploratory and sometimes stale.',
  '',
  'Decide whether this question would benefit from searching that index.',
  'Set needed to false for questions the profile document already answers well —',
  'general career, skills, project-summary, or contact questions.',
  'Set needed to true only when the question asks for something more specific or',
  'detailed than the profile document would contain.',
  '',
  'When needed is true, choose:',
  '- term: a short, specific search phrase (not the whole question)',
  '- kind: "prose" for conversational/explanatory material, "code" for source or',
  '  config snippets, "catalog" to find which documents/projects exist on a topic',
  '- expansion: "none" for an isolated match, "neighbors" for surrounding context',
  '  within the same exchange, "exchange" for the whole exchange',
  '- limit: how many rows to retrieve, typically 3-8',
  '',
  'When needed is false, leave term, kind, expansion, and limit as null.',
].join('\n');

const PLAN_TIMEOUT_MS = 3_000;

export async function planContextQuery(
  question: string,
  history: ChatMessage[] = [],
  deps: StructuredGenerationDeps = {},
): Promise<ContextPlanResult> {
  try {
    const content = await generateOpenRouterStructured({
      name: 'portfolio_context_plan_v1',
      schema: CONTEXT_PLAN_JSON_SCHEMA,
      messages: [
        { role: 'system', content: CONTEXT_PLAN_SYSTEM_PROMPT },
        ...history,
        { role: 'user', content: question },
      ],
    }, { timeoutMs: PLAN_TIMEOUT_MS, ...deps });
    return parseContextPlan(content);
  } catch {
    return { needed: false };
  }
}
