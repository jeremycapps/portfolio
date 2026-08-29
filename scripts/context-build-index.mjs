#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const snapshotArg = process.argv.find((argument) => argument.startsWith('--snapshot-dir='));
const outputArg = process.argv.find((argument) => argument.startsWith('--output-dir='));
const maximumLinesArg = process.argv.find((argument) => argument.startsWith('--max-lines='));
if (!snapshotArg || !outputArg) throw new Error('usage: context-build-index.mjs --snapshot-dir=<snapshot> --output-dir=<new-directory> [--max-lines=100]');
const snapshotDir = path.resolve(snapshotArg.slice('--snapshot-dir='.length));
const outputDir = path.resolve(outputArg.slice('--output-dir='.length));
const maximumLines = Number(maximumLinesArg?.slice('--max-lines='.length) ?? 100);
if (!Number.isSafeInteger(maximumLines) || maximumLines < 20) throw new Error('max-lines must be an integer of at least 20');
mkdirSync(outputDir, { recursive: false });

const manifest = JSON.parse(readFileSync(path.join(snapshotDir, 'manifest.json'), 'utf8')).records;
const transcripts = manifest.filter((record) => record.sourceType === 'transcript');
const roleHeading = /^## (USER|HUMAN|ASSISTANT|UNKNOWN)$/;
const anyHeading = /^#{1,6}\s+(.+)/;
const topicHeading = /^#{2,4}\s+(.+)/;
const fence = /^\s*(```|~~~)/;
const hash = (value) => createHash('sha256').update(value).digest('hex');
const sanitize = (value) => String(value ?? '').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
const stopwords = new Set([
  'about', 'after', 'again', 'against', 'also', 'another', 'because', 'been', 'before', 'being', 'between',
  'both', 'but', 'can', 'cannot', 'could', 'did', 'does', 'doing', 'done', 'each', 'either', 'else', 'even',
  'every', 'first', 'for', 'from', 'get', 'gets', 'getting', 'give', 'given', 'had', 'has', 'have', 'having',
  'here', 'how', 'into', 'its', 'itself', 'just', 'like', 'make', 'more', 'most', 'much', 'must', 'need', 'needs',
  'not', 'now', 'only', 'other', 'our', 'out', 'over', 'same', 'should', 'some', 'such', 'than', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'through', 'too', 'under', 'until', 'use', 'used',
  'uses', 'using', 'very', 'want', 'was', 'way', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'why',
  'will', 'with', 'within', 'without', 'would', 'you', 'your', 'yours'
]);

function splitRange(lines, start, end) {
  const ranges = [];
  let cursor = start;
  while (cursor <= end) {
    if (end - cursor + 1 <= maximumLines) {
      ranges.push([cursor, end]);
      break;
    }
    const hardEnd = cursor + maximumLines - 1;
    let boundary = hardEnd;
    for (let candidate = hardEnd; candidate >= cursor + Math.floor(maximumLines * 0.65); candidate -= 1) {
      if (/^\s*$/.test(lines[candidate] ?? '') || anyHeading.test(lines[candidate] ?? '')) {
        boundary = candidate;
        break;
      }
    }
    ranges.push([cursor, boundary]);
    cursor = boundary + 1;
  }
  return ranges;
}

function exchangeRanges(lines) {
  const starts = [];
  lines.forEach((line, index) => {
    if (/^## (USER|HUMAN)$/.test(line)) starts.push(index);
  });
  if (!starts.length) return [[0, lines.length - 1]];
  const ranges = [];
  if (starts[0] > 0) ranges.push([0, starts[0] - 1]);
  starts.forEach((start, index) => ranges.push([start, (starts[index + 1] ?? lines.length) - 1]));
  return ranges;
}

function classifyAtomicSegments(lines, start, end) {
  const segments = [];
  let proseStart = start;
  const pushProse = (proseEnd) => {
    if (proseStart > proseEnd) return;
    for (const [pieceStart, pieceEnd] of splitRange(lines, proseStart, proseEnd)) segments.push({ type: 'TOPIC', start: pieceStart, end: pieceEnd });
  };
  let cursor = start;
  while (cursor <= end) {
    const fenceMatch = lines[cursor]?.match(fence);
    if (fenceMatch) {
      pushProse(cursor - 1);
      const marker = fenceMatch[1];
      let codeEnd = cursor + 1;
      while (codeEnd <= end && !new RegExp(`^\\s*${marker}`).test(lines[codeEnd] ?? '')) codeEnd += 1;
      if (codeEnd > end) codeEnd = end;
      for (const [pieceStart, pieceEnd] of splitRange(lines, cursor, codeEnd)) segments.push({ type: 'CODE', start: pieceStart, end: pieceEnd });
      cursor = codeEnd + 1;
      proseStart = cursor;
      continue;
    }
    const heading = lines[cursor]?.match(topicHeading);
    if (cursor > proseStart && heading) {
      pushProse(cursor - 1);
      proseStart = cursor;
    }
    cursor += 1;
  }
  pushProse(end);
  return segments;
}

function headingCount(lines, segment) {
  return lines.slice(segment.start, segment.end + 1).filter((line) => topicHeading.test(line) && !roleHeading.test(line)).length;
}

function mergeShortProse(lines, segments) {
  const merged = [];
  for (const segment of segments) {
    const previous = merged.at(-1);
    const previousLength = previous ? previous.end - previous.start + 1 : 0;
    const currentLength = segment.end - segment.start + 1;
    const canMerge = previous
      && previous.type === 'TOPIC'
      && segment.type === 'TOPIC'
      && previous.end + 1 === segment.start
      && currentLength + previousLength <= maximumLines
      && (previousLength < 20 || currentLength < 20)
      && headingCount(lines, previous) + headingCount(lines, segment) <= 2;
    if (canMerge) previous.end = segment.end;
    else merged.push({ ...segment });
  }
  return merged;
}

function tokens(text) {
  return (text.toLowerCase().match(/[a-z][a-z0-9_-]{2,}/g) ?? []).filter((token) => !stopwords.has(token) && !/^\d+$/.test(token));
}

const rows = [];
const exchangeRows = [];
for (const record of transcripts) {
  const sourceFile = path.join(snapshotDir, 'corpus', ...record.visiblePath.split('/'));
  const content = readFileSync(sourceFile, 'utf8');
  const lines = content.split('\n');
  const fileId = `f_${hash(record.visiblePath).slice(0, 20)}`;
  for (const [exchangeIndex, [exchangeStart, exchangeEnd]] of exchangeRanges(lines).entries()) {
    const exchangeOrdinal = exchangeIndex + 1;
    const exchangeId = `e_${hash(`${record.visiblePath}\0${exchangeStart + 1}\0${exchangeEnd + 1}`).slice(0, 20)}`;
    const exchangeText = lines.slice(exchangeStart, exchangeEnd + 1).join('\n');
    const prompt = lines.slice(exchangeStart, Math.min(exchangeEnd + 1, exchangeStart + 20)).filter((line) => line.trim() && !roleHeading.test(line)).join(' ').slice(0, 500);
    exchangeRows.push({ exchangeId, fileId, exchangeOrdinal, project: record.project, date: record.date, filePath: record.visiblePath, start: exchangeStart, end: exchangeEnd, prompt });
    const segments = mergeShortProse(lines, classifyAtomicSegments(lines, exchangeStart, exchangeEnd));
    segments.forEach((segment, rowIndex) => {
      const text = lines.slice(segment.start, segment.end + 1).join('\n');
      const headings = lines.slice(segment.start, segment.end + 1)
        .map((line) => line.match(anyHeading)?.[1])
        .filter((heading) => heading && !/^(USER|HUMAN|ASSISTANT|UNKNOWN)$/.test(heading));
      const roles = [...new Set(lines.slice(segment.start, segment.end + 1).map((line) => line.match(roleHeading)?.[1]).filter(Boolean))];
      const preview = lines.slice(segment.start, Math.min(segment.end + 1, segment.start + 16))
        .map((line) => line.replace(/^#+\s*/, '').trim())
        .find((line) => line && !/^(USER|HUMAN|ASSISTANT|UNKNOWN)$/.test(line) && !fence.test(line))?.slice(0, 240) ?? '';
      rows.push({
        type: segment.type,
        id: `${segment.type === 'CODE' ? 'k' : 't'}_${hash(`${record.visiblePath}\0${segment.start + 1}\0${segment.end + 1}\0${text}`).slice(0, 20)}`,
        fileId,
        exchangeId,
        exchangeOrdinal,
        rowOrdinal: rowIndex + 1,
        project: record.project,
        date: record.date,
        filePath: record.visiblePath,
        start: segment.start,
        end: segment.end,
        roles,
        headings,
        prompt,
        preview,
        text
      });
    });
  }
}

const documentFrequency = new Map();
for (const row of rows) {
  const weightedText = `${row.text}\n${row.headings.join(' ')}\n${row.headings.join(' ')}\n${row.prompt}`;
  row.tokenCounts = new Map();
  for (const token of tokens(weightedText)) row.tokenCounts.set(token, (row.tokenCounts.get(token) ?? 0) + 1);
  for (const token of row.tokenCounts.keys()) documentFrequency.set(token, (documentFrequency.get(token) ?? 0) + 1);
}
for (const row of rows) {
  row.keywords = [...row.tokenCounts]
    .map(([token, count]) => [token, count * (Math.log((rows.length + 1) / ((documentFrequency.get(token) ?? 0) + 1)) + 1)])
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 14)
    .map(([token]) => token);
  delete row.tokenCounts;
}

const rowHeader = 'record_type\tid\tfile_id\texchange_id\texchange_ordinal\trow_ordinal\tproject\tdate\tfile_path\tstart_line\tend_line\troles\theadings\tkeywords\tpreview\tchunk_text_json';
const serializeRow = (row) => [row.type, row.id, row.fileId, row.exchangeId, row.exchangeOrdinal, row.rowOrdinal, row.project, row.date, row.filePath, row.start + 1, row.end + 1, row.roles.join(','), sanitize(row.headings.join(' | ')), row.keywords.join(','), sanitize(row.preview), JSON.stringify(row.text)].join('\t');
const exchangeHeader = 'record_type\tid\tfile_id\texchange_ordinal\tproject\tdate\tfile_path\tstart_line\tend_line\tprompt';
const serializeExchange = (row) => ['EXCHANGE', row.exchangeId, row.fileId, row.exchangeOrdinal, row.project, row.date, row.filePath, row.start + 1, row.end + 1, sanitize(row.prompt)].join('\t');
const topicRows = rows.filter((row) => row.type === 'TOPIC');
const codeRows = rows.filter((row) => row.type === 'CODE');
writeFileSync(path.join(outputDir, 'topic-rows.tsv'), `${rowHeader}\n${topicRows.map(serializeRow).join('\n')}\n`, { flag: 'wx' });
writeFileSync(path.join(outputDir, 'code-rows.tsv'), `${rowHeader}\n${codeRows.map(serializeRow).join('\n')}\n`, { flag: 'wx' });
writeFileSync(path.join(outputDir, 'all-rows.tsv'), `${rowHeader}\n${rows.map(serializeRow).join('\n')}\n`, { flag: 'wx' });
writeFileSync(path.join(outputDir, 'exchanges.tsv'), `${exchangeHeader}\n${exchangeRows.map(serializeExchange).join('\n')}\n`, { flag: 'wx' });

const lengths = (selected) => selected.map((row) => row.end - row.start + 1).sort((left, right) => left - right);
const percentile = (values, fraction) => values[Math.min(values.length - 1, Math.ceil(values.length * fraction) - 1)] ?? 0;
const stats = {
  algorithm: 'exchange-parented heading-aware prose rows plus separately linked fenced-code rows',
  maximumLines,
  transcriptFiles: transcripts.length,
  exchanges: exchangeRows.length,
  rows: rows.length,
  topicRows: topicRows.length,
  codeRows: codeRows.length,
  topicLines: { median: percentile(lengths(topicRows), 0.5), p95: percentile(lengths(topicRows), 0.95), maximum: percentile(lengths(topicRows), 1) },
  codeLines: { median: percentile(lengths(codeRows), 0.5), p95: percentile(lengths(codeRows), 0.95), maximum: percentile(lengths(codeRows), 1) },
  bytes: {
    topicRows: statSync(path.join(outputDir, 'topic-rows.tsv')).size,
    codeRows: statSync(path.join(outputDir, 'code-rows.tsv')).size,
    allRows: statSync(path.join(outputDir, 'all-rows.tsv')).size,
    exchanges: statSync(path.join(outputDir, 'exchanges.tsv')).size
  }
};
writeFileSync(path.join(outputDir, 'stats.json'), `${JSON.stringify(stats, null, 2)}\n`, { flag: 'wx' });
process.stdout.write(`${JSON.stringify(stats, null, 2)}\n`);
