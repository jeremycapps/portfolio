import type { AnswerSetV2, FieldInfoV2 } from '@facia/core';
import { adaptModelAnswer, ModelAnswerContractError } from './model-answer';
import { supportsTensionQuestion, tensionAnswerSet } from './tension-answer-source';
import { roleOf } from './question-grammar';
import { adaptModelOperation, ModelOperationContractError } from './model-operation';
import {
  generateStructuredPortfolioOperation, type OperationProvider,
} from './structured-operation-provider';
import {
  generateStructuredPortfolioAnswer,
  type StructuredProvider,
} from './structured-provider';
import type { ChatMessage } from './types';

const CANONICAL_QUESTION = 'What did Jeremy work on at Zocdoc?';

const QUESTION_TERMS = ['work', 'build', 'do', 'design system', 'accessibility', 'header'];

function normalizedQuestion(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

type LiberaStartPrecision = 'year' | 'month';

function latestUserQuestion(history: ChatMessage[]): string {
  return [...history].reverse().find((message) => message.role === 'user')?.content ?? '';
}

/** Resolve a precise Libera start-date question, including a short contextual follow-up. */
export function liberaStartPrecision(
  question: string,
  history: ChatMessage[] = [],
): LiberaStartPrecision | null {
  const current = normalizedQuestion(question);
  const prior = normalizedQuestion(latestUserQuestion(history));
  const asksForMonth = /\bmonth\b/.test(current);
  const namesLibera = /\blibera\b/.test(current)
    || (asksForMonth && /\blibera\b/.test(prior));
  const asksAboutStarting = /\b(start|started|begin|began|first)\b/.test(current)
    || (asksForMonth && /\b(start|started|begin|began|first)\b/.test(prior));

  if (!namesLibera || !asksAboutStarting) return null;
  if (asksForMonth) return 'month';
  return /^(when|what year)\b/.test(current) ? 'year' : null;
}

export function liberaStartDateAnswerSet(
  question: string,
  precision: LiberaStartPrecision,
): AnswerSetV2 {
  const sourceRef = 'content/profile.md#selected-projects';
  const monthRequested = precision === 'month';
  const title = monthRequested ? 'Month not specified' : '2026';
  const contribution = monthRequested
    ? 'The portfolio establishes that Jeremy began working on Libera in 2026, but it does not specify a month.'
    : 'Jeremy’s documented work on Libera begins in 2026.';
  return {
    schema: 'facia.answer-set/2',
    question,
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [{
      type: 'Value',
      payload: {
        title,
        contribution,
        precision: monthRequested ? 'year only' : 'year',
        scope: 'No more precise start date is present in the portfolio grounding.',
        evidenceTier: 'profile-grounded',
        source: sourceRef,
      },
      value: title,
      evidence: {
        status: 'profile-grounded',
        sourceRefs: [sourceRef],
      },
      fields: {
        priority: {
          primary: ['title', 'contribution'],
          secondary: ['precision'],
          supporting: ['scope'],
          audit: ['evidenceTier', 'source'],
        },
      },
    }],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.libera-start-date.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.libera-start-date' },
        { step: 'source.loaded', value: sourceRef },
        { step: 'precision.resolved', value: precision },
      ],
    },
  };
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

const CAREER_TERMS = [
  'career',
  'history',
  'experience',
  'background',
  'resume',
  'cv',
  'timeline',
  'title',
  'titles',
  'roles',
  'jobs',
  'worked',
];

export function supportsCareerQuestion(question: string): boolean {
  const normalized = normalizedQuestion(question);
  const words = new Set(normalized.split(' '));
  // The career spine answers "what is his history" — a value shown as a
  // timeline. A verdict, operation, or convergence question often shares a
  // keyword ("experience", "roles", "worked"), so the role gate comes first:
  // the spine may only claim a value question.
  if (roleOf(question) !== 'value') return false;
  // A Zocdoc-specific "what did you do" belongs to the richer Zocdoc model, not
  // the whole-career spine.
  if (supportsPortfolioQuestion(question)) return false;
  if (CAREER_TERMS.some((term) => words.has(term))) return true;
  return normalized.includes('current')
    && (words.has('role') || words.has('job') || words.has('position'));
}

const CAREER_REF = 'content/profile.md#career-history';

function careerFields(): FieldInfoV2 {
  return {
    priority: {
      primary: ['role', 'organization', 'period'],
      secondary: ['focus'],
      supporting: ['highlight'],
      audit: ['evidenceTier', 'source'],
    },
  };
}

