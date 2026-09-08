/**
 * Source-integrity audit for the StratOS case docs.
 *
 * Every quantitative claim in a case doc is only as good as the source id
 * attached to it. A fabricated id (`bigeye`, removed in 78e175c) or an
 * unconfirmed URL placeholder both read as evidence and are not.
 *
 * Two objective rules, both enforced:
 *   1. Every source id cited by a fact resolves to a row in that doc's
 *      sources table.
 *   2. Every source row carries a real http(s) URL — no "confirm exact URL".
 *
 * The live TS cases (`src/lib/stratos/cases/*.ts`) are covered by
 * `render-sources.test.ts`; this covers the hand-written markdown layer,
 * which had no checks at all.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface SourceEntry {
  id: string;
  kind: string;
  url: string;
  line: number;
}

export interface FactReference {
  id: string;
  line: number;
}

export interface DocAudit {
  file: string;
  sources: SourceEntry[];
  references: FactReference[];
  /** Cited source ids with no matching row in the sources table. */
  unresolved: FactReference[];
  /** Source rows whose URL cell is a placeholder rather than a link. */
  placeholderUrls: SourceEntry[];
}

const TAG = /\*\*(?:OBSERVED|ESTIMATED|FOG|HINDSIGHT)\*\*/;
const NOT_A_SOURCE = new Set(['', '-', '—', '–', 'n/a', 'source']);

function cells(line: string): string[] {
  return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
}

function bare(token: string): string {
  return token.replace(/[`*]/g, '').trim();
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith('|');
}

function isSeparatorRow(line: string): boolean {
  return /^\|[\s:|-]+\|?$/.test(line.trim());
}

/** A sources table is identified by its header: first cell `id`, last cell `url`. */
function isSourcesHeader(row: string[]): boolean {
  return row.length >= 3 && bare(row[0]).toLowerCase() === 'id' && bare(row[row.length - 1]).toLowerCase() === 'url';
}

/** A facts table is identified by its header ending in `source`. */
function isFactsHeader(row: string[]): boolean {
  return row.length >= 2 && bare(row[row.length - 1]).toLowerCase() === 'source';
}

function splitReferences(cell: string): string[] {
  return cell
    .split(/[/,+]| or /)
    .map(bare)
    .filter((token) => token.length > 0 && !NOT_A_SOURCE.has(token.toLowerCase()));
}

export function auditDoc(file: string, contents: string): DocAudit {
  const lines = contents.split('\n');
  const sources: SourceEntry[] = [];
  const references: FactReference[] = [];

  let mode: 'sources' | 'facts' | null = null;

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (!isTableRow(line)) {
      // Bullet-style facts (the archived docs): `… **OBSERVED** · `source-id``
      if (TAG.test(line)) {
        const after = line.split(TAG)[1] ?? '';
        for (const match of after.matchAll(/`([^`]+)`/g)) {
          const id = bare(match[1]);
          if (!NOT_A_SOURCE.has(id.toLowerCase())) references.push({ id, line: lineNumber });
        }
      }
      mode = null;
      return;
    }

    const row = cells(line);
    if (isSourcesHeader(row)) {
      mode = 'sources';
      return;
    }
    if (isFactsHeader(row)) {
      mode = 'facts';
      return;
    }
    if (isSeparatorRow(line)) return;

    if (mode === 'sources') {
      sources.push({
        id: bare(row[0]),
        kind: row.length >= 4 ? bare(row[row.length - 3]) : '',
        url: row[row.length - 1],
        line: lineNumber,
      });
    } else if (mode === 'facts') {
      for (const id of splitReferences(row[row.length - 1])) {
        references.push({ id, line: lineNumber });
      }
    }
  });

  // With no sources table there is nothing to resolve against, and the file is
  // not a case doc — see auditCaseDocs. Reporting every citation as unresolved
  // there would be noise, not a finding.
  const known = new Set(sources.map((source) => source.id));
  return {
    file,
    sources,
    references,
    unresolved: sources.length === 0 ? [] : references.filter((reference) => !known.has(reference.id)),
    placeholderUrls: sources.filter((source) => !/^https?:\/\//.test(source.url)),
  };
}

export function findCaseDocs(root: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) found.push(...findCaseDocs(path));
    else if (entry.endsWith('.md')) found.push(path);
  }
  return found.sort();
}

/**
 * A file counts as a case doc when it declares a sources table (`| id | … | url |`).
 * Design and spec docs also have tables with a "Source" column, meaning the code
 * path a field reads from rather than a citation — they are not audited.
 */
export function auditCaseDocs(root: string): DocAudit[] {
  return findCaseDocs(root)
    .map((file) => auditDoc(file, readFileSync(file, 'utf8')))
    .filter((audit) => audit.sources.length > 0);
}

export function formatFailures(audits: DocAudit[]): string[] {
  const failures: string[] = [];
  for (const audit of audits) {
    for (const reference of audit.unresolved) {
      failures.push(`${audit.file}:${reference.line} cites source \`${reference.id}\` — not in the sources table`);
    }
    for (const source of audit.placeholderUrls) {
      failures.push(`${audit.file}:${source.line} source \`${source.id}\` has no URL — found ${JSON.stringify(source.url)}`);
    }
  }
  return failures;
}

const invokedDirectly = process.argv[1]?.endsWith('audit-case-sources.ts');
if (invokedDirectly) {
  const audits = auditCaseDocs('docs/stratos');
  const failures = formatFailures(audits);
  const sourceCount = audits.reduce((total, audit) => total + audit.sources.length, 0);
  const referenceCount = audits.reduce((total, audit) => total + audit.references.length, 0);
  console.log(`audited ${audits.length} case doc(s): ${sourceCount} sources, ${referenceCount} citations`);
  if (failures.length === 0) {
    console.log('source integrity: ok');
  } else {
    for (const failure of failures) console.error(`  ✗ ${failure}`);
    console.error(`\n${failures.length} source-integrity failure(s)`);
    process.exitCode = 1;
  }
}
