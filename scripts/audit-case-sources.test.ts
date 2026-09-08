import { describe, expect, it } from 'vitest';
import { auditCaseDocs, auditDoc, formatFailures } from './audit-case-sources';

function factsDoc(...rows: string[]): string {
  return [SOURCES_TABLE, '', '| fact | value | status | source |', '|---|---|---|---|', ...rows].join('\n');
}

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

describe('the self-reported cap', () => {
  it('flags a quantitative OBSERVED claim resting only on a company release', () => {
    const audit = auditDoc('case.md', factsDoc('| Conversations | 2.3M | OBSERVED | klarna-pr-2024 |'));

    expect(audit.overclaimed).toHaveLength(1);
    expect(formatFailures([audit])[0]).toContain('tagged OBSERVED on self-reported sources only');
  });

  it('accepts the same claim once an independent source corroborates it', () => {
    const audit = auditDoc(
      'case.md',
      factsDoc('| Conversations | 2.3M | OBSERVED | klarna-pr-2024 / sifted-backlog |'),
    );

    expect(audit.overclaimed).toEqual([]);
  });

  it('accepts a self-reported claim tagged ESTIMATED', () => {
    const audit = auditDoc(
      'case.md',
      factsDoc('| Conversations | 2.3M | ESTIMATED (self-reported) | klarna-pr-2024 |'),
    );

    expect(audit.overclaimed).toEqual([]);
  });

  it('does not cap a qualitative claim — a release attests what the company did', () => {
    const audit = auditDoc(
      'archived.md',
      [
        SOURCES_TABLE,
        '',
        '## Facts',
        '',
        '- **`acquisition`** — "IBM agreed to acquire McD Tech Labs." · qualitative · **OBSERVED** · `klarna-pr-2024`.',
      ].join('\n'),
    );

    expect(audit.overclaimed).toEqual([]);
  });

  it('counts a quantity written in words', () => {
    const audit = auditDoc('case.md', factsDoc('| Share | two-thirds | OBSERVED | klarna-pr-2024 |'));

    expect(audit.overclaimed).toHaveLength(1);
  });
});

describe('the StratOS case docs', () => {
  const audits = auditCaseDocs('docs/stratos');

  it('finds the case docs', () => {
    expect(audits.length).toBeGreaterThan(0);
    for (const audit of audits) expect(audit.references.length).toBeGreaterThan(0);
  });

  // Regression guard for the fabricated `bigeye` source removed in 78e175c.
  it('cites only real sources, with real URLs, and no self-reported OBSERVED claims', () => {
    expect(formatFailures(audits)).toEqual([]);
  });
});
