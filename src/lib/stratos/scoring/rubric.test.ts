import { describe, expect, it } from 'vitest';
import type { SystemId } from '../cases/profile';
import { STRATOS_CASE_PROFILES } from '../cases';
import { prepareCaseScoringPacket } from './profile-adapter';
import {
  assessGoalStrain,
  assessOrganizationPosition,
  evidenceConfidence,
  evaluateCapacityPlacement,
  evaluateCommitmentReview,
  positionInterval,
  validateCapacityFigure,
  type CapacityFigure,
  type CapacityPlacement,
  type OrganizationPositionInput,
  type RiskFloorInput,
  type SpendModel,
} from './rubric';

const targetPositions: Record<SystemId, number> = {
  advantage: -0.7,
  resource: 0.2,
  discernment: -0.6,
  execution: -0.4,
  invention: -0.6,
  operations: 0.4,
};

const targetInput: OrganizationPositionInput = {
  posture: 'incumbent',
  tensions: Object.fromEntries(Object.entries(targetPositions).map(([tension, position]) => [
    tension,
    {
      position,
      rationale: `Pre-decision Target rationale for ${tension}.`,
      metricName: `${tension} operating signal`,
      sourceRefs: [`target-${tension}-source`],
      evidence: { track: 'desk', confidence: 0.6 },
    },
  ])) as unknown as OrganizationPositionInput['tensions'],
};

const figure = (
  value: readonly [number, number],
  state: CapacityFigure['state'],
  sourceClass: CapacityFigure['sourceClass'],
  unit = 'fte-months',
): CapacityFigure => ({
  value: { low: value[0], high: value[1] },
  unit,
  state,
  confidence: 0.8,
  asOf: '2011-01-13',
  sourceRef: `${state}-source`,
  sourceClass,
});

const bound = (low: number, high: number, unit = 'fte-months'): CapacityPlacement => ({
  kind: 'structural-bound',
  fit: { low, high },
  unit,
  confidence: 0.65,
  rationale: 'The disclosed plan bounds the fit without asserting internal committed load.',
  sources: [{ ref: 'plan-source', sourceClass: 'A' }],
});

const passingFloor: RiskFloorInput = {
  id: 'license-to-operate',
  status: 'pass',
  rationale: 'No disclosed hard stop in the evidence window.',
  sourceRefs: ['risk-source'],
};

const placements = (overrides: Partial<Record<SpendModel, CapacityPlacement>> = {}) => ({
  people: bound(2, 4),
  time: bound(1, 2, 'months'),
  finance: bound(10, 20, 'usd-million'),
  ...overrides,
});

describe('StratOS organization-position diagnostics', () => {
  it('reproduces the Tempo v5.1 Target diagnostics without turning them into viability', () => {
    const result = assessOrganizationPosition(targetInput);

    expect(result.commitmentIndex).toBeCloseTo(2.9 / 6);
    expect(result.evidenceIndex).toBeCloseTo(0.6);
    expect(result.evidenceTrack).toBe('desk');
    expect(result.lowCommitment).toBe(false);
    expect(result.layerBalances.map(({ pair, report }) => ({ pair, report }))).toEqual([
      { pair: 'economics', report: true },
      { pair: 'commitment', report: false },
      { pair: 'renewal', report: false },
    ]);
    expect(result.layerBalances[0].balance).toBeCloseTo(0.5);
    expect(result.layerBalances[1].balance).toBeCloseTo(0.2);
    expect(result.layerBalances[2].balance).toBeCloseTo(0.2);
    expect(Object.values(result.tensions).reduce((sum, tension) => sum + tension.attentionShare, 0)).toBeCloseTo(1);
  });

  it('uses the weaker pole as the evidence-confidence limiter', () => {
    expect(evidenceConfidence(3, 3)).toBeCloseTo(0.5);
    expect(evidenceConfidence(12, 0)).toBe(0);
  });

  it('widens uncertainty without moving the estimate', () => {
    const higherConfidence = positionInterval(0.2, 0.9);
    const lowerConfidence = positionInterval(0.2, 0.5);

    expect((higherConfidence.low + higherConfidence.high) / 2).toBeCloseTo(0.2);
    expect((lowerConfidence.low + lowerConfidence.high) / 2).toBeCloseTo(0.2);
    expect(lowerConfidence.high - lowerConfidence.low).toBeGreaterThan(higherConfidence.high - higherConfidence.low);
  });
});

