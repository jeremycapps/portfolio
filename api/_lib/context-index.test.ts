import type { DuckDBConnection } from '@duckdb/node-api';
import { describe, expect, it, vi } from 'vitest';
import {
  catalogQuery,
  clampLimit,
  exchangeAllRowsQuery,
  exchangeTopicRowsQuery,
  ensureHttpfs,
  likePattern,
  mapRawRow,
  resolveR2Config,
  rowSearchQuery,
  selectNeighborOrdinals,
  tableUrl,
} from './context-index';

describe('ensureHttpfs', () => {
  it('sets a writable Vercel home before installing and configuring httpfs', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const connection = { run } as unknown as DuckDBConnection;

    await ensureHttpfs(connection, {
      accountId: 'account',
      accessKeyId: 'access',
      secretAccessKey: 'secret',
      bucket: 'bucket',
      prefix: 'context-index',
      endpoint: 'account.r2.cloudflarestorage.com',
    });

    expect(run.mock.calls.map(([sql]) => sql)).toEqual([
      "SET home_directory='/tmp'",
      "SET extension_directory='/tmp/duckdb-extensions'",
      'INSTALL httpfs',
      'LOAD httpfs',
      "SET s3_endpoint='account.r2.cloudflarestorage.com'",
      "SET s3_region='auto'",
      "SET s3_url_style='path'",
      "SET s3_access_key_id='access'",
      "SET s3_secret_access_key='secret'",
    ]);
  });
});

describe('resolveR2Config', () => {
  it('returns null when any required variable is missing', () => {
    expect(resolveR2Config({})).toBeNull();
    expect(
      resolveR2Config({ R2_ACCOUNT_ID: 'a', R2_ACCESS_KEY_ID: 'b', R2_SECRET_ACCESS_KEY: 'c' }),
    ).toBeNull();
  });

  it('defaults the prefix and strips trailing slashes', () => {
    const env = {
      R2_ACCOUNT_ID: 'acct',
      R2_ACCESS_KEY_ID: 'key',
      R2_SECRET_ACCESS_KEY: 'secret',
      R2_BUCKET: 'bucket',
    };
    expect(resolveR2Config(env)).toEqual({
      accountId: 'acct',
      accessKeyId: 'key',
      secretAccessKey: 'secret',
      bucket: 'bucket',
      prefix: 'context-index',
      endpoint: 'acct.r2.cloudflarestorage.com',
    });
    expect(resolveR2Config({ ...env, R2_PREFIX: 'custom/' })!.prefix).toBe('custom');
  });

  it('lets R2_ENDPOINT override the derived jurisdiction-default endpoint', () => {
    const env = {
      R2_ACCOUNT_ID: 'acct',
      R2_ACCESS_KEY_ID: 'key',
      R2_SECRET_ACCESS_KEY: 'secret',
      R2_BUCKET: 'bucket',
      R2_ENDPOINT: 'acct.eu.r2.cloudflarestorage.com',
    };
    expect(resolveR2Config(env)!.endpoint).toBe('acct.eu.r2.cloudflarestorage.com');
  });
});

describe('tableUrl', () => {
  it('builds an s3:// url from bucket, prefix, and table name', () => {
    const config = {
      accountId: 'a',
      accessKeyId: 'k',
      secretAccessKey: 's',
      bucket: 'my-bucket',
      prefix: 'ctx',
      endpoint: 'a.r2.cloudflarestorage.com',
    };
    expect(tableUrl(config, 'topic-rows')).toBe('s3://my-bucket/ctx/topic-rows.parquet');
  });
});

describe('clampLimit', () => {
  it('defaults when undefined, zero, negative, or non-finite', () => {
    expect(clampLimit(undefined)).toBe(8);
    expect(clampLimit(0)).toBe(8);
    expect(clampLimit(-5)).toBe(8);
    expect(clampLimit(Number.NaN)).toBe(8);
  });

  it('caps at the maximum and truncates fractions', () => {
    expect(clampLimit(1000)).toBe(32);
    expect(clampLimit(3.7)).toBe(3);
  });
});

describe('likePattern', () => {
  it('wraps the term and escapes LIKE metacharacters', () => {
    expect(likePattern('plain')).toBe('%plain%');
    expect(likePattern('100%_done')).toBe('%100\\%\\_done%');
    expect(likePattern('a\\b')).toBe('%a\\\\b%');
  });
});

