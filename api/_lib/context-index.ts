import type { DuckDBConnection } from '@duckdb/node-api';

export type ContextQueryKind = 'catalog' | 'prose' | 'code';
export type ContextExpansion = 'none' | 'neighbors' | 'exchange';

export interface ContextQuery {
  term: string;
  kind: ContextQueryKind;
  expansion?: ContextExpansion;
  limit?: number;
}

export interface ContextRow {
  recordType: 'TOPIC' | 'CODE';
  id: string;
  fileId: string;
  exchangeId: string;
  exchangeOrdinal: number;
  rowOrdinal: number;
  project: string;
  date: string;
  filePath: string;
  startLine: number;
  endLine: number;
  roles: string[];
  headings: string[];
  keywords: string[];
  preview: string;
  text: string;
}

export interface CatalogRow {
  project: string;
  fileType: string;
  date: string;
  filePath: string;
  tags: string[];
  summary: string;
}

export interface ContextQueryResult {
  results: ContextRow[] | CatalogRow[];
  trace: string[];
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  prefix: string;
  /** Bare host, no protocol — defaults to the standard per-account endpoint, but a jurisdiction-restricted bucket (e.g. EU) gets a different one from the R2 dashboard. */
  endpoint: string;
}

const DEFAULT_LIMIT = 8;
const MAX_LIMIT = 32;

export function resolveR2Config(
  env: Record<string, string | undefined> = process.env,
): R2Config | null {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucket = env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null;
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    prefix: (env.R2_PREFIX ?? 'context-index').replace(/\/+$/, ''),
    endpoint: env.R2_ENDPOINT ?? `${accountId}.r2.cloudflarestorage.com`,
  };
}

export function tableUrl(config: R2Config, table: string): string {
  return `s3://${config.bucket}/${config.prefix}/${table}.parquet`;
}

export function clampLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit) || (limit ?? 0) <= 0) return DEFAULT_LIMIT;
  return Math.min(Math.trunc(limit as number), MAX_LIMIT);
}

/** Escapes SQL LIKE metacharacters so a raw search term matches literally. */
export function likePattern(term: string): string {
  const escaped = term.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
  return `%${escaped}%`;
}

/** read_parquet()'s path argument must be a constant at bind time, so the (trusted, config-derived) URL is quoted inline; only the caller-supplied term is a bind parameter. */
function quoteLiteral(value: string): string {
  return `'${value.replaceAll("'", "''")}'`;
}

export interface BuiltQuery {
  sql: string;
  params: string[];
}

export function catalogQuery(url: string, pattern: string, limit: number): BuiltQuery {
  return {
    sql: `SELECT project, file_type AS fileType, date, file_path AS filePath, tags, summary
          FROM read_parquet(${quoteLiteral(url)})
          WHERE file_path ILIKE $1 ESCAPE '\\' OR summary ILIKE $1 ESCAPE '\\'
          LIMIT ${limit}`,
    params: [pattern],
  };
}

export function rowSearchQuery(url: string, pattern: string, limit: number): BuiltQuery {
  return {
    sql: `SELECT record_type, id, file_id, exchange_id, exchange_ordinal, row_ordinal,
                 project, date, file_path, start_line, end_line, roles, headings, keywords,
                 preview, chunk_text_json
          FROM read_parquet(${quoteLiteral(url)})
          WHERE preview ILIKE $1 ESCAPE '\\'
             OR headings ILIKE $1 ESCAPE '\\'
             OR keywords ILIKE $1 ESCAPE '\\'
             OR chunk_text_json ILIKE $1 ESCAPE '\\'
          LIMIT ${limit}`,
    params: [pattern],
  };
}

export function exchangeTopicRowsQuery(url: string, exchangeId: string): BuiltQuery {
  return {
    sql: `SELECT record_type, id, file_id, exchange_id, exchange_ordinal, row_ordinal,
                 project, date, file_path, start_line, end_line, roles, headings, keywords,
                 preview, chunk_text_json
          FROM read_parquet(${quoteLiteral(url)})
          WHERE exchange_id = $1 AND record_type = 'TOPIC'
          ORDER BY row_ordinal`,
    params: [exchangeId],
  };
}

export function exchangeAllRowsQuery(url: string, exchangeId: string): BuiltQuery {
  return {
    sql: `SELECT record_type, id, file_id, exchange_id, exchange_ordinal, row_ordinal,
                 project, date, file_path, start_line, end_line, roles, headings, keywords,
                 preview, chunk_text_json
          FROM read_parquet(${quoteLiteral(url)})
          WHERE exchange_id = $1
          ORDER BY row_ordinal`,
    params: [exchangeId],
  };
}

/** Given matched row_ordinals within one exchange's ordered TOPIC rows, selects each match plus its immediate neighbors. */
export function selectNeighborOrdinals(orderedOrdinals: number[], matchedOrdinals: number[]): Set<number> {
  const selected = new Set<number>();
  for (const matched of matchedOrdinals) {
    const index = orderedOrdinals.indexOf(matched);
    if (index === -1) continue;
    for (const neighborIndex of [index - 1, index, index + 1]) {
      if (neighborIndex >= 0 && neighborIndex < orderedOrdinals.length) {
        selected.add(orderedOrdinals[neighborIndex]);
      }
    }
  }
  return selected;
}

