import { useMemo, useState, type ReactNode } from 'react';

import { SiteHeader } from '@/components/site-header';
import {
  createDecisionExperienceViewModel,
  decisionRecommendation,
  type DecisionExperienceViewModel,
  type PresentationLeg,
} from '@/lib/stratos/decisions/presentation';
import type { EvidenceDisplayState } from '@/lib/stratos/decisions/decision-point';
import { costSeries, formatUsdMillions, type CostSeriesPoint } from '@/lib/stratos/decisions/cost';
import './stratos-flow.css';

/**
 * The judgment-flow design, driven by the real decision view model.
 *
 * Layout and visual language follow docs/design/stratos-judgment-flow.html:
 * three dark device screens on a light editorial ground, each owning one job,
 * each labelled with the gesture whose stakes match it.
 *
 * The rule for this surface is that nothing is authored for display. Every
 * value is read from the view model or counted from it, so where the design
 * asks for something the data cannot supply, the screen says so rather than
 * inventing it. Two places where that bites, both deliberate:
 *
 *  - The reference score card carries a sparkline. There is no series behind a
 *    tension placement, so the card shows the placement itself on a real -1..+1
 *    track instead of a fabricated trend.
 *  - The commit button is inert. The decision layer is read-only, and a live
 *    button would claim to record a judgment that goes nowhere.
 */

const STATE_TAG: Record<EvidenceDisplayState, string> = {
  OBSERVED: 'sf-t-obs',
  ESTIMATED: 'sf-t-est',
  FOG: 'sf-t-fog',
  HINDSIGHT: 'sf-t-hind',
};

/** Rows that fit inside an aspect-locked screen before it would clip. */
const EVIDENCE_ROWS = 5;

function shortMetric(input: { metric?: { value: number; unit: string } | { low: number; high: number; unit: string } }): string {
  const { metric } = input;
  if (!metric) return '—';
  // Compact notation only where the digits would not fit; rounding 17,600 to
  // "18K" loses precision the source actually reports.
  const compact = (value: number) => (
    Math.abs(value) >= 1_000_000
      ? value.toLocaleString(undefined, { notation: 'compact' })
      : Math.abs(value) >= 1000
        ? Math.round(value).toLocaleString()
        : String(Math.round(value * 10) / 10)
  );
  return 'value' in metric ? compact(metric.value) : `${compact(metric.low)}–${compact(metric.high)}`;
}

/**
 * The cases whose arcs the timeline can show.
 *
 * A timeline is a run of decisions on one commitment, so mixing cases turns it
 * back into a list — the switcher moves between arcs rather than merging them.
 *
 * Derived, not listed. A case earns a place here by having more than one dated
 * decision; a single-decision case has no arc to draw and would render as one
 * dot on an axis. Ordered by when each commitment starts.
 */
function timelineCases(view: DecisionExperienceViewModel): readonly string[] {
  const firstDate = new Map<string, string>();
  const counts = new Map<string, number>();
  for (const { companyName, decisionDate } of view.timeline.options) {
    counts.set(companyName, (counts.get(companyName) ?? 0) + 1);
    const seen = firstDate.get(companyName);
    if (seen === undefined || decisionDate < seen) firstDate.set(companyName, decisionDate);
  }
  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([name]) => name)
    .sort((a, b) => firstDate.get(a)!.localeCompare(firstDate.get(b)!));
}

/** `2013-08-21` reads as `Aug 21, 2013`. */
function formatDecisionDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
  });
}
/** Stops are centred on their date, so the run is inset by half a row at each end. */
const TRACK_INSET_PCT = 5;
/**
 * Share of the track one month of elapsed time occupies.
 *
 * A fixed rate rather than a fit-to-track scale: normalising first-to-last would
 * pin any two stops to the extremes no matter how far apart they actually are,
 * which makes a short arc look long and says nothing. At a fixed rate the gap
 * means something, and a run that outgrows the track is rescaled to fit.
 */
const PCT_PER_MONTH = 4;

