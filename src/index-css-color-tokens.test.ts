import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');

type CssBlock = {
  body: string;
  end: number;
  start: number;
};

const blockFor = (selector: string, source = css): CssBlock => {
  const marker = `${selector} {`;
  const start = source.indexOf(marker);

  expect(start, `missing CSS block for ${selector}`).toBeGreaterThanOrEqual(0);

  const openBrace = start + marker.length - 1;
  let depth = 0;

  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] !== '}') continue;

    depth -= 1;
    if (depth === 0) {
      return {
        body: source.slice(openBrace + 1, index),
        end: index + 1,
        start,
      };
    }
  }

  throw new Error(`unterminated CSS block for ${selector}`);
};

const tokenHex = (block: string, token: string) => {
  const match = block.match(new RegExp(`${token}:\\s*(#[0-9a-fA-F]{6})\\s*;`));
  expect(match, `missing solid color token ${token}`).not.toBeNull();
  return match![1];
};

const relativeLuminance = (hex: string) => {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );

  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
};

const contrastRatio = (first: string, second: string) => {
  const brightest = Math.max(relativeLuminance(first), relativeLuminance(second));
  const darkest = Math.min(relativeLuminance(first), relativeLuminance(second));
  return (brightest + 0.05) / (darkest + 0.05);
};

describe('homepage and shared-surface color tokens', () => {
  it('keeps literal colors inside the canonical light and dark token definitions', () => {
    const lightTokens = blockFor(':root');
    const darkTokens = blockFor('body:has(.composer)');
    const literalColor = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\(/;
    let offset = 0;

    const violations = css
      .split('\n')
      .map((line, index) => {
        const result = { index: index + 1, line, offset };
        offset += line.length + 1;
        return result;
      })
      .filter(({ line }) => literalColor.test(line))
      .filter(({ line, offset }) => {
        const isTokenDeclaration = /^\s*--[\w-]+\s*:/.test(line);
        const isCanonicalBlock =
          (offset >= lightTokens.start && offset < lightTokens.end) ||
          (offset >= darkTokens.start && offset < darkTokens.end);
        return !isTokenDeclaration || !isCanonicalBlock;
      })
      .map(({ index, line }) => `${index}: ${line.trim()}`);

    expect(violations).toEqual([]);
    expect(lightTokens.body).toContain(
      'Portfolio document previews retain distinct editorial palettes by role.',
    );
  });

  it.each([
    ['composer', '.composer', ['--surface-veil', '--line', '--shadow-composer']],
    ['prompt form', '.starter-field', ['--line', '--ink', '--control-bg']],
    ['start chip', '.starter-chip', ['--line', '--ink-2', '--surface-2']],
    ['chat bubble', '.chat-bubble-user', ['--ink']],
    ['conversation answer', '.conversation-answer', ['--ink-2']],
    ['conversation timeline', '.conversation-timeline-item', ['--line-strong']],
    ['résumé', '.resume-surface', ['--line', '--surface-veil', '--shadow-md']],
    ['résumé audit status', ".resume-audit li[data-engine='model'] .resume-audit-engine", ['--warn']],
    ['timeline', '.timeline-node', ['--surface', '--line-focus', '--focus-halo']],
    ['audit', '.semantic-affordance-row .semantic-audit-trigger', ['--audit', '--line']],
    ['error status', '.status-line.error', ['--danger']],
    ['success status', '.status-line.success', ['--good']],
    ['semantic answer', '.semantic-single', ['--line', '--surface-veil']],
    ['semantic evidence', '.evidence-disclosure', ['--ink-soft', '--surface-2']],
  ])('routes the %s surface through meaningful roles', (_name, selector, tokens) => {
    const block = blockFor(selector).body;

    for (const token of tokens) {
      expect(block, `${selector} should consume ${token}`).toContain(`var(${token})`);
    }
  });

  it.each([
    ['light', blockFor(':root').body],
    ['dark', blockFor('body:has(.composer)').body],
  ])('keeps readable semantic text contrast in the %s theme', (_theme, tokens) => {
    const surface = tokenHex(tokens, '--surface');

    for (const foreground of [
      '--ink',
      '--ink-2',
      '--ink-soft',
      '--faint',
      '--accent-ink',
      '--good',
      '--warn',
      '--danger',
      '--audit',
    ]) {
      expect(
        contrastRatio(tokenHex(tokens, foreground), surface),
        `${foreground} should meet WCAG AA against --surface`,
      ).toBeGreaterThanOrEqual(4.5);
    }

    expect(
      contrastRatio(tokenHex(tokens, '--control-primary-ink'), tokenHex(tokens, '--control-primary-bg')),
      '--control-primary-ink should meet WCAG AA against --control-primary-bg',
    ).toBeGreaterThanOrEqual(4.5);
  });
});
