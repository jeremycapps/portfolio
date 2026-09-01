import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, RotateCcw } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  createDecisionExperienceViewModel,
  type DecisionExperienceViewModel,
} from '@/lib/stratos/decisions/presentation';
import type { OperationRecommendation } from '@/lib/stratos/decisions/judgment';
import type { ResolvedDecisionInput } from '@/lib/stratos/decisions/decision-point';
import './stratos-v2.css';

type SystemId = 'discernment' | 'invention' | 'operations' | 'execution' | 'advantage' | 'resource';
type Constraint = 'People' | 'Finance' | 'Time' | 'Risk';

interface SystemModel {
  id: SystemId;
  name: string;
  conversion: string;
  tension: string;
  internal: string;
  external: string;
  binding: Constraint;
  goalMonth: number;
  limitMonth: number;
  stages: string[];
  questions: string[];
  weights: number[];
  current: number;
  goal: number;
  reachable: number;
  capacity: [number, number];
  cycle1: number;
  cycle2: number;
}

const AIVA = ['Author', 'Implement', 'Verify', 'Adjust'];

export const STRATOS_SYSTEMS: SystemModel[] = [
  { id: 'discernment', name: 'Discernment', conversion: 'Signal → conviction → revised judgment', tension: 'Structured conviction ↔ open inquiry', internal: 'Structured conviction', external: 'Open inquiry', binding: 'Time', goalMonth: 8.6, limitMonth: 10.5, stages: ['Signal', 'Inquiry', 'Conviction', 'Feedback'], questions: ['What signal merits attention?', 'What inquiry could disconfirm the current belief?', 'What conviction authorizes action?', 'What feedback changes the next judgment?'], weights: [16, 42, 24, 18], current: 68, goal: 48, reachable: 54, capacity: [50, 78], cycle1: 9, cycle2: 7 },
  { id: 'invention', name: 'Invention', conversion: 'Knowledge → adopted offering → learning', tension: 'Codified fluency ↔ novel offering', internal: 'Codified fluency', external: 'Novel offering', binding: 'People', goalMonth: 16.8, limitMonth: 12.2, stages: ['Knowledge', 'Offering', 'Adoption', 'Learning'], questions: ['What reusable knowledge exists?', 'Can it become an offering?', 'Is it adopted in context?', 'What becomes reusable learning?'], weights: [20, 40, 25, 15], current: 42, goal: 78, reachable: 66, capacity: [30, 70], cycle1: 40, cycle2: 32 },
  { id: 'operations', name: 'Operations', conversion: 'Work → customer-visible flow → corrected system', tension: 'Execution discipline ↔ system flow', internal: 'Execution discipline', external: 'System flow', binding: 'People', goalMonth: 13, limitMonth: 11.7, stages: ['Work', 'Flow', 'Outcome', 'Constraint'], questions: ['What work is required?', 'Does value flow?', 'When does the customer receive it?', 'Which constraint changes next?'], weights: [20, 40, 24, 16], current: 31, goal: 68, reachable: 57, capacity: [22, 61], cycle1: 12, cycle2: 9.5 },
  { id: 'execution', name: 'Execution', conversion: 'Assurance → release → operational learning', tension: 'Risk assurance ↔ bounded release', internal: 'Risk assurance', external: 'Bounded release', binding: 'Risk', goalMonth: 17.2, limitMonth: 13.6, stages: ['Assurance', 'Release', 'Adoption', 'Feedback'], questions: ['What must be assured?', 'What requires bounded release?', 'When does adoption produce evidence?', 'What changes the next release?'], weights: [16, 46, 22, 16], current: 32, goal: 76, reachable: 64, capacity: [20, 65], cycle1: 18, cycle2: 15.3 },
  { id: 'advantage', name: 'Advantage', conversion: 'Capability → external value → economic evidence', tension: 'Controlled capability ↔ ecosystem value', internal: 'Controlled capability', external: 'Ecosystem value', binding: 'Finance', goalMonth: 14.2, limitMonth: 12.8, stages: ['Capability', 'External value', 'Evidence', 'Reconfigure'], questions: ['What capability is controlled?', 'How does it create external value?', 'What economic evidence proves it?', 'What boundary changes next?'], weights: [18, 38, 25, 19], current: 38, goal: 75, reachable: 64, capacity: [25, 67], cycle1: 36, cycle2: 29 },
  { id: 'resource', name: 'Resource', conversion: 'Capacity → deployment → return → renewal', tension: 'Capacity preservation ↔ capital return', internal: 'Capacity preservation', external: 'Capital return', binding: 'Finance', goalMonth: 11.8, limitMonth: 13.8, stages: ['Capacity', 'Deployment', 'Return', 'Renewal'], questions: ['What capacity is available?', 'How is it deployed?', 'When is return realized?', 'How is capacity renewed?'], weights: [20, 35, 28, 17], current: 65, goal: 47, reachable: 52, capacity: [48, 76], cycle1: 26, cycle2: 22 },
];

