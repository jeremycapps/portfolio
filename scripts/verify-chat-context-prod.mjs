#!/usr/bin/env node
const urlArg = process.argv.find((argument) => argument.startsWith('--url='));
const url = urlArg?.slice('--url='.length) ?? 'https://www.jeremycapps.com/api/chat';

const questionArg = process.argv.find((argument) => argument.startsWith('--question='));
const question = questionArg?.slice('--question='.length)
  ?? 'What did the context-index query planner decide when it has no good match?';

const response = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: question }] }),
});

const contextRetrieval = response.headers.get('x-context-retrieval');
const resultCount = Number(response.headers.get('x-context-retrieval-count') ?? '0');
const answer = await response.text();

if (contextRetrieval !== 'hit' || resultCount <= 0) {
  throw new Error(
    `expected x-context-retrieval: hit with a positive count, got "${contextRetrieval}" / ${resultCount} `
    + `(response status ${response.status}). Try a --question= that is more specific to the private corpus.`,
  );
}

process.stdout.write(`${JSON.stringify({
  url,
  question,
  contextRetrieval,
  resultCount,
  answerPreview: answer.slice(0, 300),
}, null, 2)}\n`);
