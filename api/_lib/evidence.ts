import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { readFile } from 'node:fs/promises';
import { resolveR2Config } from './context-index';
import { lexicalTerms, overlapCount } from './lexical-kernel';

/**
 * Evidence: claims extracted from Jeremy's working logs by the observation pipeline
 * (timpos/evidence). Clean claims publish automatically; flagged ones wait for his
 * review; only reviewed items carry a verbatim quote. The file never contains raw
 * transcript text or source paths.
 */
export interface EvidenceLink {
  id: string;
  relation: string | null;
}

export interface EvidenceItem {
  id: string;
  type: string;
  subject: string;
  date: string;
  claim: string;
  quote: string | null;
  reviewed: boolean;
  current: boolean;
  supersedes: EvidenceLink[];
  superseded_by: EvidenceLink[];
}

export interface EvidenceDocument {
  generated_at: string;
  count: number;
  items: EvidenceItem[];
}

const EVIDENCE_KEY = 'evidence.json';
const CACHE_MS = 5 * 60 * 1000;
const DEFAULT_LIMIT = 6;
const STOPWORDS = new Set([
  'the', 'and', 'for', 'that', 'this', 'with', 'what', 'does', 'did', 'how', 'why', 'about',
  'jeremy', 'his', 'him', 'you', 'your', 'are', 'was', 'were', 'has', 'have', 'had', 'from',
  'into', 'then', 'than', 'when', 'which', 'who', 'would', 'could', 'should', 'there', 'their',
  'they', 'them', 'its', 'not', 'but', 'can', 'any', 'all', 'more', 'most', 'some', 'think',
  'tell', 'know', 'like', 'just', 'also', 'use', 'used', 'using',
]);
const TERMS = { minLength: 3, stopwords: STOPWORDS, bigrams: true } as const;

let cache: { doc: EvidenceDocument; at: number } | null = null;

export function resetEvidenceCache(): void {
  cache = null;
}

async function fetchFromR2(env: Record<string, string | undefined>): Promise<EvidenceDocument | null> {
  const config = resolveR2Config(env);
  if (!config) return null;
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.endpoint}`,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
  const prefix = (env.EVIDENCE_PREFIX ?? 'evidence').replace(/\/+$/, '');
  const response = await client.send(new GetObjectCommand({
    Bucket: config.bucket,
    Key: `${prefix}/${EVIDENCE_KEY}`,
  }));
  const body = await response.Body?.transformToString();
  return body ? (JSON.parse(body) as EvidenceDocument) : null;
}

/** Loads the published evidence from EVIDENCE_FILE (local) or R2, cached for five minutes. */
export async function loadEvidence(
  env: Record<string, string | undefined> = process.env,
  now: number = Date.now(),
): Promise<EvidenceDocument | null> {
  if (cache && now - cache.at < CACHE_MS) return cache.doc;
  const doc = env.EVIDENCE_FILE
    ? (JSON.parse(await readFile(env.EVIDENCE_FILE, 'utf8')) as EvidenceDocument)
    : await fetchFromR2(env);
  if (doc) cache = { doc, at: now };
  return doc;
}

/**
 * Lexical top-k over subject + claim. A matched item brings its supersession chain with
 * it, so the model always sees the current position next to what it replaced.
 */
export function searchEvidence(
  doc: EvidenceDocument,
  question: string,
  limit: number = DEFAULT_LIMIT,
): EvidenceItem[] {
  const query = lexicalTerms(question, TERMS);
  if (query.size === 0) return [];
  const byId = new Map(doc.items.map((item) => [item.id, item]));
  const scored = doc.items
    .map((item) => ({
      item,
      // subject counts twice: it is the short label of what the claim is about
      score: overlapCount(query, lexicalTerms(`${item.subject} ${item.subject} ${item.claim}`, TERMS)),
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || (b.item.current ? 1 : 0) - (a.item.current ? 1 : 0) || b.item.date.localeCompare(a.item.date));

  const picked = new Map<string, EvidenceItem>();
  for (const { item } of scored) {
    if (picked.size >= limit) break;
    picked.set(item.id, item);
    for (const link of [...item.superseded_by, ...item.supersedes]) {
      const linked = byId.get(link.id);
      if (linked) picked.set(linked.id, linked);
    }
  }
  return [...picked.values()].sort((a, b) => b.date.localeCompare(a.date));
}

export const EVIDENCE_BLOCK_INSTRUCTIONS = [
  "The items below are dated claims about Jeremy's decisions, principles and working",
  'process, extracted by a pipeline over his own work logs. Items marked "reviewed" were',
  'confirmed by Jeremy; the rest passed an automatic check and may be imperfect.',
  'Rules: lead with the current position. An item marked "earlier" was later replaced;',
  'present it only as history ("earlier he ..., then ..."), never as what he thinks now.',
  'Cite dates as "as of <date>". Quote only the text in a quote field. If nothing below',
  'answers the question, say his logs do not cover it rather than guessing. The canonical',
  'profile above outranks these items on facts about his career.',
].join('\n');

export function formatEvidenceItem(item: EvidenceItem): string {
  const status = [item.current ? 'current' : 'earlier', item.reviewed ? 'reviewed' : 'auto'].join(', ');
  const replaced = item.superseded_by.length ? ` (replaced by ${item.superseded_by.map((l) => l.id).join(', ')})` : '';
  const quote = item.quote ? ` Quote: "${item.quote}"` : '';
  return `[${item.id}, ${item.date}, ${item.type}, ${status}${replaced}] ${item.subject}: ${item.claim}${quote}`;
}

export function buildEvidenceBlock(items: EvidenceItem[]): string {
  return [EVIDENCE_BLOCK_INSTRUCTIONS, '', ...items.map(formatEvidenceItem)].join('\n');
}

export async function retrieveEvidence(
  question: string,
  env: Record<string, string | undefined> = process.env,
): Promise<EvidenceItem[]> {
  const doc = await loadEvidence(env);
  return doc ? searchEvidence(doc, question) : [];
}
