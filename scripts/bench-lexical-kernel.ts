import { performance } from 'node:perf_hooks';
import { loadResumeCorpus, type ResumeCorpus } from '../api/_lib/resume-corpus';
import { prerank, tokenize } from '../api/_lib/resume-source';

const corpus = loadResumeCorpus();
const job = [
  'Forward deployed solutions engineer building API integrations, MCP servers,',
  'agent evaluation systems, React interfaces, and large-scale data migrations.',
].join(' ');

function legacyPrerank(query: string, source: ResumeCorpus): string[] {
  const queryTokens = new Set(tokenize(query));
  const phraseHits = (phrases: string[]) => phrases.reduce(
    (count, phrase) => count + (tokenize(phrase).some((term) => queryTokens.has(term)) ? 1 : 0),
    0,
  );
  return source.engagements.flatMap((engagement) => {
    const shared = phraseHits(engagement.themes) * 3
      + phraseHits([...engagement.roleFit.strongest, ...engagement.roleFit.secondary]) * 2;
    return engagement.bullets.map((bullet) => ({
      id: bullet.id,
      score: shared + tokenize(bullet.text).filter((term) => queryTokens.has(term)).length,
    }));
  }).map((result, index) => ({ result, index }))
    .sort((left, right) => right.result.score - left.result.score || left.index - right.index)
    .map(({ result }) => result.id);
}

function time(iterations: number, run: () => unknown): number {
  const started = performance.now();
  for (let index = 0; index < iterations; index += 1) run();
  return performance.now() - started;
}

const expected = legacyPrerank(job, corpus);
const actual = prerank(job, corpus).map((bullet) => bullet.bulletId);
if (JSON.stringify(expected) !== JSON.stringify(actual)) {
  throw new Error('The compiled kernel changed ranking semantics.');
}

const iterations = 5_000;
prerank(job, corpus); // compile/warm once; repeated assembly is the reuse case
const legacyMs = time(iterations, () => legacyPrerank(job, corpus));
const compiledMs = time(iterations, () => prerank(job, corpus));

console.log(`resume ranking · ${iterations} iterations · ${actual.length} bullets`);
console.log(`legacy retokenize : ${legacyMs.toFixed(1)} ms`);
console.log(`compiled kernel  : ${compiledMs.toFixed(1)} ms`);
console.log(`speedup          : ${(legacyMs / compiledMs).toFixed(2)}x`);
