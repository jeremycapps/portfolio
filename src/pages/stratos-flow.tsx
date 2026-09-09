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

/**
 * The three verdict buckets, in "bad news first" order.
 *
 * Each constraint carries one of exactly three readings, and they are the same
 * three the whole engine speaks: a priced line that breaks (COLLISION), a line
 * that cannot be priced at all (FOG), and a line that clears (FIT). The engine
 * rolls these up to a single overall verdict — one COLLISION buries every clear
 * and every fog beneath it — so a case that is genuinely mixed reads as one flat
 * word. This tally is where the mix stays visible: it counts the legs by reading
 * before the roll-up hides them, which is the only place all three coexist on
 * screen at once.
 */
const VERDICT_BUCKETS = [
  { status: 'fail', word: 'Breaks', tone: 'bad' },
  { status: 'no-line', word: 'No line', tone: 'uncertain' },
  { status: 'pass', word: 'Clears', tone: 'ok' },
] as const satisfies readonly {
  status: PresentationLeg['status'];
  word: string;
  tone: 'ok' | 'uncertain' | 'bad';
}[];

/**
 * The tally strip — a verdict count across the case's constraints.
 *
 * Sits above the leg list on screen two and answers, at a glance, the question
 * the single rolled-up verdict cannot: how many conditions clear, how many are
 * unpriceable, how many break. A bucket at zero still renders, dimmed, so the
 * shape of the read is honest — three zeros would be a lie the mixed case tells.
 */
function ConstraintTally({ legs }: { legs: readonly PresentationLeg[] }) {
  const counts = useMemo(() => {
    const tally: Record<PresentationLeg['status'], number> = { pass: 0, fail: 0, 'no-line': 0 };
    for (const leg of legs) tally[leg.status] += 1;
    return tally;
  }, [legs]);

  return (
    <div className="sf-tally" role="list" aria-label="Constraint verdicts">
      {VERDICT_BUCKETS.map(({ status, word, tone }) => {
        const n = counts[status];
        return (
          <span
            key={status}
            role="listitem"
            className={`sf-tally-item sf-tally-item--${tone}${n === 0 ? ' is-empty' : ''}`}
          >
            <b className="sf-tally-n">{n}</b>
            <span className="sf-tally-word">{word}</span>
          </span>
        );
      })}
    </div>
  );
}

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

      <ConstraintTally legs={view.legs} />

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

