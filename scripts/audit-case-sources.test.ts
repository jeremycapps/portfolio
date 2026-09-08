import { describe, expect, it } from 'vitest';
import { auditCaseDocs, auditDoc, formatFailures } from './audit-case-sources';

const SOURCES_TABLE = [
  '| id | title | publisher | kind | publishedAt | url |',
  '|---|---|---|---|---|---|',
  '| klarna-pr-2024 | First month | Klarna | company-release | 2024-02-27 | https://example.com/pr |',
  '| sifted-backlog | Backlog grows | Sifted | news | 2024 | https://example.com/sifted |',
].join('\n');

describe('auditDoc', () => {
  it('resolves citations from a facts table', () => {
    const audit = auditDoc(
      'case.md',
      [
        SOURCES_TABLE,
        '',
        '| fact | value | status | source |',
        '|---|---|---|---|',
        '| Conversations | 2.3M | OBSERVED | klarna-pr-2024 |',
        '| Backlog | quadrupled | OBSERVED | sifted-backlog / klarna-pr-2024 |',
      ].join('\n'),
    );

    expect(audit.sources.map((source) => source.id)).toEqual(['klarna-pr-2024', 'sifted-backlog']);
    expect(audit.references).toHaveLength(3);
    expect(audit.unresolved).toEqual([]);
  });

  it('flags a citation with no matching source row', () => {
    const audit = auditDoc(
      'case.md',
      [
        SOURCES_TABLE,
        '',
        '| fact | value | status | source |',
        '|---|---|---|---|',
        '| External agent pool | ~3,000 → ~2,300 | OBSERVED | bigeye |',
      ].join('\n'),
    );

    expect(audit.unresolved).toEqual([{ id: 'bigeye', line: 8 }]);
    expect(formatFailures([audit])[0]).toContain('cites source `bigeye`');
  });

  it('resolves citations from bullet-style facts', () => {
    const audit = auditDoc(
      'archived.md',
      [
        SOURCES_TABLE,
        '',
        '## Facts',
        '',
        '- **`oea-awards`** — "$51.4M awarded." · observedAt `2016-11` · **OBSERVED** · `ut-audit-2017`.',
      ].join('\n'),
    );

    expect(audit.unresolved.map((reference) => reference.id)).toEqual(['ut-audit-2017']);
  });

  it('flags a source whose URL is a placeholder', () => {
    const audit = auditDoc(
      'case.md',
      [
        '| id | title | publisher | kind | publishedAt | url |',
        '|---|---|---|---|---|---|',
        '| ut-audit-2017 | Special review | UT System | audit-report | 2016-11 | (confirm exact URL) |',
      ].join('\n'),
    );

    expect(audit.placeholderUrls.map((source) => source.id)).toEqual(['ut-audit-2017']);
    expect(formatFailures([audit])[0]).toContain('has no URL');
  });

  it('ignores a table whose "Source" column names a code path, not a citation', () => {
    const audit = auditDoc(
      'spec.md',
      ['| Field | Source |', '|---|---|', '| Move | `decisionRecommendation(view).move` |'].join('\n'),
    );

    expect(audit.sources).toEqual([]);
    expect(audit.unresolved).toEqual([]);
  });
});

describe('the StratOS case docs', () => {
  const audits = auditCaseDocs('docs/stratos');

  it('finds the case docs', () => {
    expect(audits.length).toBeGreaterThan(0);
    for (const audit of audits) expect(audit.references.length).toBeGreaterThan(0);
  });

  // Regression guard for the fabricated `bigeye` source removed in 78e175c.
  it('cites only sources that exist, and every source has a real URL', () => {
    expect(formatFailures(audits)).toEqual([]);
  });
});
