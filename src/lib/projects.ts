import type { MessageChoice } from './chat';

export interface PortfolioProject {
  id: 'libera' | 'facia' | 'domain-corus';
  name: string;
  category: string;
  description: string;
  repositoryUrl?: `https://github.com/${string}`;
}

const projectPrompt = (project: string) =>
  `Explain the ${project} project in depth — what it is, how it works, and why it matters.`;

export const EXPLAIN_PROJECT_CHOICES: MessageChoice[] = [
  { label: 'Libera', prompt: projectPrompt('Libera') },
  { label: 'Facia', prompt: projectPrompt('Facia') },
  { label: 'Domain & Corus', prompt: projectPrompt('Domain & Corus') },
  { label: 'StratOS', prompt: projectPrompt('StratOS') },
];

export const PORTFOLIO_PROJECTS: readonly PortfolioProject[] = [
  {
    id: 'libera',
    name: 'Libera',
    category: 'Semantic runtime',
    description:
      'A page-based platform for composing and deploying executable semantic models — Notion + Obsidian + Vercel for meaning.',
    repositoryUrl: 'https://github.com/jeremycapps/libera',
  },
  {
    id: 'facia',
    name: 'Facia',
    category: 'Interface runtime',
    description:
      'The question-to-interface contract: it turns an answered model into a rendered surface — and powers the structured answers on this very page.',
    repositoryUrl: 'https://github.com/jeremycapps/facia',
  },
  {
    id: 'domain-corus',
    name: 'Domain & Corus',
    category: 'Context infrastructure',
    description:
      'Source-bound, replayable context for agentic workflows: evidence, verdicts, and an audit trail that can rebuild settled state.',
    repositoryUrl: 'https://github.com/jeremycapps/corus',
  },
] as const;
