import { ANSWER_SET_SCHEMA_PIN, resolveAnswerSet } from '@facia/core';
import { afterEach, describe, it, expect, vi } from 'vitest';
import { answerPortfolioQuestion } from '../../api/_lib/portfolio-answer-source';
import { compactMessageText, readTextStream, sendChat } from './chat';

function resolvedRecipes(question: string) {
  const answer = answerPortfolioQuestion(question);
  const glance = resolveAnswerSet(answer, { depth: 'glance' });
  const inspect = resolveAnswerSet(answer, { depth: 'inspect' });
  const focus = resolveAnswerSet(answer, { depth: 'focus' });
  const audit = resolveAnswerSet(answer, { depth: 'audit' });
  if (!glance.ok || !inspect.ok || !focus.ok || !audit.ok) {
    throw new Error('Expected the portfolio answer to resolve at every depth.');
  }
  return {
    glance: glance.recipe,
    inspect: inspect.recipe,
    focus: focus.recipe,
    audit: audit.recipe,
  };
}

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
    const recipesByDepth = resolvedRecipes('What did Jeremy do at Zocdoc?');
    const text = compactMessageText({
      role: 'assistant',
      content: {
        kind: 'facia',
        question: 'What did Jeremy do at Zocdoc?',
        answer: {
          protocol: 'portfolio.answer/1',
          schemaPin: ANSWER_SET_SCHEMA_PIN,
          recipe: recipesByDepth.glance,
          recipesByDepth,
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
    const recipesByDepth = resolvedRecipes('What did Jeremy do at Zocdoc?');
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
            recipe: recipesByDepth.glance,
            recipesByDepth,
          },
        },
      },
      { role: 'user', content: 'Tell me more.' },
    ], { onDelta: () => undefined });

    expect(requestBody.messages[1].content).toContain('Structured answer to:');
    expect(requestBody.messages[1].content).not.toContain('patternReasonCode');
    expect(requestBody.messages[1].content).not.toContain('schemaPin');
  });
});
