// Answer-routing regression set — a held-out eval, not a unit test.
//
// Each case is a question paired with the *shape* its answer must take: which
// deterministic model claims it (trace id), what answer role it resolves to, or
// — for a question the corpus cannot answer — that retrieval abstains. It asserts
// routing and shape, never prose, so it stays stable as wording changes.
//
// The point (per the RAG practical guide's Step 7): a misroute is silent. The
// "what roles fit Jeremy" bug answered a forward-looking question with the career
// timeline and nothing failed. This set turns each such bug into a guardrail.
// Add a row whenever a question routes to the wrong answer.
import { describe, expect, it } from 'vitest';
import {
  generatePortfolioAnswer,
} from './portfolio-answer-source';
import { verdictTensions } from './tension-answer-source';
import { ModelAnswerContractError } from './model-answer';
import type { AnswerRole } from '@facia/core';
import {
  buildEvidenceBlock,
  formatEvidenceItem,
  searchEvidence,
  type EvidenceDocument,
  type EvidenceItem,
} from './evidence';

// A provider that must never be reached: a deterministic route reaching the model
// is itself the failure. Both providers throw so either kind of leak is caught.
const providerMustNotRun = async (): Promise<never> => {
  throw new Error('a deterministic route must not reach the model provider');
};

interface RoutingCase {
  name: string;
  question: string;
  traceId: string;
  role: AnswerRole;
}

// Deterministic routes: authored answer sets that intercept ahead of the model.
const DETERMINISTIC_ROUTES: RoutingCase[] = [
  {
    name: 'roles-fit → looking-for, not the career timeline (the regression)',
    question: 'What roles fit Jeremy?',
    traceId: 'portfolio.looking-for.v1',
    role: 'value',
  },
  {
    name: 'the exact preset phrasing that shipped the bug',
    question: 'What kinds of roles fit Jeremy, and why?',
    traceId: 'portfolio.looking-for.v1',
    role: 'value',
  },
  {
    name: '"what is he looking for" → looking-for',
    question: "What is Jeremy looking for in his next role?",
    traceId: 'portfolio.looking-for.v1',
    role: 'value',
  },
  {
    name: 'career history stays on the career spine',
    question: "What is Jeremy's career history?",
    traceId: 'portfolio.career-history.v1',
    role: 'value',
  },
  {
    name: 'a past-tense "roles he has held" is history, not fit',
    question: 'What roles has Jeremy held over his career?',
    traceId: 'portfolio.career-history.v1',
    role: 'value',
  },
  {
    name: 'technology question → technologies, not the career timeline',
    question: 'What technologies has Jeremy worked with?',
    traceId: 'portfolio.technologies.v1',
    role: 'value',
  },
];

describe('answer-routing regression set', () => {
  describe('deterministic routes intercept ahead of the model', () => {
    for (const c of DETERMINISTIC_ROUTES) {
      it(c.name, async () => {
        const answer = await generatePortfolioAnswer(
          c.question,
          providerMustNotRun,
          providerMustNotRun,
        );
        expect(answer.answerType).toBe(c.role);
        expect(answer.trace?.kind).toBe('direct');
        if (answer.trace?.kind !== 'direct') return;
        expect(answer.trace.id).toBe(c.traceId);
      });
    }
  });

  it('a two-pole question resolves as a verdict, never the career timeline', async () => {
    const tension = verdictTensions()[0];
    const answer = await generatePortfolioAnswer(
      tension.question,
      providerMustNotRun,
      providerMustNotRun,
    );
    expect(answer.answerType).toBe('verdict');
    expect(answer.question).toBe(tension.question);
  });

  it('a Zocdoc question is model-first and falls back to the reviewed fixture', async () => {
    // Zocdoc is intentionally answered by the model (the richer scoped model),
    // with the source-reviewed fixture as the unavailability fallback. This locks
    // that design: on provider unavailability the answer is the fixture, not a throw.
    const unavailable = async () => {
      throw new ModelAnswerContractError('MODEL_PROVIDER_UNAVAILABLE', 'down');
    };
    const answer = await generatePortfolioAnswer(
      'What did Jeremy do at Zocdoc?',
      unavailable,
      providerMustNotRun,
    );
    expect(answer.trace?.kind).toBe('direct');
    if (answer.trace?.kind !== 'direct') return;
    expect(answer.trace.id).toBe('portfolio.zocdoc-work.v1');
  });

  it('a relational "how does X fit Y" composes an operation, not a value list', async () => {
    // "fit" appears here as a relational verb, not the looking-for sense — this is
    // the boundary the looking-for matcher must not cross.
    const fakeOperation = async () => ({
      schema: 'portfolio.model-operation/1' as const,
      refusal: null,
      input: {
        claim: 'Owned and migrated shared TypeScript/React design-system components at Zocdoc.',
        evidenceRefs: ['profile.zocdoc' as const],
      },
      relation: 'The ownership-and-migration discipline transfers to a fintech component library.',
      output: 'Building a component library at a fintech',
      caution: 'Jeremy has not worked in fintech; the transfer is by shape of problem.',
    });
    const answer = await generatePortfolioAnswer(
      "How does Jeremy's design-system experience fit a fintech role?",
      providerMustNotRun,
      fakeOperation,
    );
    expect(answer.answerType).toBe('operation');
  });
});