describe('StratOS goal-strain mapping', () => {
  it('detects a Target-style instantiation headwind despite pole alignment', () => {
    const result = assessGoalStrain({
      tension: 'operations',
      companyPosition: 0.4,
      goalPull: 0.8,
      importance: 1,
      contextChange: true,
      rationale: 'The goal requires a scaled operating system in a new country.',
      sourceLens: 'Pre-decision plan scope and implementation clock.',
      sourceRefs: ['target-plan'],
      transferability: {
        portableShare: { low: 0.1, high: 0.3 },
        confidence: 0.45,
        rationale: 'U.S. routines do not establish local distribution, data, or workforce readiness.',
        sourceRefs: ['target-plan', 'target-capability-evidence'],
      },
    });

    expect(result.poleRelationship).toBe('tailwind');
    expect(result.overallRelationship).toBe('headwind');
    expect(result.headwindSources).toEqual(['instantiation-cost']);
    expect(result.instantiationMagnitude.low).toBeCloseTo(0.56);
    expect(result.instantiationMagnitude.high).toBeCloseTo(0.72);
    expect(result.routesTo).toEqual(['time', 'finance']);
  });

  it('routes mismatch magnitude to attention only', () => {
    const result = assessGoalStrain({
      tension: 'discernment',
      companyPosition: -0.6,
      goalPull: 0.8,
      importance: 0.5,
      contextChange: false,
      rationale: 'The goal demands an opposing decision posture.',
      sourceLens: 'Goal initiatives versus operating evidence.',
      sourceRefs: ['goal-source'],
      transferability: {
        portableShare: { low: 1, high: 1 },
        confidence: 0.8,
        rationale: 'No context change is in scope.',
        sourceRefs: ['goal-source'],
      },
    });

    expect(result.poleRelationship).toBe('headwind');
    expect(result.poleMismatchMagnitude).toBeCloseTo(0.35);
    expect(result.routesTo).toEqual(['time']);
  });

  it('labels a zero-to-positive instantiation band uncertain instead of asserting a headwind', () => {
    const result = assessGoalStrain({
      tension: 'operations',
      companyPosition: 0.5,
      goalPull: 0.75,
      importance: 1,
      contextChange: true,
      rationale: 'The goal extends an existing operating system into additional markets.',
      sourceLens: 'Commitment and pre-outcome operating evidence.',
      sourceRefs: ['operating-source'],
      transferability: {
        portableShare: { low: 0.75, high: 1 },
        confidence: 0.5,
        rationale: 'The model is designed to travel, with unresolved local variance.',
        sourceRefs: ['operating-source'],
      },
    });

    expect(result.instantiationMagnitude.low).toBe(0);
    expect(result.instantiationMagnitude.high).toBeGreaterThan(0);
    expect(result.overallRelationship).toBe('uncertain');
  });
});

