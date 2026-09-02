import type { MessageChoice } from './chat';

export interface PortfolioProject {
  id: 'libera' | 'facia' | 'stratos';
  name: string;
  category: string;
  description: string;
  repositoryUrl?: `https://github.com/${string}`;
  pageUrl?: `/${string}`;
}

const projectPrompt = (project: string) =>
  `Explain the ${project} project in depth — what it is, how it works, and why it matters.`;

export const EXPLAIN_PROJECT_CHOICES: MessageChoice[] = [
  { label: 'Libera', prompt: projectPrompt('Libera') },
  { label: 'Facia', prompt: projectPrompt('Facia') },
  { label: 'StratOS', prompt: projectPrompt('StratOS') },
];

// The three public product expressions. Domain, Timpos, and Corus are the
// supporting protocols between them — explained by the assistant, not surfaced
// as cards.
export const PORTFOLIO_PROJECTS: readonly PortfolioProject[] = [
  {
    id: 'libera',
    name: 'Libera',
    category: 'Context infrastructure',
    description:
      'Libera turns the meaning discovered inside documents and workflows—rules, evidence, decisions, and state—into reusable software context. Its tested runtime executes those models deterministically; the next layer will package them for deployment through APIs, agents, and applications.',
    repositoryUrl: 'https://github.com/jeremycapps/libera',
  },
  {
    id: 'facia',
    name: 'Facia',
    category: 'Interface infrastructure',
    description:
      'Facia turns structured answers into reusable interface recipes. The shipped TypeScript package maps validated answers to UI patterns and disclosure levels, letting the same answer move from a quick summary to an auditable interface without rebuilding the logic for every surface.',
    repositoryUrl: 'https://github.com/jeremycapps/facia',
  },
  {
    id: 'stratos',
    name: 'StratOS',
    category: 'Decision infrastructure',
    description:
      'StratOS tests whether a strategic commitment fits the evidence and the organization’s operating capacity. It turns that judgment into two bounded actions—what to do with the commitment and what must change alongside it—with an explicit release gate and reassessment rule.',
    pageUrl: '/stratos-v2',
  },
] as const;
