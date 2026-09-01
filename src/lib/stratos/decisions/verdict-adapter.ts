import type { EvidenceRef } from '../cases/profile';
import {
  evaluateCommitmentReview,
  type CommitmentReviewInput,
  type SpendModel,
} from '../scoring/rubric';
import type { JudgmentCauseKind, JudgmentResult } from './judgment';

export const VALIDATED_SCALE_NOT_DETERMINED = 'not-determined' as const;

export interface ValidatedScaleEvidence {
  readonly description: string;
  readonly evidenceRefs: readonly EvidenceRef[];
}

export interface CommitmentReviewAdapterInput {
  /** The existing v0.2 input remains authoritative and is evaluated without mutation. */
  readonly commitmentReview: CommitmentReviewInput;
  /** Scale may authorize FIT only when both its description and evidence are present. */
  readonly validatedScale?: ValidatedScaleEvidence;
  /** Decision-specific unknowns not represented by the v0.2 floor/capacity model. */
  readonly materialUnknowns?: readonly string[];
  /** Cutoff-safe references supporting the adapter's cause explanation. */
  readonly causeEvidenceRefs?: readonly EvidenceRef[];
  /** Optional authored subtype for a non-floor collision; raw display prose is never parsed. */
  readonly collisionCause?: Extract<JudgmentCauseKind, 'capacity' | 'readiness' | 'transferability' | 'authority'>;
}

export type VerdictMappingResult = Pick<
  JudgmentResult,
  'verdict' | 'validatedScale' | 'bindingDimensions' | 'materialUnknowns' | 'cause'
>;

const SPEND_MODELS: readonly SpendModel[] = ['people', 'time', 'finance'];

function isEvidenceRef(value: EvidenceRef): boolean {
  return value.sourceId.trim().length > 0 && value.locator.trim().length > 0;
}

function hasEvidencedScale(value: ValidatedScaleEvidence | undefined): value is ValidatedScaleEvidence {
  return value !== undefined
    && value.description.trim().length > 0
    && value.evidenceRefs.length > 0
    && value.evidenceRefs.every(isEvidenceRef);
}

function uniqueNonEmpty(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

/**
 * Map the existing v0.2 commitment review into judgment semantics.
 *
 * The adapter deliberately carries only dimension names, never raw placement
 * deficits, because people, time, and finance use incompatible units.
 */
export function adaptCommitmentReview(input: CommitmentReviewAdapterInput): VerdictMappingResult {
  const review = evaluateCommitmentReview(input.commitmentReview);
  const scaleIsEvidenced = hasEvidencedScale(input.validatedScale);
  const trippedRiskFloors = input.commitmentReview.riskFloors.filter((floor) => floor.status === 'trip');
  const unknownRiskFloors = input.commitmentReview.riskFloors.filter((floor) => floor.status === 'unknown');
  const uncertainModels = SPEND_MODELS.filter((model) => (
    ['uncertain', 'indeterminate'].includes(review.placements[model].status)
  ));

  const materialUnknowns = uniqueNonEmpty([
    ...(input.materialUnknowns ?? []),
    ...(input.commitmentReview.value === 'unknown' ? ['Value floor'] : []),
    ...unknownRiskFloors.map((floor) => `Risk floor: ${floor.id}`),
    ...uncertainModels.map((model) => `${model} capacity`),
    ...(review.outcome === 'ABSORBABLE' && !scaleIsEvidenced ? ['Validated scale'] : []),
  ]);
  const bindingDimensions = [...review.breakingModels];
  const evidenceRefs = [...(input.causeEvidenceRefs ?? [])];
  const validatedScale = scaleIsEvidenced
    ? input.validatedScale.description.trim()
    : VALIDATED_SCALE_NOT_DETERMINED;

  if (input.commitmentReview.value === 'not-worth-pursuing') {
    return {
      verdict: 'COLLISION',
      validatedScale,
      bindingDimensions,
      materialUnknowns,
      cause: {
        kind: 'value-floor',
        summary: input.commitmentReview.valueRationale.trim(),
        evidenceRefs,
      },
    };
  }

  if (trippedRiskFloors.length > 0) {
    return {
      verdict: 'COLLISION',
      validatedScale,
      bindingDimensions,
      materialUnknowns,
      cause: {
        kind: 'risk-floor',
        summary: trippedRiskFloors.map((floor) => floor.rationale.trim()).join(' '),
        evidenceRefs,
      },
    };
  }

  if (review.outcome === 'ABSORBABLE' && scaleIsEvidenced && materialUnknowns.length === 0) {
    return {
      verdict: 'FIT',
      validatedScale,
      bindingDimensions,
      materialUnknowns,
      cause: {
        kind: 'fit',
        summary: `The commitment is absorbable at ${validatedScale}.`,
        evidenceRefs: [...input.validatedScale.evidenceRefs],
      },
    };
  }

  if (review.outcome === 'COLLISION') {
    return {
      verdict: 'COLLISION',
      validatedScale,
      bindingDimensions,
      materialUnknowns,
      cause: {
        kind: input.collisionCause ?? 'capacity',
        summary: review.reasons.join(' '),
        evidenceRefs,
      },
    };
  }

  // Native FOG and an otherwise absorbable result with no evidenced scale both
  // remain unauthorizable uncertainty rather than becoming an invented FIT.
  return {
    verdict: 'FOG',
    validatedScale,
    bindingDimensions,
    materialUnknowns,
    cause: {
      kind: 'material-uncertainty',
      summary: review.outcome === 'ABSORBABLE'
        ? scaleIsEvidenced
          ? 'Decision-material uncertainty prevents authorization at the requested scale.'
          : 'The commitment review is absorbable, but no evidenced authorization scale was supplied.'
        : review.reasons.join(' '),
      evidenceRefs,
    },
  };
}
