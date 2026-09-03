// Route a job description to the nearest reviewed summary. Retrieval, not
// generation: the strong answer for a JD is the summary already written and
// approved for the closest real one. Below an honest threshold the router
// declines, and the caller falls back to the canonical summary or the model.

import { SUMMARY_CORPUS, type TailoredSummary } from './summary-corpus';
import { lexicalTerms, overlapCount } from './lexical-kernel';

const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'to', 'of', 'for', 'in', 'on', 'with', 'our', 'we', 'you',
  'your', 'is', 'are', 'be', 'as', 'at', 'by', 'or', 'this', 'that', 'will', 'who',
  'work', 'working', 'role', 'team', 'engineer', 'engineering', 'build', 'building',
  'across', 'end', 'product', 'products', 'experience', 'years', 'strong',
]);

const SUMMARY_TERMS = { minLength: 3, stopwords: STOPWORDS, bigrams: true } as const;
const SUMMARY_INDEX = SUMMARY_CORPUS.map((entry) => ({
  entry,
  signal: new Set(entry.signal.map((signal) => signal.toLowerCase())),
  prose: lexicalTerms(entry.summary, SUMMARY_TERMS),
}));

/** A signal term is worth more than an incidental word in the prose. */
function score(
  jdTerms: Set<string>,
  entry: { signal: ReadonlySet<string>; prose: ReadonlySet<string> },
): number {
  const signalMatches = overlapCount(jdTerms, entry.signal);
  const proseOnly = new Set([...jdTerms].filter((term) => !entry.signal.has(term)));
  const s = signalMatches * 3 + overlapCount(proseOnly, entry.prose);
  // normalise by JD size so a long JD does not automatically win
  return s / Math.sqrt(jdTerms.size);
}

export interface SummaryRouting {
  match: TailoredSummary | null;
  ranked: { id: string; score: number }[];
}

// A JD unlike anything applied to should not be forced onto a distant summary.
const MATCH_THRESHOLD = 2.0;

export function routeSummary(job: string): SummaryRouting {
  const jd = lexicalTerms(job, SUMMARY_TERMS);
  const ranked = SUMMARY_INDEX
    .map((compiled) => ({ id: compiled.entry.id, score: score(jd, compiled) }))
    .sort((a, b) => b.score - a.score);
  const top = ranked[0];
  const match = top !== undefined && top.score >= MATCH_THRESHOLD
    ? SUMMARY_CORPUS.find((e) => e.id === top.id) ?? null
    : null;
  return { match, ranked };
}

export function matchSummary(job: string): TailoredSummary | null {
  return routeSummary(job).match;
}
