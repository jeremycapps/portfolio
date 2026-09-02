import { useMemo, useState, type ReactNode } from 'react';

import { SiteHeader } from '@/components/site-header';
import {
  createDecisionExperienceViewModel,
  type DecisionExperienceViewModel,
  type PresentationTension,
} from '@/lib/stratos/decisions/presentation';
import type { EvidenceDisplayState, ResolvedDecisionInput } from '@/lib/stratos/decisions/decision-point';
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
 * The case whose arc the timeline shows.
 *
 * A timeline is a run of decisions on one commitment, so mixing cases turns it
 * back into a list. Scoped to Target Canada while the arc pattern is being
 * worked out; a case switcher comes with it.
 */
const TIMELINE_CASE = 'Target Corporation';

/** Smallest share of the track between two stops, so a cluster stays readable. */
const MIN_GAP_PCT = 11.5;
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
function timelineStops(view: DecisionExperienceViewModel) {
  const ordered = view.timeline.options
    .filter((option) => option.companyName === TIMELINE_CASE)
    .sort((a, b) => a.decisionDate.localeCompare(b.decisionDate));
  const time = (date: string) => Date.parse(`${date}T00:00:00Z`);
  const first = time(ordered[0].decisionDate);
  const span = time(ordered[ordered.length - 1].decisionDate) - first || 1;

  let previous = -Infinity;
  return ordered.map((option, index) => {
    const exact = TRACK_INSET_PCT + ((time(option.decisionDate) - first) / span) * (100 - TRACK_INSET_PCT * 2);
    const x = Math.max(exact, previous + MIN_GAP_PCT);
    previous = x;
    const band = bandFor(option.id);
    const year = option.decisionDate.slice(0, 4);
    return {
      option,
      band,
      x,
      // Bands run top-to-bottom worst-last, so severity reads as descent.
      y: TRACK_INSET_PCT + (BANDS.indexOf(band) / (BANDS.length - 1)) * (100 - TRACK_INSET_PCT * 2),
      // A year is labelled once, at its first decision.
      year: index === 0 || ordered[index - 1].decisionDate.slice(0, 4) !== year ? year : undefined,
    };
  });
}

