import { PORTFOLIO_PROJECTS } from './projects';

// The homepage surfaces three systems as "score cards". Each sits on an axis
// between two poles drawn from the system's own description — not an invented
// metric. Libera and Facia reuse the canonical project copy (source of truth in
// projects.ts); StratOS is the judgment instrument, linked to its in-app route.
export interface HomeSystem {
  readonly id: 'libera' | 'facia' | 'stratos';
  readonly name: string;
  readonly category: string;
  readonly description: string;
  /** External repo URL, or an in-app route path (starts with '/'). */
  readonly href: string;
  readonly external: boolean;
  /** The two poles the system is genuinely about, left → right. */
  readonly poles: readonly [string, string];
  /** Marker placement between the poles, 0 (left) … 1 (right). */
  readonly position: number;
  /** Accent token name applied to the card. */
  readonly accent: 'libera' | 'facia' | 'stratos';
}

const canonical = (id: 'libera' | 'facia') => {
  const project = PORTFOLIO_PROJECTS.find((p) => p.id === id);
  if (!project) throw new Error(`Missing canonical project: ${id}`);
  return project;
};

const libera = canonical('libera');
const facia = canonical('facia');

export const HOME_SYSTEMS: readonly HomeSystem[] = [
  {
    id: 'libera',
    name: libera.name,
    category: libera.category,
    description: libera.description,
    href: libera.repositoryUrl ?? '#',
    external: true,
    poles: ['State motion', 'Meaning'],
    position: 0.28,
    accent: 'libera',
  },
  {
    id: 'facia',
    name: facia.name,
    category: facia.category,
    description: facia.description,
    href: facia.repositoryUrl ?? '#',
    external: true,
    poles: ['Answer', 'Surface'],
    position: 0.62,
    accent: 'facia',
  },
  {
    id: 'stratos',
    name: 'StratOS',
    category: 'Paired-tension ontology',
    description:
      'A judgment instrument. A six-tension model that surfaces where conviction runs ahead of the evidence — built so others reach the conclusion rather than being told it.',
    href: '/stratos',
    external: false,
    poles: ['Conviction', 'Inquiry'],
    position: 0.46,
    accent: 'stratos',
  },
] as const;