/**
 * The case on two axes.
 *
 * Horizontal is calendar date — the shared clock that release cadence and
 * verification cadence both run on, so the gaps mean something: Target's
 * decisions bunch up as the segment deteriorates. Elapsed-since-T0 would be the
 * same shape re-based, and only earns its keep when overlaying several cases.
 *
 * Vertical is verdict severity, so the arc is a line rather than a caption. It
 * only ever descends here because evidence only ever accumulates, but nothing
 * forces that — a case that recovered would climb.
 */
function timelineStops(view: DecisionExperienceViewModel, caseName: string) {
  const ordered = view.timeline.options
    .filter((option) => option.companyName === caseName)
    .sort((a, b) => a.decisionDate.localeCompare(b.decisionDate));
  const time = (date: string) => Date.parse(`${date}T00:00:00Z`);
  const first = time(ordered[0].decisionDate);
  const span = time(ordered[ordered.length - 1].decisionDate) - first || 1;

  return ordered.map((option) => ({
    option,
    band: bandFor(option.id),
    // The true share of the elapsed span. Nothing nudges a crowded pair apart
    // any more: on a chart whose slope is dollars per month, moving a point off
    // its date changes the number it appears to report.
    x: TRACK_INSET_PCT + ((time(option.decisionDate) - first) / span) * (100 - TRACK_INSET_PCT * 2),
  }));
}

/**
 * Calendar years across the span, evenly spaced because years are.
 *
 * The axis used to label each decision with its own year, which put the ticks
 * wherever the decisions happened to fall — so four years of even time read as
 * four uneven gaps. The ticks now come from the calendar and the dots sit
 * wherever they truly land against them.
 */
function yearTicks(stops: readonly { option: { decisionDate: string } }[]) {
  if (stops.length === 0) return [];
  const time = (date: string) => Date.parse(`${date}T00:00:00Z`);
  const first = time(stops[0].option.decisionDate);
  const span = time(stops[stops.length - 1].option.decisionDate) - first || 1;
  const firstYear = new Date(first).getUTCFullYear();
  const lastYear = new Date(first + span).getUTCFullYear();

  const ticks: { year: number; x: number }[] = [];
  for (let year = firstYear; year <= lastYear; year += 1) {
    const at = Date.UTC(year, 0, 1);
    ticks.push({
      year,
      x: TRACK_INSET_PCT + ((at - first) / span) * (100 - TRACK_INSET_PCT * 2),
    });
  }
  // A tick for a year whose January sits before the first decision would hang
  // off the left edge, so it is dropped rather than clamped onto the axis.
  return ticks.filter(({ x }) => x >= 0 && x <= 100);
}

/**
 * Display abbreviations for the switcher, which is narrower than a legal name.
 *
 * This is typography, not data: the full `companyName` from the model is what
 * labels the chart underneath, and an unlisted case falls back to it. The names
 * here are the ones the organizations are actually called, which no rule over
 * the legal name would produce — "U.S. Department of Veterans Affairs"
 * initialises to something nobody says.
 */
const SHORT_CASE_NAMES: Record<string, string> = {
  'Target Corporation': 'Target',
  'U.S. Department of Veterans Affairs': 'VA',
  'The University of Texas MD Anderson Cancer Center': 'Watson',
};

function shortCaseName(name: string): string {
  return SHORT_CASE_NAMES[name] ?? name;
}

/**
 * Money against calendar time, both linear, so the line between two decisions
 * has a slope and the slope is dollars per month.
 *
 * A level only says how much. The question a spend chart is for is how fast,
 * and how fast is rise over a run of real calendar time — which is why the
 * horizontal axis carries years rather than sequence labels. T3 tells you
 * nothing about pace; February 2014 does.
 *
 * Linear rather than log for the same reason: a log axis flattens exactly the
 * acceleration this is meant to show.
 */
function costScale(points: readonly CostSeriesPoint[]) {
  const totals = points.map(({ total }) => total);
  const max = Math.max(...totals) * 1.12;
  return {
    y: (total: number) => (100 - TRACK_INSET_PCT) - (total / max) * (100 - TRACK_INSET_PCT * 2),
    ticks: (() => {
      // Three gridlines, on a round number that lands near the top of the data.
      const step = 10 ** Math.floor(Math.log10(max / 3));
      const rounded = Math.ceil(max / 3 / step) * step;
      return [rounded, rounded * 2, rounded * 3].filter((tick) => tick <= max);
    })(),
    max,
  };
}

