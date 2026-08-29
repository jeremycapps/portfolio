import { getConfig, portfolioGrounding } from './config';
import { evidencePromptIndex } from './portfolio-evidence';
import {
  MODEL_ANSWER_JSON_SCHEMA,
  parseModelAnswer,
  type ModelAnswer,
} from './model-answer';
import {
  generateOpenRouterStructured,
  type StructuredGenerationDeps,
} from './structured-openrouter';
import type { ChatMessage } from './types';

export type StructuredProvider = (
  question: string,
  deps?: StructuredGenerationDeps,
  history?: ChatMessage[],
) => Promise<ModelAnswer>;

export async function generateStructuredPortfolioAnswer(
  question: string,
  deps?: StructuredGenerationDeps,
  history: ChatMessage[] = [],
): Promise<ModelAnswer> {
  const config = getConfig();
  if (config.provider !== 'openrouter') {
    throw new Error(`unknown CHAT_PROVIDER: ${config.provider}`);
  }
  const content = await generateOpenRouterStructured({
    name: 'portfolio_model_answer_v1',
    schema: MODEL_ANSWER_JSON_SCHEMA,
    messages: [
      {
        role: 'system',
        content: [
          portfolioGrounding(),
          'Return semantic portfolio facts only. Do not choose a renderer, pattern, density, component, schema pin, or source path.',
          'Use only the evidence identifiers below. The host will resolve provenance and reject unknown identifiers.',
          'Do not infer a month or day when the evidence supplies only a year. Refuse when the requested precision is absent.',
          'Use null for an unknown outcome or scope. Refuse when the grounding cannot answer the question.',
          evidencePromptIndex(),
        ].join('\n\n'),
      },
      ...history,
      { role: 'user', content: question },
    ],
  }, deps);
  return parseModelAnswer(content);
}
