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
    category: 'Runtime infrastructure',
    description:
      'Libera turns the meaning inside documents and workflows—rules, evidence, decisions, state—into reusable software context. Its tested runtime executes those models deterministically; the next layer packages them for deployment across APIs, agents, and apps.',
    repositoryUrl: 'https://github.com/jeremycapps/libera',
  },
  {
    id: 'facia',
    name: 'Facia',
    category: 'Interface infrastructure',
    description:
      'Facia turns a structured answer into a reusable interface recipe, deterministically—so one answer moves from a quick summary to a fully auditable view. Shipped as a TypeScript package, and running this site.',
    repositoryUrl: 'https://github.com/jeremycapps/facia',
  },
  {
    id: 'stratos',
    name: 'StratOS',
    category: 'Decision infrastructure',
    description:
      'StratOS is the accountability layer as a product—the part of the stack that answers whether an organization is getting what it said it wanted. Using Klarna’s AI support rollout, it shows how a capacity constraint sits beneath strong aggregate metrics, and turns that read into a bounded decision, an evidence plan, and a reassessment rule.',
    pageUrl: '/method',
  },
] as const;
