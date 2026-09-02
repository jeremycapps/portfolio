export const CASE_PROFILE_SCHEMA = 'stratos.case-profile/1' as const;

export const SYSTEM_IDS = [
  'discernment',
  'invention',
  'operations',
  'execution',
  'advantage',
  'resource',
] as const;

export const CONSTRAINT_IDS = ['people', 'finance', 'time', 'risk'] as const;

export type SystemId = typeof SYSTEM_IDS[number];
export type ConstraintId = typeof CONSTRAINT_IDS[number];
export type Confidence = 'high' | 'medium' | 'low' | 'not-assessed';
export type AssessmentStatus = 'evidenced' | 'inferred' | 'insufficient-evidence';
export type SnapshotPhase = 'commitment' | 'material-update' | 'outcome' | 'ongoing';
export type EvidenceOrigin = 'reported' | 'derived';

export interface EvidenceRef {
  readonly sourceId: string;
  readonly locator: string;
}

export interface CaseSource {
  readonly id: string;
  readonly title: string;
  readonly publisher: string;
  /**
   * `audit-report` and `agency-release` carry the government cases. An inspector
   * general or GAO report is the public-sector analogue of mandatory disclosure:
   * independently produced, dated, and locatable, so it earns the same Class A
   * standing as a filing.
   */
  readonly kind:
    | 'filing'
    | 'annual-report'
    | 'earnings-release'
    | 'company-release'
    | 'audit-report'
    | 'agency-release'
    | 'news';
  /** Date on which a public analyst could first use this source. */
  readonly publishedAt: string;
  readonly url: string;
}

export interface MetricValue {
  readonly value: number;
  readonly unit: string;
}

export interface MetricRange {
  readonly low: number;
  readonly high: number;
  readonly unit: string;
}

export interface CaseFact {
  readonly id: string;
  readonly statement: string;
  /** Date or period end to which the observation applies. */
  readonly observedAt: string;
  readonly origin: EvidenceOrigin;
  readonly metric?: MetricValue | MetricRange;
  readonly calculation?: string;
  readonly evidence: readonly EvidenceRef[];
}

export interface CommitmentTarget {
  readonly id: string;
  readonly label: string;
  /** Omitted when the public commitment did not name a deadline. */
  readonly deadline?: string;
  readonly target?: MetricValue;
  readonly evidence: readonly EvidenceRef[];
}

export interface CaseAssessment {
  readonly status: AssessmentStatus;
  readonly confidence: Confidence;
  readonly summary: string;
  readonly factRefs: readonly string[];
  /** Evidence still needed before this assessment can support a numeric score. */
  readonly unknowns: readonly string[];
}

export interface CaseSnapshot {
  readonly id: string;
  readonly label: string;
  readonly phase: SnapshotPhase;
  /** No source published after this date may inform the snapshot. */
  readonly knowledgeCutoff: string;
  readonly factRefs: readonly string[];
  readonly systems: Readonly<Record<SystemId, CaseAssessment>>;
  readonly constraints: Readonly<Record<ConstraintId, CaseAssessment>>;
}

export interface CaseProfile {
  readonly schema: typeof CASE_PROFILE_SCHEMA;
  readonly id: string;
  readonly version: string;
  /** The reporting organization. Government agencies have no ticker or exchange. */
  readonly company: {
    readonly name: string;
    readonly ticker?: string;
    readonly exchange?: string;
  };
  readonly case: {
    readonly name: string;
    readonly scope: string;
    readonly announcedAt: string;
    readonly status: 'completed' | 'ongoing';
    readonly commitment: string;
    readonly targets: readonly CommitmentTarget[];
  };
  readonly scoring:
    | {
        readonly status: 'unscored';
        readonly reason: string;
      }
    | {
        readonly status: 'scored';
        readonly rubricVersion: string;
        readonly scorecardId: string;
        readonly scope: 'commitment-date-public-desk' | 'outcome-calibrated-retrodiction' | 'latest-evidence-calibration';
        readonly reason: string;
      };
  readonly sources: readonly CaseSource[];
  readonly facts: readonly CaseFact[];
  readonly snapshots: readonly CaseSnapshot[];
}

export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
}

const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value)
  && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
const isIsoTemporal = (value: string): boolean => /^(\d{4}|\d{4}-\d{2}|\d{4}-\d{2}-\d{2})$/.test(value)
  && !Number.isNaN(Date.parse(`${value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value}T00:00:00Z`));

