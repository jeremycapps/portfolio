#!/usr/bin/env node
import { createReadStream, mkdtempSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { buildSearchDatabase, sqlQuote } from './context-search-db-lib.mjs';

if (process.env.CONTEXT_REINDEX_ON_BUILD !== '1') {
  process.stdout.write('context-reindex: skipped (CONTEXT_REINDEX_ON_BUILD is not 1)\n');
  process.exit(0);
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;
const missing = [
  ['R2_ACCOUNT_ID', accountId],
  ['R2_ACCESS_KEY_ID', accessKeyId],
  ['R2_SECRET_ACCESS_KEY', secretAccessKey],
  ['R2_BUCKET', bucket],
].filter(([, value]) => !value).map(([name]) => name);
if (missing.length) {
  throw new Error(`missing required environment variables: ${missing.join(', ')}`);
}

const prefix = (process.env.R2_PREFIX ?? 'context-index').replace(/\/+$/, '');
const endpoint = process.env.R2_ENDPOINT ?? `${accountId}.r2.cloudflarestorage.com`;
const buildDir = mkdtempSync(path.join(tmpdir(), 'portfolio-context-reindex-'));
const outputFile = path.join(buildDir, 'context-index.duckdb');
const objectKey = `${prefix}/context-index.duckdb`;

try {
  const report = await buildSearchDatabase({
    allRowsSource: `s3://${bucket}/${prefix}/all-rows.parquet`,
    inventorySource: `s3://${bucket}/${prefix}/inventory.parquet`,
    outputFile,
    async configureConnection(connection) {
      await connection.run('INSTALL httpfs');
      await connection.run('LOAD httpfs');
      await connection.run(`SET s3_endpoint=${sqlQuote(endpoint)}`);
      await connection.run("SET s3_region='auto'");
      await connection.run("SET s3_url_style='path'");
      await connection.run(`SET s3_access_key_id=${sqlQuote(accessKeyId)}`);
      await connection.run(`SET s3_secret_access_key=${sqlQuote(secretAccessKey)}`);
    },
  });

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${endpoint}`,
    credentials: { accessKeyId, secretAccessKey },
  });
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: objectKey,
    Body: createReadStream(outputFile),
    ContentLength: statSync(outputFile).size,
    ContentType: 'application/octet-stream',
  }));
  process.stdout.write(`${JSON.stringify({
    protocol: report.protocol,
    searchRows: report.searchRows,
    catalogRows: report.catalogRows,
    uploaded: { key: objectKey, bytes: report.bytes },
  }, null, 2)}\n`);
} finally {
  rmSync(buildDir, { recursive: true, force: true });
}