function StatusBar() {
  return (
    <div className="sf-ios-top">
      <span>9:41</span>
      <span className="sf-ios-icons" aria-hidden="true">
        <svg width="15" height="10" viewBox="0 0 17 11">
          <rect x="0" y="7" width="3" height="4" rx="1" /><rect x="4.7" y="5" width="3" height="6" rx="1" />
          <rect x="9.3" y="2.5" width="3" height="8.5" rx="1" /><rect x="13.9" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="20" height="10" viewBox="0 0 26 12">
          <rect x="0.5" y="0.9" width="22" height="10.2" rx="3" fill="none" stroke="#E9EEF4" opacity=".4" />
          <rect x="2" y="2.4" width="17" height="7.2" rx="1.6" fill="#E9EEF4" />
        </svg>
      </span>
    </div>
  );
}

function Phone({ children, hero = false }: { children: ReactNode; hero?: boolean }) {
  return (
    <div className={`sf-phone${hero ? ' sf-phone--hero' : ''}`}>
      <div className={`sf-screen${hero ? ' sf-screen--hero' : ''}`}>
        <StatusBar />
        <div className="sf-scr-body">
          {children}
          <div className="sf-home-ind" />
        </div>
      </div>
    </div>
  );
}

const LEG_TAG: Record<PresentationLeg['status'], string> = {
  pass: 'CLEARS',
  fail: 'BREAKS',
  'no-line': 'NO LINE',
};

/**
 * The slip.
 *
 * Borrowed from a betting slip because the shape of the question is the same:
 * one call at the top, and under it every leg that has to come in for the call
 * to hold. What a book does that a scorecard usually will not is refuse to
 * price something it cannot price — it pulls the line. That is exactly the
 * model's FOG state, and giving it the same treatment stops an unpriceable
 * condition from reading as a quiet pass.
 *
 * The order is deliberate: what breaks first, then what cannot be priced, then
 * what clears. A reader glancing at this wants the bad news at the top.
 */
/**
 * Screen two — the constraints review, the "why" behind the move.
 *
 * No recommendation, no date, no verb: those live on screen one now. This screen
 * exists to be swiped into and explains the call by showing each constraint the
 * commitment has to clear. A row carries its own signal — a bar that is already
 * over, within, or has no line to draw, and the overage as a figure — so the
 * status word is redundant and gone. Tap a row for the reasoning and the
 * evidence behind it.
 */
