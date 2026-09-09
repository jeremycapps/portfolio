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
}

const STATIC_PAGES: readonly PageMetadata[] = [
  {
    path: '/',
    title: 'Jeremy Capps — Engineering, Operations, and AI Infrastructure',
    description:
      'Jeremy Capps builds accountable systems across engineering, operations, and AI infrastructure.',
    kind: 'home',
  },
  {
    path: '/about',
    title: 'About Jeremy Capps — Systems Engineer and Operator',
    description:
      'Jeremy Capps builds systems and shared understanding that keep complex work legible and accountable as it grows.',
    kind: 'profile',
  },
  {
    path: '/blog',
    title: 'Writing — Jeremy Capps',
    description:
      'Essays, papers, and system notes about executable meaning, context infrastructure, and accountable systems.',
    kind: 'blog',
    lastModified: BLOG_POSTS[0]?.date,
  },
  {
    path: '/method',
    title: 'StratOS Method — Jeremy Capps',
    description:
      'A clear guide to the StratOS accountability method: twelve poles, divergence, L1–L5 intervention, and evidence-sized commitments.',
    kind: 'application',
    lastModified: '2026-09-09',
  },
  {
    path: '/work/zocdoc',
    title: 'Zocdoc Design-System Migration — Jeremy Capps',
    description:
      'A practice case study: how Jeremy Capps ran a company-wide Zocdoc header migration as a measured product decision—sizing the reviewable unit, coordinating dependent teams, and proving the rollout with A/B evidence.',
    kind: 'application',
    lastModified: '2026-09-09',
  },
  {
    path: '/stratos',
    title: 'StratOS — Strategy Tension Instrument',
    description:
      'An interactive strategy instrument for making organizational tensions, recommendations, evidence, and decision traces inspectable.',
    kind: 'application',
  },
  {
    path: '/stratos-v2',
    title: 'StratOS — Where Organizational Signals Disagree',
    description:
      'StratOS reveals where internal operating signals and external consequences diverge before an organization makes its next commitment.',
    kind: 'application',
    lastModified: '2026-09-07',
  },
  {
    path: '/stratos-flow',
    title: 'Klarna AI Rollout Case Study — Jeremy Capps',
    description:
      'A product-strategy case study showing how Jeremy Capps named human exception capacity as the constraint that sizes Klarna’s next AI-support increment.',
    kind: 'application',
    lastModified: '2026-09-08',
  },
];

function articlePage(post: BlogPostMeta): PageMetadata | null {
  if (post.kind !== 'article') return null;

  return {
    path: `/blog/${post.slug}`,
    title: `${post.title} — Jeremy Capps`,
    description: post.summary,
    kind: 'article',
    lastModified: post.date,
    alternateMarkdown: `/blog/${post.slug}.md`,
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
