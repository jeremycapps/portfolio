import { useMemo, useState, type ReactNode } from 'react';

import { SiteHeader } from '@/components/site-header';
import {
  createDecisionExperienceViewModel,
  decisionRecommendation,
  type DecisionExperienceViewModel,
  type PresentationLeg,
} from '@/lib/stratos/decisions/presentation';
import type { EvidenceDisplayState } from '@/lib/stratos/decisions/decision-point';
import { costSeries, formatUsdMillions, type CostFigure, type CostSeriesPoint } from '@/lib/stratos/decisions/cost';
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
  "McDonald's Corporation": "McDonald's",
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
  const observedMax = Math.max(0, ...totals);
  // A case with no disclosed dollars has no money line. Keep the coordinate
  // system finite for its dated decision markers without manufacturing a $0
  // measurement or asking Math.log10(0) to produce chart ticks.
  const max = observedMax === 0 ? 1 : observedMax * 1.12;
  return {
    y: (total: number) => (100 - TRACK_INSET_PCT) - (total / max) * (100 - TRACK_INSET_PCT * 2),
    ticks: (() => {
      if (observedMax === 0) return [];
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

/**
 * Screen three — the operation role as one proposed task.
 *
 * "Do ___ because ___", from the situated recommendation rather than the raw
 * engine token: the move is the action, the focus is the reason, and the owner
 * is a natural role. An exit has no one left to ask, so the owner chip is
 * dropped rather than faked. Verdict-toned, like the rest of the step.
 */
function ProposedTaskScreen({ view, onBack }: { view: DecisionExperienceViewModel; spendLabel?: string; onBack?: () => void }) {
  const rec = decisionRecommendation(view);
  const tone = toneOfBand(bandOf(view));

  return (
    <>
      <div className="sf-con-top">
        <button className="sf-back" type="button" onClick={onBack}>
          <span aria-hidden="true">‹</span> Back
        </button>
        <span className="sf-con-title">Proposed task</span>
      </div>

      <div className="sf-push" />
      <div className={`sf-task sf-task--${tone}`}>
        <p className="sf-task-do">{rec.move}</p>
        {rec.focus ? (
          <p className="sf-task-because"><span className="sf-task-lead">Because</span> {rec.focus.detail}</p>
        ) : null}
        {rec.owner ? (
          <div className="sf-task-owner"><span className="sf-task-owner-tag">Owner</span> {rec.owner}</div>
        ) : null}
      </div>
      <div className="sf-push" />
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
    name: 'The task',
    sub: 'The operation role, resolved to one thing to do: do this, because that. The owner is the natural role to get a read from before the next commitment.',
    gesture: 'swipe',
    icon: '⇄',
    note: 'One proposed task, re-resolved to the selected step.',
    Screen: ProposedTaskScreen,
  },
  {
    num: 'iii',
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
  const hasCostLine = stops.some(({ option }) => option.cost.length > 0);
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
          {hasCostLine && points.map((point, index) => index === 0 ? null : (
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
              title={hasCostLine
                ? `${formatDecisionDate(stop.option.decisionDate)} · ${formatUsdMillions(point.total)}${
                    point.figure ? ` · ${point.figure.basis}` : ' · implied; no figure published at this date'
                  }`
                : `${formatDecisionDate(stop.option.decisionDate)} · no public cost figure`}
            >
              <input
                type="radio"
                name="sf-decision"
                value={stop.option.id}
                checked={selected}
                onChange={() => onSelect(stop.option.id)}
              />
              <span className={`sf-cpt-dot${point.implied ? ' is-implied' : ''}`} />
              <span className="sf-cpt-val">{hasCostLine ? formatUsdMillions(point.total) : 'no line'}</span>
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

/** Band → tone class. The verdict is carried by colour, never a word on screen. */
function toneOfBand(band: Band): 'ok' | 'uncertain' | 'bad' {
  return band === 'FIT' ? 'ok' : band === 'FOG' ? 'uncertain' : 'bad';
}

/**
 * Confidence in the read, as evidence completeness of the decision's conditions.
 *
 * A leg priced either way (pass or fail) is evidence; a `no-line` leg is a
 * condition the cutoff-safe packet could not place. The share that is priced is
 * a real, countable confidence — low at commitment, higher as evidence lands —
 * and it pairs honestly with the verdict colour. Undefined when there are no
 * legs, so the caller suppresses it rather than printing 0 / NaN.
 */
function confidenceOf(view: DecisionExperienceViewModel): number | undefined {
  const total = view.legs.length;
  if (total === 0) return undefined;
  const resolved = view.legs.filter(({ status }) => status !== 'no-line').length;
  return Math.round((resolved / total) * 100);
}

/** The derived possibility line, used when a decision has no authored pivot. */
function convergenceFallback(
  hasDollars: boolean,
  committed: CostFigure | undefined,
  point: CostSeriesPoint | undefined,
  overshot: boolean,
): string {
  if (!hasDollars) return 'No dollar goal disclosed — convergence reads on the offering, not spend.';
  if (!committed || !point) return 'No public goal to converge on yet.';
  return overshot
    ? `Past the goal — ${formatUsdMillions(point.total)} against a ${formatUsdMillions(committed.usdMillions)} commitment.`
    : `${formatUsdMillions(point.total)} of ${formatUsdMillions(committed.usdMillions)} committed — still reachable.`;
}

/**
 * The convergence answer, stated beneath the chart — and only this.
 *
 * The chart is the convergence view; the two things it cannot draw are the
 * pivot that would still reach the goal and how much of the read is evidenced.
 * Value is the dot labels, verdict is the colour, operation is screen three, so
 * nothing else belongs here. Both lines inherit the step's verdict tone.
 */
function ConvergenceGlance({
  view,
  points,
  committed,
}: {
  view: DecisionExperienceViewModel;
  points: readonly CostSeriesPoint[];
  committed?: CostFigure;
}) {
  const band = bandOf(view);
  const tone = toneOfBand(band);
  const point = points.find(({ id }) => id === view.timeline.selectedId) ?? points.at(-1);
  const hasDollars = Boolean(committed) || points.some(({ total }) => total > 0);
  const overshot = Boolean(committed && point && point.total > committed.usdMillions);
  const pivot =
    CONVERGENCE_PIVOTS[view.timeline.selectedId] ?? convergenceFallback(hasDollars, committed, point, overshot);
  const confidence = confidenceOf(view);

  return (
    // The verdict is carried by colour; the word rides along only for a screen reader.
    <div className={`sf-glance sf-glance--${tone}`} aria-label={`Convergence, verdict ${VERDICT_WORDS[band]}`}>
      <p className="sf-glance-pivot">{pivot}</p>
      {confidence !== undefined && (
        <div className="sf-glance-conf">
          <span className="sf-conf-tag">Confidence</span>
          <span className="sf-conf-val">{confidence}%</span>
        </div>
      )}
    </div>
  );
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
  // The strongest committed figure anchors the goal line and the convergence
  // read; kept here so the readout and the plot agree on the same goal.
  const committed = stops
    .flatMap(({ option }) => option.cost)
    .filter((figure) => figure.kind === 'committed')
    .sort((a, b) => b.usdMillions - a.usdMillions)[0];

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

      <div className="sf-kicker">{caseName}</div>

      <SpendPlot stops={stops} points={points} selectedId={view.timeline.selectedId} onSelect={onSelect} />

      <ConvergenceGlance view={view} points={points} committed={committed} />
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

/** The band a whole view resolves to, without re-fetching it by id. */
function bandOf(view: DecisionExperienceViewModel): Band {
  if (view.cause.kind === 'value-floor' || view.cause.kind === 'risk-floor') return 'FLOOR';
  return view.verdict as Band;
}

/**
 * Plain verdict words, stated relative to the goal rather than in engine terms.
 *
 * The engine's FIT/FOG/COLLISION are machine bands; on a convergence chart the
 * only question is whether the commitment is closing on its goal, drifting, or
 * has broken away. Kept as one map because the wording is still being tuned —
 * change it here and every step re-labels.
 */
const VERDICT_WORDS: Record<Band, string> = {
  FIT: 'Converging',
  FOG: 'Unresolved',
  COLLISION: 'Diverged',
  FLOOR: 'Diverged',
};

/**
 * The pivot that could still converge a commitment on its goal from a given
 * step. Editorial — a "what would you do from here" line, not a counted case
 * fact — so it lives with the page, keyed by decision id, until the case schema
 * carries it. A missing key falls back to the possibility statement alone.
 */
const CONVERGENCE_PIVOTS: Record<string, string> = {
  'watson-md-anderson-t0-2013-10-18':
    'Gate the next dollar on one treated patient before scale.',
  'watson-md-anderson-t1-2014-02-06':
    'Prove adoption at one site before authorising wider rollout.',
  'watson-md-anderson-t2-2017-02-19':
    'Restart only behind a fixed EHR-integration and patient-use gate.',
};

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
