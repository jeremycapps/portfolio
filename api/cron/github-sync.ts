import { withApiLogging, jsonResponse, jsonError } from '../_lib/http';
import { buildFeed, uploadFeed } from '../_lib/github-sync';

export const config = { runtime: 'edge' };

/**
 * Vercel Cron target that rebuilds the public GitHub activity feed on R2. Scheduled daily
 * in vercel.json; also callable by hand for an instant resync/purge:
 *   curl -X POST https://<host>/api/cron/github-sync -H "authorization: Bearer $CRON_SECRET"
 *
 * Runs on Vercel, so it reads the R2 creds already in the project env — no secret is
 * duplicated anywhere. Auth: when CRON_SECRET is set (Vercel sends it on cron calls) it is
 * required; without it the route still runs so first-time setup works, but that is logged.
 */
async function handleGithubSync(request: Request): Promise<Response> {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
      return jsonError('Unauthorized.', 'UNAUTHORIZED', 401);
    }
  } else {
    console.warn('github-sync: CRON_SECRET is not set — endpoint is unauthenticated.');
  }

  try {
    const doc = await buildFeed({ handle: process.env.GITHUB_HANDLE ?? 'jeremycapps', token: process.env.GITHUB_TOKEN });
    const key = await uploadFeed(doc);
    return jsonResponse({ uploaded: key, repos: doc.items.length, generated_at: doc.generated_at });
  } catch (error) {
    console.error('github-sync failed:', error); // full detail stays in server logs
    return jsonError('GitHub activity sync failed.', 'GITHUB_SYNC_FAILED', 500);
  }
}

const loggedHandler = withApiLogging('api/cron/github-sync', handleGithubSync);

export default function handler(request: Request): Promise<Response> {
  return loggedHandler(request);
}
