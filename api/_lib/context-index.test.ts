import type { DuckDBConnection } from '@duckdb/node-api';
import { describe, expect, it, vi } from 'vitest';
import {
  catalogQuery,
  clampLimit,
  exchangeRowsBatchQuery,
  initializeSearchDatabase,
  mapRawRow,
  queryContext,
  resolveR2Config,
  rowSearchQuery,
  searchDatabaseUrl,
  selectNeighborOrdinals,
  tableUrl,
} from './context-index';

describe('initializeSearchDatabase', () => {
  it('loads the extensions once, enables caching, and attaches the persisted index', async () => {
    const run = vi.fn().mockResolvedValue(undefined);
    const runAndReadAll = vi.fn().mockResolvedValue({
      getRowObjectsJson: () => [{ protocol: 'portfolio.context-index-db/1' }],
    });
    const connection = { run, runAndReadAll } as unknown as DuckDBConnection;

    await initializeSearchDatabase(connection, {
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
      'INSTALL fts',
      'LOAD fts',
      'PRAGMA enable_object_cache',
      "SET s3_endpoint='account.r2.cloudflarestorage.com'",
      "SET s3_region='auto'",
      "SET s3_url_style='path'",
      "SET s3_access_key_id='access'",
      "SET s3_secret_access_key='secret'",
      "ATTACH 's3://bucket/context-index/context-index.duckdb' AS context_index (READ_ONLY)",
      'USE context_index',
    ]);
    expect(runAndReadAll).toHaveBeenCalledWith('SELECT protocol FROM index_metadata LIMIT 1');
  });

  it('rejects an unsupported persisted-index protocol', async () => {
    const connection = {
      run: vi.fn().mockResolvedValue(undefined),
      runAndReadAll: vi.fn().mockResolvedValue({
        getRowObjectsJson: () => [{ protocol: 'something-else' }],
      }),
    } as unknown as DuckDBConnection;
    await expect(initializeSearchDatabase(connection, {
      accountId: 'account', accessKeyId: 'access', secretAccessKey: 'secret',
      bucket: 'bucket', prefix: 'context-index', endpoint: 'endpoint',
    })).rejects.toThrow('unsupported protocol');
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
    expect(searchDatabaseUrl(config)).toBe('s3://my-bucket/ctx/context-index.duckdb');
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

describe('query builders', () => {
  it('catalogQuery uses the persisted BM25 index and binds the term as $1', () => {
    const built = catalogQuery('term', 8);
    expect(built.sql).toContain('fts_main_catalog_rows.match_bm25(catalog_id, $1)');
    expect(built.sql).toContain('LIMIT 8');
    expect(built.params).toEqual(['term']);
  });

  it('rowSearchQuery uses BM25 and filters the requested record type', () => {
    const prose = rowSearchQuery('trustable change', 'prose', 5);
    const code = rowSearchQuery('commit tree', 'code', 5);
    expect(prose.sql).toContain('fts_main_search_rows.match_bm25(id, $1)');
    expect(prose.sql).toContain("record_type = 'TOPIC'");
    expect(code.sql).toContain("record_type = 'CODE'");
    expect(prose.params).toEqual(['trustable change']);
  });

  it('batches every exchange into one parameterized expansion query', () => {
    const built = exchangeRowsBatchQuery(['e_123', 'e_456'], true);
    expect(built.sql).toContain('exchange_id IN ($1, $2)');
    expect(built.sql).toContain("record_type = 'TOPIC'");
    expect(built.params).toEqual(['e_123', 'e_456']);
    expect(exchangeRowsBatchQuery(['e_123'], false).sql).not.toContain('record_type =');
  });
});

describe('queryContext batching', () => {
  it('uses one search query and one expansion query across all matched exchanges', async () => {
    const raw = (id: string, exchangeId: string, rowOrdinal: number) => ({
      record_type: 'TOPIC', id, file_id: 'f_1', exchange_id: exchangeId,
      exchange_ordinal: 1, row_ordinal: rowOrdinal, project: 'p', date: 'undated',
      file_path: `${exchangeId}.md`, start_line: rowOrdinal, end_line: rowOrdinal,
      roles: '', headings: '', keywords: '', preview: id, chunk_text_json: JSON.stringify(id),
    });
    const resultSets = [
      [raw('match-1', 'e_1', 2), raw('match-2', 'e_2', 2)],
      [
        raw('e1-1', 'e_1', 1), raw('match-1', 'e_1', 2), raw('e1-3', 'e_1', 3),
        raw('e2-1', 'e_2', 1), raw('match-2', 'e_2', 2), raw('e2-3', 'e_2', 3),
      ],
    ];
    const prepare = vi.fn(async (_sql: string) => ({
      bindVarchar: vi.fn(),
      runAndReadAll: vi.fn(async () => ({ getRowObjectsJson: () => resultSets.shift() ?? [] })),
    }));
    const connection = { prepare } as unknown as DuckDBConnection;

    const result = await queryContext(connection, {
      accountId: 'a', accessKeyId: 'k', secretAccessKey: 's', bucket: 'b',
      prefix: 'context-index', endpoint: 'endpoint',
    }, { term: 'change model', kind: 'prose', expansion: 'neighbors' });

    expect(prepare).toHaveBeenCalledTimes(2);
    expect(prepare.mock.calls[1]?.[0]).toContain('exchange_id IN ($1, $2)');
    expect(result.results).toHaveLength(6);
    expect(result.trace).toEqual(['topic', 'neighbors']);
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
