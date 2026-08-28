import { resolveAnswerSet, validateAnswerSet } from '@facia/core';
import { describe, expect, it } from 'vitest';
import { CANDIDATE_TENSIONS } from './candidate-tensions';
import {
  convergenceTensions, matchTension, supportsTensionQuestion, tensionAnswerSet, verdictTensions,
} from './tension-answer-source';

describe('matching a question to a tension', () => {
  it('matches every two-pole tension to its own question', () => {
    for (const t of verdictTensions()) {
      expect(matchTension(t.question)?.id, t.question).toBe(t.id);
    }
  });

  it('splits the index the way the grammar does, not the way the evidence does', () => {
    expect(verdictTensions()).toHaveLength(9);
    // "Across his roles…" and "…can he still ship…" range over a sequence.
    expect(convergenceTensions().map((t) => t.id)).toEqual(['practice-breadth', 'output-maturity']);
  });

  it('declines a convergence question rather than answering it as a verdict', () => {
    for (const t of convergenceTensions()) {
      expect(tensionAnswerSet(t.question), t.id).toBeNull();
    }
  });

  it('matches a paraphrase that keeps the two poles', () => {
    expect(matchTension('Is he a specialist or more of a broad generalist?')?.id)
      .toBe('practice-breadth');
  });

  it('declines questions that are not two-pole', () => {
    for (const q of [
      "What is Jeremy's career history?",
      'What did Jeremy work on at Zocdoc?',
      'How can I get in touch with Jeremy?',
    ]) {
      expect(supportsTensionQuestion(q), q).toBe(false);
    }
  });
});

describe('the tension answer', () => {
  const answer = tensionAnswerSet(CANDIDATE_TENSIONS[0].question)!;

  it('is a verdict, not a value', () => {
    expect(answer.answerType).toBe('verdict');
  });

  it('is a valid AnswerSet', () => {
    expect(validateAnswerSet(answer).valid).toBe(true);
  });

  it('answers the question that was asked', () => {
    expect(answer.question).toBe(CANDIDATE_TENSIONS[0].question);
  });

  it('states the position as the verdict state', () => {
    const item = answer.items[0];
    expect(item.contract).toBe('BoundedVerdictV1');
    if (item.contract !== 'BoundedVerdictV1') return;
    expect(item.state).toBe('Generalist working under accessibility requirements');
  });

  it('carries the cited engagement and evidence ids as provenance', () => {
    const evidence = answer.items[0].evidence as { sourceRefs: string[]; status: string };
    expect(evidence.status).toBe('profile-grounded');
    expect(evidence.sourceRefs).toContain('zocdoc_design_system_migrations');
    expect(evidence.sourceRefs).toContain('profile.zocdoc');
  });

  it('resolves to a badge at glance and a detail at focus', () => {
    const glance = resolveAnswerSet(answer, { depth: 'glance' });
    const focus = resolveAnswerSet(answer, { depth: 'focus' });
    expect(glance.ok && glance.recipe.pattern).toBe('badge');
    expect(focus.ok && focus.recipe.pattern).toBe('detail');
  });

  it('every two-pole tension produces a resolvable answer at every depth', () => {
    for (const t of verdictTensions()) {
      const built = tensionAnswerSet(t.question)!;
      for (const depth of ['glance', 'inspect', 'focus', 'audit'] as const) {
        const r = resolveAnswerSet(built, { depth });
        expect(r.ok, `${t.id} @ ${depth}`).toBe(true);
      }
    }
  });

  it('never projects the corpus caution as a field — it is a model directive', () => {
    for (const q of [
      'Has Jeremy managed people, or is his leadership project-based?',
      'Does Jeremy have backend and API experience, or is he frontend-only?',
    ]) {
      expect(tensionAnswerSet(q)!.items[0].payload).not.toHaveProperty('caution');
    }
  });

  it('holds a both-placement as prose rather than a single-pole label', () => {
    const both = tensionAnswerSet('Is Jeremy currently in a hands-on engineering role or an operations role?')!;
    const payload = both.items[0].payload as Record<string, unknown>;
    expect(payload.answer).toContain('Both');
  });
});
