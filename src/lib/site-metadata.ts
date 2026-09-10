import { BLOG_POSTS, type BlogPostMeta } from './blog/posts.generated';

export const SITE_ORIGIN = 'https://www.jeremycapps.com';

export type PageKind = 'home' | 'profile' | 'blog' | 'article' | 'application';

export interface PageMetadata {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly kind: PageKind;
  readonly lastModified?: string;
  readonly alternateMarkdown?: string;
  readonly markdown?: string;
  // Reachable by direct URL and still prerendered, but kept out of the sitemap
  // and the llms.txt index — the independent-work pages the portfolio no longer
  // leads with.
  readonly unlisted?: boolean;
}

const STATIC_PAGES: readonly PageMetadata[] = [
  {
    path: '/',
    title: 'Jeremy Capps — Strategic Projects Lead & Technical Project Manager',
    description:
      'Jeremy Capps is an operations and strategic-projects lead who turns ambiguous, cross-functional work into measurable systems and reliable delivery.',
    kind: 'home',
  },
  {
    path: '/blog',
    title: 'Writing — Jeremy Capps',
    description:
      'Notes on delivery, process, and shipping under constraint — how the work actually gets done.',
    kind: 'blog',
    lastModified: BLOG_POSTS[0]?.date,
  },
  {
    path: '/blog/method',
    title: 'StratOS Method — Jeremy Capps',
    description:
      'A clear guide to the StratOS accountability method: twelve poles, divergence, L1–L5 intervention, and evidence-sized commitments.',
    kind: 'application',
    lastModified: '2026-09-09',
    unlisted: true,
  },
  {
    path: '/ask',
    title: 'Ask the Assistant — Jeremy Capps',
    description:
      'Ask an assistant about Jeremy Capps’s work—his projects, experience, and thinking—answered from a curated profile.',
    kind: 'application',
    lastModified: '2026-09-09',
  },
  {
    path: '/work/zocdoc',
    title: 'Zocdoc Design-System Migration — Jeremy Capps',
    description:
      'How Jeremy Capps ran a company-wide Zocdoc header migration as product delivery and experimentation—sizing the reviewable unit, coordinating dependent teams, and proving the rollout with A/B evidence.',
    kind: 'application',
    lastModified: '2026-09-09',
  },
  {
    path: '/stratos',
    title: 'StratOS — Strategy Tension Instrument',
    description:
      'An interactive strategy instrument for making organizational tensions, recommendations, evidence, and decision traces inspectable.',
    kind: 'application',
    unlisted: true,
  },
  {
    path: '/stratos-v2',
    title: 'StratOS — Where Organizational Signals Disagree',
    description:
      'StratOS reveals where internal operating signals and external consequences diverge before an organization makes its next commitment.',
    kind: 'application',
    lastModified: '2026-09-07',
    unlisted: true,
  },
  {
    path: '/stratos-flow',
    title: 'Klarna AI Rollout Case Study — Jeremy Capps',
    description:
      'A product-strategy case study showing how Jeremy Capps named human exception capacity as the constraint that sizes Klarna’s next AI-support increment.',
    kind: 'application',
    lastModified: '2026-09-08',
    unlisted: true,
  },
];

// Articles unlisted from the blog index are also kept out of the sitemap and
// llms.txt, but still prerendered and reachable by direct URL.
const UNLISTED_ARTICLE_SLUGS: ReadonlySet<string> = new Set(['query-compiler-induced']);

function articlePage(post: BlogPostMeta): PageMetadata | null {
  if (post.kind !== 'article') return null;

  return {
    path: `/blog/${post.slug}`,
    title: `${post.title} — Jeremy Capps`,
    description: post.summary,
    kind: 'article',
    lastModified: post.date,
    alternateMarkdown: `/blog/${post.slug}.md`,
    unlisted: UNLISTED_ARTICLE_SLUGS.has(post.slug),
  };
}

export function normalizeSitePath(path: string): string {
  const pathname = path.split(/[?#]/, 1)[0] || '/';
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '');
}

export function staticPageMetadata(): readonly PageMetadata[] {
  const articles = BLOG_POSTS
    .map(articlePage)
    .filter((page): page is PageMetadata => page !== null);
  return [...STATIC_PAGES, ...articles];
}

export function metadataForPath(path: string): PageMetadata | undefined {
  const normalized = normalizeSitePath(path);
  return staticPageMetadata().find((page) => page.path === normalized);
}

export function canonicalUrl(metadata: PageMetadata): string {
  return `${SITE_ORIGIN}${metadata.path === '/' ? '/' : metadata.path}`;
}

export function jsonLdForMetadata(metadata: PageMetadata): Record<string, unknown> {
  const url = canonicalUrl(metadata);
  const person = {
    '@type': 'Person',
    name: 'Jeremy Capps',
    url: `${SITE_ORIGIN}/`,
  };

  if (metadata.kind === 'home') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Jeremy Capps Portfolio',
      url,
      description: metadata.description,
      author: person,
    };
  }
  if (metadata.kind === 'profile') {
    return {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: metadata.title,
      url,
      description: metadata.description,
      mainEntity: person,
    };
  }
  if (metadata.kind === 'blog') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Blog',
      name: metadata.title,
      url,
      description: metadata.description,
      author: person,
    };
  }
  if (metadata.kind === 'article') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: metadata.title.replace(/ — Jeremy Capps$/, ''),
      url,
      mainEntityOfPage: url,
      description: metadata.description,
      datePublished: metadata.lastModified,
      dateModified: metadata.lastModified,
      author: person,
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: metadata.title.replace(/ — .*$/, ''),
    url,
    description: metadata.description,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    author: person,
  };
}
