#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const sourceArg = process.argv.find((argument) => argument.startsWith('--source-root='));
const outputArg = process.argv.find((argument) => argument.startsWith('--output-dir='));
if (!sourceArg || !outputArg) throw new Error('usage: context-normalize.mjs --source-root=<AI Chat History> --output-dir=<new-directory>');
const sourceRoot = path.resolve(sourceArg.slice('--source-root='.length));
const outputDir = path.resolve(outputArg.slice('--output-dir='.length));
mkdirSync(outputDir, { recursive: false });
const corpusDir = path.join(outputDir, 'corpus');
mkdirSync(corpusDir);

const projectPattern = /\b(domain|libera|timpos|orchestrator)\b/i;
const textualAttachmentExtensions = new Set(['csv', 'json', 'jsonl', 'log', 'md', 'toon', 'txt', 'yaml']);
const directTextExtensions = new Set(['.md', '.txt', '.yaml', '.yml', '.ipynb']);
const manifest = [];
const exclusions = [];
const usedPaths = new Set();

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const slug = (value) => String(value || 'untitled').normalize('NFKD').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80) || 'untitled';
const isoDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.valueOf()) ? date.toISOString().slice(0, 10) : 'undated';
};
const clean = (value) => String(value ?? '').replace(/\r\n?/g, '\n').replace(/\u0000/g, '').trim();
const summaryOf = (value) => clean(value).replace(/^---[\s\S]*?---\s*/, '').split(/\n+/).map((line) => line.replace(/^#+\s*/, '').trim()).find((line) => line.length >= 20)?.slice(0, 320) ?? '';
const tagsFor = (value) => [...new Set((String(value).toLowerCase().match(/[a-z][a-z0-9-]{2,}/g) ?? []).filter((token) => !['the', 'and', 'for', 'with', 'from'].includes(token)))].slice(0, 12);

function secretReason(content) {
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(content)) return 'private-key-block';
  if (/\b(?:sk|rk|pk)-(?:live|proj|test)?[-_a-zA-Z0-9]{16,}\b/.test(content)) return 'provider-token';
  if (/\b(?:api[_-]?key|secret|password|passwd|token)\s*[:=]\s*["']?(?!example|placeholder|redacted|dummy|test)[^\s"']{12,}/i.test(content)) return 'credential-assignment';
  return null;
}

function uniqueVisiblePath(relativePath) {
  const parsed = path.posix.parse(relativePath);
  let candidate = relativePath;
  let counter = 2;
  while (usedPaths.has(candidate)) candidate = path.posix.join(parsed.dir, `${parsed.name}-${counter++}${parsed.ext}`);
  usedPaths.add(candidate);
  return candidate;
}

function emit({ relativePath, content, sourcePath, sourceType, project, date, title, tags = [], summary }) {
  const normalized = `${clean(content)}\n`;
  const exclusion = secretReason(normalized);
  if (exclusion) {
    exclusions.push({ sourcePath, sourceType, reason: exclusion });
    return;
  }
  const visiblePath = uniqueVisiblePath(relativePath);
  const destination = path.join(corpusDir, ...visiblePath.split('/'));
  mkdirSync(path.dirname(destination), { recursive: true });
  writeFileSync(destination, normalized, { flag: 'wx' });
  manifest.push({
    visiblePath,
    sourcePath,
    sourceType,
    project: project || 'unclassified',
    date: date || 'undated',
    title: title || path.posix.basename(visiblePath),
    tags: [...new Set(tags.map((tag) => String(tag).toLowerCase()))],
    summary: summary || summaryOf(normalized),
    contentSha256: sha256(normalized),
    bytes: Buffer.byteLength(normalized),
  });
}

function renderTranscript({ platform, id, title, createdAt, messages, summary }) {
  const project = (title.match(projectPattern)?.[1] || summary?.match(projectPattern)?.[1] || 'multi-project').toLowerCase();
  const header = [
    '---',
    `platform: ${platform}`,
    `conversation_id: ${id}`,
    `project: ${project}`,
    `date: ${isoDate(createdAt)}`,
    `title: ${JSON.stringify(title)}`,
    '---',
    '',
    `# ${title}`,
    '',
  ];
  const rendered = messages.map((message) => `## ${message.role}\n\n${clean(message.text)}`).filter((message) => !/\n\n$/.test(message));
  return { project, content: [...header, ...rendered].join('\n\n'), summary: clean(summary) || summaryOf(rendered.join('\n')) };
}

function normalizeChatGpt() {
  const sourcePath = path.join(sourceRoot, 'ChatGPT/chat.html');
  const html = readFileSync(sourcePath, 'utf8');
  const marker = 'var jsonData = ';
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('ChatGPT jsonData payload not found');
  const jsonStart = start + marker.length;
  const lineEnd = html.indexOf('\n', jsonStart);
  const conversations = JSON.parse(html.slice(jsonStart, lineEnd).trim().replace(/;$/, ''));
  for (const conversation of conversations.filter((entry) => projectPattern.test(entry.title || ''))) {
    const chain = [];
    const seen = new Set();
    let nodeId = conversation.current_node;
    while (nodeId && !seen.has(nodeId)) {
      seen.add(nodeId);
      const node = conversation.mapping?.[nodeId];
      if (!node) break;
      if (node.message) chain.push(node.message);
      nodeId = node.parent;
    }
    chain.reverse();
    const messages = chain.flatMap((message) => {
      const role = message.author?.role;
      const parts = message.content?.parts;
      const text = Array.isArray(parts) ? parts.map((part) => typeof part === 'string' ? part : JSON.stringify(part)).join('\n') : '';
      return role && text.trim() ? [{ role: role.toUpperCase(), text }] : [];
    });
    const rendered = renderTranscript({ platform: 'chatgpt', id: conversation.id, title: conversation.title || 'Untitled', createdAt: (conversation.create_time || 0) * 1000, messages });
    emit({
      relativePath: `transcripts/chatgpt/${isoDate((conversation.create_time || 0) * 1000)}__${slug(conversation.title)}__${conversation.id}.md`,
      content: rendered.content,
      sourcePath: 'ChatGPT/chat.html',
      sourceType: 'transcript',
      project: rendered.project,
      date: isoDate((conversation.create_time || 0) * 1000),
      title: conversation.title,
      tags: tagsFor(conversation.title),
      summary: rendered.summary,
    });
  }
}

function normalizeClaude() {
  const sourcePath = path.join(sourceRoot, 'claude/conversations.json');
  const conversations = JSON.parse(readFileSync(sourcePath, 'utf8'));
  for (const conversation of conversations.filter((entry) => projectPattern.test(`${entry.name || ''} ${entry.summary || ''}`))) {
    const messages = (conversation.chat_messages ?? []).flatMap((message) => message.text?.trim() ? [{ role: message.sender?.toUpperCase() || 'UNKNOWN', text: message.text }] : []);
    const rendered = renderTranscript({ platform: 'claude', id: conversation.uuid, title: conversation.name || 'Untitled', createdAt: conversation.created_at, messages, summary: conversation.summary });
    emit({
      relativePath: `transcripts/claude/${isoDate(conversation.created_at)}__${slug(conversation.name)}__${conversation.uuid}.md`,
      content: rendered.content,
      sourcePath: 'claude/conversations.json',
      sourceType: 'transcript',
      project: rendered.project,
      date: isoDate(conversation.created_at),
      title: conversation.name,
      tags: tagsFor(`${conversation.name} ${conversation.summary}`),
      summary: rendered.summary,
    });
  }
}

const decodeHtml = (value) => value
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?\s*>/gi, '\n')
  .replace(/<\/p>|<\/div>|<\/li>|<\/h\d>/gi, '\n')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

function normalizeGemini() {
  const sourcePath = path.join(sourceRoot, 'GeminiChatHistory.html');
  const html = readFileSync(sourcePath, 'utf8');
  const blocks = html.split('<div class="outer-cell').slice(1);
  blocks.forEach((block, index) => {
    const text = decodeHtml(block);
    if (!projectPattern.test(text)) return;
    const title = summaryOf(text) || `Gemini entry ${index + 1}`;
    emit({
      relativePath: `transcripts/gemini/undated__${slug(title)}__entry-${String(index + 1).padStart(4, '0')}.md`,
      content: `---\nplatform: gemini\nconversation_id: entry-${index + 1}\nproject: ${title.match(projectPattern)?.[1]?.toLowerCase() || 'multi-project'}\ndate: undated\ntitle: ${JSON.stringify(title)}\n---\n\n# ${title}\n\n${text}`,
      sourcePath: 'GeminiChatHistory.html', sourceType: 'transcript', project: title.match(projectPattern)?.[1]?.toLowerCase() || 'multi-project', date: 'undated', title, tags: tagsFor(title), summary: title,
    });
  });
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function normalizeDrive() {
  const driveRoot = path.join(sourceRoot, 'Drive');
  const allowedRoots = ['domain', 'libera', 'timpos', 'orchestrator'].map((name) => path.join(driveRoot, name));
  for (const allowedRoot of allowedRoots) {
    for (const sourcePath of walk(allowedRoot)) {
      const extension = path.extname(sourcePath).toLowerCase();
      let content;
      if (directTextExtensions.has(extension)) content = readFileSync(sourcePath, 'utf8');
      else if (extension === '.docx') {
        const converted = spawnSync('/usr/bin/textutil', ['-convert', 'txt', '-stdout', sourcePath], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
        if (converted.status !== 0) { exclusions.push({ sourcePath, sourceType: 'document', reason: 'docx-conversion-failed' }); continue; }
        content = converted.stdout;
      } else { exclusions.push({ sourcePath, sourceType: 'document', reason: `unsupported-${extension || 'extensionless'}` }); continue; }
      const sourceRelative = path.relative(sourceRoot, sourcePath).split(path.sep).join('/');
      const project = path.relative(driveRoot, sourcePath).split(path.sep)[0].toLowerCase();
      emit({
        relativePath: `documents/${sourceRelative.replace(/^Drive\//, '').replace(/\.docx$/i, '.txt')}`,
        content,
        sourcePath: sourceRelative,
        sourceType: extension === '.yaml' || extension === '.yml' || extension === '.ipynb' ? 'structured-artifact' : 'document',
        project,
        date: 'undated',
        title: path.basename(sourcePath),
        tags: tagsFor(sourceRelative),
        summary: summaryOf(content),
      });
    }
  }
}

function normalizeAttachments() {
  const libraryPath = path.join(sourceRoot, 'ChatGPT/library_files.json');
  const records = JSON.parse(readFileSync(libraryPath, 'utf8'));
  for (const record of records) {
    const extension = String(record.file_extension || '').toLowerCase();
    if (!textualAttachmentExtensions.has(extension) || !projectPattern.test(record.file_name || '')) continue;
    const sourcePath = path.join(sourceRoot, 'ChatGPT', `${record.file_id}.dat`);
    try {
      if (!statSync(sourcePath).isFile()) continue;
    } catch { continue; }
    const content = readFileSync(sourcePath, 'utf8');
    emit({
      relativePath: `artifacts/chatgpt/${slug(record.file_name.replace(/\.[^.]+$/, ''))}__${record.file_id}.${extension}`,
      content,
      sourcePath: `ChatGPT/${record.file_id}.dat`,
      sourceType: 'structured-artifact',
      project: record.file_name.match(projectPattern)?.[1]?.toLowerCase() || 'multi-project',
      date: isoDate(record.created_at || record.file_upload_time),
      title: record.file_name,
      tags: tagsFor(record.file_name),
      summary: summaryOf(content),
    });
  }
}

normalizeChatGpt();
normalizeClaude();
normalizeGemini();
normalizeDrive();
normalizeAttachments();
manifest.sort((left, right) => left.visiblePath.localeCompare(right.visiblePath));
const indexLines = ['project\tfile_type\tdate\tfile_path\ttags\tsummary', ...manifest.map((entry) => [entry.project, entry.sourceType, entry.date, entry.visiblePath, entry.tags.join(','), entry.summary.replace(/[\t\n]+/g, ' ')].join('\t'))];
writeFileSync(path.join(outputDir, 'inventory.tsv'), `${indexLines.join('\n')}\n`, { flag: 'wx' });
writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify({ sourceRoot, records: manifest, exclusions }, null, 2)}\n`, { flag: 'wx' });
process.stdout.write(`${JSON.stringify({ records: manifest.length, exclusions: exclusions.length, corpusDir, indexPath: path.join(outputDir, 'inventory.tsv') })}\n`);
