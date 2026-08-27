import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BlogContent } from './blog-content';

describe('BlogContent', () => {
  it('renders GFM tables', () => {
    const html = renderToStaticMarkup(
      <BlogContent content={'| Model | State |\n| --- | --- |\n| Domain | Running |'} />,
    );

    expect(html).toContain('<table>');
    expect(html).toContain('<th>Model</th>');
    expect(html).toContain('<td>Running</td>');
  });

  it('opens safe external links in a new tab and strips unsafe destinations', () => {
    const html = renderToStaticMarkup(
      <BlogContent content={'[Safe](https://example.com) and [unsafe](javascript:alert(1)).'} />,
    );

    expect(html).toContain('href="https://example.com"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer noopener"');
    expect(html).not.toContain('javascript:');
  });
});
