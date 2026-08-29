import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateStructuredPortfolioAnswer } from './structured-provider';

afterEach(() => vi.unstubAllEnvs());

describe('generateStructuredPortfolioAnswer', () => {
  it('places bounded conversation history before the current question', async () => {
    vi.stubEnv('OPENROUTER_API_KEY', 'test-key');
    let requestBody: { messages?: Array<{ role: string; content: string }> } | undefined;
    const fetchImpl: typeof fetch = vi.fn(async (_url, init) => {
      requestBody = JSON.parse(String(init?.body));
      return Response.json({
        choices: [{
          message: {
            content: JSON.stringify({
              schema: 'portfolio.model-answer/1',
              refusal: null,
              items: [{
                title: 'Month not specified',
                contribution: 'Only the year is grounded.',
                outcome: null,
                scope: null,
                evidenceRefs: ['profile.libera'],
              }],
            }),
          },
        }],
      });
    });
    const history = [
      { role: 'user' as const, content: 'When did he start working on Libera?' },
      { role: 'assistant' as const, content: '2026.' },
    ];

    await generateStructuredPortfolioAnswer(
      'What month?',
      { fetchImpl },
      history,
    );

    expect(requestBody?.messages?.slice(-3)).toEqual([
      ...history,
      { role: 'user', content: 'What month?' },
    ]);
  });
});