interface RawRow {
  record_type: string;
  id: string;
  file_id: string;
  exchange_id: string;
  exchange_ordinal: number | bigint;
  row_ordinal: number | bigint;
  project: string;
  date: string;
  file_path: string;
  start_line: number | bigint;
  end_line: number | bigint;
  roles: string;
  headings: string;
  keywords: string;
  preview: string;
  chunk_text_json: string;
}

export function mapRawRow(raw: RawRow): ContextRow {
  return {
    recordType: raw.record_type as 'TOPIC' | 'CODE',
    id: raw.id,
    fileId: raw.file_id,
    exchangeId: raw.exchange_id,
    exchangeOrdinal: Number(raw.exchange_ordinal),
    rowOrdinal: Number(raw.row_ordinal),
    project: raw.project,
    date: raw.date,
    filePath: raw.file_path,
    startLine: Number(raw.start_line),
    endLine: Number(raw.end_line),
    roles: raw.roles ? raw.roles.split(',') : [],
    headings: raw.headings ? raw.headings.split(' | ') : [],
    keywords: raw.keywords ? raw.keywords.split(',') : [],
    preview: raw.preview,
    text: JSON.parse(raw.chunk_text_json),
  };
}

async function runQuery<T>(connection: DuckDBConnection, built: BuiltQuery): Promise<T[]> {
  const prepared = await connection.prepare(built.sql);
  built.params.forEach((value, index) => prepared.bindVarchar(index + 1, value));
  const reader = await prepared.runAndReadAll();
  return reader.getRowObjectsJson() as T[];
}

export async function ensureHttpfs(connection: DuckDBConnection, config: R2Config): Promise<void> {
  await connection.run("SET extension_directory='/tmp/duckdb-extensions'");
  await connection.run('INSTALL httpfs');
  await connection.run('LOAD httpfs');
  await connection.run(`SET s3_endpoint='${config.endpoint}'`);
  await connection.run("SET s3_region='auto'");
  await connection.run("SET s3_url_style='path'");
  await connection.run(`SET s3_access_key_id=${quoteLiteral(config.accessKeyId)}`);
  await connection.run(`SET s3_secret_access_key=${quoteLiteral(config.secretAccessKey)}`);
}

export async function queryContext(
  connection: DuckDBConnection,
  config: R2Config,
  query: ContextQuery,
): Promise<ContextQueryResult> {
  const limit = clampLimit(query.limit);
  const pattern = likePattern(query.term);
  const trace: string[] = [];

  if (query.kind === 'catalog') {
    const built = catalogQuery(tableUrl(config, 'inventory'), pattern, limit);
    const rows = await runQuery<{ project: string; fileType: string; date: string; filePath: string; tags: string; summary: string }>(
      connection,
      built,
    );
    trace.push('catalog');
    return {
      trace,
      results: rows.map((row) => ({
        project: row.project,
        fileType: row.fileType,
        date: row.date,
        filePath: row.filePath,
        tags: row.tags ? row.tags.split(',') : [],
        summary: row.summary,
      })),
    };
  }

  const table = query.kind === 'prose' ? 'topic-rows' : 'code-rows';
  const url = tableUrl(config, table);
  const matches = await runQuery<RawRow>(connection, rowSearchQuery(url, pattern, limit));
  trace.push(query.kind === 'prose' ? 'topic' : 'code');

  const expansion = query.expansion ?? 'none';
  if (expansion === 'none' || matches.length === 0) {
    return { trace, results: matches.map(mapRawRow) };
  }

  const allRowsUrl = tableUrl(config, 'all-rows');
  const byExchange = new Map<string, number[]>();
  for (const match of matches) {
    const ordinals = byExchange.get(match.exchange_id) ?? [];
    ordinals.push(Number(match.row_ordinal));
    byExchange.set(match.exchange_id, ordinals);
  }

  const selectedRaw = new Map<string, RawRow>();
  for (const match of matches) selectedRaw.set(match.id, match);

  if (expansion === 'exchange') {
    trace.push('exchange');
    for (const exchangeId of byExchange.keys()) {
      const rows = await runQuery<RawRow>(connection, exchangeAllRowsQuery(allRowsUrl, exchangeId));
      for (const row of rows) selectedRaw.set(row.id, row);
    }
  } else {
    trace.push('neighbors');
    for (const [exchangeId, matchedOrdinals] of byExchange) {
      const rows = await runQuery<RawRow>(connection, exchangeTopicRowsQuery(allRowsUrl, exchangeId));
      const orderedOrdinals = rows.map((row) => Number(row.row_ordinal));
      const selectedOrdinals = selectNeighborOrdinals(orderedOrdinals, matchedOrdinals);
      for (const row of rows) {
        if (selectedOrdinals.has(Number(row.row_ordinal))) selectedRaw.set(row.id, row);
      }
    }
  }

  return {
    trace,
    results: [...selectedRaw.values()]
      .sort((left, right) => Number(left.row_ordinal) - Number(right.row_ordinal))
      .map(mapRawRow),
  };
}
