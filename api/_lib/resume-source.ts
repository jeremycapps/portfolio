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
  const bullets = ranked.map((bullet) => `${bullet.bulletId}: ${bullet.text}`).join('\n');
  return [
    {
      role: 'system',
      content:
        'You select and order resume bullets for a job posting. Return ONLY a JSON array of bullet id strings, most relevant first. Never invent ids. Never rewrite bullet text.',
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
  const bullets = selected.map((bullet) => `- ${bullet.text}`).join('\n');
  return [
    {
      role: 'system',
      content:
        'Write ONE short professional-summary paragraph (2-3 sentences) tailoring the candidate to the job. Use only facts present in the provided bullets. No lists, no headers.',
    },
    { role: 'user', content: `Job:\n${job}\n\nSelected experience:\n${bullets}` },
  ];
}

export async function summarize(
  job: string,
  selected: RankedBullet[],
  deps: AssembleDeps = {},
): Promise<SummaryResult> {
  const deterministic = (): SummaryResult => ({
    text:
      selected.slice(0, 2).map((bullet) => bullet.text).join(' ') ||
      'Systems-oriented operator and engineer.',
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

function buildExperience(orderedBulletIds: string[], corpus: ResumeCorpus): ResumeExperience[] {
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

  const engagementOrder: string[] = [];
  const experienceById = new Map<string, ResumeExperience>();
  for (const bulletId of orderedBulletIds) {
    const bullet = bulletsById.get(bulletId);
    if (!bullet) continue;
    const engagement = engagementsById.get(bullet.engagementId);
    if (!engagement) continue;

    if (!experienceById.has(engagement.id)) {
      engagementOrder.push(engagement.id);
      experienceById.set(engagement.id, {
        organization: engagement.organization,
        roleContext: engagement.roleContext,
        timePeriod: engagement.timePeriod,
        bullets: [],
        sourceRefs: [],
      });
    }

    const entry = experienceById.get(engagement.id)!;
    entry.bullets.push(bullet.text);
    for (const sourceRef of bullet.sourceRefs) {
      if (!entry.sourceRefs.includes(sourceRef)) entry.sourceRefs.push(sourceRef);
    }
  }

  return engagementOrder.map((id) => experienceById.get(id)!);
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
  const bulletCount = view.experience.reduce(
    (count, experience) => count + experience.bullets.length,
    0,
  );

  return {
    deterministicPct,
    modelPct: 100 - deterministicPct,
    operations: [
      { kind: 'corpus-load', engine: 'deterministic', detail: 'baked snapshot' },
      { kind: 'pre-rank', engine: 'deterministic', detail: 'theme / role_fit match' },
      { kind: 'selection', engine: selection.engine, detail: `${bulletCount} bullets selected` },
      {
        kind: 'summary',
        engine: summary.engine,
        detail: summary.engine === 'model' ? '1 model call' : 'assembled from source',
      },
      { kind: 'emit', engine: 'deterministic', detail: `${view.experience.length} roles` },
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
  const view: ResumeView = {
    header: corpus.header,
    summary,
    experience: buildExperience(selection.orderedBulletIds, corpus),
    skills: corpus.skills,
    education: corpus.education,
    projects: corpus.projects,
  };

  return { view, provenance: computeProvenance(view, selection, summary) };
}
