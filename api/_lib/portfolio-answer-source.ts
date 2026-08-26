import type { AnswerSetV2, FieldInfoV2 } from '@facia/core';
import { adaptModelAnswer, ModelAnswerContractError } from './model-answer';
import {
  generateStructuredPortfolioAnswer,
  type StructuredProvider,
} from './structured-provider';

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

export function zocdocAnswerSet(): AnswerSetV2 {
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

const TECHNOLOGY_TERMS = [
  'technology',
  'technologies',
  'tech',
  'stack',
  'language',
  'languages',
  'skills',
  'framework',
  'frameworks',
];

export function supportsTechnologiesQuestion(question: string): boolean {
  const normalized = normalizedQuestion(question);
  const words = new Set(normalized.split(' '));
  return TECHNOLOGY_TERMS.some((term) => words.has(term)) || normalized.includes('worked with');
}

function technologyFields(withRepo: boolean): FieldInfoV2 {
  return {
    priority: {
      primary: withRepo ? ['name', 'repo'] : ['name'],
      secondary: ['category'],
      supporting: [],
      audit: ['evidenceTier', 'source'],
    },
  };
}

function technologyItem(entry: {
  name: string;
  category: string;
  repo?: string;
  sourceRefs: string[];
}) {
  const withRepo = typeof entry.repo === 'string';
  const payload = {
    name: entry.name,
    category: entry.category,
    ...(withRepo ? { repo: entry.repo as string } : {}),
    evidenceTier: 'profile-grounded',
    source: entry.sourceRefs.join(', '),
  };

  return {
    type: 'Value' as const,
    payload,
    value: entry.name,
    evidence: {
      status: 'profile-grounded' as const,
      sourceRefs: entry.sourceRefs,
    },
    fields: technologyFields(withRepo),
  };
}

function technologiesAnswerSet(): AnswerSetV2 {
  const skillsRef = 'content/profile.md#skills-tools';
  return {
    schema: 'facia.answer-set/2',
    question: 'What technologies has Jeremy worked with?',
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [
      technologyItem({ name: 'TypeScript', category: 'Language', sourceRefs: [skillsRef] }),
      technologyItem({ name: 'React', category: 'UI library', sourceRefs: [skillsRef] }),
      technologyItem({
        name: 'Python',
        category: 'Language',
        repo: 'https://github.com/jeremycapps/corus',
        sourceRefs: [skillsRef, 'content/profile.md#domain-corus'],
      }),
      technologyItem({ name: 'C# / .NET', category: 'Language & runtime', sourceRefs: [skillsRef] }),
      technologyItem({ name: 'Java', category: 'Language', sourceRefs: [skillsRef] }),
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.technologies.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.technologies' },
        { step: 'source.loaded', value: skillsRef },
        { step: 'answer.emitted', value: 5 },
      ],
    },
  };
}

interface QuestionMatcher {
  supports: (question: string) => boolean;
  build: () => AnswerSetV2;
}

const MATCHERS: QuestionMatcher[] = [
  { supports: supportsPortfolioQuestion, build: zocdocAnswerSet },
  { supports: supportsTechnologiesQuestion, build: technologiesAnswerSet },
];

export function answerPortfolioQuestion(question: string): AnswerSetV2 | null {
  const match = MATCHERS.find((matcher) => matcher.supports(question));
  return match ? match.build() : null;
}

export async function generatePortfolioAnswer(
  question: string,
  provider: StructuredProvider = generateStructuredPortfolioAnswer,
): Promise<AnswerSetV2> {
  try {
    const answer = await provider(question);
    return adaptModelAnswer(question, answer);
  } catch (error) {
    // Keep the existing source-reviewed fixture as a deliberately narrow rollout fallback.
    if (
      supportsPortfolioQuestion(question)
      && error instanceof ModelAnswerContractError
      && ['MODEL_PROVIDER_UNAVAILABLE', 'MODEL_PROVIDER_TIMEOUT'].includes(error.code)
    ) {
      return zocdocAnswerSet();
    }
    if (error instanceof ModelAnswerContractError) throw error;
    throw new ModelAnswerContractError(
      'MODEL_PROVIDER_UNAVAILABLE',
      'Structured generation is unavailable.',
    );
  }
}
