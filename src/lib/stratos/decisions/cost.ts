import type { CaseFact, CaseProfile } from '../cases/profile';

/**
 * The money a decision placed, resolved from the case's own facts.
 *
 * A verdict says whether an increment fits. It does not say what the commitment
 * cost, and that is the first question a reader actually asks. This module
 * answers it without letting the answer drift from the evidence: every figure
 * is a fact in the profile, normalised to one unit so two cases can share a
 * scale, and carrying the basis that says what kind of measurement it is.
 *
 * The basis matters more than it looks. A quarter's operating loss, a fiscal
 * year's operating loss, and a one-time exit charge are three different
 * instruments. Plotted without labels they read as one number getting worse,
 * which is not what happened, so nothing here ever sums them.
 */

export const COST_KINDS = ['committed', 'realized', 'hindsight'] as const;
export type CostKind = typeof COST_KINDS[number];

export interface CostFigureRef {
  readonly kind: CostKind;
  readonly factRef: string;
  /** What the measurement is, in the reader's words — 'first full-year segment loss'. */
  readonly basis: string;
}

export interface CostFigure extends CostFigureRef {
  /**
   * Magnitude in USD millions.
   *
   * A magnitude rather than a signed figure: an authorized ceiling is positive
   * and an operating loss is negative, and putting both on one axis by sign
   * would place "money authorized" and "money lost" on opposite sides of zero
   * as though they offset. They do not. The kind carries that distinction.
   */
  readonly usdMillions: number;
  readonly statement: string;
  readonly observedAt: string;
  readonly sourceIds: readonly string[];
}

/** Unit prefixes the case profiles actually use for money. */
const SCALE: readonly (readonly [string, number])[] = [
  ['USD billions', 1000],
  ['USD millions', 1],
];

/**
 * Converts a money fact to USD millions.
 *
 * Throws rather than guessing. A fact whose unit this cannot read is a fact
 * that would be plotted at the wrong order of magnitude, and a chart that is
 * wrong by 1000× is worse than one that fails to build.
 */
export function usdMillions(fact: CaseFact): number {
  const { metric } = fact;
  if (!metric) throw new Error(`Cost fact ${fact.id} carries no metric.`);
  if (!('value' in metric)) {
    throw new Error(`Cost fact ${fact.id} carries a range; a cost figure needs a single value.`);
  }
  const scale = SCALE.find(([prefix]) => metric.unit.startsWith(prefix));
  if (!scale) throw new Error(`Cost fact ${fact.id} has unrecognised money unit "${metric.unit}".`);
  return Math.abs(metric.value) * scale[1];
}

export function resolveCostFigure(profile: CaseProfile, ref: CostFigureRef): CostFigure {
  const fact = profile.facts.find(({ id }) => id === ref.factRef);
  if (!fact) throw new Error(`${profile.id} has no cost fact ${ref.factRef}.`);
  return {
    ...ref,
    usdMillions: usdMillions(fact),
    statement: fact.statement,
    observedAt: fact.observedAt,
    sourceIds: fact.evidence.map(({ sourceId }) => sourceId),
  };
}

/** `$2.7B`, `$941M` — the axis and the pills are both too narrow for digits. */
export function formatUsdMillions(value: number): string {
  return value >= 1000
    ? `$${(value / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}B`
    : `$${Math.round(value).toLocaleString('en-US')}M`;
}
