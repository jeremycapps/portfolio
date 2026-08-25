// AUTO-GENERATES src/lib/stratos/recipes.generated.ts
//
// Runs the real @facia/core resolveAnswerSet over every discriminator
// combination the instrument can reach — (kind, tension, side, depth) — in
// Node, where the validator's runtime helpers resolve. The browser then never
// runs Facia: it looks a resolved recipe up by key. A resolution failure aborts
// the build, so an un-groundable answer can never ship.

import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComponentRecipe, DisclosureDepth } from '@facia/core';
import { TENSIONS, type PlacedSide, type PoleSide } from '../src/lib/stratos/ontology';
import {
  buildOfficerAnswerSet, buildTensionAnswerSet, buildVerdictAnswerSet,
} from '../src/lib/stratos/answer-sets';

// The generated Facia validator loads its ajv runtime helpers with `require(...)`,
// which has no binding in this ESM script. Bind one before the validator loads.
// Node-only build tool: the emitted recipes carry no validator and no require, so
// the browser/edge bundles are untouched. The `@facia/core` runtime is imported
// dynamically below, after this shim is in place.
(globalThis as unknown as { require?: NodeRequire }).require ??= createRequire(import.meta.url);
const { resolveAnswerSet } = await import('@facia/core');

const DEPTHS: DisclosureDepth[] = ['glance', 'inspect', 'focus', 'audit'];
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'src/lib/stratos/recipes.generated.ts');

type DepthMap = Record<DisclosureDepth, ComponentRecipe>;
const recipes: Record<string, DepthMap> = {};
let count = 0;

function resolveAll(key: string, build: (depth: DisclosureDepth) => ComponentRecipe): void {
  const map = {} as DepthMap;
  for (const depth of DEPTHS) map[depth] = build(depth);
  recipes[key] = map;
  count += DEPTHS.length;
}

function resolved(answerSet: ReturnType<typeof buildVerdictAnswerSet>, depth: DisclosureDepth, key: string): ComponentRecipe {
  const result = resolveAnswerSet(answerSet, { depth, audience: 'human' });
  if (!result.ok) {
    console.error(`\n✗ ${key} @ ${depth} did not resolve:`);
    console.error(JSON.stringify(result, null, 2));
    throw new Error(`StratOS recipe generation failed for ${key} @ ${depth}`);
  }
  return result.recipe;
}

for (const t of TENSIONS) {
  for (const side of ['l', 'neutral', 'r'] as PoleSide[]) {
    const key = `tension:${t.id}:${side}`;
    resolveAll(key, (depth) => resolved(buildTensionAnswerSet(t, side), depth, key));
  }
  for (const side of ['l', 'r'] as PlacedSide[]) {
    const key = `officer:${t.id}:${side}`;
    resolveAll(key, (depth) => resolved(buildOfficerAnswerSet(t, side), depth, key));
  }
}
resolveAll('verdict', (depth) => resolved(buildVerdictAnswerSet(), depth, 'verdict'));

const body = `// AUTO-GENERATED from src/lib/stratos/{ontology,answer-sets}.ts by
// scripts/gen-stratos-recipes.ts. Do not edit by hand. Every recipe here was
// produced by the real @facia/core resolver at build time.
import type { ComponentRecipe, DisclosureDepth } from '@facia/core';

export type RecipeDepthMap = Record<DisclosureDepth, ComponentRecipe>;

export const STRATOS_RECIPES: Record<string, RecipeDepthMap> = ${JSON.stringify(recipes, null, 1)};
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, body, 'utf8');
console.log(`gen-stratos-recipes: wrote ${count} recipes across ${Object.keys(recipes).length} keys -> ${out}`);
