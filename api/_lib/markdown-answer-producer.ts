import type { AnswerSetV2 } from '@facia/core';

export const MARKDOWN_FIELD = 'markdown';

/** Wrap a completed model document in the one semantic shape the UI accepts. */
export function produceMarkdownAnswer(question: string, markdown: string): AnswerSetV2 {
  return {
    schema: 'facia.answer-set/2',
    question,
    answerType: 'value',
    path: 'meaning',
    inspection: 'none',
    actionable: false,
    density: 2,
    items: [
      {
        type: 'Value',
        value: { documentType: 'markdown' },
        payload: {
          markdown,
          _provenance: {
            engine: 'model',
            operation: 'portfolio.answer.markdown.v1',
          },
        },
        evidence: {
          engine: 'model',
          operation: 'portfolio.answer.markdown.v1',
        },
        fields: {
          priority: {
            primary: [MARKDOWN_FIELD],
            secondary: [],
            supporting: [],
            audit: ['_provenance'],
          },
        },
      },
    ],
    operations: [],
  };
}
