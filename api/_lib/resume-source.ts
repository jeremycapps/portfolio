import type {
  ResumeAward,
  ResumeCorpus,
  ResumeEducation,
  ResumeProject,
  ResumeSkillGroup,
} from './resume-corpus';
import type { ChatMessage, StreamDeps } from './types';

export const RESUME_SHORTLIST_LIMIT = 18;
export const SUMMARY_EVIDENCE_LIMIT = 8;
export const RESUME_PROVIDER_DEADLINE_MS = 8_000;

import { matchSummary } from './summary-router';
import { CANONICAL_SUMMARY } from './professional-summary';
import { lexicalTokens, matchingTokenCount } from './lexical-kernel';

export interface RankedBullet {
  engagementId: string;
  bulletId: string;
  text: string;
  score: number;
  organization: string;
  roleContext: string[];
  timePeriod: string;
  kind: 'experience' | 'project';
  caution: string[];
}

export interface AssembleDeps {
  collect?: (messages: ChatMessage[], deps?: Pick<StreamDeps, 'signal'>) => Promise<string>;
  hasModel?: boolean;
  providerDeadlineMs?: number;
  now?: () => number;
}

export interface SelectionResult {
  orderedBulletIds: string[];
  engine: 'deterministic';
}

export interface SummaryResult {
  text: string;
  engine: 'model' | 'deterministic' | 'retrieved';
}

export interface ResumeExperience {
  organization: string;
  roleContext: string[];
  timePeriod: string;
  bullets: string[];
  sourceRefs: string[];
}

export interface ResumeView {
  header: { name: string; contacts: string[] };
  summary: SummaryResult;
  experience: ResumeExperience[];
  skills: ResumeSkillGroup[];
  education: ResumeEducation[];
  projects: ResumeProject[];
  awards: ResumeAward[];
}

export interface ResumeOperation {
  kind: 'corpus-load' | 'pre-rank' | 'selection' | 'summary' | 'emit';
  engine: 'deterministic' | 'model' | 'retrieved';
  detail: string;
}

export interface ResumeProvenance {
  deterministicPct: number;
  modelPct: number;
  operations: ResumeOperation[];
}

export interface ResumeAssembly {
  view: ResumeView;
  provenance: ResumeProvenance;
  diagnostics: ResumeDiagnostics;
}

export type SummaryFallbackReason =
  | 'no_model'
  | 'timeout'
  | 'provider_error'
  | 'empty_output'
  | 'none';

export interface ResumeDiagnostics {
  selectionMs: number;
  summaryMs: number;
  shortlistCount: number;
  summaryEvidenceCount: number;
  summaryEngine: SummaryResult['engine'];
  fallbackReason: SummaryFallbackReason;
}

export function tokenize(text: string): string[] {
  return lexicalTokens(text);
}

interface CompiledResumeEngagement {
  readonly engagement: ResumeCorpus['engagements'][number];
  readonly themeTokens: readonly (readonly string[])[];
  readonly fitTokens: readonly (readonly string[])[];
  readonly bulletTokens: ReadonlyMap<string, readonly string[]>;
}

const rankingIndex = new WeakMap<ResumeCorpus, readonly CompiledResumeEngagement[]>();

function compileRankingIndex(corpus: ResumeCorpus): readonly CompiledResumeEngagement[] {
  const cached = rankingIndex.get(corpus);
  if (cached) return cached;
  const compiled = corpus.engagements.map((engagement) => ({
    engagement,
    themeTokens: engagement.themes.map(tokenize),
    fitTokens: [...engagement.roleFit.strongest, ...engagement.roleFit.secondary].map(tokenize),
    bulletTokens: new Map(engagement.bullets.map((bullet) => [bullet.id, tokenize(bullet.text)])),
  }));
  rankingIndex.set(corpus, compiled);
  return compiled;
}

// The source corpus stores independent builds alongside employment engagements
// because both are useful for retrieval. Resume assembly must keep the two
// categories explicit so project work cannot silently become career experience.
const PROJECT_ORG = /^\s*independent\s*\/\s*(domain|tempo)\b/i;

