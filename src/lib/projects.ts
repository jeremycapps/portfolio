export interface PortfolioProject {
  id: 'libera' | 'facia' | 'domain-corus';
  name: string;
  category: string;
  description: string;
  toast: string;
  repositoryUrl?: `https://github.com/${string}`;
}

export const PORTFOLIO_PROJECTS: readonly PortfolioProject[] = [
  {
    id: 'libera',
    name: 'Libera',
    category: 'Semantic runtime',
    description:
      'A page-based platform for composing and deploying executable semantic models — Notion + Obsidian + Vercel for meaning.',
    toast: 'Libera — a page-based platform for executable semantic models.',
    repositoryUrl: 'https://github.com/jeremycapps/libera',
  },
  {
    id: 'facia',
    name: 'Facia',
    category: 'Interface runtime',
    description:
      'The question-to-interface contract: it turns an answered model into a rendered surface — and powers the structured answers on this very page.',
    toast: 'Facia — the question-to-interface contract powering this page.',
    repositoryUrl: 'https://github.com/jeremycapps/facia',
  },
  {
    id: 'domain-corus',
    name: 'Domain & Corus',
    category: 'Context infrastructure',
    description:
      'Source-bound, replayable context for agentic workflows: evidence, verdicts, and an audit trail that can rebuild settled state.',
    toast: 'Domain & Corus — source-bound, replayable context for agent workflows.',
    repositoryUrl: 'https://github.com/jeremycapps/corus-workbench',
  },
] as const;
