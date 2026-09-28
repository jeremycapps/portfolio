import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { resolveR2Config } from './context-index';

/**
 * GitHub activity: a derived, self-rebuilding feed of Jeremy's recent PUBLIC GitHub
 * work, produced hourly by scripts/github-activity-sync.ts from the /users/:handle/
 * events/public endpoint and uploaded to R2, where this module reads it. It answers
 * "what is Jeremy working on now" without anyone updating the corpus by hand.
 *
 * Two invariants make repo mutations safe:
 *  - The feed is fully overwritten each sync from GitHub's *current* public state, so a
 *    renamed/privatised/deleted repo ages out within one cycle (never a fresh leak — the
 *    endpoint only ever returns public repos).
 *  - Curated framing is keyed on the immutable numeric repo id, not the mutable name, so
 *    renaming a repo relabels its activity automatically without dropping its framing.
 */
export type GithubActivityKind = 'pull_request' | 'push' | 'branch' | 'comment';

export interface GithubActivityItem {
  kind: GithubActivityKind;
  at: string;
  title?: string;
  number?: number;
  state?: string;
  url?: string;
  ref?: string;
  commits?: number;
}

export interface GithubRepoActivity {
  repo: string;
  repoId: number;
  framing: string | null;
  lastActive: string;
  activity: GithubActivityItem[];
}

export interface GithubActivityDocument {
  generated_at: string;
  handle: string;
  items: GithubRepoActivity[];
}

/** A minimal shape of the GitHub events we consume; unknown fields are ignored. */
export interface GithubEvent {
  type: string;
  created_at: string;
  repo: { id: number; name: string };
  payload?: Record<string, unknown>;
}

const MAX_REPOS = 12;
const MAX_ACTIVITY_PER_REPO = 8;

