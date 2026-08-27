import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { BlogPostMeta } from '../lib/blog/posts.generated';
import BlogPostPage, { paperDestination } from './blog-post';

const article: BlogPostMeta = {
  title: 'Known article', slug: 'known-article', date: '2026-08-26',
  summary: 'The known summary.', kind: 'article', status: 'Draft',
};
const paper: BlogPostMeta = {
  title: 'Known paper', slug: 'known-paper', date: '2026-08-25',
  summary: 'The paper summary.', kind: 'paper', sourceUrl: 'https://example.com/paper',
};

describe('BlogPostPage', () => {
  it('renders a known article and its Markdown body', () => {
    const html = renderToStaticMarkup(
      <BlogPostPage
        slug="known-article"
        posts={[article]}
        articleBodies={{ 'known-article': '## Built from Markdown' }}
      />,
    );

    expect(html).toContain('Known article');
    expect(html).toContain('<h2>Built from Markdown</h2>');
    expect(html).toContain('href="/blog"');
  });

  it('uses the existing not-found content for an unknown slug', () => {
    const html = renderToStaticMarkup(<BlogPostPage slug="missing" posts={[]} />);
    expect(html).toContain('404 Page Not Found');
  });

  it('resolves a paper slug to its artifact destination', () => {
    expect(paperDestination(paper)).toBe('https://example.com/paper');
    expect(paperDestination(article)).toBeNull();

    const html = renderToStaticMarkup(<BlogPostPage slug="known-paper" posts={[paper]} />);
    expect(html).toContain('Opening the paper');
    expect(html).toContain('href="https://example.com/paper"');
  });
});