const CONSTRAINTS: Array<{ name: Constraint; note: string; value: number; tone: string }> = [
  { name: 'People', note: '3 critical roles near capacity', value: 78, tone: 'warning' },
  { name: 'Finance', note: 'funding peak precedes evidence', value: 69, tone: 'warning' },
  { name: 'Time', note: '15-month commitment window', value: 54, tone: 'normal' },
  { name: 'Risk', note: 'irreversible exposure at release', value: 73, tone: 'risk' },
];

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

interface Feasibility {
  compression: number;
  calendarGoal: number;
  constraintMonth: number;
  calendarPass: boolean;
  constraintPass: boolean;
  loads: Array<[string, number]>;
}

export function calculateFeasibility(system: SystemModel, elapsed: number): Feasibility {
  const compression = system.cycle2 / elapsed;
  const people = clamp((system.binding === 'People' ? 72 : 58) + (compression - 1) * 85, 35, 96);
  const finance = clamp((system.binding === 'Finance' ? 72 : 54) + (compression - 1) * 48, 30, 96);
  const risk = clamp((system.binding === 'Risk' ? 72 : 57) + (compression - 1) * 75, 28, 96);
  const loads: Array<[string, number]> = [['People capacity', people], ['Finance capacity', finance], ['Risk tolerance', risk]];
  loads.sort((a, b) => b[1] - a[1]);
  const calendarGoal = system.goalMonth / compression;
  const constraintMonth = clamp(system.limitMonth - Math.max(0, loads[0][1] - 70) * 0.14, 7.2, 15.8);
  return {
    compression,
    calendarGoal,
    constraintMonth,
    calendarPass: calendarGoal <= 15,
    constraintPass: constraintMonth >= calendarGoal,
    loads,
  };
}

const displayDate = (date: string) => new Intl.DateTimeFormat('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
}).format(new Date(`${date}T00:00:00Z`));

const displayMetric = (input: DecisionExperienceViewModel['currentCohort']) => {
  if (!input.metric || !('value' in input.metric)) return input.label;
  return `${input.metric.value} ${input.metric.unit}`;
};

