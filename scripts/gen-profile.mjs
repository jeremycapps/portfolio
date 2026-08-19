import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'content/profile.md');
const out = resolve(root, 'api/_lib/profile.generated.ts');

const md = readFileSync(src, 'utf8');
// JSON.stringify safely escapes backticks, backslashes, and newlines.
const body = `// AUTO-GENERATED from content/profile.md by scripts/gen-profile.mjs. Do not edit.\nexport const PROFILE = ${JSON.stringify(md)};\n`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, body, 'utf8');
console.log(`gen-profile: wrote ${out} (${md.length} chars)`);