function careerItem(entry: {
  role: string;
  organization: string;
  period: string;
  focus: string;
  highlight: string;
  sourceRef: string;
}) {
  return {
    type: 'Value' as const,
    payload: {
      role: entry.role,
      organization: entry.organization,
      period: entry.period,
      focus: entry.focus,
      highlight: entry.highlight,
      evidenceTier: 'profile-grounded',
      source: entry.sourceRef,
    },
    value: entry.role,
    evidence: {
      status: 'profile-grounded' as const,
      sourceRefs: [entry.sourceRef],
    },
    fields: careerFields(),
  };
}

// Reverse-chronological spine of full-time roles — the answer a recruiter scans
// for "current and last title" and drills into for the arc. Freelance and
// cultural work live in their own models, not on this timeline.
export function careerHistoryAnswerSet(): AnswerSetV2 {
  return {
    schema: 'facia.answer-set/2',
    question: "What is Jeremy's career history?",
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    structure: 'sequence',
    sequenceKind: 'temporal',
    items: [
      careerItem({
        role: 'Head of Operations',
        organization: 'Aroko',
        period: '2024–present',
        focus: 'Leads operations and client web delivery at a cooperative agency.',
        highlight: 'Authored an approved 90-day operating plan and built a Notion budgeting and estimating system.',
        sourceRef: 'content/profile.md#what-hes-doing-now',
      }),
      careerItem({
        role: 'Design Systems / Frontend Engineer',
        organization: 'Zocdoc',
        period: '2021–2024',
        focus: 'Rebuilt and migrated an outdated TypeScript/React design system under an accessibility mandate.',
        highlight: "Ran the design-system team's first frontend A/B experiment and cut average merge time by about a workday.",
        sourceRef: CAREER_REF,
      }),
      careerItem({
        role: 'Software / Product Engineer, C#',
        organization: 'Applied Software',
        period: '2019–2021',
        focus: 'Built construction-data integrations end to end on the 360Sync product.',
        highlight: 'Authored 5+ REST API wrapper libraries and trace logging that cut customer troubleshooting by 3–4 days.',
        sourceRef: CAREER_REF,
      }),
      careerItem({
        role: 'Software Engineer, legacy modernization',
        organization: 'Genesco',
        period: '2017–2019',
        focus: 'Modernized legacy COBOL systems into Java-based replacement workflows.',
        highlight: 'Translated embedded business logic and legacy data flows without disrupting operational continuity.',
        sourceRef: CAREER_REF,
      }),
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.career-history.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.career-history' },
        { step: 'source.loaded', value: CAREER_REF },
        { step: 'answer.emitted', value: 4 },
      ],
    },
  };
}

interface QuestionMatcher {
  supports: (question: string) => boolean;
  build: (question: string) => AnswerSetV2;
}

const MATCHERS: QuestionMatcher[] = [
  // A two-pole question is a bounded verdict and must be recognised before the
  // career keyword matcher, which would otherwise claim it on "experience",
  // "roles", or "worked" and answer it with a timeline.
  { supports: supportsTensionQuestion, build: (q) => tensionAnswerSet(q)! },
  { supports: supportsPortfolioQuestion, build: zocdocAnswerSet },
  { supports: supportsTechnologiesQuestion, build: technologiesAnswerSet },
  { supports: supportsCareerQuestion, build: careerHistoryAnswerSet },
];

export function answerPortfolioQuestion(question: string): AnswerSetV2 | null {
  const match = MATCHERS.find((matcher) => matcher.supports(question));
  return match ? match.build(question) : null;
}

export async function generatePortfolioAnswer(
  question: string,
  provider: StructuredProvider = generateStructuredPortfolioAnswer,
  operationProvider: OperationProvider = generateStructuredPortfolioOperation,
  history: ChatMessage[] = [],
): Promise<AnswerSetV2> {
  const startPrecision = liberaStartPrecision(question, history);
  if (startPrecision !== null) return liberaStartDateAnswerSet(question, startPrecision);
  // Role before keyword. A two-pole question opens a two-place answer space and
  // picks one — a bounded verdict, answered from the tension index. Without
  // this the career matcher claims it and returns the career timeline.
  if (supportsTensionQuestion(question)) return tensionAnswerSet(question)!;
  // A relational question names two terms whose mapping is in no single source.
  // It is composed: the model supplies the mapping, the host grounds the input
  // and draws the seam. This runs ahead of the value model so a "how does X
  // relate to Y" question is never flattened into a list of value items.
  if (roleOf(question) === 'operation') {
    const mapping = await operationProvider(question, undefined, history);
    if (mapping.refusal === null) return adaptModelOperation(question, mapping);
    throw new ModelOperationContractError('MODEL_REFUSED', mapping.refusal);
  }
  // The career spine is a temporal sequence; the model adapter only emits
  // singular values, so this answer is authored deterministically and never
  // routed through the provider.
  if (supportsCareerQuestion(question)) return careerHistoryAnswerSet();
  try {
    const answer = await provider(question, undefined, history);
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
