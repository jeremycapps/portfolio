import { resolveAnswerSet } from '@facia/core';
import { verdictTensions } from './tension-answer-source';
import { describe, expect, it } from 'vitest';
import {
  careerHistoryAnswerSet,
  lookingForAnswerSet,
  resolvePortfolioAnswer,
  supportsCareerQuestion,
  supportsLookingForQuestion,
  supportsPortfolioQuestion,
  supportsTechnologiesQuestion,
  technologiesAnswerSet,
  zocdocAnswerSet,
} from './portfolio-answer-source';

// Resolve a question to its deterministic card, asserting a card exists.
function cardFor(question: string) {
  const answer = resolvePortfolioAnswer(question);
  if (!answer) throw new Error(`Expected a portfolio card for: ${question}`);
  return answer;
}

describe('Zocdoc answer source', () => {
  it('routes only declared Zocdoc question shapes', () => {
    expect(supportsPortfolioQuestion('What did Jeremy build at Zocdoc?')).toBe(true);
    expect(supportsPortfolioQuestion('Tell me about Aroko')).toBe(false);
    expect(supportsPortfolioQuestion('Did Jeremy enjoy Zocdoc?')).toBe(false);
  });

  it('emits a valid v2 AnswerSet with honest source framing', () => {
    const result = resolveAnswerSet(zocdocAnswerSet(), { depth: 'audit', audience: 'human' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.recipe.answer.schema).toBe('facia.answer-set/2');
    expect(result.recipe.answer.items).toHaveLength(3);
    expect(result.recipe.visibleFields[0].fields).toContainEqual(expect.objectContaining({
      key: 'evidenceTier',
      value: 'profile-grounded',
    }));
  });
});

describe('career history answer source', () => {
  it('routes whole-career questions but not Zocdoc-scoped or unrelated ones', () => {
    expect(supportsCareerQuestion("What is Jeremy's career history?")).toBe(true);
    expect(supportsCareerQuestion('Walk me through his experience')).toBe(true);
    expect(supportsCareerQuestion('current role and last one')).toBe(true);
    expect(supportsCareerQuestion('What did Jeremy do at Zocdoc?')).toBe(false);
    expect(supportsCareerQuestion('How do I contact Jeremy?')).toBe(false);
  });

  it('resolves to the timeline pattern from a temporal sequence at every depth', () => {
    const answer = careerHistoryAnswerSet();
    for (const depth of ['glance', 'inspect', 'focus', 'audit'] as const) {
      const result = resolveAnswerSet(answer, { depth, audience: 'human' });
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.recipe.pattern).toBe('timeline');
      expect(result.recipe.components.map((c) => c.id)).toContain('Timeline');
      expect(result.recipe.answer.items).toHaveLength(4);
    }
  });

  it('discloses more fields as depth deepens, ending with audit provenance', () => {
    const answer = careerHistoryAnswerSet();
    const keysAt = (depth: 'glance' | 'inspect' | 'focus' | 'audit') => {
      const result = resolveAnswerSet(answer, { depth });
      if (!result.ok) throw new Error('resolution failed');
      return new Set(result.recipe.visibleFields[0].fields.map((f) => f.key));
    };
    const glance = keysAt('glance');
    expect(glance).toEqual(new Set(['role', 'organization', 'period']));
    expect(keysAt('inspect').has('focus')).toBe(true);
    expect(keysAt('focus').has('highlight')).toBe(true);
    expect(keysAt('audit').has('source')).toBe(true);
  });
});

describe('the career matcher stays on genuine history questions', () => {
  // Grammar-free shape guards keep the timeline off questions whose real shape is
  // a verdict, a relational mapping, or a synthesis, even on a shared keyword.
  it('declines an either/or verdict that mentions experience', () => {
    expect(supportsCareerQuestion('Does Jeremy have backend and API experience, or is he frontend-only?')).toBe(false);
  });

  it('declines a relational operation that mentions experience', () => {
    expect(supportsCareerQuestion("How would Jeremy's design-system experience apply to a fintech?")).toBe(false);
  });

  it('declines a convergence question that mentions roles', () => {
    expect(supportsCareerQuestion('Across his roles, is Jeremy more of a specialist or a broad generalist?')).toBe(false);
  });

  it('still claims a genuine value/history question', () => {
    expect(supportsCareerQuestion("What is Jeremy's career history?")).toBe(true);
    expect(supportsCareerQuestion('Walk me through his experience')).toBe(true);
    expect(supportsCareerQuestion("What was Jeremy's title and how long was he at Zocdoc?")).toBe(true);
  });
});

