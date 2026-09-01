import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DecisionExperience } from '../../../pages/stratos-v2';
import { TARGET_CANADA } from '../cases';
import type { CaseProfile } from '../cases/profile';
import {
  ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD,
  TARGET_CANADA_COMMITMENT_SCORECARD,
  TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD,
} from '../scoring/commitment-scorecards';
import {
  TARGET_CANADA_AUGUST_2013_DECISION_PACKET,
  TARGET_CANADA_AUGUST_2013_DECISION_POINT,
  TARGET_CANADA_AUGUST_2013_JUDGMENT,
  adaptCommitmentReview,
  createDecisionExperienceViewModel,
  resolveDecisionPoint,
  validateRecommendationPair,
} from './index';

const scale = {
  description: 'One evidenced release cohort',
  evidenceRefs: [{ sourceId: 'release-cohort', locator: 'release report, cohort table' }],
} as const;

describe('public judgment acceptance contract', () => {
  it('maps absorbable, fog, collision, and known or unknown floors through public exports', () => {
    const absorbable = ADOBE_CREATIVE_CLOUD_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput;
    const fog = TARGET_CANADA_COMMITMENT_SCORECARD.commitmentReviewInput;
    const collision = TARGET_CANADA_OUTCOME_RETRODICTION_SCORECARD.commitmentReviewInput;

    expect(adaptCommitmentReview({ commitmentReview: absorbable, validatedScale: scale }).verdict).toBe('FIT');
    expect(adaptCommitmentReview({ commitmentReview: fog }).verdict).toBe('FOG');
    expect(adaptCommitmentReview({ commitmentReview: collision }).verdict).toBe('COLLISION');
    expect(adaptCommitmentReview({
      commitmentReview: {
        ...absorbable,
        riskFloors: [{
          id: 'legal-operability',
          status: 'trip',
          rationale: 'A documented legal condition prevents operation.',
          sourceRefs: ['legal-finding'],
        }],
      },
    })).toMatchObject({ verdict: 'COLLISION', cause: { kind: 'risk-floor' } });
    expect(adaptCommitmentReview({
      commitmentReview: {
        ...absorbable,
        riskFloors: [{
          id: 'legal-operability',
          status: 'unknown',
          rationale: 'The legal floor is unresolved.',
          sourceRefs: ['legal-finding'],
        }],
      },
    })).toMatchObject({ verdict: 'FOG', cause: { kind: 'material-uncertainty' } });
  });

  it.each([
    ['missing', []],
    ['extra', [
      ...TARGET_CANADA_AUGUST_2013_JUDGMENT.recommendations,
      TARGET_CANADA_AUGUST_2013_JUDGMENT.recommendations[1],
    ]],
    ['duplicate', [
      TARGET_CANADA_AUGUST_2013_JUDGMENT.recommendations[0],
      { ...TARGET_CANADA_AUGUST_2013_JUDGMENT.recommendations[1], plane: 'commitment' },
    ]],
    ['reversed', [...TARGET_CANADA_AUGUST_2013_JUDGMENT.recommendations].reverse()],
  ] as const)('rejects a %s public recommendation pair', (_case, recommendations) => {
    expect(validateRecommendationPair(recommendations)).not.toEqual([]);
  });

  it('rejects an unbounded public recommendation pair', () => {
    const recommendations = structuredClone(TARGET_CANADA_AUGUST_2013_JUDGMENT.recommendations);
    (recommendations[1] as unknown as { boundary: Record<string, unknown> }).boundary = {
      expiryOrReturnCondition: 'Return when the work is complete.',
    };

    expect(validateRecommendationPair(recommendations)).toContainEqual(expect.objectContaining({
      path: 'recommendations.1.boundary',
    }));
  });

  it('is deterministic and invariant to post-cutoff Target facts', () => {
    expect(createDecisionExperienceViewModel()).toEqual(createDecisionExperienceViewModel());

    const profileWithLaterFact: CaseProfile = {
      ...TARGET_CANADA,
      facts: [
        ...TARGET_CANADA.facts,
        {
          id: 'acceptance-post-cutoff-fact',
          statement: 'A post-cutoff fact that must not enter the August decision packet.',
          observedAt: '2013-11-21',
          origin: 'reported',
          evidence: [{ sourceId: 'target-q3-results-2013', locator: 'Canadian Segment Results' }],
        },
      ],
    };
    const resolved = resolveDecisionPoint(
      TARGET_CANADA_AUGUST_2013_DECISION_POINT,
      profileWithLaterFact,
    );

    expect(resolved.contemporaneousInputs).toEqual(
      TARGET_CANADA_AUGUST_2013_DECISION_PACKET.contemporaneousInputs,
    );
    expect(resolved.contemporaneousInputs.some(({ factRef }) => (
      factRef === 'acceptance-post-cutoff-fact'
    ))).toBe(false);
  });

  it('carries the complete Target decision semantics into the rendered surface', () => {
    const view = createDecisionExperienceViewModel();
    const html = renderToStaticMarkup(createElement(DecisionExperience, { view }));

    expect(view.currentCohort.metric).toEqual({ value: 68, unit: 'stores operating' });
    expect(view.requestedIncrement.metric).toEqual({ value: 56, unit: 'stores planned to open' });
    expect(view.actor.authorityStatus).toBe('unknown');
    expect(view.exposures).toHaveLength(6);
    expect(html).toContain('Decision date and knowledge cutoff · August 21, 2013');
    expect(html).toContain('Verdict</span><strong>FOG');
    expect(html.indexOf('commitment operation')).toBeLessThan(html.indexOf('path operation'));
    expect(html).toContain('<dt>Authority</dt><dd>unknown</dd>');
    expect(html).toContain('Actual operations');
    expect(html).toContain('StratOS operations');
    expect(html).toContain('ANALYTICAL');
    expect(html).toContain('ASSUMPTION');
    expect(html).toContain('<legend>Decision timeline</legend>');
    expect(html).toContain('type="radio"');
    for (const status of ['OBSERVED', 'ESTIMATED', 'FOG', 'HINDSIGHT']) {
      expect(html).toContain(status);
    }
  });
});
