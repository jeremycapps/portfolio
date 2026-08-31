import {
  CONSTRAINT_IDS,
  SYSTEM_IDS,
  validateCaseProfile,
  type CaseFact,
  type CaseProfile,
  type CaseSnapshot,
  type CaseSource,
  type CommitmentTarget,
} from '../cases/profile';

export const SCORING_INPUT_REQUIREMENTS = [
  { id: 'strategic-posture', role: 'judgment', description: 'Insurgent, challenger, or incumbent posture.' },
  { id: 'tension-positions', role: 'judgment', description: 'Six positions with rationale, metric, and confidence basis.' },
  { id: 'goal-definition', role: 'evidence', description: 'Measurable target, horizon, sponsor, and three to five initiatives.' },
  { id: 'goal-pulls', role: 'judgment', description: 'Direction and strategic importance on all six tensions.' },
  { id: 'transferability', role: 'estimate', description: 'Portable-capacity ranges for each context-changing capability.' },
  { id: 'capacity-placement', role: 'estimate-or-inside', description: 'People, time, and finance fit in compatible units.' },
  { id: 'risk-floors', role: 'judgment', description: 'Explicit hard floors with pass, trip, or unknown state.' },
  { id: 'blind-prediction', role: 'process', description: 'Versioned prediction recorded before opening the outcome window.' },
] as const;

export interface CaseScoringPacket {
  readonly profileId: string;
  readonly profileVersion: string;
  readonly company: CaseProfile['company'];
  readonly commitment: string;
  readonly targets: readonly CommitmentTarget[];
  readonly snapshot: CaseSnapshot;
  readonly facts: readonly CaseFact[];
  readonly sources: readonly CaseSource[];
  /** Fields intentionally absent from the evidence-profile schema. */
  readonly authoringRequirements: typeof SCORING_INPUT_REQUIREMENTS;
}

/**
 * Expands one knowledge-cutoff-safe snapshot into the evidence packet used to
 * author a score. It does not infer positions or capacity from prose.
 */
export function prepareCaseScoringPacket(profile: CaseProfile, snapshotId: string): CaseScoringPacket {
  const issues = validateCaseProfile(profile);
  if (issues.length > 0) {
    throw new Error(`Invalid case profile: ${issues.map((issue) => `${issue.path}: ${issue.message}`).join(' ')}`);
  }
  const snapshot = profile.snapshots.find((candidate) => candidate.id === snapshotId);
  if (!snapshot) throw new Error(`Unknown snapshot ${snapshotId} in ${profile.id}.`);

  const factRefs = new Set([
    ...snapshot.factRefs,
    ...SYSTEM_IDS.flatMap((id) => snapshot.systems[id].factRefs),
    ...CONSTRAINT_IDS.flatMap((id) => snapshot.constraints[id].factRefs),
  ]);
  const facts = profile.facts.filter((fact) => factRefs.has(fact.id));
  const sourceRefs = new Set(facts.flatMap((fact) => fact.evidence.map((evidence) => evidence.sourceId)));
  for (const target of profile.case.targets) {
    for (const evidence of target.evidence) sourceRefs.add(evidence.sourceId);
  }
  const sources = profile.sources.filter((source) => sourceRefs.has(source.id) && source.publishedAt <= snapshot.knowledgeCutoff);

  return {
    profileId: profile.id,
    profileVersion: profile.version,
    company: profile.company,
    commitment: profile.case.commitment,
    targets: profile.case.targets,
    snapshot,
    facts,
    sources,
    authoringRequirements: SCORING_INPUT_REQUIREMENTS,
  };
}