describe('looking-for answer source', () => {
  it('claims forward-looking "what roles fit / looking for" questions', () => {
    expect(supportsLookingForQuestion('What roles fit Jeremy?')).toBe(true);
    expect(supportsLookingForQuestion('What kinds of roles fit Jeremy, and why?')).toBe(true);
    expect(supportsLookingForQuestion("What's he looking for?")).toBe(true);
    expect(supportsLookingForQuestion('What roles is Jeremy targeting?')).toBe(true);
    expect(supportsLookingForQuestion('What kind of work does he want?')).toBe(true);
  });

  it('does not claim career-history or relational-fit questions', () => {
    expect(supportsLookingForQuestion("What is Jeremy's career history?")).toBe(false);
    expect(supportsLookingForQuestion('Walk me through his experience')).toBe(false);
    expect(supportsLookingForQuestion('What roles has he held?')).toBe(false);
    expect(supportsLookingForQuestion("How does Jeremy's experience fit a fintech role?")).toBe(false);
  });

  it('keeps the career matcher off the "roles fit" question that used to trigger it', () => {
    expect(supportsCareerQuestion('What roles fit Jeremy?')).toBe(false);
    expect(supportsCareerQuestion('What kinds of roles fit Jeremy, and why?')).toBe(false);
  });

  it('emits a valid v2 value collection of the three target roles at every depth', () => {
    const answer = lookingForAnswerSet();
    expect(answer.answerType).toBe('value');
    expect(answer.items.map((item) => ('value' in item ? item.value : null))).toEqual([
      'Strategic / Special Projects Lead',
      'Technical Project Manager',
      'Technical Product Manager',
    ]);
    for (const depth of ['glance', 'inspect', 'focus', 'audit'] as const) {
      expect(resolveAnswerSet(answer, { depth, audience: 'human' }).ok).toBe(true);
    }
  });
});

describe('technologies answer source', () => {
  it('routes technology questions but not unrelated or Zocdoc-scoped work questions', () => {
    expect(supportsTechnologiesQuestion('What technologies has Jeremy worked with?')).toBe(true);
    expect(supportsTechnologiesQuestion('Which languages does Jeremy know?')).toBe(true);
    expect(supportsTechnologiesQuestion("What's Jeremy's tech stack?")).toBe(true);
    expect(supportsTechnologiesQuestion('Tell me about Aroko')).toBe(false);
    expect(supportsTechnologiesQuestion('How do I contact Jeremy?')).toBe(false);
  });

  it('emits a valid v2 collection with a grounded repo link on exactly one item', () => {
    const result = resolveAnswerSet(technologiesAnswerSet(), { depth: 'audit', audience: 'human' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const repoFields = result.recipe.visibleFields
      .flatMap((item) => item.fields)
      .filter((field) => field.key === 'repo');
    expect(repoFields).toHaveLength(1);
    expect(repoFields[0].value).toBe('https://github.com/jeremycapps/corus');
  });

  it('surfaces the repo link at glance depth so the chip is reachable without expanding', () => {
    const result = resolveAnswerSet(technologiesAnswerSet(), { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const hasRepoAtGlance = result.recipe.visibleFields
      .flatMap((item) => item.fields)
      .some((field) => field.key === 'repo');
    expect(hasRepoAtGlance).toBe(true);
  });
});

describe('resolvePortfolioAnswer routes questions to the right card', () => {
  it('sends each modelled question to its deterministic card', () => {
    expect(cardFor('What did Jeremy build at Zocdoc?').trace?.kind).toBe('direct');
    const cases: Array<[string, string]> = [
      ['What did Jeremy build at Zocdoc?', 'portfolio.zocdoc-work.v1'],
      ['What technologies has Jeremy worked with?', 'portfolio.technologies.v1'],
      ['What kinds of roles fit Jeremy, and why?', 'portfolio.looking-for.v1'],
      ["What is Jeremy's career history?", 'portfolio.career-history.v1'],
    ];
    for (const [question, traceId] of cases) {
      const trace = cardFor(question).trace;
      expect(trace?.kind).toBe('direct');
      if (trace?.kind !== 'direct') return;
      expect(trace.id).toBe(traceId);
    }
  });

  it('answers a two-pole question as a verdict, and never with the career timeline', () => {
    for (const t of verdictTensions()) {
      const answer = cardFor(t.question);
      expect(answer.answerType).toBe('verdict');
      expect(answer.question).toBe(t.question);
    }
  });

  it('returns null for a synthesis or unrelated question so the caller uses prose', () => {
    expect(resolvePortfolioAnswer("What is the throughline of Jeremy's work?")).toBeNull();
    expect(resolvePortfolioAnswer('How do I contact Jeremy?')).toBeNull();
    expect(resolvePortfolioAnswer("How would Jeremy's experience apply to a fintech?")).toBeNull();
  });
});