describe('query builders', () => {
  const url = "s3://bucket/ctx/topic-rows.parquet";

  it('catalogQuery inlines the url and binds the pattern as $1', () => {
    const built = catalogQuery(url, '%term%', 8);
    expect(built.sql).toContain(`read_parquet('${url}')`);
    expect(built.sql).toContain('LIMIT 8');
    expect(built.params).toEqual(['%term%']);
  });

  it('rowSearchQuery searches preview/headings/keywords/text and binds one param', () => {
    const built = rowSearchQuery(url, '%term%', 5);
    expect(built.sql).toContain('preview ILIKE $1');
    expect(built.sql).toContain('chunk_text_json ILIKE $1');
    expect(built.params).toEqual(['%term%']);
  });

  it('exchangeTopicRowsQuery filters to TOPIC rows for one exchange, ordered', () => {
    const built = exchangeTopicRowsQuery(url, 'e_123');
    expect(built.sql).toContain("record_type = 'TOPIC'");
    expect(built.sql).toContain('ORDER BY row_ordinal');
    expect(built.params).toEqual(['e_123']);
  });

  it('exchangeAllRowsQuery does not filter by record_type', () => {
    const built = exchangeAllRowsQuery(url, 'e_123');
    expect(built.sql).not.toContain('record_type =');
    expect(built.params).toEqual(['e_123']);
  });

  it('escapes an embedded single quote in the url', () => {
    const built = catalogQuery("s3://bucket/o'brien/topic-rows.parquet", '%x%', 1);
    expect(built.sql).toContain("o''brien");
  });
});

describe('selectNeighborOrdinals', () => {
  it('selects the match plus its immediate neighbors', () => {
    expect(selectNeighborOrdinals([1, 2, 3, 4, 5], [3])).toEqual(new Set([2, 3, 4]));
  });

  it('clamps at the boundaries', () => {
    expect(selectNeighborOrdinals([1, 2, 3], [1])).toEqual(new Set([1, 2]));
    expect(selectNeighborOrdinals([1, 2, 3], [3])).toEqual(new Set([2, 3]));
  });

  it('unions neighbors across multiple matches', () => {
    expect(selectNeighborOrdinals([1, 2, 3, 4, 5], [1, 5])).toEqual(new Set([1, 2, 4, 5]));
  });

  it('ignores a matched ordinal absent from the ordered list', () => {
    expect(selectNeighborOrdinals([1, 2, 3], [99])).toEqual(new Set());
  });
});

describe('mapRawRow', () => {
  it('splits delimited fields, parses the JSON text, and numbers the rest', () => {
    const raw = {
      record_type: 'TOPIC',
      id: 't_1',
      file_id: 'f_1',
      exchange_id: 'e_1',
      exchange_ordinal: 2,
      row_ordinal: 3,
      project: 'domain',
      date: '2026-08-29',
      file_path: 'transcripts/chatgpt/x.md',
      start_line: 10,
      end_line: 20,
      roles: 'USER,ASSISTANT',
      headings: 'Intro | Details',
      keywords: 'alpha,beta',
      preview: 'a preview',
      chunk_text_json: JSON.stringify('hello\nworld'),
    };
    expect(mapRawRow(raw)).toEqual({
      recordType: 'TOPIC',
      id: 't_1',
      fileId: 'f_1',
      exchangeId: 'e_1',
      exchangeOrdinal: 2,
      rowOrdinal: 3,
      project: 'domain',
      date: '2026-08-29',
      filePath: 'transcripts/chatgpt/x.md',
      startLine: 10,
      endLine: 20,
      roles: ['USER', 'ASSISTANT'],
      headings: ['Intro', 'Details'],
      keywords: ['alpha', 'beta'],
      preview: 'a preview',
      text: 'hello\nworld',
    });
  });

  it('returns empty arrays for empty delimited fields', () => {
    const raw = {
      record_type: 'CODE',
      id: 'k_1',
      file_id: 'f_1',
      exchange_id: 'e_1',
      exchange_ordinal: 1,
      row_ordinal: 1,
      project: 'p',
      date: 'undated',
      file_path: 'x.md',
      start_line: 1,
      end_line: 1,
      roles: '',
      headings: '',
      keywords: '',
      preview: '',
      chunk_text_json: JSON.stringify(''),
    };
    expect(mapRawRow(raw).roles).toEqual([]);
    expect(mapRawRow(raw).headings).toEqual([]);
    expect(mapRawRow(raw).keywords).toEqual([]);
  });
});
