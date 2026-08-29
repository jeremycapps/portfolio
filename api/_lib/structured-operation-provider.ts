// The live provider for a relational (operation) question. It asks the model for
// a mapping only — a grounded input claim, a relation, and an output target —
// under portfolio.model-operation/1. The host verifies the evidence ids and
// draws the composed seam; the model never names a source path or a renderer.

import { getConfig, portfolioGrounding } from './config';
import { evidencePromptIndex } from './portfolio-evidence';
import {
  MODEL_OPERATION_JSON_SCHEMA,
  parseModelOperation,
  type ModelOperation,
} from './model-operation';
import {
  generateOpenRouterStructured,
  type StructuredGenerationDeps,
} from './structured-openrouter';
import type { ChatMessage } from './types';

export type OperationProvider = (
  question: string,
  deps?: StructuredGenerationDeps,
  history?: ChatMessage[],
) => Promise<ModelOperation>;

const OPERATION_INSTRUCTIONS = [
  'The question is relational: it asks how one thing applies to, compares to, connects to, or builds on another.',
  'Return the mapping only. Give an `input` claim about Jeremy grounded in the evidence below, a `relation` that states how it maps to the target, and an `output` naming the target.',
  'The `input` claim must be supported by the evidence ids you cite. Do not overstate it.',
  'The `relation` is your reasoning — the transferable shape, not a restatement of the two terms.',
  'Set `caution` when the mapping reaches past the evidence (an unworked domain, an untried stack); otherwise null.',
  'Do not choose a renderer, pattern, density, component, schema pin, or source path.',
  'Use only the evidence identifiers below. The host resolves provenance and rejects unknown identifiers.',
  'Refuse when the grounding cannot support any honest mapping.',
].join('\n');

export async function generateStructuredPortfolioOperation(
  question: string,
  deps?: StructuredGenerationDeps,
  history: ChatMessage[] = [],
): Promise<ModelOperation> {
  const config = getConfig();
  if (config.provider !== 'openrouter') {
    throw new Error(`unknown CHAT_PROVIDER: ${config.provider}`);
  }
  const content = await generateOpenRouterStructured({
    name: 'portfolio_model_operation_v1',
    schema: MODEL_OPERATION_JSON_SCHEMA,
    messages: [
      {
        role: 'system',
        content: [portfolioGrounding(), OPERATION_INSTRUCTIONS, evidencePromptIndex()].join('\n\n'),
      },
      ...history,
      { role: 'user', content: question },
    ],
  }, deps);
  return parseModelOperation(content);
}