describe('StratOS source contract and capacity placement', () => {
  it('rejects inside-only epistemic states in a public desk review', () => {
    const issues = validateCapacityFigure(figure([4, 4], 'committed', 'inside'), 'desk');
    expect(issues).toContain('A desk review cannot assert a committed figure.');
  });

  it('rejects point estimates and Class D numeric inputs', () => {
    expect(validateCapacityFigure(figure([4, 4], 'estimated', 'A'), 'desk')).toContain(
      'An estimated figure must be a range, not a point.',
    );
    expect(validateCapacityFigure(figure([4, 5], 'estimated', 'D'), 'desk')).toContain(
      'Class D framing cannot supply a capacity figure.',
    );
  });

  it('computes transferable reserve and fit only when units and inside commitments are valid', () => {
    const result = evaluateCapacityPlacement({
      kind: 'computed',
      capacity: figure([10, 10], 'observed', 'A'),
      committed: figure([4, 4], 'committed', 'inside'),
      load: figure([2, 3], 'estimated', 'A'),
      transferability: {
        value: { low: 1, high: 1 },
        confidence: 0.7,
        asOf: '2011-01-13',
        rationale: 'Capacity is fully applicable to this context.',
        sourceRefs: ['transfer-source'],
      },
    }, 'inside-access');

    expect(result).toMatchObject({ status: 'fits', fit: { low: 3, high: 4 }, method: 'computed' });
  });

  it('accepts a sourced one-sided bound when its upper edge establishes collision', () => {
    const result = evaluateCapacityPlacement({
      kind: 'structural-upper-bound',
      fitAtMost: -11,
      unit: 'months',
      confidence: 0.75,
      rationale: 'The observed learning window exceeded the available rollout window by more than eleven months.',
      sources: [{ ref: 'time-bound-source', sourceClass: 'A' }],
    }, 'desk');

    expect(result).toMatchObject({
      status: 'collides',
      fitUpperBound: -11,
      method: 'structural-upper-bound',
    });
  });

  it('accepts a sourced lower bound when outcomes establish nonnegative fit without precise surplus', () => {
    const result = evaluateCapacityPlacement({
      kind: 'structural-lower-bound',
      fitAtLeast: 0,
      unit: 'delivered transition coverage',
      confidence: 0.5,
      rationale: 'The completed transition proves coverage but does not quantify unused reserve.',
      sources: [{ ref: 'completed-transition', sourceClass: 'A' }],
    }, 'desk');

    expect(result).toMatchObject({
      status: 'fits',
      fitLowerBound: 0,
      method: 'structural-lower-bound',
    });
  });
});

describe('StratOS evidenced local shortfall', () => {
  const positions = (
    value: readonly [number, number],
    state: CapacityFigure['state'],
    sourceRef: string,
  ): CapacityFigure => ({
    value: { low: value[0], high: value[1] },
    unit: 'rollout-support positions',
    state,
    confidence: 0.8,
    asOf: '2020-01-08',
    sourceRef,
    sourceClass: 'A',
  });

  const shortfall = (
    required: CapacityFigure,
    available: CapacityFigure,
  ): CapacityPlacement => ({
    kind: 'evidenced-shortfall',
    scope: 'Mann-Grandstaff EHR rollout-support staffing',
    required,
    available,
  });

  it('collides when the evidenced local supply falls below the evidenced local requirement', () => {
    const result = evaluateCapacityPlacement(
      shortfall(
        positions([108, 108], 'observed', 'va-oig-access-2020'),
        positions([48, 60], 'estimated', 'va-oig-access-2020'),
      ),
      'desk',
    );

    expect(result).toMatchObject({
      status: 'collides',
      fit: { low: -60, high: -48 },
      unit: 'rollout-support positions',
      method: 'evidenced-shortfall',
    });
  });

  it('fits when the evidenced local supply meets the requirement', () => {
    const result = evaluateCapacityPlacement(
      shortfall(
        positions([100, 100], 'observed', 'required-source'),
        positions([110, 120], 'estimated', 'available-source'),
      ),
      'desk',
    );

    expect(result).toMatchObject({ status: 'fits', fit: { low: 10, high: 20 } });
  });

  it('carries the weakest confidence of the two figures as the floor', () => {
    const required = { ...positions([108, 108], 'observed', 'required-source'), confidence: 0.9 };
    const available = { ...positions([48, 48], 'observed', 'available-source'), confidence: 0.55 };

    expect(evaluateCapacityPlacement(shortfall(required, available), 'desk')).toMatchObject({
      confidenceFloor: 0.55,
    });
  });

  it('refuses committed or actual figures because a local shortfall never asserts reserve', () => {
    const insideFigure: CapacityFigure = {
      ...positions([48, 48], 'committed', 'inside-source'),
      sourceClass: 'inside',
    };

    expect(() => evaluateCapacityPlacement(
      shortfall(positions([108, 108], 'observed', 'required-source'), insideFigure),
      'inside-access',
    )).toThrow(/models a local position, not organizational reserve/);
  });

  it('requires a named scope so an organization-wide claim cannot pose as a local one', () => {
    expect(() => evaluateCapacityPlacement({
      kind: 'evidenced-shortfall',
      scope: '   ',
      required: positions([108, 108], 'observed', 'required-source'),
      available: positions([48, 48], 'observed', 'available-source'),
    }, 'desk')).toThrow(/scope/);
  });

  it('requires both figures to share a unit', () => {
    expect(() => evaluateCapacityPlacement(
      shortfall(
        positions([108, 108], 'observed', 'required-source'),
        { ...positions([48, 48], 'observed', 'available-source'), unit: 'fte-months' },
      ),
      'desk',
    )).toThrow(/same unit/);
  });

  it('applies the standard figure contract to both sides', () => {
    expect(() => evaluateCapacityPlacement(
      shortfall(
        positions([108, 108], 'observed', 'required-source'),
        { ...positions([48, 48], 'estimated', 'available-source'), sourceClass: 'D' },
      ),
      'desk',
    )).toThrow(/Class D framing cannot supply a capacity figure/);
  });
});

