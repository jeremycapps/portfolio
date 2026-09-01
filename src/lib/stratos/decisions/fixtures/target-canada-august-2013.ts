import { TARGET_CANADA } from '../../cases';
import {
  TARGET_CANADA_AUGUST_2013_REVIEW,
  TARGET_CANADA_AUGUST_2013_REVIEW_INPUT,
} from '../../scoring/target-canada-august-review';
import { defineDecisionPoint } from '../decision-point';
import { resolveDecisionPoint } from '../evidence-integrity';

const q2Evidence = {
  sourceId: 'target-q2-results-2013',
  locator: 'Chief executive quotation, Canadian launch outlook',
} as const;

const fog = (id: string, label: string) => ({
  id,
  label,
  displayState: 'FOG' as const,
  materiality: 'material' as const,
  assumptionRefs: [],
});

export const TARGET_CANADA_AUGUST_2013_DECISION_POINT = defineDecisionPoint({
  schema: 'stratos.decision-point/1',
  id: 'target-canada-t2-2013-08-21',
  caseId: TARGET_CANADA.id,
  evidenceSnapshotId: 'scaling-boundary-2013-08-21',
  sequence: 'T2',
  decisionDate: '2013-08-21',
  knowledgeCutoff: '2013-08-21',
  actor: {
    label: 'Target management responsible for the Canadian rollout',
    authorityStatus: 'unknown',
    provenance: 'inferred',
    evidenceRefs: [q2Evidence],
    assumptionRefs: ['analytical-actor-label'],
  },
  currentCommitment: {
    id: 'active-store-cohort',
    label: 'Canadian stores operating after Q2',
    displayState: 'OBSERVED',
    materiality: 'material',
    metric: { value: 68, unit: 'stores operating' },
    factRef: 'canada-stores-operating-q2',
    evidence: { sourceId: 'target-q2-results-2013', locator: 'Release highlights, Canadian store openings' },
    publishedAt: '2013-08-21',
    origin: 'reported',
    assumptionRefs: [],
  },
  requestedIncrement: {
    id: 'remaining-store-increment',
    label: 'Remaining Canadian stores planned by year-end',
    displayState: 'OBSERVED',
    materiality: 'material',
    metric: { value: 56, unit: 'stores planned to open' },
    factRef: 'canada-stores-remaining-2013',
    evidence: { sourceId: 'target-q2-results-2013', locator: 'Chief executive quotation, Canadian launch outlook' },
    publishedAt: '2013-08-21',
    origin: 'reported',
    assumptionRefs: [],
  },
  cadence: {
    id: 'remaining-rollout-cadence',
    label: 'Prepare and open the remaining cohort by year-end',
    displayState: 'OBSERVED',
    materiality: 'material',
    factRef: 'canada-stores-remaining-2013',
    evidence: { sourceId: 'target-q2-results-2013', locator: 'Chief executive quotation, Canadian launch outlook' },
    publishedAt: '2013-08-21',
    origin: 'reported',
    assumptionRefs: [],
  },
  irreversibility: {
    level: 'high',
    rationale: 'Activating another 56 stores would substantially enlarge the operating footprint; the high label is analytical because the release does not quantify category-level reversibility.',
    provenance: 'analytical',
    evidenceRefs: [q2Evidence],
    assumptionRefs: ['analytical-high-irreversibility'],
  },
  reassessment: {
    nextFeasibleAt: '2013-08-22',
    rationale: 'The earliest safe analytical reassessment is before any additional store activation, because no documented public release gate is available.',
    provenance: 'assumption',
    evidenceRefs: [q2Evidence],
    assumptionRefs: ['analytical-reassessment-before-release'],
  },
  constructs: [
    { id: 'target-t1', label: 'T1: pilot/readiness review', provenance: 'analytical', assumptionRefs: ['analytical-sequence'] },
    { id: 'target-t2', label: 'T2: 68-store scaling boundary', provenance: 'analytical', assumptionRefs: ['analytical-sequence'] },
    { id: 'target-release-gates', label: 'Proposed readiness release gates', provenance: 'assumption', assumptionRefs: ['analytical-release-gates'] },
    { id: 'target-tranche-alternatives', label: 'Alternatives smaller than the requested 56-store increment', provenance: 'assumption', assumptionRefs: ['analytical-tranche-alternatives'] },
  ],
  actualOperations: [
    {
      operation: 'CONTINUE',
      object: 'learn, adjust, and refine operations in the existing 68 Canadian stores',
      provenance: 'documented',
      evidenceRefs: [q2Evidence],
    },
    {
      operation: 'PREPARE',
      object: 'prepare to open another 56 Canadian stores by year-end',
      provenance: 'documented',
      evidenceRefs: [q2Evidence],
    },
  ],
  exposures: {
    storeActivation: {
      id: 'store-activation-exposure',
      label: 'Requested store-activation exposure',
      displayState: 'OBSERVED',
      materiality: 'material',
      metric: { value: 56, unit: 'stores planned to open' },
      factRef: 'canada-stores-remaining-2013',
      evidence: q2Evidence,
      publishedAt: '2013-08-21',
      origin: 'reported',
      assumptionRefs: [],
    },
    leases: fog('lease-exposure', 'Lease obligations for the remaining cohort'),
    capitalRemodeling: fog('capital-remodeling-exposure', 'Capital and remodeling exposure for the remaining cohort'),
    inventory: fog('inventory-exposure', 'Inventory exposure for the remaining cohort'),
    people: fog('people-exposure', 'People capacity and exposure for the remaining cohort'),
    cash: fog('cash-exposure', 'Cash exposure for the remaining cohort'),
  },
  materialUnknowns: [
    fog('readiness-gates-unknown', 'Documented readiness and release gates'),
    fog('inventory-in-stock-unknown', 'Inventory accuracy and in-stock performance'),
    fog('distribution-thresholds-unknown', 'Distribution readiness thresholds'),
    fog('mature-store-economics-unknown', 'Mature-store economics'),
    fog('loss-tolerance-unknown', 'Authorized operating-loss tolerance'),
    fog('authority-unknown', 'Actor authority and delegation boundary'),
  ],
  assumptions: [
    { id: 'analytical-actor-label', statement: 'The aggregate actor label is inferred from management commentary; no named decision authority is documented.' },
    { id: 'analytical-high-irreversibility', statement: 'High irreversibility is an analytical classification, not a disclosed Target label.' },
    { id: 'analytical-reassessment-before-release', statement: 'Reassessment before another activation is a proposed safe boundary, not a documented Target gate.' },
    { id: 'analytical-sequence', statement: 'T1 and T2 are StratOS analytical sequence labels.' },
    { id: 'analytical-release-gates', statement: 'Release gates are proposed analytical controls; the public packet documents none.' },
    { id: 'analytical-tranche-alternatives', statement: 'Smaller tranche alternatives are analytical options, not reported Target plans.' },
  ],
  hindsight: [
    {
      id: 'q3-warning-hindsight',
      label: 'Third-quarter Canadian warning evidence',
      displayState: 'HINDSIGHT',
      materiality: 'context',
      evidence: { sourceId: 'target-q3-results-2013', locator: 'Canadian Segment Results' },
      publishedAt: '2013-11-21',
      origin: 'reported',
      assumptionRefs: [],
    },
    {
      id: 'full-year-outcome-hindsight',
      label: 'Full-year Canadian operating evidence',
      displayState: 'HINDSIGHT',
      materiality: 'context',
      factRef: 'canada-ebit-2013',
      evidence: { sourceId: 'target-results-2013', locator: 'Canadian Segment Results' },
      publishedAt: '2014-02-26',
      origin: 'reported',
      assumptionRefs: [],
    },
    {
      id: 'exit-outcome-hindsight',
      label: 'Canadian exit footprint',
      displayState: 'HINDSIGHT',
      materiality: 'context',
      factRef: 'stores-at-exit',
      evidence: { sourceId: 'target-exit-2015', locator: 'Canada operations summary' },
      publishedAt: '2015-01-15',
      origin: 'reported',
      assumptionRefs: [],
    },
  ],
});

export const TARGET_CANADA_AUGUST_2013_DECISION_PACKET = resolveDecisionPoint(
  TARGET_CANADA_AUGUST_2013_DECISION_POINT,
  TARGET_CANADA,
);

export { TARGET_CANADA_AUGUST_2013_REVIEW, TARGET_CANADA_AUGUST_2013_REVIEW_INPUT };