function isProjectOrg(organization: string): boolean {
  return PROJECT_ORG.test(organization);
}

export function prerank(job: string, corpus: ResumeCorpus): RankedBullet[] {
  const jobTokens = new Set(tokenize(job));
  const phraseHits = (phrases: readonly (readonly string[])[]) =>
    phrases.reduce((count, tokens) => count + (tokens.some((token) => jobTokens.has(token)) ? 1 : 0), 0);

  const ranked: RankedBullet[] = [];
  for (const compiled of compileRankingIndex(corpus)) {
    const eng = compiled.engagement;
    const themeScore = phraseHits(compiled.themeTokens) * 3;
    const fitScore = phraseHits(compiled.fitTokens) * 2;
    for (const b of eng.bullets) {
      const bulletScore = matchingTokenCount(compiled.bulletTokens.get(b.id) ?? [], jobTokens);
      ranked.push({
        engagementId: eng.id,
        bulletId: b.id,
        text: b.text,
        score: themeScore + fitScore + bulletScore,
        organization: eng.organization,
        roleContext: eng.roleContext,
        timePeriod: eng.timePeriod,
        kind: isProjectOrg(eng.organization) ? 'project' : 'experience',
        caution: eng.caution,
      });
    }
  }
  // Stable sort by score desc; ties keep corpus order.
  return ranked
    .map((r, i) => ({ r, i }))
    .sort((a, b) => b.r.score - a.r.score || a.i - b.i)
    .map(({ r }) => r);
}

export function buildDeterministicShortlist(
  corpus: ResumeCorpus,
  ranked: RankedBullet[],
): SelectionResult {
  const knownIds = new Set(
    corpus.engagements.flatMap((engagement) => engagement.bullets.map((bullet) => bullet.id)),
  );
  const seen = new Set<string>();
  const orderedBulletIds: string[] = [];

  for (const bullet of ranked) {
    if (!knownIds.has(bullet.bulletId) || seen.has(bullet.bulletId)) continue;
    seen.add(bullet.bulletId);
    orderedBulletIds.push(bullet.bulletId);
    if (orderedBulletIds.length === RESUME_SHORTLIST_LIMIT) break;
  }

  return { orderedBulletIds, engine: 'deterministic' };
}

function summaryMessages(job: string, selected: RankedBullet[]): ChatMessage[] {
  const order: string[] = [];
  const groups = new Map<string, { sample: RankedBullet; bullets: string[] }>();
  for (const bullet of selected) {
    let group = groups.get(bullet.engagementId);
    if (!group) {
      group = { sample: bullet, bullets: [] };
      groups.set(bullet.engagementId, group);
      order.push(bullet.engagementId);
    }
    group.bullets.push(bullet.text);
  }
  const bullets = order
    .map((id) => groups.get(id)!)
    .map(({ sample, bullets: engagementBullets }) => {
      const label = sample.kind === 'project' ? 'INDEPENDENT PROJECT' : 'CAREER EXPERIENCE';
      const facts = engagementBullets.map((text) => `\n  - ${text}`).join('');
      const cautions = sample.caution.length > 0
        ? `\n  Cautions: ${sample.caution.join(' ')}`
        : '';
      return `[${label}] ${sample.organization} — ${sample.roleContext.join(' / ')} (${sample.timePeriod})${facts}${cautions}`;
    })
    .join('\n');
  return [
    {
      role: 'system',
      content:
        'Write ONE short professional-summary paragraph (2-3 sentences) tailoring the candidate to the job. Use only facts present in the provided bullets and obey every caution. Clearly distinguish career experience from independent project work. Never describe an independent project as employment, client work, a commercial or production deployment, team experience, or external-user impact. Prefer the phrase "independent project work" when referring to project evidence. Do not call the person "this candidate." No lists, no headers.',
    },
    { role: 'user', content: `Job:\n${job}\n\nSelected source material:\n${bullets}` },
  ];
}

