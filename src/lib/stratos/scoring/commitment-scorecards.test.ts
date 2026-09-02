import { describe, expect, it } from 'vitest';
import { STRATOS_CASE_PROFILES } from '../cases';
import { SYSTEM_IDS } from '../cases/profile';
import {
  ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD,
  DOMINOS_GROWTH_OUTCOME_RETRODICTION_SCORECARD,
  FORD_MODEL_E_LATEST_EVIDENCE_SCORECARD,
  STRATOS_CASE_SCORECARDS,
  STRATOS_COMMITMENT_SCORECARDS,
  TARGET_CANADA_COMMITMENT_SCORECARD,
  TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD,
} from './commitment-scorecards';
import { CASE_SCORECARD_SCHEMA, DESK_AUTHORING_ANCHORS } from './scorecard';

describe('StratOS commitment-date scorecards', () => {
  it('scores all four evidence profiles with the versioned rubric', () => {
    expect(STRATOS_COMMITMENT_SCORECARDS).toHaveLength(4);
    for (const scorecard of STRATOS_COMMITMENT_SCORECARDS) {
      expect(scorecard.schema).toBe(CASE_SCORECARD_SCHEMA);
      expect(scorecard.rubricVersion).toBe('0.2.0');
      expect(scorecard.evidencePacket.snapshot.phase).toBe('commitment');
      expect(scorecard.evidencePacket.company.name).toBeTruthy();
      expect(scorecard.evidencePacket.profileId).toBeTruthy();
    }
    for (const profile of STRATOS_CASE_PROFILES) {
      // Unscored profiles are under construction; a scored one must resolve to a
      // scorecard that actually exists.
      const scoring = profile.scoring;
      if (scoring.status === 'scored') {
        expect(STRATOS_CASE_SCORECARDS.some((scorecard) => scorecard.id === scoring.scorecardId), profile.id).toBe(true);
      }
    }
  });

  it('keeps every scorecard inside its commitment-date evidence window', () => {
    for (const scorecard of STRATOS_COMMITMENT_SCORECARDS) {
      const cutoff = scorecard.evidencePacket.snapshot.knowledgeCutoff;
      expect(scorecard.evidencePacket.sources.every((source) => source.publishedAt <= cutoff), scorecard.id).toBe(true);
      expect(scorecard.evidencePacket.facts.some((fact) => /outcome|actual|exit/i.test(fact.id)), scorecard.id).toBe(false);
    }
  });

  it('uses documented authoring anchors for new desk judgments', () => {
    const quarterStep = (value: number) => Math.abs(value * 4 - Math.round(value * 4)) < 1e-12;
    expect(DESK_AUTHORING_ANCHORS.portabilityBands).toBeDefined();

    for (const scorecard of STRATOS_COMMITMENT_SCORECARDS) {
      for (const tension of SYSTEM_IDS) {
        const position = scorecard.positionInput.tensions[tension];
        const imported = position.sourceRefs.some((ref) => ref.startsWith('tempo:'));
        if (!imported) expect(quarterStep(position.position), `${scorecard.id}.${tension}.position`).toBe(true);
        if (position.evidence.track === 'desk') {
          expect(quarterStep(position.evidence.confidence), `${scorecard.id}.${tension}.confidence`).toBe(true);
        }

        const strain = scorecard.strainInputs[tension];
        expect(strain.companyPosition).toBe(position.position);
        expect(quarterStep(strain.goalPull), `${scorecard.id}.${tension}.goalPull`).toBe(true);
        expect(quarterStep(strain.importance), `${scorecard.id}.${tension}.importance`).toBe(true);
        expect(quarterStep(strain.transferability.portableShare.low)).toBe(true);
        expect(quarterStep(strain.transferability.portableShare.high)).toBe(true);
      }
    }
  });

  it('preserves the pre-existing Tempo Target position vector as an attributed import', () => {
    const positions = TARGET_CANADA_COMMITMENT_SCORECARD.positionInput.tensions;
    expect(SYSTEM_IDS.map((tension) => positions[tension].position)).toEqual([-0.6, -0.6, 0.4, -0.4, -0.7, 0.2]);
    expect(SYSTEM_IDS.every((tension) => positions[tension].sourceRefs[0].startsWith('tempo:'))).toBe(true);
  });

  it('does not turn diagnostic indices or possible strain into a success probability or absolute rank', () => {
    for (const scorecard of STRATOS_COMMITMENT_SCORECARDS) {
      expect(scorecard).not.toHaveProperty('successProbability');
      expect(scorecard).not.toHaveProperty('overallScore');
      expect(scorecard.strainBands.every((strain) => strain.magnitude.low <= strain.magnitude.high)).toBe(true);
    }
  });

  it('returns evidence-gated Fog with a concrete information purchase', () => {
    for (const scorecard of STRATOS_COMMITMENT_SCORECARDS) {
      expect(scorecard.commitmentReview.outcome, scorecard.id).toBe('FOG');
      expect(scorecard.commitmentReview.can, scorecard.id).toBe('unknown');
      expect(scorecard.informationPurchase.length, scorecard.id).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps the computed diagnostic values stable and descriptive', () => {
    const diagnostics = Object.fromEntries(STRATOS_COMMITMENT_SCORECARDS.map((scorecard) => [scorecard.id, {
      commitment: scorecard.position.commitmentIndex,
      evidence: scorecard.position.evidenceIndex,
    }]));

    expect(diagnostics['target-canada-commitment-2012-v0.2']).toEqual({
      commitment: expect.closeTo(0.483333, 5),
      evidence: expect.closeTo(0.416667, 5),
    });
    expect(diagnostics['adobe-creative-cloud-commitment-2013-v0.2']).toEqual({
      commitment: expect.closeTo(0.333333, 5),
      evidence: expect.closeTo(0.375, 5),
    });
    expect(diagnostics['dominos-growth-commitment-2019-v0.2']).toEqual({
      commitment: expect.closeTo(0.583333, 5),
      evidence: expect.closeTo(0.5, 5),
    });
    expect(diagnostics['ford-model-e-commitment-2022-v0.2']).toEqual({
      commitment: expect.closeTo(0.416667, 5),
      evidence: expect.closeTo(0.416667, 5),
    });
  });

  it('uses outcome-calibrated bounds to place Target as a collision', () => {
    const scorecard = TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD;

    expect(scorecard.status).toBe('outcome-calibrated-retrodiction');
    expect(scorecard.evidencePacket.snapshot.phase).toBe('outcome');
    expect(scorecard.commitmentReview).toMatchObject({
      outcome: 'COLLISION',
      should: 'yes',
      can: 'no',
      breakingModels: ['time', 'finance'],
      placements: {
        people: { status: 'uncertain', fit: { low: -400, high: 2600 } },
        time: { status: 'collides', fitUpperBound: -11 },
        finance: { status: 'collides', fitUpperBound: -941 },
      },
    });
  });

  it('calculates distinct calibrated results for the remaining cases', () => {
    expect(ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD.commitmentReview).toMatchObject({
      outcome: 'ABSORBABLE',
      should: 'yes',
      can: 'yes',
      breakingModels: [],
      placements: {
        people: { status: 'fits', fitLowerBound: 0 },
        time: { status: 'fits', fitLowerBound: 0 },
        finance: { status: 'fits', fitLowerBound: 28 },
      },
    });
    expect(DOMINOS_GROWTH_OUTCOME_RETRODICTION_SCORECARD.commitmentReview).toMatchObject({
      outcome: 'COLLISION',
      should: 'yes',
      can: 'no',
      breakingModels: ['time', 'finance'],
      placements: {
        people: { status: 'indeterminate' },
        time: { status: 'collides', fitUpperBound: -2858 },
        finance: { status: 'collides', fitUpperBound: -4.8732 },
      },
    });
    expect(FORD_MODEL_E_LATEST_EVIDENCE_SCORECARD).toMatchObject({
      status: 'latest-evidence-calibration',
      commitmentReview: {
        outcome: 'COLLISION',
        should: 'yes',
        can: 'no',
        breakingModels: ['time', 'finance'],
        placements: {
          people: { status: 'indeterminate' },
          time: { status: 'collides', fitUpperBound: -1 },
          finance: { status: 'collides', fitUpperBound: -139.8 },
        },
      },
    });
  });
});
