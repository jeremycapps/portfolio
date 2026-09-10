import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
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
  if (!input.metric) return input.label;
  return 'value' in input.metric
    ? `${input.metric.value} ${input.metric.unit}`
    : `${input.metric.low}–${input.metric.high} ${input.metric.unit}`;
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

const MODEL_AXES = [
  {
    eyebrow: '3 questions',
    items: [
      ['Economics', 'Is the enterprise economically sustainable?'],
      ['Commitment', 'Can it deliver what it has promised?'],
      ['Renewal', 'Can it adapt quickly enough to keep doing so?'],
    ],
  },
  {
    eyebrow: '2 altitudes',
    items: [
      ['StratOps', 'What machine are we building?'],
      ['BizOps', 'Where is the running machine succeeding or failing?'],
    ],
  },
  {
    eyebrow: '2 loci of evidence',
    items: [
      ['Internal condition', 'What does the operating system say is happening?'],
      ['External consequence', 'What evidence appears in the customer, market, or environment?'],
    ],
  },
] as const;

const OUTCOME_ROWS = [
  ['CSO · controlled advantage', 'Moat coverage %', 'Make-vs-buy case', 'Owned-IP in build %', 'Switching-cost index', 'IP asset value on B/S'],
  ['CMO · orchestrated ecosystem', 'External value share', 'Participant ROI case', 'Partner integration %', 'Active participant rate', 'Ecosystem revenue (audited)'],
  ['CPO · workforce capacity', 'Skill-coverage ratio', 'Capacity vs. demand', 'Staffing ramp vs. plan', 'Buffer % · attrition · ρ', 'Capacity cost vs. baseline'],
  ['CFO · capital & return', 'ROIC vs. cost of capital', 'NPV / payback case', 'Budget burn vs. plan', 'Cost per resolved contact', 'Net savings vs. baseline (GL)'],
  ['CEO · decision quality', 'Strategic-bet thesis', 'Go/no-go options priced', 'Scope adherence', 'Decision-to-outcome variance', 'Decision outcome audit'],
  ['CDO · disconfirming evidence', 'Evidence coverage', 'Disconfirming-evidence plan', 'Instrumented signals %', 'Signal latency', 'Evidence audit trail'],
  ['CRO · risk & traceability', 'Irreversibility exposure', 'Risk & rollback plan', 'Control coverage built', 'Incident rate vs. tolerance', 'Traceability / defensibility'],
  ['CTO · technical release', 'Architecture fit', 'Technical feasibility case', 'Release readiness', 'Uptime / SLO', 'Capitalized-dev audit'],
  ['CKO · knowledge', 'Knowledge-moat thesis', 'Knowledge-capture plan', 'Knowledge codified %', 'Knowledge freshness / decay', 'Retained-knowledge audit'],
  ['CGO · growth', 'Growth thesis / TAM', 'Growth case (CAC/LTV)', 'Launch readiness', 'Retention / churn', 'Realized growth vs. plan'],
  ['COO · operations', 'Operating-model fit', 'Exception-handling design', 'Runbook / failover', 'Backlog age by segment', 'Ops loss vs. baseline'],
  ['CIO · flow & information', 'Information-flow thesis', 'Data-flow / integration case', 'Flow integration %', 'Flow throughput / cycle time', 'Information-cost audit'],
] as const;

const KLARNA_INTERNAL = [
  ['Automation', 'Two-thirds of support chats handled in the first month.'],
  ['Speed', 'Reported resolution time fell from 11 minutes to 2.'],
  ['Labor economics', 'The operating model suggested substantial savings.'],
  ['Aggregate satisfaction', 'Klarna reported satisfaction on par with human agents.'],
] as const;

