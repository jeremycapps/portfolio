import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { BlogPostMeta } from '../lib/blog/posts.generated';
import { BlogIndex } from './blog';

const posts: readonly BlogPostMeta[] = [
  {
    title: 'Older paper', slug: 'older-paper', date: '2026-01-02',
    summary: 'Downloadable work.', kind: 'paper', pdf: '/blog/older-paper.pdf',
  },
  {
    title: 'Newer essay', slug: 'newer-essay', date: '2026-08-26',
    summary: 'Readable on the site.', kind: 'article', status: 'Ratified',
  },
  {
    title: 'Linked paper', slug: 'linked-paper', date: '2026-02-03',
    summary: 'Published elsewhere.', kind: 'paper', sourceUrl: 'https://example.com/paper',
  },
];

describe('BlogIndex', () => {
  it('renders posts newest first with internal article and artifact links', () => {
    const html = renderToStaticMarkup(<BlogIndex posts={posts} />);

    expect(html.indexOf('Newer essay')).toBeLessThan(html.indexOf('Linked paper'));
    expect(html.indexOf('Linked paper')).toBeLessThan(html.indexOf('Older paper'));
    expect(html).toContain('href="/blog/newer-essay"');
    expect(html).toContain('href="/blog/older-paper.pdf"');
    expect(html).toContain('href="https://example.com/paper"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('Ratified');
  });

  it('renders an intentional empty state', () => {
    expect(renderToStaticMarkup(<BlogIndex posts={[]} />)).toContain('blog-empty');
  });
});
