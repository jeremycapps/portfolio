#!/usr/bin/env node
import { createReadStream, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const inputArg = process.argv.find((argument) => argument.startsWith('--input-dir='));
const inputDir = path.resolve(inputArg?.slice('--input-dir='.length) ?? '.context-index/parquet');
const prefix = (process.argv.find((argument) => argument.startsWith('--prefix='))?.slice('--prefix='.length)
  ?? process.env.R2_PREFIX
  ?? 'context-index').replace(/\/+$/, '');

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

const endpointHost = process.env.R2_ENDPOINT ?? `${accountId}.r2.cloudflarestorage.com`;
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${endpointHost}`,
  credentials: { accessKeyId, secretAccessKey },
});

const contentTypes = new Map([
  ['.parquet', 'application/vnd.apache.parquet'],
  ['.duckdb', 'application/octet-stream'],
]);
const files = readdirSync(inputDir).filter((name) => contentTypes.has(path.extname(name)));
if (!files.length) throw new Error(`no supported .parquet or .duckdb files found in ${inputDir}`);

const report = [];
for (const name of files) {
  const filePath = path.join(inputDir, name);
  const key = `${prefix}/${name}`;
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: createReadStream(filePath),
    ContentLength: statSync(filePath).size,
    ContentType: contentTypes.get(path.extname(name)),
  }));
  report.push({ key, bytes: statSync(filePath).size });
}

process.stdout.write(`${JSON.stringify({ bucket, prefix, uploaded: report }, null, 2)}\n`);
