import { describe, it, expect, beforeEach } from 'vitest';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildEvidenceBlock,
  formatEvidenceItem,
  loadEvidence,
  resetEvidenceCache,
  searchEvidence,
  type EvidenceDocument,
  type EvidenceItem,
} from './evidence';

function item(overrides: Partial<EvidenceItem>): EvidenceItem {
  return {
    id: 'ev-x',
    type: 'decision',
    subject: 'subject',
    date: '2026-09-20',
    claim: 'claim',
    quote: null,
    reviewed: false,
    current: true,
    supersedes: [],
    superseded_by: [],
    ...overrides,
  };
}

const doc: EvidenceDocument = {
  generated_at: '2026-09-25T00:00:00Z',
  count: 4,
  items: [
    item({
      id: 'ev-new', date: '2026-09-25', subject: 'Review by exception',
      claim: 'I moved from reviewing every claim to an automatic gate with a random audit sample.',
      reviewed: true, quote: 'with gated review, I can not scale it up',
      supersedes: [{ id: 'ev-old', relation: 'replaces' }],
    }),
    item({
      id: 'ev-old', date: '2026-09-24', subject: 'Human review gate',
      claim: 'Every published claim must be approved by a person first.',
      current: false, superseded_by: [{ id: 'ev-new', relation: 'replaces' }],
    }),
    item({ id: 'ev-duck', date: '2026-09-22', subject: 'DuckDB over Parquet', claim: 'I normalise all logs into Parquet and query them with DuckDB.' }),
    item({ id: 'ev-k8s', date: '2026-09-23', subject: 'Kubernetes', claim: 'I decided Kubernetes is overkill for this project.' }),
  ],
};

describe('searchEvidence', () => {
  it('returns nothing when the question shares no terms', () => {
    expect(searchEvidence(doc, 'favourite colour?')).toEqual([]);
  });

  it('brings the current position along when an earlier one matches', () => {
    const ids = searchEvidence(doc, 'Does every claim need human approval?').map((i) => i.id);
    expect(ids).toEqual(['ev-new', 'ev-old']);
  });

  it('ranks by term overlap and respects the limit', () => {
    const hits = searchEvidence(doc, 'Why DuckDB and Parquet?', 1);
    expect(hits.map((i) => i.id)).toEqual(['ev-duck']);
  });
});

describe('evidence block', () => {
  it('marks earlier and automatic items and quotes only reviewed text', () => {
    const [newer, older] = [doc.items[0], doc.items[1]];
    expect(formatEvidenceItem(newer)).toContain('current, reviewed');
    expect(formatEvidenceItem(newer)).toContain('Quote: "with gated review');
    expect(formatEvidenceItem(older)).toContain('earlier, auto (replaced by ev-new)');
    expect(formatEvidenceItem(older)).not.toContain('Quote:');
    expect(buildEvidenceBlock([newer])).toContain('lead with the current position');
  });
});

describe('loadEvidence', () => {
  beforeEach(() => resetEvidenceCache());

  it('reads EVIDENCE_FILE and caches it', async () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'evidence-'));
    const file = path.join(dir, 'evidence.json');
    writeFileSync(file, JSON.stringify(doc));
    const first = await loadEvidence({ EVIDENCE_FILE: file }, 0);
    writeFileSync(file, JSON.stringify({ ...doc, count: 0, items: [] }));
    const cached = await loadEvidence({ EVIDENCE_FILE: file }, 1000);
    expect(first?.count).toBe(4);
    expect(cached?.count).toBe(4);
  });

  it('returns null with no file and no R2 configuration', async () => {
    expect(await loadEvidence({}, 0)).toBeNull();
  });
});
