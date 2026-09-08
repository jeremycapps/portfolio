import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const HEAD_PATTERN = /<!--app-head-start-->[\s\S]*?<!--app-head-end-->/;
const ROOT_PATTERN = /<div id="root"><\/div>/;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeXml(value) {
  return escapeHtml(value).replaceAll("'", '&apos;');
}

function safeJson(value) {
  return JSON.stringify(value).replaceAll('<', '\\u003c');
}

export function pageHead(metadata, canonical, structuredData) {
  const title = escapeHtml(metadata.title);
  const description = escapeHtml(metadata.description);
  const ogType = metadata.kind === 'article' ? 'article' : 'website';
  const alternate = metadata.alternateMarkdown
    ? `\n    <link rel="alternate" type="text/markdown" href="${escapeHtml(metadata.alternateMarkdown)}" />`
    : '';
  const agentIndex = metadata.kind === 'home'
    ? '\n    <link rel="alternate" type="text/plain" href="/llms.txt" />'
    : '';
  const articleDates = metadata.kind === 'article' && metadata.lastModified
    ? `\n    <meta property="article:published_time" content="${escapeHtml(metadata.lastModified)}" />`
      + `\n    <meta property="article:modified_time" content="${escapeHtml(metadata.lastModified)}" />`
    : '';

  return `<!--app-head-start-->
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${escapeHtml(canonical)}" />${alternate}${agentIndex}
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="${ogType}" />
    <meta property="og:url" content="${escapeHtml(canonical)}" />${articleDates}
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <script id="page-structured-data" type="application/ld+json">${safeJson(structuredData)}</script>
    <!--app-head-end-->`;
}

export function pageDocument(template, appHtml, metadata, canonical, structuredData) {
  if (!HEAD_PATTERN.test(template)) throw new Error('HTML template is missing app head markers');
  if (!ROOT_PATTERN.test(template)) throw new Error('HTML template is missing an empty #root element');
  return template
    .replace(HEAD_PATTERN, pageHead(metadata, canonical, structuredData))
    .replace(ROOT_PATTERN, `<div id="root">${appHtml}</div>`);
}

export function sitemapXml(pages, canonicalForPage) {
  const urls = pages.map((page) => {
    const lastModified = page.lastModified
      ? `\n    <lastmod>${escapeXml(page.lastModified)}</lastmod>`
      : '';
    return `  <url>\n    <loc>${escapeXml(canonicalForPage(page))}</loc>${lastModified}\n  </url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
}

export function llmsText(pages, canonicalForPage) {
  const core = pages.filter((page) => page.kind !== 'article');
  const articles = pages.filter((page) => page.kind === 'article');
  const links = (items) => items
    .map((page) => `- [${page.title}](${canonicalForPage(page)}): ${page.description}`)
    .join('\n');

  return `# Jeremy Capps\n\n> Jeremy Capps builds accountable systems across engineering, operations, and AI infrastructure.\n\nThis is the canonical index of public, human-authored content on Jeremy Capps's portfolio.\n\n## Core pages\n\n${links(core)}\n\n## Writing\n\n${links(articles)}\n`;
}

async function writeText(path, content) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

export async function prerender({
  outputDir = resolve(root, 'dist'),
  serverEntry = resolve(root, '.prerender/entry-server.js'),
} = {}) {
  const server = await import(pathToFileURL(serverEntry).href);
  const templatePath = resolve(outputDir, 'index.html');
  const template = await readFile(templatePath, 'utf8');
  const pages = server.getStaticPages();

  for (const page of pages) {
    // StratOS v2 has a purpose-built static document and metadata already.
    if (page.path === '/stratos-v2') continue;
    const appHtml = await server.renderPath(page.path);
    const canonical = server.canonicalUrl(page);
    const structuredData = server.jsonLdForMetadata(page);
    const output = page.path === '/'
      ? templatePath
      : resolve(outputDir, page.path.slice(1), 'index.html');
    await writeText(output, pageDocument(template, appHtml, page, canonical, structuredData));

    if (page.alternateMarkdown && page.markdown) {
      await writeText(resolve(outputDir, page.alternateMarkdown.slice(1)), page.markdown);
    }
  }

  await writeText(resolve(outputDir, 'sitemap.xml'), sitemapXml(pages, server.canonicalUrl));
  await writeText(resolve(outputDir, 'llms.txt'), llmsText(pages, server.canonicalUrl));
  return pages;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const pages = await prerender();
  console.log(`prerender: wrote ${pages.length} public routes plus sitemap.xml and llms.txt`);
}
