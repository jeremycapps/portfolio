import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_CONTENT_DIR = resolve(root, 'content/blog');
const DEFAULT_PUBLIC_DIR = resolve(root, 'public');
const DEFAULT_OUTPUT = resolve(root, 'src/lib/blog/posts.generated.ts');

const REQUIRED_FIELDS = ['title', 'slug', 'date', 'summary', 'kind'];
const OPTIONAL_FIELDS = ['status', 'pdf', 'sourceUrl'];
const ALLOWED_FIELDS = new Set([...REQUIRED_FIELDS, ...OPTIONAL_FIELDS]);

function fail(fileName, message) {
  throw new Error(`gen-blog: ${fileName}: ${message}`);
}

function requiredString(frontmatter, field, fileName) {
  const value = frontmatter[field];
  if (typeof value !== 'string' || value.trim() === '') {
    fail(fileName, `frontmatter field "${field}" must be a non-empty string`);
  }
  return value.trim();
}

function optionalString(frontmatter, field, fileName) {
  const value = frontmatter[field];
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    fail(fileName, `frontmatter field "${field}" must be a non-empty string when set`);
  }
  return value.trim();
}

export function parseBlogSource(source, fileName = '<source>') {
  const match = source.match(/^---[\t ]*\r?\n([\s\S]*?)\r?\n---[\t ]*(?:\r?\n|$)/);
  if (!match) fail(fileName, 'expected YAML frontmatter between leading --- fences');

  let frontmatter;
  try {
    frontmatter = parseYaml(match[1]);
  } catch (error) {
    fail(fileName, `invalid YAML frontmatter (${error instanceof Error ? error.message : String(error)})`);
  }

  if (!frontmatter || typeof frontmatter !== 'object' || Array.isArray(frontmatter)) {
    fail(fileName, 'frontmatter must be a YAML mapping');
  }

  for (const field of Object.keys(frontmatter)) {
    if (!ALLOWED_FIELDS.has(field)) fail(fileName, `unknown frontmatter field "${field}"`);
  }

  const title = requiredString(frontmatter, 'title', fileName);
  const slug = requiredString(frontmatter, 'slug', fileName);
  const date = requiredString(frontmatter, 'date', fileName);
  const summary = requiredString(frontmatter, 'summary', fileName);
  const kind = requiredString(frontmatter, 'kind', fileName);
  const status = optionalString(frontmatter, 'status', fileName);
  const pdf = optionalString(frontmatter, 'pdf', fileName);
  const sourceUrl = optionalString(frontmatter, 'sourceUrl', fileName);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    fail(fileName, 'frontmatter field "slug" must be kebab-case');
  }
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)
      || Number.isNaN(parsedDate.getTime())
      || parsedDate.toISOString().slice(0, 10) !== date) {
    fail(fileName, 'frontmatter field "date" must be a valid ISO date (YYYY-MM-DD)');
  }
  if (kind !== 'article' && kind !== 'paper') {
    fail(fileName, 'frontmatter field "kind" must be "article" or "paper"');
  }
  if (sourceUrl) {
    try {
      if (new URL(sourceUrl).protocol !== 'https:') throw new Error();
    } catch {
      fail(fileName, 'frontmatter field "sourceUrl" must be an https URL');
    }
  }
  if (kind === 'paper' && !pdf && !sourceUrl) {
    fail(fileName, 'paper posts require at least one of "pdf" or "sourceUrl"');
  }

  return {
    meta: {
      title,
      slug,
      date,
      summary,
      kind,
      ...(status ? { status } : {}),
      ...(pdf ? { pdf } : {}),
      ...(sourceUrl ? { sourceUrl } : {}),
    },
    body: source.slice(match[0].length),
  };
}

function validatePdf(meta, fileName, publicDir) {
  if (!meta.pdf) return;
  if (!meta.pdf.startsWith('/') || meta.pdf.startsWith('//') || meta.pdf.includes('\\')) {
    fail(fileName, 'frontmatter field "pdf" must be a root-relative public path');
  }

  const publicRoot = resolve(publicDir);
  const artifact = resolve(publicRoot, `.${meta.pdf}`);
  const pathFromPublic = relative(publicRoot, artifact);
  if (pathFromPublic === '..' || pathFromPublic.startsWith(`..${sep}`)) {
    fail(fileName, 'frontmatter field "pdf" must stay within public/');
  }
  if (!existsSync(artifact) || !statSync(artifact).isFile()) {
    fail(fileName, `PDF does not exist at public/${pathFromPublic}`);
  }
}

export function buildBlogData(sources, { publicDir = DEFAULT_PUBLIC_DIR } = {}) {
  const seen = new Map();
  const parsed = sources.map(({ fileName, source }) => {
    const post = parseBlogSource(source, fileName);
    const previous = seen.get(post.meta.slug);
    if (previous) fail(fileName, `duplicate slug "${post.meta.slug}" (already used by ${previous})`);
    seen.set(post.meta.slug, fileName);
    validatePdf(post.meta, fileName, publicDir);
    return post;
  });

  parsed.sort((a, b) => b.meta.date.localeCompare(a.meta.date) || a.meta.slug.localeCompare(b.meta.slug));
  return {
    posts: parsed.map(({ meta }) => meta),
    articleBodies: Object.fromEntries(
      parsed.filter(({ meta }) => meta.kind === 'article').map(({ meta, body }) => [meta.slug, body]),
    ),
  };
}

export function generateBlog({
  contentDir = DEFAULT_CONTENT_DIR,
  publicDir = DEFAULT_PUBLIC_DIR,
  output = DEFAULT_OUTPUT,
} = {}) {
  const files = existsSync(contentDir)
    ? readdirSync(contentDir).filter((file) => file.endsWith('.md')).sort()
    : [];
  const sources = files.map((fileName) => ({
    fileName,
    source: readFileSync(resolve(contentDir, fileName), 'utf8'),
  }));
  const { posts, articleBodies } = buildBlogData(sources, { publicDir });
  const generated = `// AUTO-GENERATED from content/blog/*.md by scripts/gen-blog.mjs. Do not edit.\n\n`
    + `export type BlogKind = 'article' | 'paper';\n\n`
    + `export interface BlogPostMeta {\n`
    + `  readonly title: string;\n  readonly slug: string;\n  readonly date: string;\n`
    + `  readonly summary: string;\n  readonly kind: BlogKind;\n`
    + `  readonly status?: string;\n  readonly pdf?: string;\n  readonly sourceUrl?: string;\n}\n\n`
    + `export const BLOG_POSTS = ${JSON.stringify(posts, null, 2)} as const satisfies readonly BlogPostMeta[];\n\n`
    + `export const BLOG_ARTICLE_BODIES = ${JSON.stringify(articleBodies, null, 2)} as const satisfies Readonly<Record<string, string>>;\n`;

  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, generated, 'utf8');
  return { output, postCount: posts.length, articleCount: Object.keys(articleBodies).length };
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const result = generateBlog();
  console.log(`gen-blog: wrote ${result.output} (${result.postCount} posts, ${result.articleCount} articles)`);
}