describe('StratOS Commitment Review decision cascade', () => {
  it('returns FLOOR when a non-compensating risk floor trips', () => {
    const result = evaluateCommitmentReview({
      accessTier: 'desk',
      value: 'worth-pursuing',
      valueRationale: 'The goal has disclosed strategic value.',
      valueSourceRefs: ['value-source'],
      riskFloors: [{ ...passingFloor, status: 'trip' }],
      placements: placements(),
    });

    expect(result).toMatchObject({ outcome: 'FLOOR', should: 'no' });
  });

  it('keeps a definite collision when another fit crosses zero', () => {
    const result = evaluateCommitmentReview({
      accessTier: 'desk',
      value: 'worth-pursuing',
      valueRationale: 'The goal has disclosed strategic value.',
      valueSourceRefs: ['value-source'],
      riskFloors: [passingFloor],
      placements: placements({ time: bound(-1, 1, 'months'), finance: bound(-20, -10, 'usd-million') }),
    });

    expect(result).toMatchObject({ outcome: 'COLLISION', can: 'no' });
    expect(result.breakingModels).toEqual(['finance']);
  });

  it('returns COLLISION when any independently evaluated spend model is negative', () => {
    const result = evaluateCommitmentReview({
      accessTier: 'desk',
      value: 'worth-pursuing',
      valueRationale: 'The goal has disclosed strategic value.',
      valueSourceRefs: ['value-source'],
      riskFloors: [passingFloor],
      placements: placements({ time: bound(-4, -2, 'months'), finance: bound(100, 200, 'usd-million') }),
    });

    expect(result).toMatchObject({ outcome: 'COLLISION', should: 'yes', can: 'no' });
    expect(result.breakingModels).toEqual(['time']);
  });

  it('returns ABSORBABLE only when all floors pass and all spend models fit', () => {
    const result = evaluateCommitmentReview({
      accessTier: 'desk',
      value: 'worth-pursuing',
      valueRationale: 'The goal has disclosed strategic value.',
      valueSourceRefs: ['value-source'],
      riskFloors: [passingFloor],
      placements: placements(),
    });

    expect(result).toMatchObject({ outcome: 'ABSORBABLE', should: 'yes', can: 'yes' });
  });

  it('treats unknown committed load as FOG rather than a favorable default', () => {
    const result = evaluateCommitmentReview({
      accessTier: 'desk',
      value: 'worth-pursuing',
      valueRationale: 'The goal has disclosed strategic value.',
      valueSourceRefs: ['value-source'],
      riskFloors: [passingFloor],
      placements: placements({
        people: { kind: 'indeterminate', reason: 'Public evidence cannot place internal committed people capacity.' },
      }),
    });

    expect(result).toMatchObject({ outcome: 'FOG', can: 'unknown' });
  });
});

describe('StratOS evidence-profile adapter', () => {
  it('builds cutoff-safe scoring packets without inventing the missing judgments', () => {
    for (const profile of STRATOS_CASE_PROFILES) {
      const commitmentSnapshot = profile.snapshots.find((snapshot) => snapshot.phase === 'commitment');
      expect(commitmentSnapshot, profile.id).toBeDefined();

      const packet = prepareCaseScoringPacket(profile, commitmentSnapshot!.id);
      expect(packet.facts.length, profile.id).toBeGreaterThan(0);
      expect(packet.sources.every((source) => source.publishedAt <= packet.snapshot.knowledgeCutoff), profile.id).toBe(true);
      expect(packet.authoringRequirements.map((requirement) => requirement.id)).toContain('blind-prediction');
      expect(profile.scoring.status).toBe('scored');
    }
  });
});
