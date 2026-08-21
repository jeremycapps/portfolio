import type {
  ResumeCorpus,
  ResumeEducation,
  ResumeProject,
  ResumeSkillGroup,
} from './resume-corpus';
import type { ChatMessage } from './types';

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
  collect?: (messages: ChatMessage[]) => Promise<string>;
  hasModel?: boolean;
}

export interface SelectionResult {
  orderedBulletIds: string[];
  engine: 'model' | 'deterministic';
}

export interface SummaryResult {
  text: string;
  engine: 'model' | 'deterministic';
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
}

export interface ResumeOperation {
  kind: 'corpus-load' | 'pre-rank' | 'selection' | 'summary' | 'emit';
  engine: 'deterministic' | 'model';
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
}

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
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
  const phraseHits = (phrases: string[]) =>
    phrases.reduce((n, p) => n + (tokenize(p).some((t) => jobTokens.has(t)) ? 1 : 0), 0);

  const ranked: RankedBullet[] = [];
  for (const eng of corpus.engagements) {
    const themeScore = phraseHits(eng.themes) * 3;
    const fitScore = phraseHits([...eng.roleFit.strongest, ...eng.roleFit.secondary]) * 2;
    for (const b of eng.bullets) {
      const bulletScore = tokenize(b.text).filter((t) => jobTokens.has(t)).length;
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

export function parseIdList(raw: string): string[] {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed: unknown = JSON.parse(match[0]);
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : [];
  } catch {
    return [];
  }
}

function selectionMessages(job: string, ranked: RankedBullet[]): ChatMessage[] {
  const bullets = ranked
    .map((bullet) => {
      const label = bullet.kind === 'project' ? 'INDEPENDENT PROJECT' : 'CAREER EXPERIENCE';
      return `${bullet.bulletId} [${label} — ${bullet.organization}]: ${bullet.text}`;
    })
    .join('\n');
  return [
    {
      role: 'system',
      content:
        'You select and order resume bullets for a job posting. Return ONLY a JSON array of bullet id strings, most relevant first. Never invent ids. Never rewrite bullet text. Independent-project bullets are relevant evidence but are not employment, client work, or production deployments.',
    },
    {
      role: 'user',
      content: `Job:\n${job}\n\nBullets:\n${bullets}\n\nReturn a JSON array of the ids to include, best first.`,
    },
  ];
}

export async function selectBullets(
  job: string,
  _corpus: ResumeCorpus,
  ranked: RankedBullet[],
  deps: AssembleDeps = {},
): Promise<SelectionResult> {
  const fallback = (): SelectionResult => ({
    orderedBulletIds: ranked.map((bullet) => bullet.bulletId),
    engine: 'deterministic',
  });
  if (!deps.hasModel || !deps.collect) return fallback();

  const knownIds = new Set(ranked.map((bullet) => bullet.bulletId));
  try {
    const raw = await deps.collect(selectionMessages(job, ranked));
    const ids = [...new Set(parseIdList(raw).filter((id) => knownIds.has(id)))];
    return ids.length > 0 ? { orderedBulletIds: ids, engine: 'model' } : fallback();
  } catch {
    return fallback();
  }
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

export async function summarize(
  job: string,
  selected: RankedBullet[],
  deps: AssembleDeps = {},
): Promise<SummaryResult> {
  const deterministic = (): SummaryResult => ({
    text: (() => {
      const career = selected.find((bullet) => bullet.kind === 'experience');
      const project = selected.find((bullet) => bullet.kind === 'project');
      const parts = [career?.text];
      if (project) parts.push(`Independent project work: ${project.text}`);
      return parts.filter(Boolean).join(' ') || 'Systems-oriented operator and engineer.';
    })(),
    engine: 'deterministic',
  });
  if (!deps.hasModel || !deps.collect) return deterministic();

  try {
    const text = (await deps.collect(summaryMessages(job, selected))).trim();
    return text ? { text, engine: 'model' } : deterministic();
  } catch {
    return deterministic();
  }
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
        sourceRefs: [],
        firstIndex: index,
      };
      byId.set(engagement.id, group);
      order.push(engagement.id);
    }

    group.bullets.push(bullet.text);
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

// When the model selects no bullet for an employer, we still show the role with
// its own top bullets — a resume must never drop a real job (e.g. the current
// one) just because a job posting made its bullets rank low.
const EXPERIENCE_FALLBACK_BULLETS = 2;

interface OrgAccumulator {
  organization: string;
  roleContext: string[];
  timePeriod: string;
  selected: { text: string; sourceRefs: string[]; rank: number }[];
  fallback: { text: string; sourceRefs: string[] }[];
  bestRank: number;
}

// Experience membership comes from the corpus, not from model selection: every
// employer engagement is present, merged into one entry per organization (the
// corpus stores Aroko and Zocdoc as several evidence records), ordered newest
// first. Selected bullets are used when the model picked any; otherwise the
// role falls back to its own leading bullets so it still appears with content.
function buildExperience(orderedBulletIds: string[], corpus: ResumeCorpus): ResumeExperience[] {
  const rank = new Map(orderedBulletIds.map((id, index) => [id, index]));
  const order: string[] = [];
  const byOrganization = new Map<string, OrgAccumulator>();

  for (const engagement of corpus.engagements) {
    if (isProjectOrg(engagement.organization)) continue;
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
        entry.fallback.push({ text: bullet.text, sourceRefs: bullet.sourceRefs });
      } else {
        entry.selected.push({ text: bullet.text, sourceRefs: bullet.sourceRefs, rank: selectedRank });
        if (selectedRank < entry.bestRank) entry.bestRank = selectedRank;
      }
    }
  }

  return order
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
      return {
        organization: entry.organization,
        roleContext: entry.roleContext,
        timePeriod: entry.timePeriod,
        bullets: bullets.map((bullet) => bullet.text),
        sourceRefs,
        recency: recencyKey(entry.timePeriod),
        bestRank: entry.bestRank,
      };
    })
    .sort((a, b) => b.recency - a.recency || a.bestRank - b.bestRank)
    .map(({ recency: _recency, bestRank: _bestRank, ...experience }) => experience);
}

function buildProjects(groups: EngagementGroup[]): ResumeProject[] {
  return groups
    .filter((group) => isProjectOrg(group.organization))
    .sort((a, b) => a.firstIndex - b.firstIndex) // keep the most relevant projects
    .slice(0, MAX_PROJECTS)
    .sort(byRecency) // then present them newest first
    .map((group) => ({
      id: group.engagementId,
      name: PROJECT_NAMES[group.engagementId] ?? group.organization,
      text: group.bullets.slice(0, MAX_PROJECT_BULLETS).join(' '),
      sourceRefs: group.sourceRefs,
    }));
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
        engine: selection.engine,
        detail: `${selection.orderedBulletIds.length} source bullets selected`,
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
  const ranked = prerank(job, corpus);
  const selection = await selectBullets(job, corpus, ranked, deps);
  const rankedById = new Map(ranked.map((bullet) => [bullet.bulletId, bullet]));
  const selected = selection.orderedBulletIds
    .map((id) => rankedById.get(id))
    .filter((bullet): bullet is RankedBullet => Boolean(bullet));
  const summary = await summarize(job, selected, deps);
  const groups = groupSelected(selection.orderedBulletIds, corpus);
  const view: ResumeView = {
    header: corpus.header,
    summary,
    experience: buildExperience(selection.orderedBulletIds, corpus),
    skills: corpus.skills,
    education: corpus.education,
    projects: buildProjects(groups),
  };

  return { view, provenance: computeProvenance(view, selection, summary) };
}