interface SummaryOutcome {
  summary: SummaryResult;
  fallbackReason: SummaryFallbackReason;
}

// The no-match floor: the authored canonical summary. It reads as a summary —
// identity, through-line, recent focus, fit — where the old concatenation of two
// bullets read as two bullets. Used when no tailored summary matches the JD and
// no model is available.
function deterministicSummary(_selected: RankedBullet[]): SummaryResult {
  return { text: CANONICAL_SUMMARY, engine: 'deterministic' };
}

class ResumeSummaryTimeoutError extends Error {
  constructor() {
    super('resume summary provider deadline exceeded');
    this.name = 'ResumeSummaryTimeoutError';
  }
}

async function summarizeWithDiagnostics(
  job: string,
  selected: RankedBullet[],
  deps: AssembleDeps = {},
  routed: ReturnType<typeof matchSummary> = matchSummary(job),
): Promise<SummaryOutcome> {
  // Retrieval before generation: if the job matched a reviewed tailored summary,
  // return it as-is. These were written and approved for real roles, so a close
  // match beats anything regenerated from bullets.
  if (routed !== null) {
    return { summary: { text: routed.summary, engine: 'retrieved' }, fallbackReason: 'none' };
  }
  const evidence = selected.slice(0, SUMMARY_EVIDENCE_LIMIT);
  const fallback = deterministicSummary(evidence);
  if (!deps.hasModel || !deps.collect) {
    return { summary: fallback, fallbackReason: 'no_model' };
  }

  const controller = new AbortController();
  const deadlineMs = deps.providerDeadlineMs ?? RESUME_PROVIDER_DEADLINE_MS;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new ResumeSummaryTimeoutError());
    }, deadlineMs);
  });
  try {
    const collection = Promise.resolve().then(() =>
      deps.collect!(summaryMessages(job, evidence), { signal: controller.signal }),
    );
    const text = (await Promise.race([collection, timeout])).trim();
    return text
      ? { summary: { text, engine: 'model' }, fallbackReason: 'none' }
      : { summary: fallback, fallbackReason: 'empty_output' };
  } catch (error) {
    return {
      summary: fallback,
      fallbackReason:
        controller.signal.aborted || error instanceof ResumeSummaryTimeoutError
          ? 'timeout'
          : 'provider_error',
    };
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

export async function summarize(
  job: string,
  selected: RankedBullet[],
  deps: AssembleDeps = {},
): Promise<SummaryResult> {
  return (await summarizeWithDiagnostics(job, selected, deps)).summary;
}

// Curated project display names mirror the tailored CVs. Any independent
// engagement not listed falls back to its organization label.
const PROJECT_NAMES: Record<string, string> = {
  jeremy_domain_ai_multi_provider_llm_orchestration:
    'Corus — LLM Orchestration & Evaluation Harness',
  domain_corus_agentic_context_infrastructure: 'Corus — Agentic Context Infrastructure',
  jeremy_domain_corus_chatbot_filesystem_runtime_contract:
    'Corus — Chatbot Filesystem Runtime Contract',
  jeremy_domain_langgraph_reference_runtime: 'Domain — Deterministic Agent Runtime on LangGraph',
  tempo_stratos_v5_governed_decision_product:
    'StratOS / Tempo — Governed Executive Decision Product',
  tempo_strategy_framework_model: 'Tempo — Strategy Framework Model',
};

// Projects stay lighter than experience: fewer entries, fewer bullets each.
const MAX_PROJECTS = 3;
const MAX_PROJECT_BULLETS = 2;

// NEW INC is a fellowship, not a job — it belongs under Awards, never Experience.
const AWARDS: ResumeAward[] = [{ name: 'NEW INC Fellowship, Social Architecture', year: 2025 }];

function isAwardEngagement(id: string): boolean {
  return /^new_inc/i.test(id);
}

// Most-recent year mentioned in a time period; "Present"/"Current" sorts newest.
export function recencyKey(timePeriod: string): number {
  if (/present|current/i.test(timePeriod)) return Number.POSITIVE_INFINITY;
  const years = timePeriod.match(/\b(?:19|20)\d{2}\b/g);
  return years ? Math.max(...years.map(Number)) : 0;
}

interface EngagementGroup {
  engagementId: string;
  organization: string;
  roleContext: string[];
  timePeriod: string;
  bullets: string[];
  bulletIds: string[];
  sourceRefs: string[];
  firstIndex: number; // relevance rank of this engagement's first selected bullet
}

const MAX_EXPERIENCE_BULLETS = 5;

// Group selected bullets under their engagement, preserving each engagement's
// best (earliest-selected) rank as firstIndex for relevance tie-breaking.
function groupSelected(orderedBulletIds: string[], corpus: ResumeCorpus): EngagementGroup[] {
  const engagementsById = new Map(corpus.engagements.map((engagement) => [engagement.id, engagement]));
  const bulletsById = new Map<string, { engagementId: string; text: string; sourceRefs: string[] }>();
  for (const engagement of corpus.engagements) {
    for (const bullet of engagement.bullets) {
      bulletsById.set(bullet.id, {
        engagementId: engagement.id,
        text: bullet.text,
        sourceRefs: bullet.sourceRefs,
      });
    }
  }

  const order: string[] = [];
  const byId = new Map<string, EngagementGroup>();
  orderedBulletIds.forEach((bulletId, index) => {
    const bullet = bulletsById.get(bulletId);
    if (!bullet) return;
    const engagement = engagementsById.get(bullet.engagementId);
    if (!engagement) return;

    let group = byId.get(engagement.id);
    if (!group) {
      group = {
        engagementId: engagement.id,
        organization: engagement.organization,
        roleContext: engagement.roleContext,
        timePeriod: engagement.timePeriod,
        bullets: [],
        bulletIds: [],
        sourceRefs: [],
        firstIndex: index,
      };
      byId.set(engagement.id, group);
      order.push(engagement.id);
    }

    group.bullets.push(bullet.text);
    group.bulletIds.push(bulletId);
    for (const sourceRef of bullet.sourceRefs) {
      if (!group.sourceRefs.includes(sourceRef)) group.sourceRefs.push(sourceRef);
    }
  });

  return order.map((id) => byId.get(id)!);
}

// Newest first; ties keep the more relevant engagement (lower firstIndex) ahead.
function byRecency(a: EngagementGroup, b: EngagementGroup): number {
  return recencyKey(b.timePeriod) - recencyKey(a.timePeriod) || a.firstIndex - b.firstIndex;
}

function firstYear(timePeriod: string): number {
  const match = timePeriod.match(/\b(?:19|20)\d{2}\b/);
  return match ? Number(match[0]) : Number.POSITIVE_INFINITY;
}

// When the bounded shortlist contains no bullet for an employer, we still show the role with
// its own top bullets — a resume must never drop a real job (e.g. the current
// one) just because a job posting made its bullets rank low.
const EXPERIENCE_FALLBACK_BULLETS = 2;

interface OrgAccumulator {
  organization: string;
  roleContext: string[];
  timePeriod: string;
  selected: { bulletId: string; text: string; sourceRefs: string[]; rank: number }[];
  fallback: { bulletId: string; text: string; sourceRefs: string[] }[];
  bestRank: number;
}

interface RenderedExperience {
  items: ResumeExperience[];
  bulletIds: string[];
}

// Experience membership comes from the corpus, not from shortlist membership: every
// employer engagement is present, merged into one entry per organization (the
// corpus stores Aroko and Zocdoc as several evidence records), ordered newest
// first. Shortlisted bullets are used when present; otherwise the
// role falls back to its own leading bullets so it still appears with content.
function buildExperience(
  orderedBulletIds: string[],
  corpus: ResumeCorpus,
  titleOverrides?: Readonly<Record<string, string>>,
): RenderedExperience {
  const rank = new Map(orderedBulletIds.map((id, index) => [id, index]));
  const order: string[] = [];
  const byOrganization = new Map<string, OrgAccumulator>();

  for (const engagement of corpus.engagements) {
    if (isProjectOrg(engagement.organization) || isAwardEngagement(engagement.id)) continue;
    const key = engagement.organization.trim().toLowerCase();
    let entry = byOrganization.get(key);
    if (!entry) {
      entry = {
        organization: engagement.organization,
        roleContext: [],
        timePeriod: engagement.timePeriod,
        selected: [],
        fallback: [],
        bestRank: Number.POSITIVE_INFINITY,
      };
      byOrganization.set(key, entry);
      order.push(key);
    }

    // Keep the period whose start year is earliest so the merged entry shows the
    // full span (e.g. Zocdoc's 2021–2024 across two records).
    if (firstYear(engagement.timePeriod) < firstYear(entry.timePeriod)) {
      entry.timePeriod = engagement.timePeriod;
    }
    for (const role of engagement.roleContext) {
      if (!entry.roleContext.includes(role)) entry.roleContext.push(role);
    }
    for (const bullet of engagement.bullets) {
      const selectedRank = rank.get(bullet.id);
      if (selectedRank === undefined) {
        entry.fallback.push({ bulletId: bullet.id, text: bullet.text, sourceRefs: bullet.sourceRefs });
      } else {
        entry.selected.push({
          bulletId: bullet.id,
          text: bullet.text,
          sourceRefs: bullet.sourceRefs,
          rank: selectedRank,
        });
        if (selectedRank < entry.bestRank) entry.bestRank = selectedRank;
      }
    }
  }

  const rendered = order
    .map((key) => byOrganization.get(key)!)
    .map((entry) => {
      const chosen = entry.selected.length
        ? [...entry.selected].sort((a, b) => a.rank - b.rank)
        : entry.fallback.slice(0, EXPERIENCE_FALLBACK_BULLETS);
      const bullets = chosen.slice(0, MAX_EXPERIENCE_BULLETS);
      const sourceRefs: string[] = [];
      for (const bullet of bullets) {
        for (const sourceRef of bullet.sourceRefs) {
          if (!sourceRefs.includes(sourceRef)) sourceRefs.push(sourceRef);
        }
      }
      const override = titleOverrides?.[entry.organization];
      return {
        organization: entry.organization,
        roleContext: override ? [override] : entry.roleContext,
        timePeriod: entry.timePeriod,
        bullets: bullets.map((bullet) => bullet.text),
        sourceRefs,
        recency: recencyKey(entry.timePeriod),
        bestRank: entry.bestRank,
        chosen: bullets,
      };
    })
    .sort((a, b) => b.recency - a.recency || a.bestRank - b.bestRank);

  return {
    items: rendered.map(({ recency: _recency, bestRank: _bestRank, chosen: _chosen, ...item }) => item),
    bulletIds: rendered.flatMap((entry) => entry.chosen.map((bullet) => bullet.bulletId)),
  };
}

interface RenderedProjects {
  items: ResumeProject[];
  bulletIds: string[];
}

function buildProjects(groups: EngagementGroup[]): RenderedProjects {
  const rendered = groups
    .filter((group) => isProjectOrg(group.organization))
    .sort((a, b) => a.firstIndex - b.firstIndex) // keep the most relevant projects
    .slice(0, MAX_PROJECTS)
    .sort(byRecency); // then present them newest first

  return {
    items: rendered.map((group) => ({
      id: group.engagementId,
      name: PROJECT_NAMES[group.engagementId] ?? group.organization,
      text: group.bullets.slice(0, MAX_PROJECT_BULLETS).join(' '),
      sourceRefs: group.sourceRefs,
    })),
    bulletIds: rendered.flatMap((group) => group.bulletIds.slice(0, MAX_PROJECT_BULLETS)),
  };
}

export function buildSummaryEvidence(
  ranked: RankedBullet[],
  renderedBulletIds: Iterable<string>,
): RankedBullet[] {
  const rendered = new Set(renderedBulletIds);
  const seen = new Set<string>();
  const evidence: RankedBullet[] = [];

  for (const bullet of ranked) {
    if (!rendered.has(bullet.bulletId) || seen.has(bullet.bulletId)) continue;
    seen.add(bullet.bulletId);
    evidence.push(bullet);
    if (evidence.length === SUMMARY_EVIDENCE_LIMIT) break;
  }

  return evidence;
}

export function computeProvenance(
  view: ResumeView,
  selection: SelectionResult,
  summary: SummaryResult,
): ResumeProvenance {
  const bodyText = [
    ...view.header.contacts,
    ...view.experience.flatMap((experience) => [
      experience.organization,
      experience.timePeriod,
      ...experience.roleContext,
      ...experience.bullets,
    ]),
    ...view.skills.flatMap((skill) => [skill.group, ...skill.items]),
    ...view.education.map((education) => education.degree),
    ...view.projects.flatMap((project) => [project.name, project.text]),
  ].join(' ');
  const modelChars = summary.engine === 'model' ? summary.text.length : 0;
  const deterministicChars = bodyText.length + (summary.engine === 'model' ? 0 : summary.text.length);
  const totalChars = deterministicChars + modelChars;
  const deterministicPct =
    totalChars === 0 ? 100 : Math.round((deterministicChars / totalChars) * 100);
  return {
    deterministicPct,
    modelPct: 100 - deterministicPct,
    operations: [
      { kind: 'corpus-load', engine: 'deterministic', detail: 'baked snapshot' },
      { kind: 'pre-rank', engine: 'deterministic', detail: 'theme / role_fit match' },
      {
        kind: 'selection',
        engine: 'deterministic',
        detail: `${selection.orderedBulletIds.length} bounded candidates`,
      },
      {
        kind: 'summary',
        engine: summary.engine,
        detail: summary.engine === 'model' ? '1 model call' : 'assembled from source',
      },
      {
        kind: 'emit',
        engine: 'deterministic',
        detail: `${view.experience.length} roles · ${view.projects.length} projects`,
      },
    ],
  };
}

export async function assembleResume(
  job: string,
  corpus: ResumeCorpus,
  deps: AssembleDeps = {},
): Promise<ResumeAssembly> {
  const now = deps.now ?? Date.now;
  const selectionStartedAt = now();
  const ranked = prerank(job, corpus);
  const selection = buildDeterministicShortlist(corpus, ranked);
  const selectionMs = Math.max(0, Math.round(now() - selectionStartedAt));

  // Route the JD to the nearest reviewed application once. It supplies both the
  // summary and the single most-apt title per role; a miss leaves both to the
  // corpus and the model.
  const routed = matchSummary(job);
  const groups = groupSelected(selection.orderedBulletIds, corpus);
  const experience = buildExperience(selection.orderedBulletIds, corpus, routed?.roles);
  const projects = buildProjects(groups);
  const summaryEvidence = buildSummaryEvidence(ranked, [
    ...experience.bulletIds,
    ...projects.bulletIds,
  ]);

  const summaryStartedAt = now();
  const summaryOutcome = await summarizeWithDiagnostics(job, summaryEvidence, deps, routed);
  const summaryMs = Math.max(0, Math.round(now() - summaryStartedAt));
  const summary = summaryOutcome.summary;
  const view: ResumeView = {
    header: corpus.header,
    summary,
    experience: experience.items,
    skills: corpus.skills,
    education: corpus.education,
    projects: projects.items,
    awards: AWARDS,
  };

  return {
    view,
    provenance: computeProvenance(view, selection, summary),
    diagnostics: {
      selectionMs,
      summaryMs,
      shortlistCount: selection.orderedBulletIds.length,
      summaryEvidenceCount: summaryEvidence.length,
      summaryEngine: summary.engine,
      fallbackReason: summaryOutcome.fallbackReason,
    },
  };
}
