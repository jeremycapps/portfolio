#!/usr/bin/env node
// Upload the published evidence file (timpos/evidence/publish.py output) to R2, where
// api/_lib/evidence.ts reads it. Refuses a file that carries private source keys.
import { readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const fileArg = process.argv.find((argument) => argument.startsWith('--file='));
const file = path.resolve(fileArg?.slice('--file='.length)
  ?? path.join(os.homedir(), '.local/share/observation-evidence/published/evidence.json'));
const prefix = (process.env.EVIDENCE_PREFIX ?? 'evidence').replace(/\/+$/, '');

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

const body = readFileSync(file, 'utf8');
const doc = JSON.parse(body);
if (!Array.isArray(doc.items)) throw new Error(`${file} has no items array`);
const leaked = doc.items.filter((item) => 'source' in item).map((item) => item.id);
if (leaked.length) throw new Error(`refusing to upload: private source key on ${leaked.join(', ')}`);

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ENDPOINT ?? `${accountId}.r2.cloudflarestorage.com`}`,
  credentials: { accessKeyId, secretAccessKey },
});
const key = `${prefix}/evidence.json`;
await client.send(new PutObjectCommand({
  Bucket: bucket,
  Key: key,
  Body: body,
  ContentType: 'application/json',
}));
console.log(JSON.stringify({ uploaded: key, items: doc.items.length, generated_at: doc.generated_at }));
