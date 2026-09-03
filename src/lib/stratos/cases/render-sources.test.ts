import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { STRATOS_CASE_PROFILES } from './index';
import { renderCaseSources } from './render-sources';

const SHEET = new URL('./SOURCES.md', import.meta.url);

describe('case evidence sheet', () => {
  it('is current with the profiles it documents', () => {
    // The sheet is checked in so it is readable on GitHub, which means it can
    // fall behind. Regenerate with `npm run gen:case-sources`.
    expect(readFileSync(SHEET, 'utf8')).toBe(renderCaseSources(STRATOS_CASE_PROFILES));
  });

  it('lists every source in the library exactly once', () => {
    const sheet = readFileSync(SHEET, 'utf8');
    for (const profile of STRATOS_CASE_PROFILES) {
      for (const source of profile.sources) {
        expect(sheet.split(`\`${source.id}\``).length - 1, `${source.id}`).toBe(1);
        expect(sheet).toContain(source.url);
      }
    }
  });

  it('gives every source its publication date, since the cutoffs turn on it', () => {
    const sheet = readFileSync(SHEET, 'utf8');
    for (const profile of STRATOS_CASE_PROFILES) {
      for (const source of profile.sources) {
        expect(sheet).toContain(`### ${source.publishedAt} · ${source.title}`);
      }
    }
  });
});
