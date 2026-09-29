import { AwsClient } from 'aws4fetch';
import { resolveR2Config } from './context-index';
import {
  foldForks,
  transformEvents,
  type GithubActivityDocument,
  type GithubActivityItem,
  type GithubEvent,
  type RepoRef,
} from './github-activity';
import framingData from '../../data/github-framing.json';

/**
 * Write side of the GitHub connector: fetch Jeremy's public activity, fold it into the
 * feed, verify every surfaced repo is still public, and upload to R2. Edge-safe (fetch +
 * @aws-sdk, no node builtins) so it can run as a Vercel Cron route; the CLI in
 * scripts/github-activity-sync.ts uses the same core. The read side is github-activity.ts.
 */
export interface SyncOptions {
  handle: string;
  token?: string;
  now?: Date;
  fetchImpl?: typeof fetch;
}

/** Curated significance keyed on the immutable repo id (see data/github-framing.json). */
export function framingMap(): Map<number, string> {
  const entries = (framingData.framing ?? []) as Array<{ repo_id: number; significance: string }>;
  return new Map(entries.map((e) => [e.repo_id, e.significance]));
}

function ghHeaders(handle: string, token?: string): Record<string, string> {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': `portfolio-evidence-sync/${handle}`,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function ghJson<T>(url: string, headers: Record<string, string>, fetchImpl: typeof fetch): Promise<T> {
  const res = await fetchImpl(url, { headers });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${url}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

interface RepoInfo {
  private: boolean;
  fork?: boolean;
  parent?: { id: number; full_name: string };
}

/**
 * Drop any surfaced repo that is not currently public — the load-bearing privacy guard.
 * Makes "made a repo private" purge on the very next run regardless of endpoint caching.
 * The same lookup reports each fork's upstream, returned so forks can be folded into it.
 */
async function keepPublicOnly(
  doc: GithubActivityDocument,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<{ doc: GithubActivityDocument; parentById: Map<number, RepoRef> }> {
  const parentById = new Map<number, RepoRef>();
  const checked = await Promise.all(
    doc.items.map(async (item) => {
      try {
        const repo = await ghJson<RepoInfo>(`https://api.github.com/repos/${item.repo}`, headers, fetchImpl);
        if (repo.private) return null;
        if (repo.fork && repo.parent) parentById.set(item.repoId, { id: repo.parent.id, name: repo.parent.full_name });
        return item;
      } catch {
        return null; // 404 (deleted/renamed away) or error → do not publish it
      }
    }),
  );
  return { doc: { ...doc, items: checked.filter((x): x is NonNullable<typeof x> => x !== null) }, parentById };
}

interface PullDetail {
  title?: string;
  body?: string | null;
  state?: string;
  merged?: boolean;
  html_url?: string;
}

const MAX_PR_LOOKUPS = 40;
const SUMMARY_MAX_CHARS = 240;

/** First paragraph of a PR description as plain text, trimmed to a sentence-sized line. */
export function summarizePrBody(body: string | null | undefined): string | undefined {
  if (!body) return undefined;
  const lead = body
    .replace(/\r/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('#'))
    .join('\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find(Boolean);
  if (!lead) return undefined;
  const text = lead
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= SUMMARY_MAX_CHARS) return text;
  return `${text.slice(0, SUMMARY_MAX_CHARS).replace(/\s+\S*$/, '')}…`;
}

/**
 * The events API now sends PRs as bare numbers (no title, body, link or merged flag), so
 * look each one up. Needs a token: unauthenticated calls share a 60/hour limit that the
 * events and visibility calls already use. A failed lookup leaves that item as it was.
 */
async function enrichPullRequests(
  doc: GithubActivityDocument,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<GithubActivityDocument> {
  const details = new Map<string, Promise<PullDetail | null>>();
  const lookup = (repo: string, number: number) => {
    const key = `${repo}#${number}`;
    if (!details.has(key) && details.size < MAX_PR_LOOKUPS) {
      details.set(
        key,
        ghJson<PullDetail>(`https://api.github.com/repos/${repo}/pulls/${number}`, headers, fetchImpl).catch((error) => {
          console.warn(`github-sync: PR lookup failed for ${key}:`, error);
          return null;
        }),
      );
    }
    return details.get(key) ?? Promise.resolve(null);
  };
  const enrich = async (repo: string, item: GithubActivityItem): Promise<GithubActivityItem> => {
    if (item.kind !== 'pull_request' || item.number === undefined) return item;
    const pr = await lookup(repo, item.number);
    if (!pr) return item;
    const summary = summarizePrBody(pr.body);
    return {
      ...item,
      ...(pr.title ? { title: pr.title } : {}),
      ...(pr.html_url ? { url: pr.html_url } : {}),
      state: pr.merged ? 'merged' : (pr.state ?? item.state),
      ...(summary ? { summary } : {}),
    };
  };
  const items = await Promise.all(
    doc.items.map(async (group) => {
      const enriched = await Promise.all(group.activity.map((item) => enrich(group.repo, item)));
      // Opened and merged events now carry the same current state; keep the newest per PR.
      const seen = new Set<number>();
      const activity = enriched.filter((item) => {
        if (item.kind !== 'pull_request' || item.number === undefined) return true;
        if (seen.has(item.number)) return false;
        seen.add(item.number);
        return true;
      });
      return { ...group, activity };
    }),
  );
  return { ...doc, items };
}

/** Fetch + transform + public-only guard. Pure of storage; returns the feed to publish. */
export async function buildFeed(opts: SyncOptions): Promise<GithubActivityDocument> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const headers = ghHeaders(opts.handle, opts.token);
  const events = await ghJson<GithubEvent[]>(
    `https://api.github.com/users/${opts.handle}/events/public?per_page=100`,
    headers,
    fetchImpl,
  );
  const framing = framingMap();
  const transformed = transformEvents(events, framing, opts.handle, opts.now ?? new Date());
  const { doc, parentById } = await keepPublicOnly(transformed, headers, fetchImpl);
  // Enrich before folding: a PR's lookup path is the repo its event was recorded on.
  const enriched = opts.token ? await enrichPullRequests(doc, headers, fetchImpl) : doc;
  return foldForks(enriched, parentById, framing);
}

export function feedBody(doc: GithubActivityDocument): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

/**
 * Upload the feed to R2, fully overwriting the previous one. Returns the object key.
 * Uses aws4fetch (SigV4 over fetch) rather than @aws-sdk: the SDK's S3 PutObject
 * deserializes the XML response with DOMParser, which the Vercel Edge runtime lacks
 * ("DOMParser is not defined"). aws4fetch signs a plain fetch and works on Edge and Node.
 */
export async function uploadFeed(
  doc: GithubActivityDocument,
  env: Record<string, string | undefined> = process.env,
): Promise<string> {
  const config = resolveR2Config(env);
  if (!config) throw new Error('R2 is not configured (need R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET)');
  const prefix = (env.GITHUB_ACTIVITY_PREFIX ?? 'github').replace(/\/+$/, '');
  const key = `${prefix}/github-activity.json`;
  const client = new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    region: 'auto',
    service: 's3',
  });
  const response = await client.fetch(`https://${config.endpoint}/${config.bucket}/${key}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: feedBody(doc),
  });
  if (!response.ok) {
    throw new Error(`R2 PUT ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return key;
}
