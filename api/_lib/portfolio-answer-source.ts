import type { AnswerSetV2, FieldInfoV2 } from '@facia/core';

const CANONICAL_QUESTION = 'What did Jeremy work on at Zocdoc?';

const QUESTION_TERMS = ['work', 'build', 'do', 'design system', 'accessibility', 'header'];

function normalizedQuestion(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function supportsPortfolioQuestion(question: string): boolean {
  const normalized = normalizedQuestion(question);
  const words = new Set(normalized.split(' '));
  return words.has('zocdoc') && QUESTION_TERMS.some((term) => (
    term.includes(' ') ? normalized.includes(term) : words.has(term)
  ));
}

function zocdocAnswerSet(): AnswerSetV2 {
  const fields: FieldInfoV2 = {
    priority: {
      primary: ['title', 'contribution'],
      secondary: ['outcome'],
      supporting: ['scope'],
      audit: ['evidenceTier', 'source'],
    },
  };

  return {
    schema: 'facia.answer-set/2',
    question: CANONICAL_QUESTION,
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [
      {
        type: 'Value',
        payload: {
          title: 'Accessible design-system migration',
          contribution: 'Rebuilt and migrated assigned React components under a company-wide accessibility mandate.',
          outcome: 'Delivered reusable buttons, links, form inputs, and Header components for product-team adoption.',
          scope: 'Jeremy owned assigned components and participated in the initial audit; he did not lead the company-wide accessibility program.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md#career-history',
        },
        value: 'Accessible design-system migration',
        evidence: {
          status: 'profile-grounded',
          sourceRefs: ['content/profile.md#career-history'],
        },
        fields,
      },
      {
        type: 'Value',
        payload: {
          title: 'Header migration experiment',
          contribution: "Applied Zocdoc's existing A/B testing framework to the design-system team's first frontend-component experiment.",
          outcome: 'Supported a gradual test/control rollout across browsers and mobile.',
          scope: 'Jeremy applied the existing engineering-wide experimentation framework; he did not design that framework.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md#career-history',
        },
        value: 'Header migration experiment',
        evidence: {
          status: 'profile-grounded',
          sourceRefs: ['content/profile.md#career-history'],
        },
        fields,
      },
      {
        type: 'Value',
        payload: {
          title: 'Delivery workflow improvements',
          contribution: 'Built Jira dashboards, split initiatives into smaller tickets, and introduced a pull-request merge template.',
          outcome: 'Velocity increased by roughly 2–3 points per sprint, and average merge time fell by about one workday.',
          scope: 'These are delivery-process contributions, not a claim of formal people management.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md#career-history',
        },
        value: 'Delivery workflow improvements',
        evidence: {
          status: 'profile-grounded',
          sourceRefs: ['content/profile.md#career-history'],
        },
        fields,
      },
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.zocdoc-work.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.zocdoc-work' },
        { step: 'source.loaded', value: 'content/profile.md#career-history' },
        { step: 'answer.emitted', value: 3 },
      ],
    },
  };
}

export function answerPortfolioQuestion(question: string): AnswerSetV2 | null {
  return supportsPortfolioQuestion(question) ? zocdocAnswerSet() : null;
}
