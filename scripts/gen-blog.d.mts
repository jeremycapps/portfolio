export type BlogKind = 'article' | 'paper';

export interface BlogPostMeta {
  title: string;
  slug: string;
  date: string;
  summary: string;
  kind: BlogKind;
  status?: string;
  pdf?: string;
  sourceUrl?: string;
}

export interface BlogSource {
  fileName: string;
  source: string;
}

export function parseBlogSource(
  source: string,
  fileName?: string,
): { meta: BlogPostMeta; body: string };

export function buildBlogData(
  sources: BlogSource[],
  options?: { publicDir?: string },
): { posts: BlogPostMeta[]; articleBodies: Record<string, string> };

export function generateBlog(options?: {
  contentDir?: string;
  publicDir?: string;
  output?: string;
}): { output: string; postCount: number; articleCount: number };
