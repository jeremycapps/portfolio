// Two-pole questions, answered as verdicts from the tension index.
//
// A question like "is he a specialist or a generalist?" opens an answer space
// with two places and picks one. That is a bounded verdict. Until now these
// questions were captured by the career keyword matcher and answered with a
// temporal timeline titled "What is Jeremy's career history?" — a confident
// answer to a question nobody asked.
//
// Every value here comes from CANDIDATE_TENSIONS, which cites only engagement
// and evidence ids the corpus already holds.

import { directTrace, fields, verdictAnswerSet } from '@facia/core/authoring';
import type { JsonObject, VerdictAnswerSetV2 } from '@facia/core';
import { CANDIDATE_TENSIONS, type CandidateTension } from './candidate-tensions';
import { isTwoPole } from './question-grammar';

const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'but', 'by', 'did', 'do', 'does',
  'for', 'from', 'has', 'have', 'he', 'her', 'his', 'in', 'is', 'it', 'its', 'jeremy',
  'more', 'of', 'on', 'or', 'that', 'the', 'their', 'them', 'they', 'to', 'was', 'were',
  'who', 'with', 'work', 'worked', 'you', 'your',
]);

function significantWords(text: string): Set<string> {
  return new Set(
    text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ')
      .filter((w) => w.length > 2 && !STOPWORDS.has(w)),
  );
}

/** Overlap between the asked question and everything a tension names. */
function score(question: string, tension: CandidateTension): number {
  const asked = significantWords(question);
  const named = significantWords(
    `${tension.question} ${tension.left.name} ${tension.right.name}`,
  );
  let shared = 0;
  for (const w of asked) if (named.has(w)) shared += 1;
  return shared / Math.max(asked.size, 1);
}

const MATCH_THRESHOLD = 0.34;

/** The tension a two-pole question is asking about, or null. */
export function matchTension(question: string): CandidateTension | null {
  if (!isTwoPole(question)) return null;
  let best: CandidateTension | null = null;
  let bestScore = 0;
  for (const tension of CANDIDATE_TENSIONS) {
    const s = score(question, tension);
    if (s > bestScore) {
      bestScore = s;
      best = tension;
    }
  }
  return bestScore >= MATCH_THRESHOLD ? best : null;
}

export function supportsTensionQuestion(question: string): boolean {
  return matchTension(question) !== null;
}

/** Tensions whose question opens a two-place choice. These are answerable now. */
export function verdictTensions(): CandidateTension[] {
  return CANDIDATE_TENSIONS.filter((t) => isTwoPole(t.question));
}

/**
 * Tensions whose question ranges over a sequence — "across his roles", "can he
 * still ship". The grammar is right that these are convergence questions, and
 * they are declined here rather than downgraded to verdicts.
 *
 * ConvergenceV2 requires a `state` of converging / diverging / stalled /
 * reached, and a direction is only meaningful relative to a declared goal. The
 * corpus declares none, so the honest position is that the role is unreachable
 * for want of a goal, not for want of a renderer. Naming a goal is a claim
 * about what Jeremy is aiming at, and that is his to make.
 */
export function convergenceTensions(): CandidateTension[] {
  return CANDIDATE_TENSIONS.filter((t) => !isTwoPole(t.question));
}

/** The verdict `state` — a short contract label, not reader-facing prose. */
function stateOf(tension: CandidateTension): string {
  switch (tension.placement) {
    case 'left': return tension.left.name;
    case 'right': return tension.right.name;
    case 'both': return `Both — ${tension.left.name} and ${tension.right.name}`;
    case 'shifting': return `Shifted — ${tension.left.name} to ${tension.right.name}`;
  }
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** The answer as a spoken lead clause. A two-pole question rarely has a
 *  one-pole answer; where the evidence lands on both, or has moved between
 *  them, the lead says so rather than flattening it into a single label. */
function answerLead(tension: CandidateTension): string {
  switch (tension.placement) {
    case 'left': return `${tension.left.name}.`;
    case 'right': return `${tension.right.name}.`;
    case 'both': return `Both — ${lower(tension.left.name)} and ${lower(tension.right.name)}.`;
    case 'shifting': return `It has shifted, from ${lower(tension.left.name)} to ${lower(tension.right.name)}.`;
  }
}

export function tensionAnswerSet(question: string): VerdictAnswerSetV2 | null {
  const tension = matchTension(question);
  if (tension === null) return null;

  const sourceRefs = [
    ...new Set([
      ...tension.left.engagements, ...tension.right.engagements,
      ...tension.left.evidence, ...tension.right.evidence,
    ]),
  ];

  const payload: JsonObject = {
    answer: answerLead(tension),
    basis: tension.basis,
  };

  return verdictAnswerSet({
    question,
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [{
      type: 'Verdict',
      contract: 'BoundedVerdictV1',
      payload,
      state: stateOf(tension),
      evidence: { status: 'profile-grounded', sourceRefs },
      fields: fields({ primary: ['answer'], secondary: ['basis'] }),
    }],
    operations: [],
    trace: directTrace(`portfolio.tension.${tension.id}`, [
      { step: 'grammar.arity', value: '2·alternative' },
      { step: 'tension.matched', value: tension.id },
      { step: 'placement.resolved', value: tension.placement },
    ]),
  });
}