const KLARNA_EXTERNAL = [
  ['Complex work', 'The assistant handled first-line support; complex cases still transferred to people.'],
  ['Different stakes', 'Those cases included disputes, fraud, hardship, and account closure.'],
  ['Receiving capacity', 'The human system receiving those exceptions was simultaneously being reduced.'],
  ['Missing grain', 'Blended satisfaction could not establish quality within those high-stakes segments.'],
] as const;

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
            <small>{option.companyName} · {option.label} · cutoff {displayDate(option.knowledgeCutoff)}</small>
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
  const primaryExposure = view.primaryExposure;
  return (
    <Card className="sv2-decision" aria-labelledby="decision-overview-title">
      <header className="sv2-decision-head">
        <div>
          <p className="sv2-kicker">{view.companyName} · {view.sequence}</p>
          <h2 id="decision-overview-title">{view.headline}</h2>
          <p>{view.caseName}</p>
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
          <p className="sv2-eyebrow">{view.primaryExposureTitle}</p>
          <div>
            <p><strong>Actual intent · <span className="sv2-status-icon" aria-hidden="true">{STATUS_ICONS[primaryExposure.actualIntent.status]}</span> {primaryExposure.actualIntent.status}</strong>{primaryExposure.actualIntent.label}</p>
            <p><strong>StratOS scenario · <span className="sv2-analytical-label">ANALYTICAL</span> · <span className="sv2-status-icon" aria-hidden="true">{STATUS_ICONS[primaryExposure.stratosScenario.status]}</span> {primaryExposure.stratosScenario.status}</strong>{primaryExposure.stratosScenario.label}</p>
          </div>
          {primaryExposure.stratosScenario.calculation && <p><strong>Calculation · <span className="sv2-analytical-label">ANALYTICAL</span></strong>{primaryExposure.stratosScenario.calculation}</p>}
          {primaryExposure.stratosScenario.assumption && <p><strong>Counterfactual assumption · <span className="sv2-assumption-label">ASSUMPTION</span></strong>{primaryExposure.stratosScenario.assumption}</p>}
          <p>{primaryExposure.limitation}</p>
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

function NarrativeSection({
  id,
  eyebrow,
  title,
  children,
  className = '',
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`sv2-story-section ${className}`.trim()}>
      <div className="sv2-story-heading">
        <p className="sv2-eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ModelReveal() {
  return (
    <NarrativeSection
      id="model"
      eyebrow="The underlying structure"
      title="The twelve roles resolved into three dimensions."
      className="sv2-model-reveal"
    >
      <div className="sv2-origin">
        <p>I started with two existing ways of looking at an enterprise: an L1–L5 framework for separating strategic and operational work, and twelve common C-suite functions.</p>
        <p>I mapped those functions by the resources they governed, the signals they watched, and whether those signals described the company or its environment.</p>
        <blockquote><strong>Why twelve?</strong><span>What smaller structure would naturally produce twelve different perspectives on an enterprise?</span></blockquote>
      </div>
      <div className="sv2-axis-grid">
        {MODEL_AXES.map((axis, axisIndex) => (
          <article key={axis.eyebrow} className={`sv2-axis sv2-axis--${axisIndex + 1}`}>
            <p className="sv2-eyebrow">{axis.eyebrow}</p>
            <div>
              {axis.items.map(([label, copy]) => (
                <div key={label}>
                  <strong>{label}{label === 'Internal condition' ? ' ◀' : label === 'External consequence' ? ' ▶' : ''}</strong>
                  <span>{copy}</span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
      <div className="sv2-equation" aria-label="Three times two times two equals twelve poles">
        <span>3</span><i>×</i><span>2</span><i>×</i><span>2</span><i>=</i><strong>12 poles</strong>
      </div>
      <p className="sv2-equation-note">The 12 poles are not the model. They are the result of the model.</p>
    </NarrativeSection>
  );
}

function DivergenceSection() {
  return (
    <NarrativeSection eyebrow="The useful part" title="The two sides do not have to agree." className="sv2-divergence">
      <p className="sv2-story-lede">Internal measures can improve while external consequences deteriorate.</p>
      <div className="sv2-divergence-examples" aria-label="Examples of diverging organizational signals">
        <span>Faster <b>but less trustworthy</b></span>
        <span>Cheaper <b>but less resilient</b></span>
        <span>More automated <b>but worse at exceptions</b></span>
        <span>More productive <b>with a growing downstream queue</b></span>
      </div>
      <p>Collapse both signals into a blended KPI and the disagreement disappears. StratOS keeps them separate long enough to ask:</p>
      <blockquote className="sv2-question-callout">Where is the system telling two different stories?<span>What commitment should change because of that?</span></blockquote>
    </NarrativeSection>
  );
}

function EvidenceColumn({
  side,
  heading,
  items,
  summary,
}: {
  side: 'internal' | 'external';
  heading: string;
  items: ReadonlyArray<readonly [string, string]>;
  summary: string;
}) {
  return (
    <article className={`sv2-klarna-column sv2-klarna-column--${side}`}>
      <header>
        <p className="sv2-eyebrow">{side === 'internal' ? 'Internal condition ◀' : 'External consequence ▶'}</p>
        <h3>{heading}</h3>
      </header>
      <dl>
        {items.map(([label, copy]) => <div key={label}><dt>{label}</dt><dd>{copy}</dd></div>)}
      </dl>
      <p className="sv2-klarna-summary">{summary}</p>
    </article>
  );
}

function KlarnaCase() {
  return (
    <NarrativeSection id="klarna" eyebrow="A real decision boundary" title="Klarna makes the divergence concrete." className="sv2-klarna">
      <div className="sv2-klarna-intro">
        <p>In early 2024, Klarna’s AI customer-support results looked extraordinary. The assistant handled two-thirds of support chats, reported resolution time fell from 11 minutes to 2, and the company projected a $40 million improvement in 2024 profit.</p>
        <div className="sv2-decision-prompt"><span>The pilot worked.</span><strong>Should Klarna deepen the commitment?</strong></div>
        <p className="sv2-cutoff-note">This review uses only evidence available at the decision boundary. Company estimates remain labeled, and later outcomes are kept separate as hindsight.</p>
      </div>
      <div className="sv2-klarna-evidence">
        <EvidenceColumn side="internal" heading="What looked strong" items={KLARNA_INTERNAL} summary="From inside the operating system, the transformation looked highly successful." />
        <EvidenceColumn side="external" heading="What remained harder to establish" items={KLARNA_EXTERNAL} summary="The strongest evidence supporting the commitment existed at a different grain from the risk created by it." />
      </div>
      <div className="sv2-disagreement">
        <div className="sv2-story-heading">
          <p className="sv2-eyebrow">The decision hidden inside the dashboard</p>
          <h3>The disagreement is the decision.</h3>
        </div>
        <div className="sv2-signal-readout">
          <p><span>Internal efficiency</span><strong className="is-up">Improving ↑</strong></p>
          <p><span>Complex-segment quality</span><strong className="is-unknown">Unknown ?</strong></p>
          <p><span>Receiving human capacity</span><strong className="is-down">Shrinking ↓</strong></p>
        </div>
        <p>That is not proof the AI program was failing. It is a more precise statement:</p>
        <blockquote>The evidence supporting the next commitment was incomplete at the place where the downside was concentrated.</blockquote>
      </div>
    </NarrativeSection>
  );
}

function DecisionLogic() {
  return (
    <NarrativeSection id="decision-logic" eyebrow="Decision logic" title="StratOS distinguishes three conditions." className="sv2-logic">
      <div className="sv2-verdict-grid">
        <article className="is-fit"><strong>FIT</strong><p>The available evidence and constraints support the proposed commitment—at the scale actually demonstrated.</p></article>
        <article className="is-fog"><strong>FOG</strong><p>A material question remains unanswered. The organization does not yet have the evidence required to make the claim.</p></article>
        <article className="is-collision"><strong>COLLISION</strong><p>The proposed commitment conflicts with an observed constraint.</p></article>
      </div>
      <div className="sv2-klarna-verdict">
        <p className="sv2-eyebrow">Klarna result</p>
        <strong>FOG + constraint collision</strong>
        <p>Aggregate operating performance was strong. Complex-segment quality was not established at the grain required by the decision, while the capacity absorbing those exceptions was being reduced.</p>
      </div>
      <div className="sv2-hold">
        <p className="sv2-eyebrow">Suggested decision output</p>
        <h3>HOLD the next increment—not the AI program.</h3>
        <p>Before further reducing receiving human capacity:</p>
        <ol>
          <li>establish complex-segment quality independently of blended satisfaction;</li>
          <li>measure backlog age by segment;</li>
          <li>define the minimum capacity required to absorb escalations;</li>
          <li>establish explicit rollback conditions;</li>
          <li>reassess after those signals have been observed.</li>
        </ol>
        <blockquote>The purpose of a HOLD is to identify what must become true before the answer can become yes.</blockquote>
      </div>
    </NarrativeSection>
  );
}

function ActionLayer() {
  const levels = [
    ['L1', 'Strategy', 'What are we trying to accomplish?'],
    ['L2', 'Business case', 'What must be true before we commit?'],
    ['L3', 'Implementation', 'What must be true before we launch?'],
    ['L4', 'Operations', 'What must remain true while we run?'],
    ['L5', 'Audit', 'Did the claimed outcome actually occur?'],
  ] as const;
  return (
    <NarrativeSection eyebrow="The action layer" title="Finding the problem is only half of the job." className="sv2-action-layer">
      <p className="sv2-story-lede">L1–L5 answers the next question: where should the organization act?</p>
      <p>A signal may appear in operations but originate in a business-case assumption. A backlog may be visible at L4 while the missing capacity gate belonged at L2.</p>
      <div className="sv2-levels">
        {levels.map(([level, label, question]) => <article key={level}><span>{level}</span><div><strong>{label}</strong><p>{question}</p></div></article>)}
      </div>
    </NarrativeSection>
  );
}

function MeasurementDepth({
  selectedSystem,
  elapsed,
  onElapsed,
  onSelect,
  onBack,
}: {
  selectedSystem?: SystemModel;
  elapsed?: number;
  onElapsed: (value: number) => void;
  onSelect: (id: SystemId) => void;
  onBack: () => void;
}) {
  return (
    <NarrativeSection eyebrow="Measurement depth" title="12 perspectives × 5 levels = 60 accountable outcomes." className="sv2-depth">
      <p className="sv2-story-lede">The important part is not the number. The matrix gives every material question an owner, a lifecycle stage, an evidence requirement, and a consequence.</p>
      <details className="sv2-disclosure">
        <summary>Explore the 60-cell model <ArrowRight aria-hidden="true" /></summary>
        <div className="sv2-matrix-wrap">
          <table className="sv2-matrix">
            <caption>Sixty accountable outcomes across twelve enterprise perspectives and five lifecycle levels</caption>
            <thead><tr><th scope="col">Perspective</th><th scope="col">L1 · Strategy</th><th scope="col">L2 · Business case</th><th scope="col">L3 · Implementation</th><th scope="col">L4 · Operations</th><th scope="col">L5 · Audit</th></tr></thead>
            <tbody>{OUTCOME_ROWS.map(([owner, ...cells]) => <tr key={owner}><th scope="row">{owner}</th>{cells.map((cell) => <td key={cell} className={['Capacity vs. demand', 'Buffer % · attrition · ρ', 'Instrumented signals %', 'Exception-handling design', 'Backlog age by segment', 'Net savings vs. baseline (GL)'].includes(cell) ? 'is-decisive' : ''}>{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      </details>
      <div className="sv2-gates">
        <div className="sv2-story-heading"><p className="sv2-eyebrow">Gate logic</p><h3>A metric should do more than report.</h3></div>
        <div>
          <article><strong>Soft gate</strong><p>Proceed with conditions and revisit.</p></article>
          <article><strong>Hard gate</strong><p>Do not release the commitment until the condition clears.</p></article>
          <article><strong>Operating floor</strong><p>Continue only while the condition remains above an explicit threshold.</p></article>
        </div>
        <p>This turns measurement into decision control.</p>
      </div>
      <details className="sv2-disclosure sv2-prototype-disclosure">
        <summary>Inspect the conversion-system prototype <ArrowRight aria-hidden="true" /></summary>
        <Card className="sv2-shell">
          {selectedSystem && elapsed !== undefined
            ? <DetailView system={selectedSystem} elapsed={elapsed} onElapsed={onElapsed} onBack={onBack} />
            : <SystemView onSelect={onSelect} />}
        </Card>
      </details>
    </NarrativeSection>
  );
}

function HindsightAndAbout() {
  return (
    <>
      <NarrativeSection eyebrow="Separate outcome layer" title="Then—and only then—look at what happened later." className="sv2-hindsight-story">
        <p>In 2025, Klarna’s CEO said cost had become too predominant in the support strategy and that lower quality followed. The company began rebuilding a model in which customers could reach people again.</p>
        <p>Hindsight is useful for evaluating the quality of the model. It should not be smuggled backward into the original decision.</p>
        <blockquote>Did the process identify the uncertainty and constraint that mattered before the organization increased its exposure?</blockquote>
      </NarrativeSection>
      <NarrativeSection id="about-the-work" eyebrow="Why I built this" title="I’m drawn to the structure underneath difficult domains." className="sv2-about-work">
        <p>The compelling part of StratOS was not producing dozens of metrics. It was understanding why the underlying structure existed.</p>
        <p>My strongest work begins where a domain contains many roles, measures, and processes, but the existing taxonomy does not quite explain their relationships. I learn how the work operates, find the dimensions that matter, and turn that model into something a product or team can use.</p>
        <blockquote>Find where the signals disagree. Make the missing evidence visible. Connect what is learned to what may happen next.</blockquote>
        <div className="sv2-employment">
          <div><p className="sv2-eyebrow">Work with me</p><h3>I’m looking for product problems that need this kind of thinking.</h3></div>
          <p>I’m especially interested in forward-deployed engineering, AI operations, solutions architecture, implementation, and product or platform engineering—particularly where the hard part is deciding what model of the problem a system should encode.</p>
          <div className="sv2-cta-row">
            <a className="sv2-button sv2-button--primary" href="/">View my background <ArrowRight aria-hidden="true" /></a>
            <a className="sv2-button" href="https://www.linkedin.com/in/jeremycapps" target="_blank" rel="noreferrer noopener">LinkedIn</a>
            <a className="sv2-button" href="https://github.com/jeremycapps" target="_blank" rel="noreferrer noopener">GitHub</a>
            <a className="sv2-button" href="mailto:jeremy@nycwork.space">Contact me</a>
          </div>
        </div>
      </NarrativeSection>
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
        <header className="sv2-page-head sv2-story-hero">
          <p className="sv2-kicker">StratOS · organizational decision systems</p>
          <h1>When the company looks healthy inside, but the customer is telling you something else.</h1>
          <p>Organizations rarely lack metrics. The harder problem is knowing which signals describe the same thing—and noticing when they stop agreeing.</p>
          <p>StratOS structures strategy, operations, and evidence so divergence becomes visible before the next commitment is made.</p>
          <div className="sv2-cta-row">
            <a className="sv2-button sv2-button--primary" href="#model">See how the model works <ArrowDown aria-hidden="true" /></a>
            <a className="sv2-button" href="#klarna">Jump to Klarna <ArrowRight aria-hidden="true" /></a>
          </div>
        </header>
        <nav className="sv2-local-nav" aria-label="StratOS sections">
          <a href="#model">Model</a><a href="#klarna">Klarna</a><a href="#decision-logic">Decision logic</a><a href="#about-the-work">About the work</a>
        </nav>
        <ModelReveal />
        <DivergenceSection />
        <KlarnaCase />
        <DecisionLogic />
        <ActionLayer />
        <MeasurementDepth
          selectedSystem={selectedSystem}
          elapsed={selectedSystem ? elapsedBySystem[selectedSystem.id] : undefined}
          onElapsed={(value) => selectedSystem && setElapsedBySystem((current) => ({ ...current, [selectedSystem.id]: value }))}
          onSelect={setSelected}
          onBack={() => setSelected(null)}
        />
        <HindsightAndAbout />
        <p className="sv2-disclaimer">Cutoff-safe retrospective · company-reported estimates, analytical findings, and hindsight remain distinct.</p>
      </div>
    </main>
  );
}
