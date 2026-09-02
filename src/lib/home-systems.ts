import { PORTFOLIO_PROJECTS } from './projects';

// The homepage surfaces three systems as "score cards". Each sits on an axis
// between two poles drawn from the system's own description — not an invented
// metric. All three reuse the canonical project copy (source of truth in
// projects.ts); StratOS links to its current commitment-judgment prototype.
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

const canonical = (id: HomeSystem['id']) => {
  const project = PORTFOLIO_PROJECTS.find((p) => p.id === id);
  if (!project) throw new Error(`Missing canonical project: ${id}`);
  return project;
};

const libera = canonical('libera');
const facia = canonical('facia');
const stratos = canonical('stratos');

export const HOME_SYSTEMS: readonly HomeSystem[] = [
  {
    id: 'libera',
    name: libera.name,
    category: libera.category,
    description: libera.description,
    href: libera.repositoryUrl ?? '#',
    external: true,
    poles: ['Discovered meaning', 'Reusable context'],
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
    poles: ['Structured answer', 'Usable interface'],
    position: 0.62,
    accent: 'facia',
  },
  {
    id: 'stratos',
    name: stratos.name,
    category: stratos.category,
    description: stratos.description,
    href: stratos.pageUrl ?? '#',
    external: false,
    poles: ['Commitment', 'Operating capacity'],
    position: 0.46,
    accent: 'stratos',
  },
] as const;
