import { authorizeCommitment, type CommitmentJudgmentInput } from './contract';

/**
 * A transparent UI fixture for the Phase 1 contract. It is intentionally not a
 * historical Target Canada finding; Phase 2 will replace it with dated evidence sets.
 */
export const ILLUSTRATIVE_TARGET_INPUT: CommitmentJudgmentInput = {
  caseId: 'target-canada-illustrative-contract',
  label: 'Target Canada · illustrative decision model',
  decisionDate: '2013-06-30',
  evidenceCutoff: '2013-06-30',
  requestedCommitment: {
    object: 'store_release',
    increment: 'next national tranche',
    active: true,
    irreversibility: 'high',
  },
  value: {
    verdict: 'FIT',
    cause: 'The scenario assumes the market-entry goal remains above its value floor.',
  },
  dimensions: [
    {
      dimension: 'operations',
      verdict: 'COLLISION',
      cause: 'The requested release rate exceeds the scenario readiness gate for inventory and store operations.',
      evidenceRefs: ['operating-readiness'],
      material: true,
    },
    {
      dimension: 'learning_time',
      verdict: 'COLLISION',
      cause: 'The next tranche would be committed before two operating cycles can produce reassessment evidence.',
      evidenceRefs: ['learning-window'],
      material: true,
    },
    {
      dimension: 'finance',
      verdict: 'FOG',
      cause: 'The remediation budget is not placed in this illustrative input set.',
      evidenceRefs: ['remediation-budget'],
      material: false,
    },
  ],
  evidence: [
    {
      id: 'operating-readiness',
      label: 'Operating readiness',
      value: 'Below analytical release gate',
      status: 'ESTIMATED',
      sourceLabel: 'Illustrative scenario input',
      assumption: 'Inventory accuracy, in-stock rate, and distribution cycle time must clear the release gate together.',
      material: true,
    },
    {
      id: 'learning-window',
      label: 'Learning window',
      value: 'Less than two operating cycles',
      status: 'ESTIMATED',
      sourceLabel: 'Illustrative scenario input',
      assumption: 'Two stable cycles are required before another irreversible release.',
      material: true,
    },
    {
      id: 'remediation-budget',
      label: 'Remediation budget',
      value: 'Not established',
      status: 'FOG',
      sourceLabel: 'Illustrative scenario input',
      material: false,
    },
  ],
  evidenceStandardMet: true,
  collisionRepairable: true,
  pathState: 'ineffective',
  commitmentPolicy: {
    hasAuthority: true,
    options: {
      CHANGE: {
        object: 'store_release',
        parameters: { release_rate: 0 },
        label: 'Hold additional store releases',
        authorization: 'The goal remains valuable, but the requested tranche is not authorized under the current operating configuration.',
        owner: 'Canada executive sponsor',
        displayMacro: 'HOLD',
      },
      ESCALATE: {
        object: 'commitment_authority',
        parameters: { decision: 'change release scope', authority: 'executive sponsor' },
        label: 'Escalate the release decision',
        authorization: 'The current actor cannot change the release commitment.',
        owner: 'Executive sponsor',
      },
    },
  },
  pathPolicy: {
    hasAuthority: true,
    options: {
      CHANGE: {
        object: 'rollout_configuration',
        parameters: { next_form: 'bounded operating cohort' },
        label: 'Redesign the rollout configuration',
        authorization: 'The current rollout form does not resolve the operating-readiness collision before the next release.',
        owner: 'Canada operations lead',
        displayMacro: 'REDESIGN',
      },
      ESCALATE: {
        object: 'path_authority',
        parameters: { decision: 'assign remediation ownership', authority: 'executive sponsor' },
        label: 'Escalate path ownership',
        authorization: 'No actor inside the current path can authorize the required redesign.',
        owner: 'Executive sponsor',
      },
    },
  },
  nextSafeCommitment: 'No additional stores under the current configuration.',
  releaseGate: {
    conditions: [
      'Inventory accuracy clears the analytical threshold',
      'In-stock rate clears the analytical threshold',
      'Distribution cycle time stays inside the analytical range',
    ],
    sustainedFor: '2 operating cycles',
  },
  boundary: {
    time: '2 operating cycles',
    finance: 'bounded remediation budget',
    attempts: '1 revised configuration',
    returnCondition: 'Return to commitment review when the release gate is met or the boundary is exhausted.',
  },
  reassessment: [
    { trigger: 'Release gate met', operation: 'CHANGE', object: 'store_release', parameters: { tranche: 'smaller_tranche' } },
    { trigger: 'Configuration remains ineffective', operation: 'CHANGE', object: 'rollout_configuration' },
    { trigger: 'Boundary exhausted', operation: 'ESCALATE', object: 'commitment_scope_and_value' },
    { trigger: 'Value floor breached', operation: 'END', object: 'store_release' },
  ],
};

export const ILLUSTRATIVE_TARGET_EVALUATION = authorizeCommitment(ILLUSTRATIVE_TARGET_INPUT);
