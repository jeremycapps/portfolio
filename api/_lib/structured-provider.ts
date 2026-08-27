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

export type StructuredProvider = (
  question: string,
  deps?: StructuredGenerationDeps,
) => Promise<ModelAnswer>;

export async function generateStructuredPortfolioAnswer(
  question: string,
  deps?: StructuredGenerationDeps,
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
          'Use null for an unknown outcome or scope. Refuse when the grounding cannot answer the question.',
          evidencePromptIndex(),
        ].join('\n\n'),
      },
      { role: 'user', content: question },
    ],
  }, deps);
  return parseModelAnswer(content);
}