export function validateCaseProfile(profile: CaseProfile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const sourceById = new Map(profile.sources.map((source) => [source.id, source]));
  const factById = new Map(profile.facts.map((fact) => [fact.id, fact]));

  const duplicateIds = (ids: readonly string[], path: string) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) issues.push({ path, message: `Duplicate id: ${id}` });
      seen.add(id);
    }
  };

  const checkEvidence = (evidence: readonly EvidenceRef[], path: string) => {
    if (evidence.length === 0) issues.push({ path, message: 'At least one evidence reference is required.' });
    for (const ref of evidence) {
      if (!sourceById.has(ref.sourceId)) {
        issues.push({ path, message: `Unknown source reference: ${ref.sourceId}` });
      }
      if (ref.locator.trim().length === 0) {
        issues.push({ path, message: `Source ${ref.sourceId} needs a page, section, or table locator.` });
      }
    }
  };

  duplicateIds(profile.sources.map((source) => source.id), 'sources');
  duplicateIds(profile.facts.map((fact) => fact.id), 'facts');
  duplicateIds(profile.snapshots.map((snapshot) => snapshot.id), 'snapshots');

  if (profile.schema !== CASE_PROFILE_SCHEMA) {
    issues.push({ path: 'schema', message: `Expected ${CASE_PROFILE_SCHEMA}.` });
  }
  if (!/^\d+\.\d+\.\d+$/.test(profile.version)) {
    issues.push({ path: 'version', message: 'Version must be semantic (for example, 1.0.0).' });
  }
  if (profile.scoring.status === 'scored') {
    if (!/^\d+\.\d+\.\d+$/.test(profile.scoring.rubricVersion)) {
      issues.push({ path: 'scoring.rubricVersion', message: 'Rubric version must be semantic.' });
    }
    if (!profile.scoring.scorecardId.trim()) {
      issues.push({ path: 'scoring.scorecardId', message: 'A scored profile must reference its scorecard.' });
    }
  }
  if (!isIsoTemporal(profile.case.announcedAt)) {
    issues.push({ path: 'case.announcedAt', message: 'Expected an ISO year, month, or calendar date.' });
  }

  for (const source of profile.sources) {
    if (!isIsoDate(source.publishedAt)) {
      issues.push({ path: `sources.${source.id}.publishedAt`, message: 'Expected an ISO calendar date.' });
    }
    if (!source.url.startsWith('https://')) {
      issues.push({ path: `sources.${source.id}.url`, message: 'Only HTTPS public sources are accepted.' });
    }
  }

  for (const target of profile.case.targets) {
    if (target.deadline && !isIsoDate(target.deadline)) {
      issues.push({ path: `case.targets.${target.id}.deadline`, message: 'Expected an ISO calendar date.' });
    }
    checkEvidence(target.evidence, `case.targets.${target.id}.evidence`);
  }

  for (const fact of profile.facts) {
    if (!isIsoTemporal(fact.observedAt)) {
      issues.push({ path: `facts.${fact.id}.observedAt`, message: 'Expected an ISO year, month, or calendar date.' });
    }
    if (fact.origin === 'derived' && !fact.calculation) {
      issues.push({ path: `facts.${fact.id}.calculation`, message: 'Derived facts must disclose their calculation.' });
    }
    if (fact.origin === 'reported' && fact.calculation) {
      issues.push({ path: `facts.${fact.id}.calculation`, message: 'Reported facts cannot carry a derivation.' });
    }
    if (fact.metric) {
      if (!fact.metric.unit.trim()) {
        issues.push({ path: `facts.${fact.id}.metric.unit`, message: 'Metric unit is required.' });
      }
      if ('value' in fact.metric) {
        if (!Number.isFinite(fact.metric.value)) {
          issues.push({ path: `facts.${fact.id}.metric.value`, message: 'Metric value must be finite.' });
        }
      } else if (!Number.isFinite(fact.metric.low) || !Number.isFinite(fact.metric.high)
        || fact.metric.low > fact.metric.high) {
        issues.push({ path: `facts.${fact.id}.metric`, message: 'Metric range must be finite and ordered low to high.' });
      }
    }
    checkEvidence(fact.evidence, `facts.${fact.id}.evidence`);
  }

  const checkFactRefs = (refs: readonly string[], path: string) => {
    for (const ref of refs) {
      if (!factById.has(ref)) issues.push({ path, message: `Unknown fact reference: ${ref}` });
    }
  };

  for (const snapshot of profile.snapshots) {
    if (!isIsoDate(snapshot.knowledgeCutoff)) {
      issues.push({ path: `snapshots.${snapshot.id}.knowledgeCutoff`, message: 'Expected an ISO calendar date.' });
    }
    checkFactRefs(snapshot.factRefs, `snapshots.${snapshot.id}.factRefs`);

    const assessmentGroups: Array<[string, readonly CaseAssessment[]]> = [
      ['systems', SYSTEM_IDS.map((id) => snapshot.systems[id])],
      ['constraints', CONSTRAINT_IDS.map((id) => snapshot.constraints[id])],
    ];

    for (const [groupName, assessments] of assessmentGroups) {
      assessments.forEach((assessment, index) => {
        const id = groupName === 'systems' ? SYSTEM_IDS[index] : CONSTRAINT_IDS[index];
        const path = `snapshots.${snapshot.id}.${groupName}.${id}`;
        if (!assessment) {
          issues.push({ path, message: 'Assessment is required.' });
          return;
        }
        checkFactRefs(assessment.factRefs, `${path}.factRefs`);
        if (assessment.status === 'insufficient-evidence' && assessment.unknowns.length === 0) {
          issues.push({ path: `${path}.unknowns`, message: 'An insufficient assessment must state what is unknown.' });
        }
      });
    }

    const usedFactRefs = new Set([
      ...snapshot.factRefs,
      ...SYSTEM_IDS.flatMap((id) => snapshot.systems[id]?.factRefs ?? []),
      ...CONSTRAINT_IDS.flatMap((id) => snapshot.constraints[id]?.factRefs ?? []),
    ]);
    for (const factRef of usedFactRefs) {
      const fact = factById.get(factRef);
      if (!fact) continue;
      for (const evidence of fact.evidence) {
        const source = sourceById.get(evidence.sourceId);
        if (source && source.publishedAt > snapshot.knowledgeCutoff) {
          issues.push({
            path: `snapshots.${snapshot.id}`,
            message: `Temporal leakage: ${factRef} uses ${source.id}, published ${source.publishedAt} after the ${snapshot.knowledgeCutoff} cutoff.`,
          });
        }
      }
    }
  }

  return issues;
}

export function defineCaseProfile<const T extends CaseProfile>(profile: T): T {
  return profile;
}
