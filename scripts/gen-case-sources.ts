// AUTO-GENERATES src/lib/stratos/cases/SOURCES.md
//
// The evidence sheet for the case library. Every claim a scorecard makes is
// traceable to one of these documents, so the list has to be complete and it
// has to be current. Hand-maintaining it guarantees neither, so it is derived
// from the profiles themselves and checked by a drift test.
//
// What the sheet adds over the profiles is the reverse index: a source shows
// which facts rest on it, and each fact says whether it is reported or derived.
// That is the view you need to audit a verdict, and it is the one the profiles
// cannot show, because they are ordered by fact rather than by document.

import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRATOS_CASE_PROFILES } from '../src/lib/stratos/cases';
import { renderCaseSources } from '../src/lib/stratos/cases/render-sources';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'src/lib/stratos/cases/SOURCES.md');

writeFileSync(out, renderCaseSources(STRATOS_CASE_PROFILES), 'utf8');

const sources = STRATOS_CASE_PROFILES.reduce((n, p) => n + p.sources.length, 0);
console.log(`Wrote ${out} — ${STRATOS_CASE_PROFILES.length} cases, ${sources} sources.`);
