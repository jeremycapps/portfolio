import type { MessageChoice } from './chat';

export interface PortfolioProject {
  id: 'libera' | 'facia';
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
  { label: 'StratOS', prompt: projectPrompt('StratOS') },
];

// The two substantial builds. Domain, Timpos, and Corus are the supporting
// protocols between them — explained by the assistant, not surfaced as cards.
export const PORTFOLIO_PROJECTS: readonly PortfolioProject[] = [
  {
    id: 'libera',
    name: 'Libera',
    category: 'Semantic runtime',
    description:
      'Where a question becomes a deterministic path. A page-based platform for executable semantic models, on a runtime whose kernel executes state motion without knowing what that motion means.',
    repositoryUrl: 'https://github.com/jeremycapps/libera',
  },
  {
    id: 'facia',
    name: 'Facia',
    category: 'Interface contract',
    description:
      'Where an answered model becomes a surface. It turns a validated answer into a renderer-neutral component recipe — and it renders the structured answers on this page.',
    repositoryUrl: 'https://github.com/jeremycapps/facia',
  },
] as const;
