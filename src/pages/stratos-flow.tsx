import { useMemo, useState } from 'react';

import { SiteHeader } from '@/components/site-header';
import {
  createDecisionExperienceViewModel,
  type DecisionExperienceViewModel,
  type PresentationTension,
} from '@/lib/stratos/decisions/presentation';
import type { EvidenceDisplayState, ResolvedDecisionInput } from '@/lib/stratos/decisions/decision-point';
import './stratos-flow.css';

/**
 * A test surface for the judgment-flow mapping.
 *
 * Three screens — case hero, evidence drill, commit — driven entirely by the
 * real DecisionExperienceViewModel, so the point of the page is to show which
 * parts of the design already have data behind them and which do not. Nothing
 * here is authored for display: every value is read from the view model or
 * counted from it.
 *
 * The commit screen's button is deliberately inert. There is no write path in
 * the decision layer yet, and a button that appeared to record a judgment would
 * misrepresent that.
 */

const STEPS = ['case', 'evidence', 'commit'] as const;
type Step = typeof STEPS[number];

const STEP_LABELS: Record<Step, { title: string; gesture: string; note: string }> = {
  case: { title: 'Case', gesture: 'swipe', note: 'Between cases. Fully reversible — nothing is decided by arriving.' },
  evidence: { title: 'Evidence', gesture: 'scroll', note: 'Depth within one verdict. Reading, never committing.' },
  commit: { title: 'Commit', gesture: 'tap', note: 'Reserved for commitment. It should feel like it cost something.' },
};

const STATE_MARK: Record<EvidenceDisplayState, string> = {
  OBSERVED: '●',
  ESTIMATED: '◐',
  FOG: '?',
  HINDSIGHT: '◆',
};

function metricText(input: { metric?: { value: number; unit: string } | { low: number; high: number; unit: string } }): string {
  const { metric } = input;
  if (!metric) return '—';
  return 'value' in metric
    ? `${metric.value.toLocaleString()} ${metric.unit}`
    : `${metric.low.toLocaleString()}–${metric.high.toLocaleString()} ${metric.unit}`;
}

/** The share of the split bar that sits left of centre, for a -1..+1 position. */
function poleOffset(position: number): number {
  return ((position + 1) / 2) * 100;
}

function PoleRow({ tension }: { tension: PresentationTension }) {
  return (
    <div className="sf-pole">
      <div className="sf-pole-head">
        <span className="sf-pole-name">{tension.name}</span>
        <span className="sf-pole-verdict">
          {tension.poleLabel ? `LEANING · ${tension.poleLabel.toUpperCase()}` : 'UNRESOLVED'}
        </span>
      </div>
      <div className="sf-pole-bar" role="img" aria-label={`${tension.name}: ${tension.position} between ${tension.leftLabel} and ${tension.rightLabel}`}>
        <span className="sf-pole-track" />
        <span className="sf-pole-centre" />
        <span className="sf-pole-dot" style={{ left: `${poleOffset(tension.position)}%` }} />
      </div>
      <div className="sf-pole-ends">
        <span className={tension.side === 'l' ? 'is-selected' : undefined}>{tension.leftLabel}</span>
        <span className={tension.side === 'r' ? 'is-selected' : undefined}>{tension.rightLabel}</span>
      </div>
    </div>
  );
}