function RecommendationCard({ recommendation }: { recommendation: OperationRecommendation }) {
  const boundary = Object.entries(recommendation.boundary)
    .filter(([, value]) => value !== undefined);
  return (
    <article className="sv2-recommendation">
      <header>
        <div>
          <p className="sv2-eyebrow">{recommendation.plane} operation</p>
          <h3>{recommendation.displayLabel}</h3>
        </div>
        <span>{recommendation.operation}</span>
      </header>
      <p className="sv2-recommendation-object">{recommendation.object}</p>
      <dl className="sv2-recommendation-meta">
        <div><dt>Owner</dt><dd>{recommendation.owner}</dd></div>
        <div><dt>Authority</dt><dd>{recommendation.authorityStatus}</dd></div>
        <div><dt>Why authorized</dt><dd>{recommendation.authorizationReason}</dd></div>
      </dl>
      <section>
        <h4>Boundary</h4>
        <ul>{boundary.map(([label, value]) => <li key={label}><strong>{label}</strong> {String(value)}</li>)}</ul>
      </section>
      <section>
        <h4>Gate · {recommendation.gate.evidenceStatus}</h4>
        <ul>{recommendation.gate.conditions.map((condition) => <li key={condition}>{condition}</li>)}</ul>
      </section>
      <section>
        <h4>Reassessment</h4>
        <dl className="sv2-reassessment">
          <div><dt>Trigger</dt><dd>{recommendation.reassessment.trigger}</dd></div>
          <div><dt>If improving</dt><dd>{recommendation.reassessment.ifImproving}</dd></div>
          <div><dt>If ineffective</dt><dd>{recommendation.reassessment.ifIneffective}</dd></div>
          <div><dt>At boundary</dt><dd>{recommendation.reassessment.ifBoundaryExhausted}</dd></div>
        </dl>
      </section>
    </article>
  );
}

const STATUS_ICONS = {
  OBSERVED: '●',
  ESTIMATED: '△',
  FOG: '?',
  HINDSIGHT: '◆',
} as const;

function EvidenceDisclosure({ input }: { input: ResolvedDecisionInput }) {
  return (
    <details className={`sv2-evidence-item sv2-status--${input.displayState.toLowerCase()}`}>
      <summary>
        <span className="sv2-status-icon" aria-hidden="true">{STATUS_ICONS[input.displayState]}</span>
        <span>{input.label}</span>
        <strong>{input.displayState}</strong>
      </summary>
      <dl>
        <div><dt>Source</dt><dd>{input.sourceTitle ?? 'Not placed at this cutoff'}</dd></div>
        <div><dt>Locator</dt><dd>{input.evidence?.locator ?? 'Not placed at this cutoff'}</dd></div>
        <div><dt>Published</dt><dd>{input.publishedAt ? displayDate(input.publishedAt) : 'Not placed at this cutoff'}</dd></div>
        <div><dt>Materiality</dt><dd>{input.materiality}</dd></div>
        <div><dt>Underlying origin</dt><dd>{input.origin ?? 'Not placed at this cutoff'}</dd></div>
        <div><dt>Display status</dt><dd>{input.displayState}</dd></div>
        {input.calculation && <div><dt>Calculation</dt><dd>{input.calculation}</dd></div>}
      </dl>
    </details>
  );
}