function DecisionLibrary() {
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

type KlarnaOperation = 'AUTHORIZE' | 'HOLD' | 'REDUCE SCOPE';

const KLARNA_EVIDENCE = {
  internal: [
    {
      label: 'Assistant share of support chats',
      value: 'Two-thirds',
      detail: 'The AI assistant was handling roughly two-thirds of customer-service chats.',
      status: 'OBSERVED',
    },
    {
      label: 'Average resolution time',
      value: '11 → 2 min',
      detail: 'Company-reported average resolution time fell from eleven minutes to two.',
      status: 'OBSERVED',
    },
    {
      label: '2024 profit improvement',
      value: '$40M',
      detail: 'A projected improvement, not a realized audited outcome at the decision boundary.',
      status: 'ESTIMATED',
    },
    {
      label: 'Receiving human capacity',
      value: 'Shrinking',
      detail: 'The next commitment would continue reducing the people available to absorb AI escalations.',
      status: 'OBSERVED',
    },
  ],
  external: [
    {
      label: 'Blended customer satisfaction',
      value: 'On par',
      detail: 'Klarna reported satisfaction comparable with human agents at the aggregate level.',
      status: 'OBSERVED',
    },
    {
      label: 'Repeat inquiries',
      value: '−25%',
      detail: 'The company reported fewer repeat inquiries after the assistant entered service.',
      status: 'OBSERVED',
    },
    {
      label: 'Complex-segment resolution quality',
      value: 'No segment line',
      detail: 'The aggregate result did not establish quality for the cases most likely to need escalation.',
      status: 'UNKNOWN',
    },
    {
      label: 'High-severity customer outcomes',
      value: 'Not reported',
      detail: 'Fraud, disputes, hardship, and other high-consequence cases had no separate outcome line.',
      status: 'UNKNOWN',
    },
    {
      label: 'Escalated backlog age',
      value: 'Not reported',
      detail: 'The packet did not show whether difficult cases were accumulating after transfer to people.',
      status: 'UNKNOWN',
    },
  ],
} as const;

const KLARNA_OPERATIONS: readonly {
  id: KlarnaOperation;
  label: string;
  description: string;
  exposure: string;
  protection: string;
}[] = [
  {
    id: 'AUTHORIZE',
    label: 'Authorize',
    description: 'Release a bounded next increment at the scale actually demonstrated.',
    exposure: 'Deepen the mandate for one measured increment.',
    protection: 'Keep the human-capacity floor and rollback conditions in force.',
  },
  {
    id: 'HOLD',
    label: 'Hold',
    description: 'Pause the next increment while leaving the AI program in place.',
    exposure: 'Do not reduce receiving human capacity further yet.',
    protection: 'Clear the missing quality and capacity lines before release.',
  },
  {
    id: 'REDUCE SCOPE',
    label: 'Reduce scope',
    description: 'Narrow where the mandate applies instead of treating every segment alike.',
    exposure: 'Continue in simple, demonstrated segments only.',
    protection: 'Route complex work to retained human capacity.',
  },
];

const FLOW_STEPS = [
  ['1', 'Decision'],
  ['2', 'Evidence'],
  ['3', 'Divergence'],
  ['4', 'StratOS'],
  ['5', 'Clearing'],
  ['6', 'Hindsight'],
] as const;

function FlowButton({ children, onClick, disabled = false }: { children: ReactNode; onClick: () => void; disabled?: boolean }) {
  return <button className="sf-x-button" type="button" onClick={onClick} disabled={disabled}>{children}</button>;
}

function EvidenceStatus({ status }: { status: 'OBSERVED' | 'ESTIMATED' | 'UNKNOWN' }) {
  return <span className={`sf-x-status sf-x-status--${status.toLowerCase()}`}>{status}</span>;
}

function KlarnaEvidencePanel() {
  return (
    <div className="sf-x-evidence-grid">
      {(['internal', 'external'] as const).map((side) => (
        <section className={`sf-x-evidence sf-x-evidence--${side}`} key={side} aria-labelledby={`sf-x-${side}`}>
          <header>
            <span className="sf-x-overline">{side === 'internal' ? 'Internal condition' : 'External consequence'}</span>
            <h3 id={`sf-x-${side}`}>{side === 'internal' ? 'What looked strong' : 'What the decision still could not establish'}</h3>
          </header>
          <ul>
            {KLARNA_EVIDENCE[side].map((item) => (
              <li key={item.label}>
                <div className="sf-x-evidence-line">
                  <EvidenceStatus status={item.status} />
                  <strong>{item.label}</strong>
                  <b>{item.value}</b>
                </div>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function KlarnaDecisionFlow() {
  const [step, setStep] = useState(1);
  const [furthestStep, setFurthestStep] = useState(1);
  const [choice, setChoice] = useState<KlarnaOperation>();
  const [decisionComplete, setDecisionComplete] = useState(false);
  const chosen = KLARNA_OPERATIONS.find((operation) => operation.id === choice);

  const goTo = (next: number) => {
    setStep(next);
    setFurthestStep((current) => Math.max(current, next));
  };

  const completeDecision = () => {
    if (!choice) return;
    setDecisionComplete(true);
    goTo(2);
  };

  const chooseOperation = (operation: KlarnaOperation) => {
    setChoice(operation);
    if (decisionComplete) {
      setDecisionComplete(false);
      setFurthestStep(1);
    }
  };

  return (
    <section className="sf-x-lab" id="decision-lab" aria-labelledby="sf-x-lab-title">
      <header className="sf-x-lab-head">
        <div>
          <span className="sf-x-overline">A contemporaneous decision · early 2024</span>
          <h2 id="sf-x-lab-title">Klarna: make the call before seeing what happened later.</h2>
        </div>
        <p>Only evidence available at the boundary is shown until your judgment is complete.</p>
      </header>

      <nav className="sf-x-stepper" aria-label="Klarna decision steps">
        {FLOW_STEPS.map(([number, label], index) => {
          const value = index + 1;
          const locked = value > furthestStep;
          return (
            <button
              key={number}
              type="button"
              aria-current={step === value ? 'step' : undefined}
              disabled={locked}
              onClick={() => setStep(value)}
            >
              <span>{number}</span>{label}
            </button>
          );
        })}
      </nav>

      <div className="sf-x-stage" aria-live="polite">
        {step === 1 && (
          <div>
            <span className="sf-x-stage-count">01 / 06 · Present the decision</span>
            <div className="sf-x-cutoff-glance" aria-label="Attractive evidence available at the cutoff">
              <span><b>⅔</b> chats handled by AI</span>
              <span><b>11 → 2 min</b> resolution time</span>
              <span><b>$40M</b> projected profit improvement</span>
            </div>
            <div className="sf-x-prose-stage">
              <p className="sf-x-stage-kicker">The AI pilot is outperforming expectations.</p>
              <h3>Should Klarna deepen the AI mandate while continuing to reduce human support capacity?</h3>
              <p>Make the decision as it appeared in early 2024. Later outcomes remain unavailable.</p>
            </div>
            <fieldset className="sf-x-choices sf-x-choices--decision">
              <legend>Choose your contemporaneous decision</legend>
              {KLARNA_OPERATIONS.map((operation) => (
                <label className={choice === operation.id ? 'is-selected' : ''} key={operation.id}>
                  <input
                    type="radio"
                    name="klarna-operation"
                    value={operation.id}
                    checked={choice === operation.id}
                    onChange={() => chooseOperation(operation.id)}
                  />
                  <span><strong>{operation.label}</strong>{operation.description}</span>
                </label>
              ))}
            </fieldset>
            <FlowButton onClick={completeDecision} disabled={!choice}>Lock decision and inspect the evidence</FlowButton>
          </div>
        )}

        {step === 2 && (
          <div>
            <span className="sf-x-stage-count">02 / 06 · Inspect the evidence</span>
            <KlarnaEvidencePanel />
            <div className="sf-x-stage-action">
              <p>Statuses describe what the decision packet can support—not whether a signal is favorable.</p>
              <FlowButton onClick={() => goTo(3)}>Read the disagreement</FlowButton>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="sf-x-prose-stage">
            <span className="sf-x-stage-count">03 / 06 · Find the divergence</span>
            <h3>The dashboard is telling two different stories.</h3>
            <div className="sf-x-signals" aria-label="Diverging organizational signals">
              <p><span>Internal efficiency</span><strong className="is-good">Strong ↑</strong></p>
              <p><span>Complex-case external consequence</span><strong className="is-unknown">Insufficient evidence ?</strong></p>
              <p><span>Receiving human capacity</span><strong className="is-bad">Shrinking ↓</strong></p>
            </div>
            <div className="sf-x-dependency">
              <span className="sf-x-overline">The dependency</span>
              <p>The AI system still transfers high-complexity work to humans while the human capacity receiving that work is being reduced.</p>
            </div>
            <blockquote>The question is not “Was the AI good or bad?” It is whether the signals supporting further commitment agree across both loci of evidence.</blockquote>
            <FlowButton onClick={() => goTo(4)}>See the StratOS decision</FlowButton>
          </div>
        )}

        {step === 4 && (
          <div>
            <span className="sf-x-stage-count">04 / 06 · StratOS decision</span>
            {chosen && <div className="sf-x-result-head"><p>Your call <strong>{chosen.id}</strong></p><p>StratOS call <strong>HOLD</strong></p></div>}
            <div className="sf-x-result">
              <div className="sf-x-result-primary">
                <span className="sf-x-overline">Bounded result · FOG + COLLISION</span>
                <h3>HOLD — next scope increment.</h3>
                <p>Current evidence demonstrates efficiency at aggregate scale but does not establish the quality or operational resilience of complex-case handling under reduced human capacity.</p>
              </div>
              <dl className="sf-x-result-fields">
                <div><dt>Evidence supporting the call</dt><dd>Aggregate volume, speed, satisfaction, and repeat-inquiry measures are strong.</dd></div>
                <div><dt>Signals that disagree</dt><dd>Internal efficiency is strong; complex-case external consequence is unresolved.</dd></div>
                <div><dt>What remains unknown</dt><dd>Segment quality, high-severity outcomes, and escalated backlog age.</dd></div>
                <div><dt>Binding constraint</dt><dd>Human exception capacity</dd></div>
                <div><dt>Intervention level</dt><dd>L2 · Business case</dd></div>
                <div><dt>Bounded operations</dt><dd>HOLD capacity reduction · REDUCE SCOPE to demonstrated segments</dd></div>
              </dl>
            </div>
            <FlowButton onClick={() => goTo(5)}>See what clears the hold</FlowButton>
          </div>
        )}

        {step === 5 && decisionComplete && (
          <div>
            <span className="sf-x-stage-count">05 / 06 · What clears the hold</span>
            <div className="sf-x-prose-stage">
              <h3>Turn uncertainty into an evidence plan.</h3>
              <p>A HOLD is useful only when it identifies what must become true before the answer can become yes.</p>
            </div>
            <div className="sf-x-clear-grid">
              <article><b>01</b><strong>Measure complex-case quality</strong><p>Separate fraud, disputes, hardship, and other complex segments from blended satisfaction.</p></article>
              <article><b>02</b><strong>Instrument escalated queues</strong><p>Monitor backlog age and high-severity outcomes after cases transfer to people.</p></article>
              <article><b>03</b><strong>Protect exception capacity</strong><p>Establish a minimum human-capacity floor and a maximum utilization threshold.</p></article>
              <article><b>04</b><strong>Define rollback</strong><p>Set explicit quality, backlog, and capacity thresholds that reverse the next increment.</p></article>
            </div>
            <div className="sf-x-reassess">
              <span className="sf-x-overline">Reassessment trigger</span>
              <p>Reassess after two consecutive 30-day operating cycles in which segment quality, backlog age, and the human-capacity floor are all observed.</p>
              <div>
                <span>Commitment operation <b>HOLD</b></span>
                <span>Path operation <b>REDUCE SCOPE</b></span>
              </div>
            </div>
            <FlowButton onClick={() => goTo(6)}>Unlock what became known later</FlowButton>
          </div>
        )}

        {step === 6 && decisionComplete && (
          <div className="sf-x-prose-stage sf-x-hindsight">
            <span className="sf-x-stage-count">06 / 06 · Hindsight unlocked</span>
            <span className="sf-x-status sf-x-status--hindsight">HINDSIGHT · 2025</span>
            <h3>Later evidence does not get to rewrite the original packet.</h3>
            <p>In 2025, Klarna’s CEO said cost had become too predominant in the support strategy and that lower quality followed. The company began rebuilding a model in which customers could reach people again.</p>
            <blockquote>The test is not whether StratOS predicted the headline. It is whether the process identified the missing evidence and binding constraint before exposure increased.</blockquote>
            <button className="sf-x-text-button" type="button" onClick={() => { setStep(1); setFurthestStep(6); }}>Review the decision again</button>
          </div>
        )}
      </div>
    </section>
  );
}

function RecruiterCaseSummary() {
  return (
    <section className="sf-x-case-summary" id="case-study" aria-labelledby="sf-x-case-title">
      <header>
        <span className="sf-x-overline">Klarna case study · the five-minute read</span>
        <h2 id="sf-x-case-title">A strong AI pilot surfaced a capacity decision.</h2>
        <p>I reframed the question from “Is the AI performing?” to “Is the operating system ready for the next commitment?”</p>
      </header>
      <div className="sf-x-case-grid">
        <article>
          <span>01 · Situation</span>
          <h3>Scaling looked rational.</h3>
          <p>AI handled two-thirds of chats, resolution time fell from 11 minutes to 2, satisfaction was reported on par with human agents, and profit improvement was projected at $40 million.</p>
        </article>
        <article>
          <span>02 · Read</span>
          <h3>The proof reached aggregate performance.</h3>
          <p>Complex-case quality and escalated backlog each deserve their own signal—especially as human capacity for those cases becomes the binding resource.</p>
        </article>
        <article>
          <span>03 · Decision</span>
          <h3>Size the next increment to the evidence; keep the AI program running.</h3>
          <p>Focus scope on demonstrated segments, protect exception capacity, and make further expansion conditional on segment-level evidence.</p>
        </article>
        <article>
          <span>04 · Product judgment</span>
          <h3>Turn uncertainty into a release plan.</h3>
          <p>Name the binding constraint, set clearing conditions, assign the intervention to the business case, and define when the decision should be reassessed.</p>
        </article>
      </div>
      <div className="sf-x-proof-line">
        <strong>What this demonstrates</strong>
        <span>Problem framing</span><span>Systems thinking</span><span>Metric architecture</span><span>AI product judgment</span>
      </div>
    </section>
  );
}

function FlowModel() {
  return (
    <section className="sf-x-model" id="model" aria-labelledby="sf-x-model-title">
      <div className="sf-x-section-head">
        <span className="sf-x-overline">The supporting model</span>
        <h2 id="sf-x-model-title">The structure I used to find the gap.</h2>
        <p>StratOS separates the enterprise question, the operating altitude, and the location of proof so conflicting signals cannot disappear inside one score.</p>
      </div>
      <div className="sf-x-model-grid">
        <article>
          <header><b>3</b><div><strong>Enterprise questions</strong><span>The primary conceptual axis</span></div></header>
          <div className="sf-x-axis-poles">
            <section><strong>Economics</strong><p>Does this system create sufficient economic value to sustain itself?</p></section>
            <section><strong>Commitment</strong><p>Can the organization deliver what it has committed to?</p></section>
            <section><strong>Renewal</strong><p>Can the organization keep adapting as its environment changes?</p></section>
          </div>
        </article>
        <article>
          <header><b>2</b><div><strong>Operating altitudes</strong><span>Architecture and mechanics stay distinct</span></div></header>
          <div className="sf-x-axis-poles">
            <section><strong>StratOps · Architecture</strong><p>What machine are we building?</p></section>
            <section><strong>BizOps · Mechanics</strong><p>Where is the running machine succeeding or failing?</p></section>
          </div>
        </article>
        <article>
          <header><b>2</b><div><strong>Loci of evidence</strong><span>Where the proof lives</span></div></header>
          <div className="sf-x-axis-poles">
            <section><strong>Internal condition</strong><p>What is happening inside the organization?</p></section>
            <section><strong>External consequence</strong><p>What is the organization causing outside itself?</p></section>
          </div>
        </article>
      </div>
      <div className="sf-x-equation" aria-label="Three by two by two equals twelve poles"><span>3</span><i>×</i><span>2</span><i>×</i><span>2</span><i>=</i><strong>12 poles</strong></div>
      <details className="sf-x-origin-story">
        <summary>How the model emerged <span aria-hidden="true">＋</span></summary>
        <div>
          <h3>StratOS did not begin with 60 metrics.</h3>
          <p>It began with two existing structures: an L1–L5 enterprise strategy framework, introduced through an experienced product and operating leader, and a set of 12 common C-suite roles.</p>
          <p>I mapped those roles by the resources and organizational capacities they governed, whether their decisive evidence lived inside the company or in the market, and whether their signals behaved more like leading or lagging indicators.</p>
          <blockquote>Why twelve?</blockquote>
          <p>The goal was not to invent a taxonomy. It was to discover whether the roles shared a smaller structure. They resolved into three enterprise questions, two operating altitudes, and two loci of evidence.</p>
          <p>The final axis evolved beyond <strong>lead versus lag</strong>. Its more useful property was <strong>location of proof</strong>: internal condition and external consequence could diverge.</p>
        </div>
      </details>
    </section>
  );
}

const ACTION_LEVELS = [
  ['L1', 'Strategy', 'What are we trying to accomplish?'],
  ['L2', 'Business case', 'What must be true before we commit?'],
  ['L3', 'Implementation', 'What must be true before we launch?'],
  ['L4', 'Operations', 'What must remain true while we run?'],
  ['L5', 'Audit', 'Did the claimed outcome actually occur?'],
] as const;

function FlowDepth() {
  return (
    <section className="sf-x-depth" aria-labelledby="sf-x-depth-title">
      <div className="sf-x-section-head">
        <span className="sf-x-overline">Action after diagnosis</span>
        <h2 id="sf-x-depth-title">Divergence says where to look. L1–L5 says where to intervene.</h2>
        <p>The 3×2×2 model identifies what dimension of enterprise condition is in question. L1–L5 identifies the level at which that condition should be governed or changed.</p>
      </div>
      <div className="sf-x-levels">
        {ACTION_LEVELS.map(([level, name, question]) => <article key={level}><b>{level}</b><div><strong>{name}</strong><p>{question}</p></div></article>)}
      </div>
      <div className="sf-x-level-bridge" aria-label="From observed symptom to intervention level">
        <article><span>Observed signal</span><strong>BizOps · Internal condition</strong><p>Escalated work concentrates where human capacity is the binding resource.</p></article>
        <b aria-hidden="true">→</b>
        <article><span>Intervention</span><strong>L2 · Business case</strong><p>The capacity gate belongs in the architecture of the commitment.</p></article>
      </div>
      <details className="sf-x-disclosure">
        <summary>Explore the 60-cell accountability model <span aria-hidden="true">＋</span></summary>
        <div>
          <p><strong>12 perspectives × 5 levels = 60 accountable outcomes.</strong> The matrix assigns every material question an owner, lifecycle stage, evidence requirement, and consequence.</p>
          <p>The 60 cells are measurement depth, not the opening hook. They become useful after the 3×2×2 model has located the disagreement and the decision has named the intervention level.</p>
        </div>
      </details>
    </section>
  );
}

export default function StratosFlowPage() {
  return (
    <main className="app-shell sf-page sf-x-page">
      <SiteHeader current="stratos" />
      <div className="sf-x-wrap">
        <header className="sf-x-hero">
          <span className="sf-x-overline">Product strategy · enterprise AI · decision intelligence</span>
          <h1>I turn ambiguous AI rollouts into <b>decisions teams can act on.</b></h1>
          <p>In this Klarna case study, the headline metrics made expansion look rational. I named the constraint that decides the next increment—human exception capacity—and turned it into a bounded decision, an evidence plan, and a reassessment rule.</p>
          <div className="sf-x-hero-actions"><a href="#case-study">Read the case</a><a href="#decision-lab">Make the decision yourself</a></div>
        </header>

        <RecruiterCaseSummary />
        <KlarnaDecisionFlow />
        <FlowModel />
        <FlowDepth />

        <section className="sf-x-work" aria-labelledby="sf-x-work-title">
          <div>
            <span className="sf-x-overline">Why I built this</span>
            <h2 id="sf-x-work-title">I’m strongest at the front end of ambiguous product problems.</h2>
            <p className="sf-x-work-thesis">Finding the underlying structure, defining the right conceptual model, and turning it into something teams can build, measure, and make decisions with.</p>
          </div>
          <div>
            <p>StratOS is my attempt to make complex organizational decisions legible by showing where strategy, operations, and evidence agree—and where they diverge. It is the accountability layer of a larger system: the part that answers whether an organization is getting what it said it wanted.</p>
            <div className="sf-x-capabilities" aria-label="Capabilities demonstrated by this case">
              {['Problem framing', 'Conceptual modeling', 'Systems thinking', 'Metric architecture', 'Product judgment', 'AI product thinking'].map((capability) => <span key={capability}>{capability}</span>)}
            </div>
            <p className="sf-x-role-line">Product strategy · 0→1 product management · AI product management · technical product management · decision intelligence · platform product management · enterprise AI product · product operations strategy · applied research / product</p>
            <div className="sf-x-work-links"><a href="/about">View my background</a><a href="mailto:jeremy@nycwork.space">Contact me</a></div>
          </div>
        </section>

        <footer className="sf-x-footer">Cutoff-safe retrospective · company-reported observations, estimates, unknowns, and hindsight remain distinct.</footer>
      </div>
    </main>
  );
}
