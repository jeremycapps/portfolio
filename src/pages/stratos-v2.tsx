import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, CornerDownLeft, RotateCcw } from 'lucide-react';
import { SiteHeader } from '@/components/site-header';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ILLUSTRATIVE_TARGET_EVALUATION } from '@/lib/stratos/judgment/illustrative-target';
import type { OperationRecommendation } from '@/lib/stratos/judgment/contract';
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

function formatParameter([key, value]: [string, string | number | boolean]) {
  return `${key.replaceAll('_', ' ')} = ${value}`;
}

function RecommendationCard({ recommendation }: { recommendation: OperationRecommendation }) {
  return (
    <article className={`sv2-recommendation sv2-recommendation--${recommendation.plane}`}>
      <p className="sv2-eyebrow">{recommendation.plane}</p>
      <div className="sv2-operation-line">
        <strong>{recommendation.operation}</strong>
        {recommendation.displayMacro && <span>{recommendation.displayMacro}</span>}
      </div>
      <h3>{recommendation.label}</h3>
      <code>{recommendation.object}({Object.entries(recommendation.parameters).map(formatParameter).join(', ')})</code>
      <p>{recommendation.authorization}</p>
      <footer><span>Owner</span><strong>{recommendation.owner}</strong></footer>
    </article>
  );
}

export function CommitmentReview() {
  const evaluation = ILLUSTRATIVE_TARGET_EVALUATION;
  return (
    <Card className="sv2-judgment" id="commitment-review">
      <header className="sv2-judgment-head">
        <div>
          <p className="sv2-eyebrow">Interactive anchor · Phase 1 contract</p>
          <h2>What is the largest commitment we can responsibly make next?</h2>
        </div>
        <p>Illustrative inputs demonstrate the decision grammar. They are not a historical assessment of Target Canada.</p>
      </header>

      <section className="sv2-verdict-panel" aria-labelledby="sv2-verdict-title">
        <div>
          <p className="sv2-eyebrow" id="sv2-verdict-title">Verdict</p>
          <strong>{evaluation.verdict.overall}</strong>
          <span>{evaluation.verdict.bindingDimensions.join(' · ')}</span>
        </div>
        <p>{evaluation.verdict.cause}</p>
        <dl>
          <div><dt>Requested</dt><dd>{evaluation.requestedCommitment.increment}</dd></div>
          <div><dt>Evidence cutoff</dt><dd>{evaluation.evidenceCutoff}</dd></div>
          <div><dt>Irreversibility</dt><dd>{evaluation.requestedCommitment.irreversibility}</dd></div>
        </dl>
      </section>

      <div className="sv2-recommendations" aria-label="Authorized operations">
        <RecommendationCard recommendation={evaluation.recommendations.commitment} />
        <RecommendationCard recommendation={evaluation.recommendations.path} />
      </div>

      <section className="sv2-decision-boundary">
        <div>
          <p className="sv2-eyebrow">Next safe commitment</p>
          <strong>{evaluation.nextSafeCommitment}</strong>
        </div>
        <div>
          <p className="sv2-eyebrow">Release gate</p>
          <ul>
            {evaluation.releaseGate.conditions.map((condition) => <li key={condition}>{condition}</li>)}
          </ul>
          {evaluation.releaseGate.sustainedFor && <small>Sustained for {evaluation.releaseGate.sustainedFor}</small>}
        </div>
        <div>
          <p className="sv2-eyebrow">Boundary</p>
          <ul>
            {evaluation.boundary.time && <li>{evaluation.boundary.time}</li>}
            {evaluation.boundary.finance && <li>{evaluation.boundary.finance}</li>}
            {evaluation.boundary.attempts && <li>{evaluation.boundary.attempts}</li>}
          </ul>
        </div>
      </section>
    </Card>
  );
}

function ConstraintEnvelope() {
  return (
    <section className="sv2-envelope" id="constraint-envelope" aria-labelledby="constraint-envelope-title">
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
      <section className="sv2-system" id="conversion-systems" aria-labelledby="organization-system-title">
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
  const [selected, setSelected] = useState<SystemId | null>(null);
  const [elapsedBySystem, setElapsedBySystem] = useState<Record<SystemId, number>>(() => Object.fromEntries(STRATOS_SYSTEMS.map((system) => [system.id, system.cycle2])) as Record<SystemId, number>);
  const selectedSystem = useMemo(() => STRATOS_SYSTEMS.find((system) => system.id === selected), [selected]);
  return (
    <main className="app-shell sv2-page">
      <SiteHeader current="stratos" />
      <div className="sv2-workspace">
        <header className="sv2-page-head">
          <div>
            <p className="sv2-kicker">StratOS v2 · commitment judgment prototype</p>
            <h1>Make the next commitment fit the evidence.</h1>
            <p>StratOS tests a strategic commitment against the organization’s operating envelope, then identifies what to do with the commitment and what must change alongside it.</p>
            <nav className="sv2-page-links" aria-label="StratOS v2 contents">
              <a href="#commitment-review">Review the decision</a>
              <a href="#how-it-works">See how the model works</a>
            </nav>
          </div>
          <aside>
            <span>Product expression</span>
            <strong>Judgment → action</strong>
            <p>Two operations · one bounded next step</p>
          </aside>
        </header>
        <CommitmentReview />
        <section className="sv2-model-section" id="how-it-works" aria-labelledby="sv2-model-title">
          <header>
            <div><p className="sv2-eyebrow">What StratOS evaluates</p><h2 id="sv2-model-title">Six coupled conversions inside one constraint envelope.</h2></div>
            <p>The existing organizational model remains the substrate for the commitment judgment above.</p>
          </header>
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
        </section>
        <p className="sv2-disclaimer">Illustrative decision model — historical case evidence, dated thresholds, and exposure estimates are reserved for the sourced Target Canada implementation.</p>
      </div>
    </main>
  );
}