function stripRef(ref: unknown): string | undefined {
  return typeof ref === 'string' ? ref.replace(/^refs\/heads\//, '') : undefined;
}

/** Map one raw event to an activity item, or null if it is not "work" signal we surface. */
function toActivityItem(event: GithubEvent): GithubActivityItem | null {
  const at = event.created_at;
  const p = event.payload ?? {};
  switch (event.type) {
    case 'PushEvent': {
      // payload.size is the true push count; payload.commits is truncated at 20.
      const commits = typeof p.size === 'number' ? p.size : Array.isArray(p.commits) ? p.commits.length : undefined;
      return { kind: 'push', at, ref: stripRef(p.ref), commits };
    }
    case 'PullRequestEvent': {
      const pr = (p.pull_request ?? {}) as Record<string, unknown>;
      const merged = pr.merged === true;
      const action = typeof p.action === 'string' ? p.action : undefined;
      const state = action === 'closed' ? (merged ? 'merged' : 'closed') : typeof pr.state === 'string' ? pr.state : action;
      return {
        kind: 'pull_request',
        at,
        title: typeof pr.title === 'string' ? pr.title : undefined,
        number: typeof p.number === 'number' ? p.number : typeof pr.number === 'number' ? pr.number : undefined,
        state,
        url: typeof pr.html_url === 'string' ? pr.html_url : undefined,
      };
    }
    case 'CreateEvent': {
      if (p.ref_type !== 'branch') return null; // ignore repo/tag creation
      return { kind: 'branch', at, ref: typeof p.ref === 'string' ? p.ref : undefined };
    }
    case 'IssueCommentEvent': {
      const issue = (p.issue ?? {}) as Record<string, unknown>;
      return {
        kind: 'comment',
        at,
        title: typeof issue.title === 'string' ? issue.title : undefined,
        number: typeof issue.number === 'number' ? issue.number : undefined,
        url: typeof issue.html_url === 'string' ? issue.html_url : undefined,
      };
    }
    default:
      // Watch, Fork, Delete, Public, tag/repo Create, etc. are not "what he's working on".
      return null;
  }
}

/**
 * Fold a page of public events into a repo-grouped feed. Pure: no network, no clock
 * beyond `now`. `framingById` supplies curated significance keyed on the immutable
 * repo id, so a rename cannot break the join.
 */
export function transformEvents(
  events: GithubEvent[],
  framingById: ReadonlyMap<number, string>,
  handle: string,
  now: Date = new Date(),
): GithubActivityDocument {
  const byRepo = new Map<number, GithubRepoActivity>();
  for (const event of events) {
    const item = toActivityItem(event);
    if (!item) continue;
    let group = byRepo.get(event.repo.id);
    if (!group) {
      group = {
        repo: event.repo.name,
        repoId: event.repo.id,
        framing: framingById.get(event.repo.id) ?? null,
        lastActive: item.at,
        activity: [],
      };
      byRepo.set(event.repo.id, group);
    }
    group.activity.push(item);
    if (item.at > group.lastActive) group.lastActive = item.at;
    // A later event may carry the current name after a rename; prefer the most recent.
    if (item.at >= group.lastActive) group.repo = event.repo.name;
  }

  const items = [...byRepo.values()]
    .map((group) => ({
      ...group,
      activity: group.activity
        .sort((a, b) => b.at.localeCompare(a.at))
        .slice(0, MAX_ACTIVITY_PER_REPO),
    }))
    .sort((a, b) => b.lastActive.localeCompare(a.lastActive))
    .slice(0, MAX_REPOS);

  return { generated_at: now.toISOString(), handle, items };
}

export const GITHUB_BLOCK_INSTRUCTIONS = [
  "The items below are Jeremy's recent PUBLIC GitHub activity, collected automatically",
  'from the GitHub events API (never edited by hand, never private repos). Use them to',
  'answer what he is working on now. The "significance" note on a repo is Jeremy\'s own',
  'one-line framing of why that project matters. Cite recency as "as of <date>". If the',
  'items do not answer the question, say so rather than guessing.',
].join('\n');

function formatActivityItem(item: GithubActivityItem): string {
  const date = item.at.slice(0, 10);
  switch (item.kind) {
    case 'pull_request':
      return `  - PR #${item.number ?? '?'} "${item.title ?? ''}" (${item.state ?? 'open'}) ${date}`;
    case 'push':
      return `  - pushed ${item.commits ?? '?'} commit(s)${item.ref ? ` to ${item.ref}` : ''} ${date}`;
    case 'branch':
      return `  - created branch ${item.ref ?? ''} ${date}`;
    case 'comment':
      return `  - commented on #${item.number ?? '?'} "${item.title ?? ''}" ${date}`;
  }
}

function formatRepo(repo: GithubRepoActivity): string {
  const head = repo.framing
    ? `[${repo.repo} — ${repo.framing} | last active ${repo.lastActive.slice(0, 10)}]`
    : `[${repo.repo} | last active ${repo.lastActive.slice(0, 10)}]`;
  return [head, ...repo.activity.map(formatActivityItem)].join('\n');
}

/** Render the feed as a compact context block, or null when there is nothing to show. */
export function buildGithubBlock(doc: GithubActivityDocument | null): string | null {
  if (!doc || doc.items.length === 0) return null;
  return [
    `${GITHUB_BLOCK_INSTRUCTIONS} (as of ${doc.generated_at.slice(0, 10)})`,
    '',
    ...doc.items.map(formatRepo),
  ].join('\n');
}

const ACTIVITY_KEY = 'github-activity.json';
const CACHE_MS = 5 * 60 * 1000;
let cache: { doc: GithubActivityDocument; at: number } | null = null;

export function resetGithubActivityCache(): void {
  cache = null;
}

async function fetchFromR2(env: Record<string, string | undefined>): Promise<GithubActivityDocument | null> {
  const config = resolveR2Config(env);
  if (!config) return null;
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.endpoint}`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  const prefix = (env.GITHUB_ACTIVITY_PREFIX ?? 'github').replace(/\/+$/, '');
  try {
    const response = await client.send(new GetObjectCommand({ Bucket: config.bucket, Key: `${prefix}/${ACTIVITY_KEY}` }));
    const body = await response.Body?.transformToString();
    return body ? (JSON.parse(body) as GithubActivityDocument) : null;
  } catch {
    // No feed uploaded yet is a normal state, not an error — the block is simply absent.
    return null;
  }
}

/** Loads the feed from GITHUB_ACTIVITY_FILE (local dev/tests) or R2, cached five minutes. */
export async function loadGithubActivity(
  env: Record<string, string | undefined> = process.env,
  now: number = Date.now(),
): Promise<GithubActivityDocument | null> {
  if (cache && now - cache.at < CACHE_MS) return cache.doc;
  let doc: GithubActivityDocument | null;
  if (env.GITHUB_ACTIVITY_FILE) {
    // Indirected import so the Edge bundler never sees a static node: builtin (mirrors evidence.ts).
    const fsModule = 'node:fs/promises';
    const { readFile } = await import(fsModule);
    doc = JSON.parse(await readFile(env.GITHUB_ACTIVITY_FILE, 'utf8')) as GithubActivityDocument;
  } else {
    doc = await fetchFromR2(env);
  }
  if (doc) cache = { doc, at: now };
  return doc;
}

/** The context block for the current environment's feed, or null when there is none. */
export async function retrieveGithubBlock(
  env: Record<string, string | undefined> = process.env,
): Promise<string | null> {
  try {
    return buildGithubBlock(await loadGithubActivity(env));
  } catch (error) {
    console.error('github activity load failed:', error);
    return null;
  }
}
