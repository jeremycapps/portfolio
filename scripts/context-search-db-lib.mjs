import { existsSync, mkdirSync, statSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { DuckDBInstance } from '@duckdb/node-api';

export function sqlQuote(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

export async function buildSearchDatabase({
  allRowsSource,
  inventorySource,
  outputFile,
  configureConnection,
}) {
  if (existsSync(outputFile)) throw new Error(`refusing to overwrite existing output: ${outputFile}`);
  mkdirSync(path.dirname(outputFile), { recursive: true });

  let connection;
  let failure;
  let report;
  try {
    const instance = await DuckDBInstance.create(outputFile);
    connection = await instance.connect();
    await connection.run(`SET home_directory=${sqlQuote(path.dirname(outputFile))}`);
    await connection.run(`SET extension_directory=${sqlQuote(path.join(path.dirname(outputFile), 'extensions'))}`);
    await configureConnection?.(connection);
    await connection.run('INSTALL fts');
    await connection.run('LOAD fts');
    await connection.run(`
      CREATE TABLE search_rows AS
      SELECT * FROM read_parquet(${sqlQuote(allRowsSource)})
    `);
    await connection.run(`
      CREATE TABLE catalog_rows AS
      SELECT row_number() OVER ()::VARCHAR AS catalog_id, *
      FROM read_parquet(${sqlQuote(inventorySource)})
    `);
    await connection.run('CREATE INDEX search_rows_exchange_idx ON search_rows(exchange_id)');
    await connection.run(`
      PRAGMA create_fts_index(
        'search_rows', 'id', 'preview', 'headings', 'keywords', 'chunk_text_json',
        stemmer='porter', stopwords='english', overwrite=1
      )
    `);
    await connection.run(`
      PRAGMA create_fts_index(
        'catalog_rows', 'catalog_id', 'file_path', 'summary', 'tags',
        stemmer='porter', stopwords='english', overwrite=1
      )
    `);
    await connection.run(`
      CREATE TABLE index_metadata AS
      SELECT
        'portfolio.context-index-db/1'::VARCHAR AS protocol,
        current_timestamp AS built_at,
        (SELECT count(*) FROM search_rows)::BIGINT AS search_rows,
        (SELECT count(*) FROM catalog_rows)::BIGINT AS catalog_rows
    `);
    await connection.run('ANALYZE');
    await connection.run('CHECKPOINT');

    const metadata = await connection.runAndReadAll('SELECT * FROM index_metadata');
    const [row] = metadata.getRowObjectsJson();
    report = {
      outputFile,
      bytes: statSync(outputFile).size,
      protocol: row.protocol,
      builtAt: row.built_at,
      searchRows: Number(row.search_rows),
      catalogRows: Number(row.catalog_rows),
    };
  } catch (error) {
    failure = error;
  } finally {
    connection?.closeSync();
  }
  if (failure) {
    for (const generated of [outputFile, `${outputFile}.wal`]) {
      if (existsSync(generated)) unlinkSync(generated);
    }
    throw failure;
  }
  return report;
}
