import { describe, expect, it } from 'vitest';
import { getConfig } from './config';

describe('getConfig', () => {
  it('bounds output tokens by default', () => {
    expect(getConfig({}).maxOutputTokens).toBe(400);
    expect(getConfig({}).structuredMaxOutputTokens).toBe(1_000);
  });

  it('accepts a positive output-token override', () => {
    expect(getConfig({ CHAT_MAX_OUTPUT_TOKENS: '250' }).maxOutputTokens).toBe(250);
    expect(getConfig({ STRUCTURED_ANSWER_MAX_OUTPUT_TOKENS: '750' }).structuredMaxOutputTokens)
      .toBe(750);
  });

  it('rejects invalid output-token overrides', () => {
    expect(getConfig({ CHAT_MAX_OUTPUT_TOKENS: '0' }).maxOutputTokens).toBe(400);
    expect(getConfig({ CHAT_MAX_OUTPUT_TOKENS: 'nope' }).maxOutputTokens).toBe(400);
    expect(getConfig({ CHAT_MAX_OUTPUT_TOKENS: '10.5' }).maxOutputTokens).toBe(400);
    expect(getConfig({ STRUCTURED_ANSWER_MAX_OUTPUT_TOKENS: '0' }).structuredMaxOutputTokens)
      .toBe(1_000);
  });
});
