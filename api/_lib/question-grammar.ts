// Question grammar: which answer space a question opens, read from its form.
//
// A question surface (word order, auxiliary, connectives) is read into a
// small set of independently-testable features. One precedence rule turns
// those features into a semantic operator, and each operator names exactly
// one Facia answer role:
//
//   LOOKUP -> value        fill one open place
//   JUDGE  -> verdict      resolve a bounded predicate, possibly between
//                          two named alternatives
//   MAP    -> operation    relate two named frames to each other
//   TRACE  -> convergence  synthesize a judgment from a body of evidence —
//                          a range over roles/history, or a claim's
//                          persistence across time
//
// Nothing here reads the subject, so the same rules classify "Does advantage
// come from assets or interactions?" and "Is Jeremy a specialist or a
// generalist?" identically — the classifier only ever sees question form.
//
// Precedence exists because features can co-occur and are not equally
// decisive. "Which product integrations did Jeremy build on 360Sync?" both
// enumerates ("which") and contains a relational verb ("build on"); the verb
// is incidental to the sentence's real shape, which selects one item from a
// named set. "Across his roles, is Jeremy a specialist or a generalist?"
// both evidences a range and names two alternatives; the range is what the
// question is actually asking for — the alternatives are its answer space,
// not its subject. So: evidential > enumerating > relational > alternatives >
// polar > default lookup.
//
// This exact-feature-plus-precedence shape, over collapsing verbs into coarse
// classes, isn't a style preference — it's the one design this file's own
// prior form (word × verb-class × arity) lost on when tested out-of-domain
// against real command logs ("A Query Compiler, Induced From My Own Logs").
// Granular, independently-testable features beat abstracted verb classes
// there, and arity/operator earned its keep only bolted onto the exact verb,
// never as a replacement for it.

import type { AnswerRole } from '@facia/core';

export type Lead = 'what' | 'which' | 'who' | 'when' | 'where' | 'how' | 'why' | '∅';
export type Operator = 'lookup' | 'judge' | 'map' | 'trace';

export interface QuestionFeatures {
  /** "which X" / "what kind(s) of X" — selects one item from a named set;
   *  the answer has one open place no matter what else the sentence contains. */
  enumerating: boolean;
  /** A fronted auxiliary ("did/does/is/…") — the question's own shape is
   *  yes/no. */
  polar: boolean;
  /** Two named alternatives offered explicitly ("X, or Y?"). */
  alternatives: boolean;
  /** A verb or noun that relates two named frames to each other — compare,
   *  apply to, build on, translate into, or the noun "impact" (a cause
   *  naming its effect). */
  relational: boolean;
  /** The question asks for a judgment synthesized from a body of evidence —
   *  an explicit range over roles/career, an evidence-weighing opener, an
   *  evaluative-fit judgment, or a claim's persistence across time — rather
   *  than a single fact or a single predicate. */
  evidential: boolean;
}

export interface QuestionParse {
  lead: Lead;
  features: QuestionFeatures;
  operator: Operator;
  role: AnswerRole;
}

const OPERATOR_ROLE: Record<Operator, AnswerRole> = {
  lookup: 'value',
  judge: 'verdict',
  map: 'operation',
  trace: 'convergence',
};

const LEAD_WORD = /^(what|which|who|when|where|how|why)\b/;
const ENUMERATING = /^(which|what kinds?)\b/;
const POLAR_AUX = /^(did|has|have|does|do|is|are|was|were|can|could|will|would|should)\b/;
const NAMED_OR = /,?\s*\bor\b(?!\s+not\b)/;

// A verb (or, for "impact", a noun) that takes two named frames as its
// arguments — the sentence relates one thing to another rather than
// resolving a single predicate about one thing.
const RELATIONAL_VERB = /\b(compare[ds]?|appl(?:y|ies)|transfers?|fits?|builds?\s+on|relates?|connects?|translates?)\b/;
const RELATIONAL_NOUN = /\bimpact\b/;

// An evidence-weighing opener: the question announces up front that its
// answer is a synthesis over what follows, not a lookup on it.
const EVIDENTIAL_OPENER = /^(based on|given|weighing|considering)\b/;
// An explicit range over a person's history — the answer has to be read off
// a sequence, not a single point in it.
const EVIDENTIAL_RANGE = /\bacross (his|her|their)\s+(roles|career|history|work)\b/;
// "Why should we hire them" asks for a recommendation weighed from the whole
// record, not a single fact or predicate about it.
const EVIDENTIAL_RECOMMENDATION = /^why should\b/;
// A temporal-continuity adverb: "can X still do Y" asks whether a past
// capability persists — a claim about a trajectory, not a point-in-time fact.
const EVIDENTIAL_CONTINUITY = /\bstill\b/;
// Evaluative-fit vocabulary: gradable judgments (a superlative, a fit/suit
// verdict, a seniority placement) that can only be read off an accumulated
// body of evidence, not verified against one fact.
const EVIDENTIAL_VOCAB = /\b(strongest|strengths?|suit(?:ed)?|ready|seniority|heading)\b/;

