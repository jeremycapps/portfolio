// Question grammar: which answer space a question opens, read from its form.
//
//   question word  +  verb  +  arity  =  answer role
//
// Arity is the discriminator — how many places the answer has to hold at once,
// and whether it chooses among them or joins them. The word and the verb are
// how you detect it. Nothing here reads the subject, so the same rules classify
// "Does advantage come from assets or interactions?" and "Is Jeremy a
// specialist or a generalist?" identically.
//
// The arities are the contract's own item shapes, read from the question side:
// OperationV2 requires both `input` and `output` because a relation has two
// places; ConvergenceV2 is the only role required to carry a trace because a
// direction cannot be read without the sequence it was read from.

import type { AnswerRole } from '@facia/core';

export type QuestionWord = 'what' | 'which' | 'who' | 'when' | 'where' | 'how' | 'why' | '∅';
export type QuestionVerb = 'polar' | 'relational' | 'motion' | 'modal' | 'lexical';
export type Arity = '1·open' | '1·closed' | '2·alternative' | '2·relational' | 'n·sequential';

export interface QuestionParse {
  word: QuestionWord;
  verb: QuestionVerb;
  arity: Arity;
  role: AnswerRole;
}

const ARITY_ROLE: Record<Arity, AnswerRole> = {
  '1·open': 'value',
  '1·closed': 'verdict',
  '2·alternative': 'verdict',
  '2·relational': 'operation',
  'n·sequential': 'convergence',
};

const POLAR = /^(did|has|have|does|do|is|are|was|were|can|could|will)\b/;
const RELATIONAL = /\b(compare[ds]?|apply|applies|transfer|fits?|build on|relates?|connects?|translates?)\b/;
const MOTION = /\b(shift|shifted|heads?|heading|becom\w+|ready|looking for|ramp)\b/;

/** A range read over a sequence, or a direction toward a goal. */
const SEQUENTIAL = new RegExp([
  /\bacross (his|their|her)\b/, /\bfrom \d{4}\b/, /\bover time\b/, /\bstill\b/,
  /^(based on|given|weighing)\b/, /\bstrengths?\b/, /\bhow deep\b/, /\bstrongest\b/,
  /\bseniority\b/, /\bsuit\b/, /^why should\b/, /\bready for\b/, /\bheading\b/,
].map((r) => r.source).join('|'));

export function parseQuestion(question: string): QuestionParse {
  const s = question.trim().toLowerCase().replace(/\?+$/, '');

  const word = (/^(what|which|who|when|where|how|why)\b/.exec(s)?.[1] ?? '∅') as QuestionWord;
  const verb: QuestionVerb = POLAR.test(s) ? 'polar'
    : RELATIONAL.test(s) ? 'relational'
    : MOTION.test(s) ? 'motion'
    : /^(would|should)\b/.test(s) ? 'modal'
    : 'lexical';

  // "what kinds of X" and "which X" enumerate; they do not offer alternatives.
  const enumerating = /^what kinds?\b|^which\b/.test(s);
  const alternative = !enumerating && /,\s*or\b|\bor\b(?!\s+not\b)/.test(s);
  const relational = verb === 'relational' || /\bimpact\b/.test(s);

  const arity: Arity = SEQUENTIAL.test(s) ? 'n·sequential'
    : relational ? '2·relational'
    : alternative ? '2·alternative'
    : verb === 'polar' ? '1·closed'
    : '1·open';

  return { word, verb, arity, role: ARITY_ROLE[arity] };
}

export function roleOf(question: string): AnswerRole {
  return parseQuestion(question).role;
}

/** True when the question names two poles and asks which one holds. */
export function isTwoPole(question: string): boolean {
  return parseQuestion(question).arity === '2·alternative';
}
