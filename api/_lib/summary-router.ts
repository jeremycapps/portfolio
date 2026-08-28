// Route a job description to the nearest reviewed summary. Retrieval, not
// generation: the strong answer for a JD is the summary already written and
// approved for the closest real one. Below an honest threshold the router
// declines, and the caller falls back to the canonical summary or the model.

import { SUMMARY_CORPUS, type TailoredSummary } from './summary-corpus';

const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'to', 'of', 'for', 'in', 'on', 'with', 'our', 'we', 'you',
  'your', 'is', 'are', 'be', 'as', 'at', 'by', 'or', 'this', 'that', 'will', 'who',
  'work', 'working', 'role', 'team', 'engineer', 'engineering', 'build', 'building',
  'across', 'end', 'product', 'products', 'experience', 'years', 'strong',
]);

function terms(text: string): Set<string> {
  const single = text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  const out = new Set(single);
  // keep authored two-word signals as bigrams so "data mapping", "0 to 1" match
  for (let i = 0; i < single.length - 1; i += 1) out.add(`${single[i]} ${single[i + 1]}`);
  return out;
}

/** A signal term is worth more than an incidental word in the prose. */
function score(jdTerms: Set<string>, entry: TailoredSummary): number {
  const signal = new Set(entry.signal.map((s) => s.toLowerCase()));
  const prose = terms(entry.summary);
  let s = 0;
  for (const t of jdTerms) {
    if (signal.has(t)) s += 3;
    else if (prose.has(t)) s += 1;
  }
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
  const jd = terms(job);
  const ranked = SUMMARY_CORPUS
    .map((entry) => ({ id: entry.id, score: score(jd, entry) }))
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