// Evidence-shape regression: the retriever's contract with the model block.
// A synthetic corpus with one superseded pair and one unmatched query proves the
// two behaviors the answer instructions depend on — supersession chaining and
// abstention — without a live index.
function evItem(over: Partial<EvidenceItem> & Pick<EvidenceItem, 'id' | 'subject' | 'claim' | 'date'>): EvidenceItem {
  return {
    type: 'decision',
    quote: null,
    reviewed: false,
    current: true,
    supersedes: [],
    superseded_by: [],
    ...over,
  };
}

const OLD = evItem({
  id: 'ev-old',
  subject: 'pricing model',
  claim: 'Jeremy priced projects with a flat day rate.',
  date: '2026-01-10',
  current: false,
  superseded_by: [{ id: 'ev-new', relation: 'replaces' }],
});
const NEW = evItem({
  id: 'ev-new',
  subject: 'pricing model',
  claim: 'Jeremy set the first per-project pricing model from reconciled delivery data.',
  date: '2026-06-01',
  current: true,
  reviewed: true,
  supersedes: [{ id: 'ev-old', relation: 'replaces' }],
});
const UNRELATED = evItem({
  id: 'ev-other',
  subject: 'accessibility mandate',
  claim: 'Jeremy migrated components under a WCAG mandate at Zocdoc.',
  date: '2026-03-01',
});

const CORPUS: EvidenceDocument = {
  generated_at: '2026-09-28T00:00:00Z',
  count: 3,
  items: [OLD, NEW, UNRELATED],
};

describe('evidence-retrieval regression set', () => {
  it('a matched claim brings its whole supersession chain, current first', () => {
    const hits = searchEvidence(CORPUS, 'pricing model');
    const ids = hits.map((item) => item.id);
    expect(ids).toContain('ev-new');
    expect(ids).toContain('ev-old');
    // The current position leads (newest date first).
    expect(ids[0]).toBe('ev-new');
  });

  it('marks the current item current and the replaced item earlier', () => {
    expect(formatEvidenceItem(NEW)).toContain('current');
    expect(formatEvidenceItem(OLD)).toContain('earlier');
    // Only the reviewed item exposes a verbatim quote path; both here have none,
    // so neither block line fabricates a quote.
    expect(formatEvidenceItem(NEW)).not.toContain('Quote:');
  });

  it('abstains on a question the corpus cannot answer (no forced match)', () => {
    const hits = searchEvidence(CORPUS, 'What is his stance on quantum error correction?');
    expect(hits).toEqual([]);
    // The block still renders its instructions, so the model is told to say the
    // logs do not cover it rather than reaching for an irrelevant item.
    const block = buildEvidenceBlock(hits);
    expect(block).toContain('say his logs do not cover it');
  });
});