/** The timeline's own label for this decision — the short form of the headline. */
function shortLabel(view: DecisionExperienceViewModel): string {
  const option = view.timeline.options.find(({ id }) => id === view.timeline.selectedId);
  return option?.label ?? view.headline;
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

/** The placement on its real track. Replaces the reference sparkline, which
 *  would need a series the model does not have. */
function PoleCard({ tension, tone }: { tension: PresentationTension; tone: 'cool' | 'warm' }) {
  const offset = ((tension.position + 1) / 2) * 100;
  return (
    <div className={`sf-scard sf-scard--${tone}`}>
      <div className="sf-scard-top">
        <div>
          <div className="sf-scard-name">{tension.name}</div>
          <div className="sf-scard-status">
            {tension.poleLabel ? `LEANING · ${tension.poleLabel.toUpperCase()}` : 'UNRESOLVED'}
          </div>
        </div>
        <span className="sf-scard-chev" aria-hidden="true">›</span>
      </div>
      <div
        className="sf-track"
        role="img"
        aria-label={`${tension.name} placed at ${tension.position} between ${tension.leftLabel} and ${tension.rightLabel}`}
      >
        <span className="sf-track-line" />
        <span className="sf-track-mid" />
        <span className={`sf-track-dot sf-track-dot--${tone}`} style={{ left: `${offset}%` }} />
      </div>
      <div className="sf-scard-poles">
        <span className={tension.side === 'l' ? 'is-on' : undefined}>{tension.leftLabel}</span>
        <span className={tension.side === 'r' ? 'is-on' : undefined}>{tension.rightLabel}</span>
      </div>
    </div>
  );
}

function CaseScreen({ view }: { view: DecisionExperienceViewModel }) {
  const placed = (view.tensions ?? []).filter((tension) => tension.side !== 'neutral').slice(0, 2);
  return (
    <>
      <div className="sf-kicker">Case · {view.caseName}</div>
      <div className="sf-scr-title sf-scr-title--big">{view.companyName}</div>
      <div className="sf-kicker sf-kicker--accent">{view.sequence} · {shortLabel(view)}</div>

      <div className="sf-verdict-line">
        <strong className={`sf-v sf-v--${view.verdict.toLowerCase()}`}>{view.verdict}</strong>
        <span className="sf-cause">{view.cause.displayLabel}</span>
      </div>

      {placed.length > 0 ? (
        placed.map((tension, index) => (
          <PoleCard key={tension.id} tension={tension} tone={index === 0 ? 'cool' : 'warm'} />
        ))
      ) : (
        <div className="sf-scard sf-scard--empty">
          <div className="sf-scard-name">No dated placement</div>
          <p>Placements are dated. This decision has no scorecard of its own, so it shows no poles rather than borrowing another date&rsquo;s.</p>
        </div>
      )}

      <div className="sf-push" />
      <div className="sf-kicker">Pending judgment</div>
      <div className="sf-split">
        {view.recommendations.map((recommendation, index) => (
          <div key={recommendation.plane} className={index === 0 ? 'sf-split-a' : 'sf-split-b'}>
            {recommendation.displayLabel}{index === 1 ? ' ›' : ''}
          </div>
        ))}
      </div>
    </>
  );
}

function EvidenceScreen({ view }: { view: DecisionExperienceViewModel }) {
  const rows = useMemo(() => {
    const seen = new Set<string>();
    const material = view.inspectionInputs.filter((input) => {
      if (input.materiality !== 'material') return false;
      const key = input.factRef ?? input.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const ordered = [...material].sort((a, b) => (a.displayState === 'FOG' ? 1 : 0) - (b.displayState === 'FOG' ? 1 : 0));
    return ordered.slice(0, EVIDENCE_ROWS);
  }, [view]);
  const remaining = view.inspectionInputs.length - rows.length;

  return (
    <>
      <div className="sf-kicker">{view.primaryExposureTitle}</div>
      <div className="sf-scr-title">What the verdict rests on</div>

      <div className="sf-ev-list">
        {rows.map((input: ResolvedDecisionInput) => (
          <div className="sf-ev" key={input.id}>
            <span className={`sf-ev-tag ${STATE_TAG[input.displayState]}`}>{input.displayState}</span>
            <span className="sf-ev-label">{input.label}</span>
            <span className={`sf-ev-val ${input.displayState === 'FOG' ? 'is-fog' : ''}`}>
              {input.displayState === 'FOG' ? '?' : shortMetric(input)}
            </span>
          </div>
        ))}
        {view.hindsight.slice(0, 1).map((input) => (
          <div className="sf-ev" key={input.id}>
            <span className={`sf-ev-tag ${STATE_TAG.HINDSIGHT}`}>HINDSIGHT</span>
            <span className="sf-ev-label">{input.label}</span>
            <span className="sf-ev-val is-hind">held</span>
          </div>
        ))}
      </div>

      <div className="sf-push" />
      <div className="sf-kicker sf-kicker--centre">
        ↕ {remaining > 0 ? `${remaining} more · ` : ''}assumptions &amp; sources
      </div>
    </>
  );
}

function CommitScreen({ view }: { view: DecisionExperienceViewModel }) {
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
      <div className="sf-kicker">Your judgment · {view.sequence}</div>
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
    name: 'Case hero',
    sub: 'A self-contained verdict card. Glanceable thesis, current pole placement, the pending question.',
    gesture: 'swipe',
    icon: '⇄',
    note: 'Between cases & tensions. Fully reversible — swipe back costs nothing.',
    Screen: CaseScreen,
  },
  {
    num: 'ii',
    name: 'Evidence drill',
    sub: 'Unpack what the verdict stands on. Every fact carries its provenance state — the honesty layer.',
    gesture: 'scroll',
    icon: '↕',
    note: 'Depth within one verdict. Pure browsing — no commitment implied.',
    Screen: EvidenceScreen,
  },
  {
    num: 'iii',
    name: 'Commit',
    sub: 'The bet slip. The one weighty act — a deliberate tap that locks your call and your exposure.',
    gesture: 'tap',
    icon: '◉',
    note: 'Reserved for commitment. It should feel like it cost something.',
    Screen: CommitScreen,
  },
] as const;

function TimelineScreen({
  view,
  onSelect,
}: {
  view: DecisionExperienceViewModel;
  onSelect: (id: string) => void;
}) {
  const stops = timelineStops(view);
  const selectedStop = stops.find(({ option }) => option.id === view.timeline.selectedId);
  const adverse = stops.filter(({ option }) => verdictFor(option.id) !== 'FOG').length;
  const caseLabel = stops[0]?.option.companyName ?? TIMELINE_CASE;

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

      <div className="sf-kicker">{caseLabel} · {stops.length} dated decisions</div>
      <div className="sf-narrative">
        {adverse === 0
          ? <>Every decision on this commitment reads <b>uncertain</b> rather than adverse.</>
          : <>{adverse} of {stops.length} decisions {adverse === 1 ? 'reads' : 'read'} <b>adverse</b> rather than merely uncertain.</>}
      </div>

      <div className="sf-chart">
        <div className="sf-bands" aria-hidden="true">
          {BANDS.map((band) => <span key={band} className={`sf-band sf-band--${band.toLowerCase()}`}>{band}</span>)}
        </div>

        <div className="sf-plot" role="radiogroup" aria-label="Decision timeline">
          <svg className="sf-plot-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {BANDS.map((band, index) => {
              const y = TRACK_INSET_PCT + (index / (BANDS.length - 1)) * (100 - TRACK_INSET_PCT * 2);
              return <line key={band} className="sf-gridline" x1="0" x2="100" y1={y} y2={y} />;
            })}
            <polyline
              className="sf-arc"
              points={stops.map(({ x, y }) => `${x},${y}`).join(' ')}
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {stops.map(({ option, band, x, y }) => {
            const selected = option.id === view.timeline.selectedId;
            return (
              <label
                className={`sf-pt${selected ? ' is-on' : ''}`}
                key={option.id}
                style={{ left: `${x}%`, top: `${y}%` }}
                title={`${option.sequence} · ${option.decisionDate} · ${option.label}`}
              >
                <input
                  type="radio"
                  name="sf-decision"
                  value={option.id}
                  checked={selected}
                  onChange={() => onSelect(option.id)}
                />
                <span className={`sf-pt-dot sf-pt-dot--${band.toLowerCase()}`} />
                <span className="sf-pt-seq">{option.sequence}</span>
              </label>
            );
          })}

          {selectedStop && (
            <span className="sf-tip" style={{ left: `${selectedStop.x}%`, top: `${selectedStop.y}%` }}>
              {selectedStop.option.sequence} · {selectedStop.option.decisionDate}
            </span>
          )}
        </div>

        <div className="sf-axis" aria-hidden="true">
          {stops.filter(({ year }) => year).map(({ year, x }) => (
            <span key={year} className="sf-axis-year" style={{ left: `${x}%` }}>{year}</span>
          ))}
        </div>
      </div>

      <div className="sf-legend">
        <span className="sf-legend-label">{selectedStop?.option.label}</span>
        <span className={`sf-legend-verdict sf-legend-verdict--${(selectedStop?.band ?? 'fog').toLowerCase()}`}>
          {selectedStop?.band}
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
  const [decisionId, setDecisionId] = useState<string>();
  const view = useMemo(() => createDecisionExperienceViewModel(decisionId), [decisionId]);

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
              <TimelineScreen view={view} onSelect={setDecisionId} />
            </Phone>
          </div>
        </div>

        <hr className="sf-rule" />

        <div className="sf-sect-tag">01 — The flow</div>
        <h2 className="sf-h2">Case hero → evidence drill → commit</h2>

        <p className="sf-sect-intro">
          <span className="sf-mono">
            {view.companyName}, {view.sequence} — {view.headline}, cutoff {view.cutoff}.
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
              <Phone><Screen view={view} /></Phone>
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
