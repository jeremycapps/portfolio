import { describe, expect, it } from 'vitest';
import { shouldSubmitOnKey } from './composer-keys';

const key = (overrides: Partial<Parameters<typeof shouldSubmitOnKey>[0]> = {}) => ({
  key: 'Enter',
  shiftKey: false,
  metaKey: false,
  ctrlKey: false,
  isComposing: false,
  ...overrides,
});

describe('shouldSubmitOnKey', () => {
  it('sends on plain Enter, the chat convention', () => {
    expect(shouldSubmitOnKey(key(), false)).toBe(true);
  });

  it('keeps Shift+Enter as a newline', () => {
    expect(shouldSubmitOnKey(key({ shiftKey: true }), false)).toBe(false);
  });

  it('still sends on Cmd/Ctrl+Enter', () => {
    expect(shouldSubmitOnKey(key({ metaKey: true }), false)).toBe(true);
    expect(shouldSubmitOnKey(key({ ctrlKey: true }), false)).toBe(true);
  });

  it('never sends mid IME composition', () => {
    expect(shouldSubmitOnKey(key({ isComposing: true }), false)).toBe(false);
  });

  it('keeps plain Enter as a newline for a multi-line job description, Cmd/Ctrl+Enter sends', () => {
    expect(shouldSubmitOnKey(key(), true)).toBe(false);
    expect(shouldSubmitOnKey(key({ metaKey: true }), true)).toBe(true);
  });

  it('ignores other keys', () => {
    expect(shouldSubmitOnKey(key({ key: 'a' }), false)).toBe(false);
  });
});
