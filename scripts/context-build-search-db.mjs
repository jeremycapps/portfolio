#!/usr/bin/env node
import { existsSync } from 'node:fs';
import path from 'node:path';
import { buildSearchDatabase } from './context-search-db-lib.mjs';

const inputArg = process.argv.find((argument) => argument.startsWith('--input-dir='));
const outputArg = process.argv.find((argument) => argument.startsWith('--output-file='));
if (!inputArg || !outputArg) {
  throw new Error(
    'usage: context-build-search-db.mjs --input-dir=<parquet-dir> --output-file=<context-index.duckdb>',
  );
}

const inputDir = path.resolve(inputArg.slice('--input-dir='.length));
const outputFile = path.resolve(outputArg.slice('--output-file='.length));
const allRowsSource = path.join(inputDir, 'all-rows.parquet');
const inventorySource = path.join(inputDir, 'inventory.parquet');
for (const required of [allRowsSource, inventorySource]) {
  if (!existsSync(required)) throw new Error(`missing required input: ${required}`);
}

const report = await buildSearchDatabase({ allRowsSource, inventorySource, outputFile });
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
