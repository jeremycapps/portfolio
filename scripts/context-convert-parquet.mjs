#!/usr/bin/env node
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { DuckDBInstance } from '@duckdb/node-api';

const topicArg = process.argv.find((argument) => argument.startsWith('--topic-index-dir='));
const normalizedArg = process.argv.find((argument) => argument.startsWith('--normalized-dir='));
const outputArg = process.argv.find((argument) => argument.startsWith('--output-dir='));
if (!topicArg || !normalizedArg || !outputArg) {
  throw new Error(
    'usage: context-convert-parquet.mjs --topic-index-dir=<dir> --normalized-dir=<dir> --output-dir=<dir>',
  );
}
const topicIndexDir = path.resolve(topicArg.slice('--topic-index-dir='.length));
const normalizedDir = path.resolve(normalizedArg.slice('--normalized-dir='.length));
const outputDir = path.resolve(outputArg.slice('--output-dir='.length));
mkdirSync(outputDir, { recursive: true });

const rowColumns = `
  record_type, id, file_id, exchange_id,
  CAST(exchange_ordinal AS INTEGER) AS exchange_ordinal,
  CAST(row_ordinal AS INTEGER) AS row_ordinal,
  project, date, file_path,
  CAST(start_line AS INTEGER) AS start_line,
  CAST(end_line AS INTEGER) AS end_line,
  roles, headings, keywords, preview, chunk_text_json
`;
const exchangeColumns = `
  record_type, id, file_id,
  CAST(exchange_ordinal AS INTEGER) AS exchange_ordinal,
  project, date, file_path,
  CAST(start_line AS INTEGER) AS start_line,
  CAST(end_line AS INTEGER) AS end_line,
  prompt
`;
const inventoryColumns = `project, file_type, date, file_path, tags, summary`;

function readTsv(file) {
  return `read_csv(${quote(file)}, delim='\t', header=true, quote='', escape='', all_varchar=true)`;
}
function quote(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

const conversions = [
  { source: path.join(topicIndexDir, 'topic-rows.tsv'), target: path.join(outputDir, 'topic-rows.parquet'), columns: rowColumns },
  { source: path.join(topicIndexDir, 'code-rows.tsv'), target: path.join(outputDir, 'code-rows.parquet'), columns: rowColumns },
  { source: path.join(topicIndexDir, 'all-rows.tsv'), target: path.join(outputDir, 'all-rows.parquet'), columns: rowColumns },
  { source: path.join(topicIndexDir, 'exchanges.tsv'), target: path.join(outputDir, 'exchanges.parquet'), columns: exchangeColumns },
  { source: path.join(normalizedDir, 'inventory.tsv'), target: path.join(outputDir, 'inventory.parquet'), columns: inventoryColumns },
];

const instance = await DuckDBInstance.create(':memory:');
const connection = await instance.connect();
const report = [];
for (const { source, target, columns } of conversions) {
  await connection.run(
    `COPY (SELECT ${columns} FROM ${readTsv(source)}) TO ${quote(target)} (FORMAT PARQUET)`,
  );
  const countReader = await connection.runAndReadAll(
    `SELECT count(*) AS rows FROM read_parquet(${quote(target)})`,
  );
  const [{ rows }] = countReader.getRowObjectsJson();
  report.push({ source, target, rows: Number(rows) });
}
connection.closeSync();

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
