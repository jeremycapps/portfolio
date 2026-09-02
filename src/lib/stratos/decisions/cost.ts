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
  /**
   * How this figure joins the running total.
   *
   * `adds` is a new increment. `supersedes` replaces the figure before it,
   * for the case where a later report widens the same window rather than
   * reporting new money: a full fiscal year contains the quarter already
   * counted, and a lifecycle estimate contains the contract ceiling already
   * counted. Adding either would count the same dollars twice.
   */
  readonly accrual: 'adds' | 'supersedes';
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

export interface CostSeriesInput {
  readonly id: string;
  readonly sequence: string;
  readonly decisionDate: string;
  readonly cost: readonly CostFigure[];
  /** Whether the verdict at this date was adverse — a collision or a floor. */
  readonly adverse: boolean;
}

export interface CostSeriesPoint extends CostSeriesInput {
  /** Money recognised against the commitment by this date, in USD millions. */
  readonly total: number;
  /** The figure that anchors this point, if one was published at this date. */
  readonly figure?: CostFigure;
  /**
   * True where no figure was published and the total is read off the line
   * between the dates that did publish one.
   */
  readonly implied: boolean;
  /** USD millions per month over the segment ending at this point. */
  readonly ratePerMonth: number;
}

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 365.25 / 12;
const at = (date: string) => Date.parse(`${date}T00:00:00Z`);

/**
 * Cumulative spend over time.
 *
 * Money leaves continuously; only the reporting is lumpy. So a date that
 * published no figure is placed on the line between the dates that did, rather
 * than holding the previous total flat until the next report lands. Carrying
 * flat draws a step — a plateau and then a cliff — which says nothing was spent
 * for two years and then everything at once. For a program running the whole
 * time, that is not a simplification, it is the wrong shape.
 *
 * Interpolated points are marked `implied`, because a reader should be able to
 * tell which totals were reported and which were read off the line.
 *
 * One known overstatement, kept deliberately: an exit charge is largely
 * impairment of capital this series has already counted, so a case ending in
 * one recognises some dollars twice. The total is money recognised against the
 * commitment, not cash out the door.
 */
export function costSeries(decisions: readonly CostSeriesInput[]): CostSeriesPoint[] {
  // Pass one: the anchors, where a published figure fixes the running total.
  let total = 0;
  let lastContribution = 0;
  const anchors = new Map<number, number>();
  const figures = decisions.map((decision) => {
    const figure = decision.cost[0];
    if (figure) {
      total = figure.accrual === 'supersedes'
        ? total - lastContribution + figure.usdMillions
        : total + figure.usdMillions;
      lastContribution = figure.usdMillions;
      anchors.set(at(decision.decisionDate), total);
    }
    return figure;
  });

  const dates = [...anchors.keys()].sort((a, b) => a - b);
  const totalAt = (when: number): number => {
    const next = dates.find((date) => date >= when);
    if (next === undefined) return anchors.get(dates[dates.length - 1]!)!;
    if (next === when) return anchors.get(next)!;
    // A decision before the first published money figure is not evidence that
    // the later amount had already been spent. Start it at zero and let the
    // first evidenced anchor establish the slope.
    if (dates[0] === next) return 0;
    const previous = dates[dates.indexOf(next) - 1]!;
    const share = (when - previous) / (next - previous);
    const from = anchors.get(previous)!;
    return from + (anchors.get(next)! - from) * share;
  };

  let previous: { total: number; at: number } | undefined;
  return decisions.map((decision, index) => {
    const when = at(decision.decisionDate);
    const value = dates.length === 0 ? 0 : totalAt(when);
    const months = previous ? (when - previous.at) / MS_PER_MONTH : 0;
    const ratePerMonth = previous && months > 0 ? (value - previous.total) / months : 0;
    previous = { total: value, at: when };
    const figure = figures[index];
    return {
      ...decision,
      total: value,
      ...(figure ? { figure } : {}),
      implied: figure === undefined,
      ratePerMonth,
    };
  });
}