export function isEnumerating(question: string): boolean {
  return ENUMERATING.test(question);
}

export function isPolar(question: string): boolean {
  return POLAR_AUX.test(question);
}

export function namesAlternatives(question: string): boolean {
  return !isEnumerating(question) && NAMED_OR.test(question);
}

export function relatesTwoFrames(question: string): boolean {
  return RELATIONAL_VERB.test(question) || RELATIONAL_NOUN.test(question);
}

export function weighsEvidence(question: string): boolean {
  return EVIDENTIAL_OPENER.test(question)
    || EVIDENTIAL_RANGE.test(question)
    || EVIDENTIAL_RECOMMENDATION.test(question)
    || EVIDENTIAL_CONTINUITY.test(question)
    || EVIDENTIAL_VOCAB.test(question);
}

function operatorOf(features: QuestionFeatures): Operator {
  if (features.evidential) return 'trace';
  if (features.enumerating) return 'lookup';
  if (features.relational) return 'map';
  if (features.alternatives) return 'judge';
  if (features.polar) return 'judge';
  return 'lookup';
}

export function parseQuestion(question: string): QuestionParse {
  const s = question.trim().toLowerCase().replace(/\?+$/, '');

  const lead = (LEAD_WORD.exec(s)?.[1] ?? '∅') as Lead;
  const features: QuestionFeatures = {
    enumerating: isEnumerating(s),
    polar: isPolar(s),
    alternatives: namesAlternatives(s),
    relational: relatesTwoFrames(s),
    evidential: weighsEvidence(s),
  };
  const operator = operatorOf(features);

  return { lead, features, operator, role: OPERATOR_ROLE[operator] };
}

export function roleOf(question: string): AnswerRole {
  return parseQuestion(question).role;
}

// TODO(question-grammar): `isTwoPole` is a misnomer for what it actually
// gates, and the gate itself is narrower than the concept behind it.
//
// `polar` and `alternatives` are not two different kinds of question — both
// already resolve to the same `judge -> verdict` operator, because both are
// the same underlying thing: a discrete verdict, whose true answer is one
// member of a closed, enumerable set. "Did X happen?" is a discrete verdict
// with an implicit binary label (yes/no); "Is it X, or Y?" is a discrete
// verdict with explicit named labels. Cardinality (two options vs. three vs.
// binary) isn't the discriminator; closedness is. A `status: accepted |
// rejected | hold` question is exactly as discrete as a yes/no one.
//
// The real axis this module should expose is discrete vs. synthesized:
//   - discrete   — the answer is one member of a closed set, of any size.
//   - synthesized — the answer doesn't collapse into a label at all; it's a
//     structure built by weighing evidence ("Jeremy has more experience as
//     a generalist across his career, but spent focused time on
//     accessibility in design-system components at Zocdoc" is not
//     "generalist" *or* "specialist"). This is exactly the `evidential`
//     feature / `trace` operator already in this file.
//
// `namesAlternatives` is a narrower proxy for "discrete" than the concept
// it's standing in for: it only fires on a literal `or` connective between
// two named spans, so it would miss a genuinely discrete, closed-set
// question phrased without "or" (e.g. an enumerated status field). The
// binary/named split this function currently makes (`alternatives` vs.
// `polar`) is an accident of surface phrasing, not a real category
// boundary — both are already the same operator.
//
// Proposed shape, not yet implemented: replace `isTwoPole` with something
// like `isDiscrete(question): boolean` — true whenever `operator === judge`
// (both polar and alternatives collapse into this), generalized so a
// closed-set question of any cardinality qualifies, not just an `or`-joined
// pair. Known consumers to update if this lands: `matchTension`,
// `verdictTensions`, and `convergenceTensions` in `tension-answer-source.ts`
// (3 call sites, all gating whether a tension is answerable as a verdict vs.
// declined as an unresolvable convergence) — small blast radius, but the
// three-way split there (discrete tension / declined convergence tension /
// not a tension at all) should be re-derived from the new function, not
// papered over with a rename alone.

/** True when the question names two poles, and they are what its answer
 *  actually resolves — not subordinate to a wider evidence trace. */
export function isTwoPole(question: string): boolean {
  const p = parseQuestion(question);
  return p.operator === 'judge' && p.features.alternatives;
}
