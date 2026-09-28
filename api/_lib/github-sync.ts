import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { resolveR2Config } from './context-index';
import { transformEvents, type GithubActivityDocument, type GithubEvent } from './github-activity';
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

/**
 * Drop any surfaced repo that is not currently public — the load-bearing privacy guard.
 * Makes "made a repo private" purge on the very next run regardless of endpoint caching.
 */
async function keepPublicOnly(
  doc: GithubActivityDocument,
  headers: Record<string, string>,
  fetchImpl: typeof fetch,
): Promise<GithubActivityDocument> {
  const checked = await Promise.all(
    doc.items.map(async (item) => {
      try {
        const repo = await ghJson<{ private: boolean }>(`https://api.github.com/repos/${item.repo}`, headers, fetchImpl);
        return repo.private ? null : item;
      } catch {
        return null; // 404 (deleted/renamed away) or error → do not publish it
      }
    }),
  );
  return { ...doc, items: checked.filter((x): x is NonNullable<typeof x> => x !== null) };
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
  const doc = transformEvents(events, framingMap(), opts.handle, opts.now ?? new Date());
  return keepPublicOnly(doc, headers, fetchImpl);
}

export function feedBody(doc: GithubActivityDocument): string {
  return `${JSON.stringify(doc, null, 2)}\n`;
}

/** Upload the feed to R2, fully overwriting the previous one. Returns the object key. */
export async function uploadFeed(
  doc: GithubActivityDocument,
  env: Record<string, string | undefined> = process.env,
): Promise<string> {
  const config = resolveR2Config(env);
  if (!config) throw new Error('R2 is not configured (need R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET)');
  const prefix = (env.GITHUB_ACTIVITY_PREFIX ?? 'github').replace(/\/+$/, '');
  const key = `${prefix}/github-activity.json`;
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.endpoint}`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: feedBody(doc),
    ContentType: 'application/json',
  }));
  return key;
}
