import { ANSWER_SET_SCHEMA_PIN, resolveAnswerSet } from '@facia/core';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { answerPortfolioQuestion } from '../../api/_lib/portfolio-answer-source';
import { compactMessageText, readTextStream, replaceFaciaAnswer, sendChat } from './chat';

function textStream(parts: string[]): Response {
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      const enc = new TextEncoder();
      for (const p of parts) c.enqueue(enc.encode(p));
      c.close();
    },
  });
  return new Response(body, { status: 200 });
}

describe('readTextStream', () => {
  it('invokes onDelta for each chunk and accumulates full text', async () => {
    const got: string[] = [];
    await readTextStream(textStream(['Hel', 'lo!']), (t) => got.push(t));
    expect(got.join('')).toBe('Hello!');
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('structured chat history', () => {
  it('uses compact semantic answer text without renderer metadata', () => {
    const result = resolveAnswerSet(
      answerPortfolioQuestion('What did Jeremy do at Zocdoc?'),
      { depth: 'glance' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const text = compactMessageText({
      role: 'assistant',
      content: {
        kind: 'facia',
        question: 'What did Jeremy do at Zocdoc?',
        answer: {
          protocol: 'portfolio.answer/1',
          schemaPin: ANSWER_SET_SCHEMA_PIN,
          recipe: result.recipe,
        },
      },
    });

    expect(text).toContain('Accessible design-system migration');
    expect(text).toContain('contribution:');
    expect(text).not.toContain('PATTERN_COLLECTION_LIST');
    expect(text).not.toContain('InspectionToolbar');
    expect(text).not.toContain('facia.answer-set/2');
    expect(text).not.toContain('content/profile.md');
  });

  it('sends compact structured history to later model calls', async () => {
    const result = resolveAnswerSet(
      answerPortfolioQuestion('What did Jeremy do at Zocdoc?'),
      { depth: 'glance' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    let requestBody: any;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      requestBody = JSON.parse(String(init?.body));
      return textStream(['Done']);
    }));

    await sendChat([
      { role: 'user', content: 'What did you do?' },
      {
        role: 'assistant',
        content: {
          kind: 'facia',
          question: 'What did you do?',
          answer: {
            protocol: 'portfolio.answer/1',
            schemaPin: ANSWER_SET_SCHEMA_PIN,
            recipe: result.recipe,
          },
        },
      },
      { role: 'user', content: 'Tell me more.' },
    ], { onDelta: () => undefined });

    expect(requestBody.messages[1].content).toContain('Structured answer to:');
    expect(requestBody.messages[1].content).not.toContain('patternReasonCode');
    expect(requestBody.messages[1].content).not.toContain('schemaPin');
  });

  it('replaces disclosure state only on the owning structured message', () => {
    const glance = resolveAnswerSet(
      answerPortfolioQuestion('What did Jeremy do at Zocdoc?'),
      { depth: 'glance' },
    );
    const audit = resolveAnswerSet(
      answerPortfolioQuestion('What did Jeremy do at Zocdoc?'),
      { depth: 'audit' },
    );
    expect(glance.ok && audit.ok).toBe(true);
    if (!glance.ok || !audit.ok) return;
    const answer = {
      protocol: 'portfolio.answer/1' as const,
      schemaPin: ANSWER_SET_SCHEMA_PIN,
      recipe: glance.recipe,
    };
    const messages = [
      { role: 'user' as const, content: 'Earlier turn' },
      {
        role: 'assistant' as const,
        content: { kind: 'facia' as const, question: 'First?', answer },
      },
      { role: 'assistant' as const, content: { kind: 'markdown' as const, markdown: 'Still here.' } },
      {
        role: 'assistant' as const,
        content: { kind: 'facia' as const, question: 'Second?', answer },
      },
    ];

    const updated = replaceFaciaAnswer(messages, 3, { ...answer, recipe: audit.recipe });
    expect(updated[0]).toBe(messages[0]);
    expect(updated[1]).toBe(messages[1]);
    expect(updated[2]).toBe(messages[2]);
    expect(updated[3]).not.toBe(messages[3]);
    expect(updated[3].role === 'assistant' && updated[3].content.kind === 'facia'
      ? updated[3].content.answer.recipe.context.depth
      : null).toBe('audit');
  });
});