function DecisionTimeline({
  view,
  onSelect,
}: {
  view: DecisionExperienceViewModel;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset className="sv2-timeline">
      <legend>Decision timeline</legend>
      <p>Choose a dated packet. Decision evidence is re-resolved at its declared knowledge cutoff.</p>
      <div>
        {view.timeline.options.map((option) => (
          <label key={option.id}>
            <input
              type="radio"
              name="stratos-decision-date"
              value={option.id}
              checked={option.id === view.timeline.selectedId}
              onChange={() => onSelect(option.id)}
            />
            <span aria-hidden="true" />
            <strong>{option.sequence} · {displayDate(option.decisionDate)}</strong>
            <small>{option.label} · cutoff {displayDate(option.knowledgeCutoff)}</small>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DecisionExperience({
  view,
  onTimelineSelect = () => {},
}: {
  view: DecisionExperienceViewModel;
  onTimelineSelect?: (id: string) => void;
}) {
  const storeExposure = view.exposures.find(({ category }) => category === 'storeActivation')!;
  return (
    <Card className="sv2-decision" aria-labelledby="decision-overview-title">
      <header className="sv2-decision-head">
        <div>
          <p className="sv2-kicker">Target Canada · {view.sequence}</p>
          <h2 id="decision-overview-title">Scaling decision after 68 stores</h2>
          <p>Decision date and knowledge cutoff · {displayDate(view.cutoff)}</p>
        </div>
        <div className="sv2-decision-verdict">
          <span>Verdict</span>
          <strong>{view.verdict}</strong>
        </div>
      </header>

      <DecisionTimeline view={view} onSelect={onTimelineSelect} />

      <section className="sv2-decision-facts" aria-label="Decision overview">
        <article><span>Current state</span><strong>{displayMetric(view.currentCohort)}</strong><p>{view.currentCohort.label}</p></article>
        <article><span>Requested increment</span><strong>{displayMetric(view.requestedIncrement)}</strong><p>{view.requestedIncrement.label}</p></article>
        <article><span>Next safe scale</span><strong>{view.validatedScale.value === 'not-determined' ? 'Not determined' : view.validatedScale.value}</strong><p>{view.validatedScale.description}</p></article>
      </section>

      <section className="sv2-unknowns" aria-labelledby="material-unknowns-title">
        <div>
          <p className="sv2-eyebrow">Decision boundary</p>
          <h3 id="material-unknowns-title">Material unknowns</h3>
        </div>
        <ul>{view.materialUnknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul>
      </section>

      <section className="sv2-actions" aria-labelledby="recommendations-title">
        <div className="sv2-section-head">
          <div><p className="sv2-eyebrow">Paired recommendation</p><h2 id="recommendations-title">Change the commitment. Change the path.</h2></div>
          <p>Exactly one operation on each plane; commitment first, path second.</p>
        </div>
        <div className="sv2-recommendations">
          {view.recommendations.map((recommendation) => (
            <RecommendationCard key={recommendation.plane} recommendation={recommendation} />
          ))}
        </div>
      </section>

      <section className="sv2-comparison" aria-labelledby="comparison-title">
        <div className="sv2-section-head">
          <div><p className="sv2-eyebrow">Bounded comparison</p><h2 id="comparison-title">Actual intent and StratOS alternative</h2></div>
          <p>{displayDate(view.actualComparison.period.startsAt)}–{displayDate(view.actualComparison.period.endsAt)}</p>
        </div>
        <div className="sv2-operation-comparison">
          <article>
            <h3>Actual operations</h3>
            <ol>{view.actualComparison.actualOperations.map((operation) => <li key={operation.operation}><strong>{operation.operation}</strong><span>{operation.object}</span></li>)}</ol>
          </article>
          <article>
            <h3>StratOS operations</h3>
            <ol>{view.recommendations.map((operation) => <li key={operation.plane}><strong>{operation.displayLabel}</strong><span>{operation.object}</span></li>)}</ol>
          </article>
        </div>
        <div className="sv2-exposure-bound">
          <p className="sv2-eyebrow">Store-activation exposure only</p>
          <div>
            <p><strong>Actual intent · <span className="sv2-status-icon" aria-hidden="true">{STATUS_ICONS[storeExposure.actualIntent.status]}</span> {storeExposure.actualIntent.status}</strong>{storeExposure.actualIntent.label}</p>
            <p><strong>StratOS scenario · <span className="sv2-analytical-label">ANALYTICAL</span> · <span className="sv2-status-icon" aria-hidden="true">{STATUS_ICONS[storeExposure.stratosScenario.status]}</span> {storeExposure.stratosScenario.status}</strong>{storeExposure.stratosScenario.label}</p>
          </div>
          {storeExposure.stratosScenario.calculation && <p><strong>Calculation · <span className="sv2-analytical-label">ANALYTICAL</span></strong>{storeExposure.stratosScenario.calculation}</p>}
          {storeExposure.stratosScenario.assumption && <p><strong>Counterfactual assumption · <span className="sv2-assumption-label">ASSUMPTION</span></strong>{storeExposure.stratosScenario.assumption}</p>}
          <p>{storeExposure.limitation}</p>
          <small>This comparison ends at the next release decision or December 31, 2013. It makes no claim about obligations beyond the evidence placed at this cutoff.</small>
        </div>
      </section>

      <section className="sv2-inspector" aria-labelledby="evidence-inspector-title">
        <div className="sv2-section-head">
          <div><p className="sv2-eyebrow">Cutoff-safe packet</p><h2 id="evidence-inspector-title">Evidence and assumptions</h2></div>
          <p>Statuses use text and symbols as well as color. Open any row for provenance.</p>
        </div>
        <div className="sv2-evidence-list">
          {view.inspectionInputs.map((input) => <EvidenceDisclosure input={input} key={input.id} />)}
        </div>
        <div className="sv2-analytical-layer">
          <h3>Analytical layer</h3>
          <ul>
            {view.constructs.map((construct) => (
              <li key={construct.id}><span className="sv2-analytical-label">{construct.displayLabel}</span>{construct.label}</li>
            ))}
          </ul>
          <h3>Assumptions</h3>
          <ul>
            {view.assumptions.map((assumption) => (
              <li key={assumption.id}><span className="sv2-assumption-label">{assumption.displayLabel}</span>{assumption.statement}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="sv2-hindsight" aria-labelledby="hindsight-title">
        <div className="sv2-section-head">
          <div><p className="sv2-eyebrow">Separate outcome layer</p><h2 id="hindsight-title">Hindsight</h2></div>
          <p>Published after the selected cutoff. Never used by the dated verdict or recommendations.</p>
        </div>
        <div className="sv2-evidence-list">
          {view.hindsight.map((input) => <EvidenceDisclosure input={input} key={input.id} />)}
        </div>
      </section>
    </Card>
  );
}

function ConstraintEnvelope() {
  return (
    <section className="sv2-envelope" aria-labelledby="constraint-envelope-title">
      <p className="sv2-eyebrow" id="constraint-envelope-title">Shared constraint envelope</p>
      <div className="sv2-constraints">
        {CONSTRAINTS.map((constraint) => (
          <article className="sv2-constraint" key={constraint.name}>
            <strong>{constraint.name}</strong>
            <span>{constraint.note}</span>
            <div className={`sv2-limit sv2-limit--${constraint.tone}`} aria-hidden="true">
              <i style={{ width: `${constraint.value}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ConversionCard({ system, onSelect, className = '' }: { system: SystemModel; onSelect: () => void; className?: string }) {
  return (
    <button className={`sv2-conversion ${className}`} type="button" onClick={onSelect}>
      <span className="sv2-conversion-head">
        <strong>{system.name}</strong>
        <small>{system.binding} binds</small>
      </span>
      <span className="sv2-conversion-flow">{system.conversion}</span>
      <span className="sv2-conversion-tension">{system.tension}</span>
      <span className="sv2-inspect">Inspect conversion <ArrowRight aria-hidden="true" /></span>
    </button>
  );
}

function SystemView({ onSelect }: { onSelect: (id: SystemId) => void }) {
  const byId = (id: SystemId) => STRATOS_SYSTEMS.find((system) => system.id === id)!;
  return (
    <>
      <ConstraintEnvelope />
      <section className="sv2-system" aria-labelledby="organization-system-title">
        <div className="sv2-section-head">
          <div>
            <p className="sv2-eyebrow">System view</p>
            <h2 id="organization-system-title">The organization converts, learns, and renews.</h2>
          </div>
          <p>Select a conversion to inspect its motion and feasibility.</p>
        </div>
        <div className="sv2-metabolism">
          <ConversionCard system={byId('discernment')} onSelect={() => onSelect('discernment')} className="sv2-card--discernment" />
          <span className="sv2-flow-arrow sv2-arrow--one"><ArrowRight /></span>
          <ConversionCard system={byId('invention')} onSelect={() => onSelect('invention')} className="sv2-card--invention" />
          <span className="sv2-flow-arrow sv2-arrow--two"><ArrowRight /></span>
          <ConversionCard system={byId('operations')} onSelect={() => onSelect('operations')} className="sv2-card--operations" />
          <span className="sv2-flow-arrow sv2-arrow--down"><ArrowDown /></span>
          <ConversionCard system={byId('resource')} onSelect={() => onSelect('resource')} className="sv2-card--resource" />
          <span className="sv2-flow-arrow sv2-arrow--four"><ArrowLeft /></span>
          <ConversionCard system={byId('advantage')} onSelect={() => onSelect('advantage')} className="sv2-card--advantage" />
          <span className="sv2-flow-arrow sv2-arrow--three"><ArrowLeft /></span>
          <ConversionCard system={byId('execution')} onSelect={() => onSelect('execution')} className="sv2-card--execution" />
          <div className="sv2-return"><CornerDownLeft aria-hidden="true" /><span>Renewed capacity and retained learning feed the next signal.</span></div>
        </div>
      </section>
      <footer className="sv2-model-note">
        <strong>How to read the model</strong>
        <p>The poles hold an internal–external tension. The cycle is how the organization moves. Repeated cycles reveal its velocity; changing cycle time and constraint load reveals whether it can converge on a goal.</p>
      </footer>
    </>
  );
}

function Pole({ system }: { system: SystemModel }) {
  return (
    <section className="sv2-pole" aria-label={`${system.name} tension pole`}>
      <div className="sv2-pole-labels"><strong>{system.internal}</strong><strong>{system.external}</strong></div>
      <div className="sv2-pole-track">
        <span className="sv2-pole-line" />
        <span className="sv2-capacity-range" style={{ left: `${system.capacity[0]}%`, width: `${system.capacity[1] - system.capacity[0]}%` }} title="Position range the organization can currently sustain" />
        <Tooltip><TooltipTrigger asChild><span tabIndex={0} className="sv2-pole-mark sv2-pole-mark--current" style={{ left: `${system.current}%` }}><i>Current</i></span></TooltipTrigger><TooltipContent>Evidenced current position</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><span tabIndex={0} className="sv2-pole-mark sv2-pole-mark--reachable" style={{ left: `${system.reachable}%` }}><i>Reachable</i></span></TooltipTrigger><TooltipContent>Reachable position within current constraints</TooltipContent></Tooltip>
        <Tooltip><TooltipTrigger asChild><span tabIndex={0} className="sv2-pole-mark sv2-pole-mark--goal" style={{ left: `${system.goal}%` }}><i>Goal</i></span></TooltipTrigger><TooltipContent>Position required by the commitment</TooltipContent></Tooltip>
      </div>
    </section>
  );
}

function CycleStages({ system }: { system: SystemModel }) {
  return (
    <>
      {system.stages.map((stage, index) => (
        <Tooltip key={stage}>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="sv2-stage" style={{ width: `${system.weights[index]}%` }}>
              <small>{AIVA[index]}</small><strong>{stage}</strong>
            </span>
          </TooltipTrigger>
          <TooltipContent>{system.questions[index]}</TooltipContent>
        </Tooltip>
      ))}
    </>
  );
}

function CycleTimeline({ system, elapsed, interactive, onElapsed }: { system: SystemModel; elapsed: number; interactive?: boolean; onElapsed?: (value: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const max = system.cycle1 * 1.25;
  const minElapsed = system.cycle1 * 0.55;
  const maxElapsed = system.cycle1 * 1.2;
  const width = elapsed / max * 100;

  const updateFromPointer = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || !onElapsed) return;
    const next = clamp((clientX - rect.left) / rect.width * max, minElapsed, maxElapsed);
    onElapsed(Math.round(next * 10) / 10);
  };

  const beginDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const move = (moveEvent: PointerEvent) => updateFromPointer(moveEvent.clientX);
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
  };

  return (
    <div className="sv2-cycle-row">
      <div className="sv2-cycle-label"><strong>{interactive ? 'Cycle 2' : 'Cycle 1'}</strong><span>{interactive ? 'next unit' : 'observed'}</span></div>
      <div className="sv2-cycle-track" ref={trackRef}>
        <div className="sv2-cycle" style={{ width: `${width}%` }}>
          <CycleStages system={system} />
          {interactive && onElapsed && (
            <button
              type="button"
              className="sv2-time-handle"
              aria-label="Cycle 2 elapsed time in weeks"
              aria-valuemin={minElapsed}
              aria-valuemax={maxElapsed}
              aria-valuenow={elapsed}
              role="slider"
              onPointerDown={beginDrag}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
                event.preventDefault();
                onElapsed(clamp(elapsed + (event.key === 'ArrowRight' ? 0.5 : -0.5), minElapsed, maxElapsed));
              }}
            />
          )}
        </div>
      </div>
      <strong className="sv2-cycle-time">{elapsed.toFixed(1)} weeks</strong>
    </div>
  );
}

function ConstraintFootprint({ system, elapsed }: { system: SystemModel; elapsed: number }) {
  const { loads } = calculateFeasibility(system, elapsed);
  const loadMap = new Map(loads);
  const rows: Array<[Constraint, string]> = [
    ['People', (loadMap.get('People capacity') ?? 0) > 80 ? 'critical-role load exceeds sustainable range' : 'critical-role load remains supportable'],
    ['Finance', (loadMap.get('Finance capacity') ?? 0) > 80 ? 'spend peak precedes verified evidence' : 'funding remains inside available envelope'],
    ['Risk', (loadMap.get('Risk tolerance') ?? 0) > 80 ? 'release exposure exceeds current tolerance' : 'exposure remains inside tolerance'],
  ];
  const stages = [0.35, 0.95, 0.68, 0.4];
  return (
    <section className="sv2-footprint">
      <div className="sv2-subhead"><strong>Cycle 2 constraint footprint</strong><span>time is the horizontal axis</span></div>
      {rows.map(([name, note]) => {
        const value = loadMap.get(name === 'Risk' ? 'Risk tolerance' : `${name} capacity`) ?? 0;
        return (
          <div className="sv2-foot-row" key={name}>
            <strong>{name}</strong>
            <div className="sv2-load" aria-label={`${name} load ${Math.round(value)} percent`}>
              {stages.map((multiplier, index) => {
                const stageLoad = multiplier * value;
                const tone = stageLoad > 80 ? 'risk' : stageLoad > 68 ? 'hot' : '';
                return <i className={tone} style={{ width: `${system.weights[index]}%`, opacity: clamp(stageLoad / 100, 0.18, 1) }} key={index} />;
              })}
            </div>
            <span>{note}</span>
          </div>
        );
      })}
    </section>
  );
}

function Convergence({ system, elapsed }: { system: SystemModel; elapsed: number }) {
  const result = calculateFeasibility(system, elapsed);
  const x = (month: number) => clamp(month / 18 * 1000, 0, 1000);
  const history = [[0, 0.05], [4.8, 0.18], [8.9, 0.39], [11.9, 0.64]];
  const actual = history.map(([month, position]) => `${x(month)},${92 - position * 72}`).join(' ');
  const last = history[history.length - 1];
  const plan = `${x(last[0])},${92 - last[1] * 72} ${x(result.calendarGoal)},20`;
  let verdict: JSX.Element;
  if (!result.calendarPass) {
    verdict = <><strong>Calendar trajectory does not converge.</strong> Required range is reached after the commitment date.</>;
  } else if (!result.constraintPass) {
    verdict = <><strong>Calendar trajectory converges; feasible trajectory does not.</strong> {result.loads[0][0]} binds first.</>;
  } else {
    verdict = <><strong>Converges inside the constraint envelope.</strong> Required range is reached before the commitment date without exhausting available capacity.</>;
  }
  return (
    <section className="sv2-feasibility">
      <div className="sv2-subhead"><strong>Constraint-aware convergence</strong><span>calendar months</span></div>
      <div className="sv2-runway">
        <div className="sv2-required-band">Required configuration range</div>
        <div className="sv2-deadline"><span>15-month commitment</span></div>
        <div className="sv2-envelope-end" style={{ left: `${x(result.constraintMonth) / 10}%` }}><span>Feasible envelope ends</span></div>
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none" role="img" aria-label="Observed and projected calendar trajectory against the feasible constraint boundary">
          <polyline className="sv2-path-actual" points={actual} />
          <polyline className="sv2-path-plan" points={plan} />
          {history.map(([month, position]) => <circle className="sv2-point" cx={x(month)} cy={92 - position * 72} r="5" key={month} />)}
        </svg>
        <div className="sv2-months"><span>0</span><span>5</span><span>10</span><span>15 months</span></div>
      </div>
      <p className={`sv2-verdict ${result.calendarPass && result.constraintPass ? 'is-feasible' : 'is-constrained'}`}>{verdict}</p>
    </section>
  );
}

function DetailView({ system, elapsed, onElapsed, onBack }: { system: SystemModel; elapsed: number; onElapsed: (value: number) => void; onBack: () => void }) {
  return (
    <>
      <div className="sv2-detail-nav">
        <button type="button" onClick={onBack}><ArrowLeft /> Organization</button>
        <span>{system.name} conversion</span>
      </div>
      <section className="sv2-detail">
        <header className="sv2-detail-head">
          <div><p className="sv2-eyebrow">Conversion detail</p><h2>{system.conversion}</h2></div>
          <button className="sv2-reset" type="button" onClick={() => onElapsed(system.cycle2)}><RotateCcw /> Reset scenario</button>
        </header>
        <Pole system={system} />
        <div className="sv2-cycle-grid">
          <CycleTimeline system={system} elapsed={system.cycle1} />
          <CycleTimeline system={system} elapsed={elapsed} interactive onElapsed={onElapsed} />
        </div>
        <p className="sv2-drag-hint">Drag the right edge of Cycle 2 to test how time compression changes the organization’s constraint load.</p>
        <ConstraintFootprint system={system} elapsed={elapsed} />
        <Convergence system={system} elapsed={elapsed} />
      </section>
    </>
  );
}

export default function StratosV2Page() {
  const [decisionId, setDecisionId] = useState<string>();
  const decision = useMemo(() => createDecisionExperienceViewModel(decisionId), [decisionId]);
  const [selected, setSelected] = useState<SystemId | null>(null);
  const [elapsedBySystem, setElapsedBySystem] = useState<Record<SystemId, number>>(() => Object.fromEntries(STRATOS_SYSTEMS.map((system) => [system.id, system.cycle2])) as Record<SystemId, number>);
  const selectedSystem = useMemo(() => STRATOS_SYSTEMS.find((system) => system.id === selected), [selected]);
  return (
    <main className="app-shell sv2-page">
      <SiteHeader current="stratos" />
      <div className="sv2-workspace">
        <header className="sv2-page-head">
          <div>
            <p className="sv2-kicker">StratOS v2 · scenario prototype</p>
            <h1>Organization as a constrained conversion system.</h1>
            <p>See what the organization is, how it moves, and whether that movement can reach a commitment without exhausting the system.</p>
          </div>
          <aside>
            <span>Cutoff-safe decision</span>
            <strong>Target Canada</strong>
            <p>August 21, 2013 · scaling boundary</p>
          </aside>
        </header>
        <DecisionExperience view={decision} onTimelineSelect={setDecisionId} />
        <Card className="sv2-shell">
          {selectedSystem ? (
            <DetailView
              system={selectedSystem}
              elapsed={elapsedBySystem[selectedSystem.id]}
              onElapsed={(value) => setElapsedBySystem((current) => ({ ...current, [selectedSystem.id]: value }))}
              onBack={() => setSelected(null)}
            />
          ) : <SystemView onSelect={setSelected} />}
        </Card>
        <p className="sv2-disclaimer">Cutoff-safe retrospective — the comparison evaluates decision structure within the evidence available on the selected date.</p>
      </div>
    </main>
  );
}