function CaseScreen({ view }: { view: DecisionExperienceViewModel }) {
  return (
    <>
      <p className="sf-eyebrow">Case · {view.caseName}</p>
      <h2 className="sf-case-title">{view.companyName}</h2>
      <p className="sf-case-sub">{view.sequence} · {view.headline}</p>

      <div className={`sf-verdict sf-verdict--${view.verdict.toLowerCase()}`}>
        <span className="sf-verdict-label">Verdict</span>
        <strong>{view.verdict}</strong>
        <span className="sf-cause-tag">{view.cause.displayLabel}</span>
      </div>
      <p className="sf-cause-summary">{view.cause.summary}</p>

      {view.tensions ? (
        <div className="sf-poles">
          {view.tensions.filter((tension) => tension.side !== 'neutral').slice(0, 2).map((tension) => (
            <PoleRow key={tension.id} tension={tension} />
          ))}
        </div>
      ) : (
        <p className="sf-absent">
          No tension placement at this date. Placements are dated, and this decision has no
          scorecard of its own — it renders without poles rather than borrowing another date's.
        </p>
      )}

      <div className="sf-pending">
        <p className="sf-eyebrow">Pending judgment</p>
        <ol>
          {view.recommendations.map((recommendation) => (
            <li key={recommendation.plane}>
              <strong>{recommendation.operation}</strong>
              <span>{recommendation.object}</span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

function EvidenceRow({ input }: { input: ResolvedDecisionInput }) {
  return (
    <details className={`sf-ev sf-ev--${input.displayState.toLowerCase()}`}>
      <summary>
        <span className="sf-ev-mark" aria-hidden="true">{STATE_MARK[input.displayState]}</span>
        <span className="sf-ev-state">{input.displayState}</span>
        <span className="sf-ev-label">{input.label}</span>
        <span className="sf-ev-metric">{metricText(input)}</span>
      </summary>
      <dl>
        {input.sourceTitle && <div><dt>Source</dt><dd>{input.sourceTitle}</dd></div>}
        {input.evidence && <div><dt>Locator</dt><dd>{input.evidence.locator}</dd></div>}
        {input.publishedAt && <div><dt>Published</dt><dd>{input.publishedAt}</dd></div>}
        <div><dt>Materiality</dt><dd>{input.materiality}</dd></div>
        {input.calculation && <div><dt>Calculation</dt><dd>{input.calculation}</dd></div>}
      </dl>
    </details>
  );
}

function EvidenceScreen({ view }: { view: DecisionExperienceViewModel }) {
  return (
    <>
      <p className="sf-eyebrow">{view.primaryExposureTitle}</p>
      <h2 className="sf-case-title">What the verdict rests on</h2>
      <p className="sf-case-sub">Cutoff {view.cutoff} · every row carries its provenance</p>

      <div className="sf-ev-list">
        {view.inspectionInputs.map((input) => <EvidenceRow input={input} key={input.id} />)}
      </div>

      <p className="sf-eyebrow sf-section-gap">Separate outcome layer</p>
      <p className="sf-case-sub">
        Published after the cutoff. Never used by the dated verdict.
      </p>
      <div className="sf-ev-list">
        {view.hindsight.map((input) => <EvidenceRow input={input} key={input.id} />)}
      </div>

      <p className="sf-eyebrow sf-section-gap">Assumptions</p>
      <ul className="sf-plain">
        {view.assumptions.map((assumption) => (
          <li key={assumption.id}>
            <span className="sf-tag">{assumption.displayLabel}</span>{assumption.statement}
          </li>
        ))}
      </ul>
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
      <p className="sf-eyebrow">Your judgment · {view.sequence}</p>
      <h2 className="sf-case-title">{commitment.operation} — {commitment.object}</h2>
      <p className="sf-case-sub">{commitment.authorizationReason}</p>

      <dl className="sf-ledger">
        <div><dt>Operation</dt><dd>{commitment.operation}</dd></div>
        <div><dt>Exposure staked</dt><dd>{metricText(view.primaryExposure.actualIntent)}</dd></div>
        <div><dt>Evidence basis</dt><dd>{basis}</dd></div>
        <div>
          <dt>Reversible?</dt>
          <dd>
            {view.cards.irreversibility.level === 'high' ? 'Low reversibility' : 'Partly reversible'}
            {' · reassess '}{view.cards.reassessment.nextFeasibleAt}
          </dd>
        </div>
        <div><dt>Next safe scale</dt><dd>{view.validatedScale.value}</dd></div>
      </dl>

      <button className="sf-commit" type="button" disabled>◉ Commit judgment</button>
      <p className="sf-absent">
        Inert. The decision layer is read-only — there is no representation of a user's own
        judgment yet, so a working button would claim to record something that goes nowhere.
      </p>
    </>
  );
}

export default function StratosFlowPage() {
  const [decisionId, setDecisionId] = useState<string>();
  const [step, setStep] = useState<Step>('case');
  const view = useMemo(() => createDecisionExperienceViewModel(decisionId), [decisionId]);

  return (
    <main className="app-shell sf-page">
      <SiteHeader current="stratos" />
      <div className="sf-wrap">
        <header className="sf-head">
          <p className="sf-eyebrow">StratOS · judgment flow test surface</p>
          <h1>Case → evidence → commit</h1>
          <p className="sf-lede">
            The three screens driven by the real decision view model. Everything shown is read
            from it or counted from it; nothing is authored for display.
          </p>
        </header>

        <label className="sf-picker">
          <span>Decision</span>
          <select
            value={view.timeline.selectedId}
            onChange={(event) => setDecisionId(event.target.value)}
          >
            {view.timeline.options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.sequence} · {option.companyName} · {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="sf-stage">
          <nav className="sf-steps" aria-label="Flow step">
            {STEPS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                aria-current={candidate === step ? 'step' : undefined}
                onClick={() => setStep(candidate)}
              >
                <strong>{STEP_LABELS[candidate].title}</strong>
                <span>{STEP_LABELS[candidate].gesture}</span>
              </button>
            ))}
          </nav>

          <div className="sf-phone">
            <div className="sf-screen">
              {step === 'case' && <CaseScreen view={view} />}
              {step === 'evidence' && <EvidenceScreen view={view} />}
              {step === 'commit' && <CommitScreen view={view} />}
            </div>
          </div>

          <p className="sf-gesture-note">
            <strong>{STEP_LABELS[step].gesture}</strong> — {STEP_LABELS[step].note}
          </p>
        </div>
      </div>
    </main>
  );
}