function ConstraintsScreen({ view, onBack }: { view: DecisionExperienceViewModel; spendLabel?: string; onBack?: () => void }) {
  const [openId, setOpenId] = useState<string>();
  const legs = useMemo(() => {
    const rank: Record<PresentationLeg['status'], number> = { fail: 0, 'no-line': 1, pass: 2 };
    return [...view.legs].sort((a, b) => rank[a.status] - rank[b.status]);
  }, [view]);

  return (
    <>
      <div className="sf-con-top">
        <button className="sf-back" type="button" onClick={onBack}>
          <span aria-hidden="true">‹</span> Back
        </button>
        <span className="sf-con-title">Constraints</span>
      </div>

      <div className="sf-cons">
        {legs.map((leg) => {
          const key = `${leg.kind}-${leg.id}`;
          const open = openId === key;
          return (
            <div className={`sf-con sf-con--${leg.bar.state}${open ? ' is-open' : ''}`} key={key}>
              <button
                className="sf-con-head"
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? undefined : key)}
              >
                <span className="sf-con-name">{leg.label}</span>
                <span className={`sf-con-bar sf-con-bar--${leg.bar.state}`}>
                  <span style={{ width: `${Math.max(leg.bar.fill, leg.bar.state === 'none' ? 0 : 0.08) * 100}%` }} />
                </span>
                <span className="sf-con-fig">{leg.figure ?? (leg.bar.state === 'none' ? 'no line' : leg.bar.state === 'over' ? 'over' : 'clears')}</span>
              </button>
              {open && (
                <div className="sf-con-body">
                  <p className="sf-con-detail">{leg.detail}</p>
                  {leg.evidence.length > 0 && (
                    <div className="sf-con-ev">
                      <span className="sf-con-ev-tag">Evidence</span>
                      {leg.evidence.map((source) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="sf-con-ev-link">
                          {source.title} ↗
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function CommitScreen({ view }: { view: DecisionExperienceViewModel; spendLabel?: string; onBack?: () => void }) {
  const basis = useMemo(() => {
    const counts = new Map<EvidenceDisplayState, number>();
    for (const input of view.inspectionInputs) {
      counts.set(input.displayState, (counts.get(input.displayState) ?? 0) + 1);
    }
    return [...counts.entries()].map(([state, count]) => `${count} ${state.slice(0, 3)}`).join(' · ');
  }, [view]);

  const commitment = view.recommendations[0];

  return (
    <>
      <div className="sf-kicker">Your judgment · {formatDecisionDate(view.cutoff)}</div>
      <div className="sf-scr-title">{commitment.displayLabel} — {commitment.object}</div>
      <p className="sf-scr-note">{commitment.authorizationReason}</p>

      <div className="sf-push" />
      <div className="sf-slip">
        <div className="sf-slip-row"><span>Operation</span><b>{commitment.displayLabel}</b></div>
        <div className="sf-slip-row"><span>Exposure staked</span><b>{shortMetric(view.primaryExposure.actualIntent)}</b></div>
        <div className="sf-slip-row"><span>Evidence basis</span><b>{basis}</b></div>
        <div className="sf-slip-row">
          <span>Reversible?</span>
          <b>{view.cards.irreversibility.level === 'high' ? 'Low' : 'Partial'} · {view.cards.reassessment.nextFeasibleAt}</b>
        </div>
        <button className="sf-commit" type="button" disabled>◉ Commit judgment</button>
      </div>
    </>
  );
}

const STAGES = [
  {
    num: 'i',
    name: 'Why — the constraints',
    sub: 'The move on screen one, explained. Every constraint the commitment has to clear, each carrying its own overage. Tap a row for the reasoning and the evidence.',
    gesture: 'swipe',
    icon: '⇄',
    note: 'Swiped into from the chart. Tap a row to expand it.',
    Screen: ConstraintsScreen,
  },
  {
    num: 'ii',
    name: 'Commit',
    sub: 'The one weighty act — a deliberate tap that locks your call and your exposure.',
    gesture: 'tap',
    icon: '◉',
    note: 'Reserved for commitment. It should feel like it cost something.',
    Screen: CommitScreen,
  },
] as const;

type Stop = ReturnType<typeof timelineStops>[number];

/**
 * A decision's dot colour.
 *
 * Two states, not four bands. The chart's job is now the money, and the verdict
 * rides along as an attribute of each point — so it has to be readable at a
 * glance without a legend. Green where the model would have let the commitment
 * continue, red where it would not.
 */
function toneFor(stop: Stop): 'ok' | 'bad' | 'uncertain' {
  if (stop.band === 'COLLISION' || stop.band === 'FLOOR') return 'bad';
  if (stop.band === 'FOG') return 'uncertain';
  return 'ok';
}

function SpendPlot({
  stops,
  points,
  selectedId,
  onSelect,
}: {
  stops: readonly Stop[];
  points: readonly CostSeriesPoint[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const scale = costScale(points);
  const at = (index: number) => ({ x: stops[index].x, y: scale.y(points[index].total) });
  // The goal line: an even burn from zero to what was committed, drawn dotted so
  // the solid actual line reads against it. Where actual sits above, the
  // commitment is spending past what it set out to. Only drawn when a committed
  // figure exists to anchor it.
  // A later audit can place the complete contracted commitment alongside the
  // realized figure used for the solid spend line. Read every figure attached
  // to the case and keep the strongest committed anchor for the goal line.
  const committed = stops
    .flatMap(({ option }) => option.cost)
    .filter((figure) => figure.kind === 'committed')
    .sort((a, b) => b.usdMillions - a.usdMillions)[0];
  const goal = committed && stops.length > 1
    ? { x1: stops[0].x, y1: scale.y(0), x2: stops[stops.length - 1].x, y2: scale.y(committed.usdMillions) }
    : undefined;

  return (
    <div className="sf-chart">
      <div className="sf-bands sf-bands--cost" aria-hidden="true">
        {scale.ticks.map((tick) => (
          <span key={tick} className="sf-ctick" style={{ top: `${scale.y(tick)}%` }}>
            {formatUsdMillions(tick)}
          </span>
        ))}
      </div>

      <div className="sf-plot" role="radiogroup" aria-label="Decision timeline">
        <svg className="sf-plot-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {scale.ticks.map((tick) => (
            <line key={tick} className="sf-gridline" x1="0" x2="100" y1={scale.y(tick)} y2={scale.y(tick)} />
          ))}
          {yearTicks(stops).map(({ year, x }) => (
            <line key={year} className="sf-yeargrid" x1={x} x2={x} y1="0" y2="100" />
          ))}
          {goal && (
            <line
              className="sf-goal"
              x1={goal.x1} y1={goal.y1} x2={goal.x2} y2={goal.y2}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {points.map((point, index) => index === 0 ? null : (
            <line
              key={point.id}
              className="sf-spend"
              x1={at(index - 1).x} y1={at(index - 1).y}
              x2={at(index).x} y2={at(index).y}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {goal && committed && (
          <span className="sf-goal-tag" style={{ left: `${goal.x2}%`, top: `${goal.y2}%` }}>
            goal · {formatUsdMillions(committed.usdMillions)}
          </span>
        )}
        {points.map((point, index) => {
          const stop = stops[index];
          const selected = stop.option.id === selectedId;
          return (
            <label
              className={`sf-cpt sf-cpt--${toneFor(stop)}${selected ? ' is-on' : ''}`}
              key={stop.option.id}
              style={{ left: `${stop.x}%`, top: `${scale.y(point.total)}%` }}
              title={`${formatDecisionDate(stop.option.decisionDate)} · ${formatUsdMillions(point.total)}${
                point.figure ? ` · ${point.figure.basis}` : ' · implied; no figure published at this date'
              }`}
            >
              <input
                type="radio"
                name="sf-decision"
                value={stop.option.id}
                checked={selected}
                onChange={() => onSelect(stop.option.id)}
              />
              <span className={`sf-cpt-dot${point.implied ? ' is-implied' : ''}`} />
              <span className="sf-cpt-val">{formatUsdMillions(point.total)}</span>
            </label>
          );
        })}

      </div>

      <div className="sf-axis" aria-hidden="true">
        {yearTicks(stops).map(({ year, x }) => (
          <span key={year} className="sf-axis-year" style={{ left: `${x}%` }}>{year}</span>
        ))}
      </div>

    </div>
  );
}

/**
 * What the model would have said at the tapped point.
 *
 * The chart shows the money; this shows the call. Keeping them on one screen is
 * the whole argument — the recommendation is dated, so reading it beside the
 * spend at that same date is what makes a verdict worth anything. Selecting a
 * different dot re-resolves the whole packet, so nothing here is written for
 * display.
 */
function Recommendation({ view }: { view: DecisionExperienceViewModel }) {
  const rec = decisionRecommendation(view);
  const adverse = rec.verb === 'HOLD' || rec.verb === 'EXIT' || rec.verb === 'TRIM';

  // The glance card is the move and nothing else: the date and the running
  // total are already on the chart, and the verdict's detail is one swipe away
  // on the constraints screen.
  return (
    <div className={`sf-rec sf-rec--${adverse ? 'bad' : 'ok'}`}>
      <div className="sf-move sf-move--glance">
        <span className="sf-move-tag">At a glance</span>
        <p className="sf-move-text">{rec.move}</p>
      </div>
    </div>
  );
}

/**
 * Money per month across the whole commitment.
 *
 * Deliberately the average and not the steepest segment. The steepest segment
 * on both cases is an artefact: Target's last leg divides a one-time exit
 * charge by the year before it, and VA's divides a whole-program lifecycle
 * estimate by the thirteen months before it was published. Neither is a rate
 * anything ran at, and quoting one would put a number on the screen that never
 * happened. The average over the commitment's own span is a real quantity.
 */
function averageRatePerMonth(points: readonly CostSeriesPoint[]): number {
  if (points.length < 2) return 0;
  const first = Date.parse(`${points[0].decisionDate}T00:00:00Z`);
  const last = Date.parse(`${points.at(-1)!.decisionDate}T00:00:00Z`);
  const months = (last - first) / (1000 * 60 * 60 * 24 * 365.25 / 12);
  return months > 0 ? points.at(-1)!.total / months : 0;
}

function TimelineScreen({
  view,
  caseName,
  cases,
  onSelect,
  onSelectCase,
}: {
  view: DecisionExperienceViewModel;
  caseName: string;
  cases: readonly string[];
  onSelect: (id: string) => void;
  onSelectCase: (name: string) => void;
}) {
  const stops = timelineStops(view, caseName);
  const points = costSeries(stops.map(({ option, band }) => ({
    id: option.id,
    sequence: option.sequence,
    decisionDate: option.decisionDate,
    cost: option.cost,
    adverse: band === 'COLLISION' || band === 'FLOOR',
  })));
  const firstAdverse = stops.find((stop) => toneFor(stop) === 'bad');
  const rate = averageRatePerMonth(points);

  return (
    <>
      <div className="sf-app-head">
        <div className="sf-app-id"><span className="sf-avatar" /><span className="sf-app-name">StratOS</span></div>
        <span className="sf-bell" aria-hidden="true">
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" stroke="#9098A4" strokeWidth="1.4">
            <path d="M4 7a4.5 4.5 0 0 1 9 0c0 4 1.5 5 1.5 5h-12S4 11 4 7Z" /><path d="M7 14.5a1.7 1.7 0 0 0 3 0" />
          </svg>
        </span>
      </div>

      <div className="sf-cases" role="radiogroup" aria-label="Case">
        {cases.map((name) => (
          <label className={`sf-case${name === caseName ? ' is-on' : ''}`} key={name}>
            <input
              type="radio"
              name="sf-case"
              value={name}
              checked={name === caseName}
              onChange={() => onSelectCase(name)}
            />
            {shortCaseName(name)}
          </label>
        ))}
      </div>

      <div className="sf-kicker">{caseName} · money recognised against the commitment</div>
      <div className="sf-narrative">
        {rate > 0
          ? <>Averaged <b>{formatUsdMillions(rate)} a month</b>{firstAdverse ? <> — and kept running past <b>{formatDecisionDate(firstAdverse.option.decisionDate)}</b>.</> : '.'}</>
          : <>The commitment&rsquo;s cost never became public while it was being decided.</>}
      </div>

      <SpendPlot stops={stops} points={points} selectedId={view.timeline.selectedId} onSelect={onSelect} />

      <Recommendation view={view} />

      <div className="sf-legend sf-legend--cost">
        <span className="sf-legend-label">
          Totals are money recognised against the commitment, not cash out the door.
          {/* Only the cases that end in a charge overstate, so only they say so. */}
          {points.some(({ figure }) => figure?.basis.includes('exit charge'))
            && ' An exit charge impairs capital already counted here.'}
          {points.some(({ figure }) => figure?.kind === 'hindsight')
            && ' The closing figure was published after the last decision could use it.'}
        </span>
      </div>
    </>
  );
}

/**
 * Where a decision sits on the severity axis.
 *
 * The display vocabulary has three verdicts while the review has four outcomes,
 * so a breached floor arrives as COLLISION. The cause recovers it: a value or
 * risk floor is what the review calls FLOOR, and it belongs on its own band
 * rather than flattened against a capacity collision.
 */
const BANDS = ['FIT', 'FOG', 'COLLISION', 'FLOOR'] as const;
type Band = typeof BANDS[number];

function bandFor(id: string): Band {
  const { verdict, cause } = createDecisionExperienceViewModel(id);
  if (cause.kind === 'value-floor' || cause.kind === 'risk-floor') return 'FLOOR';
  return verdict as Band;
}

/** Each stop carries its own verdict, so the rail shows where the arc turns. */
function verdictFor(id: string): DecisionExperienceViewModel['verdict'] {
  return createDecisionExperienceViewModel(id).verdict;
}

export default function StratosFlowPage() {
  const cases = useMemo(() => timelineCases(createDecisionExperienceViewModel()), []);
  const [caseName, setCaseName] = useState(cases[0]);
  const [decisionId, setDecisionId] = useState<string>();
  const view = useMemo(() => createDecisionExperienceViewModel(decisionId), [decisionId]);

  // The selected decision's cumulative spend, composed once here and handed to
  // the recommendation screens — the running total is a property of the case,
  // not of the decision, so it cannot come from the view model alone.
  const spendLabel = useMemo(() => {
    const stops = timelineStops(view, caseName);
    const points = costSeries(stops.map(({ option, band }) => ({
      id: option.id,
      sequence: option.sequence,
      decisionDate: option.decisionDate,
      cost: option.cost,
      adverse: band === 'COLLISION' || band === 'FLOOR',
    })));
    const point = points.find(({ id }) => id === view.timeline.selectedId);
    if (!point) return undefined;
    return `${formatUsdMillions(point.total)} ${point.implied ? 'implied' : 'recognised'}`;
  }, [view, caseName]);

  // The constraints screen's back control returns attention to the chart, which
  // is where the recommendation and the selection live.
  const scrollToHero = () => {
    document.querySelector('.sf-hero-phone')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // Switching case moves the selection with it. Leaving it behind would leave
  // the chart with no selected stop while the flow below still resolved to a
  // decision the chart no longer shows.
  const selectCase = (name: string) => {
    setCaseName(name);
    setDecisionId(timelineStops(view, name)[0]?.option.id);
  };

  return (
    <main className="app-shell sf-page">
      <SiteHeader current="stratos" />
      <div className="sf-wrap">
        <div className="sf-hero">
          <div>
            <div className="sf-eyebrow">StratOS · judgment flow</div>
            <h1>The verdict <b>moves</b>. Watch where.</h1>
            <p className="sf-lede">
              A case is a run of dated decisions, not one judgment. The library opens on the arc —
              pick a stop and the flow below re-resolves to it. Everything shown is read from the
              real decision model or counted from it.
            </p>
          </div>
          <div className="sf-hero-phone">
            <Phone hero>
              <TimelineScreen
                view={view}
                caseName={caseName}
                cases={cases}
                onSelect={setDecisionId}
                onSelectCase={selectCase}
              />
            </Phone>
          </div>
        </div>

        <hr className="sf-rule" />

        <div className="sf-sect-tag">01 — The flow</div>
        <h2 className="sf-h2">Case hero → evidence drill → commit</h2>

        <p className="sf-sect-intro">
          <span className="sf-mono">
            {view.companyName} — {view.headline}, as of {formatDecisionDate(view.cutoff)}.
          </span>{' '}
          Each screen owns one job, and each job gets the gesture whose stakes match it.
        </p>

        <div className="sf-flow">
          {STAGES.map(({ num, name, sub, gesture, icon, note, Screen }) => (
            <div className="sf-stage" key={num}>
              <div className="sf-stage-head">
                <span className="sf-stage-num">{num}</span>
                <span className="sf-stage-name">{name}</span>
              </div>
              <div className="sf-stage-sub">{sub}</div>
              <Phone><Screen view={view} spendLabel={spendLabel} onBack={scrollToHero} /></Phone>
              <span className={`sf-gbadge sf-g-${gesture}`}>
                <span className="sf-gicon" aria-hidden="true">{icon}</span>
                {gesture[0].toUpperCase() + gesture.slice(1)}
              </span>
              <div className="sf-gnote">{note}</div>
            </div>
          ))}
        </div>

        <footer className="sf-foot">
          <span>Driven by DecisionExperienceViewModel · nothing authored for display</span>
          <span>Commit is inert — the decision layer is read-only</span>
        </footer>
      </div>
    </main>
  );
}
