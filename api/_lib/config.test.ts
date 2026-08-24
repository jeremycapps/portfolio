import { describe, expect, it } from 'vitest';
import { answerSystemPrompt, getConfig, systemPrompt } from './config';

describe('getConfig', () => {
  it('bounds output tokens by default', () => {
    expect(getConfig({}).maxOutputTokens).toBe(400);
  });

  it('accepts a positive output-token override', () => {
    expect(getConfig({ CHAT_MAX_OUTPUT_TOKENS: '250' }).maxOutputTokens).toBe(250);
  });

  it('rejects invalid output-token overrides', () => {
    expect(getConfig({ CHAT_MAX_OUTPUT_TOKENS: '0' }).maxOutputTokens).toBe(400);
    expect(getConfig({ CHAT_MAX_OUTPUT_TOKENS: 'nope' }).maxOutputTokens).toBe(400);
    expect(getConfig({ CHAT_MAX_OUTPUT_TOKENS: '10.5' }).maxOutputTokens).toBe(400);
  });

  it('bounds answer completion time and accepts a positive override', () => {
    expect(getConfig({}).answerTimeoutMs).toBe(15_000);
    expect(getConfig({ ANSWER_TIMEOUT_MS: '2500' }).answerTimeoutMs).toBe(2500);
    expect(getConfig({ ANSWER_TIMEOUT_MS: '0' }).answerTimeoutMs).toBe(15_000);
  });

  it('adds a Markdown-only contract without changing the shared raw-chat prompt', () => {
    expect(answerSystemPrompt()).toContain('Return only the completed reader-facing answer in Markdown');
    expect(answerSystemPrompt()).toContain('Do not emit raw HTML');
    expect(systemPrompt()).not.toContain('## Answer format');
  });
});
