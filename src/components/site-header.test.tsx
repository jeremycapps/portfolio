import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SiteHeader } from './site-header';

describe('SiteHeader', () => {
  it('renders the shared brand and every desktop and mobile destination', () => {
    const markup = renderToStaticMarkup(<SiteHeader current="portfolio" />);

    expect(markup).toContain('Domain');
    expect(markup).toContain('link-brand');
    expect(markup).toContain('link-portfolio');
    expect(markup).toContain('link-stratos');
    expect(markup).toContain('link-blog');
    expect(markup).toContain('link-mobile-portfolio');
    expect(markup).toContain('link-mobile-stratos');
    expect(markup).toContain('link-mobile-blog');
    expect(markup).toContain('link-about');
    expect(markup).toContain('link-mobile-about');
  });

  it('marks only the current section in both navigation variants', () => {
    const markup = renderToStaticMarkup(<SiteHeader current="blog" />);

    expect(markup.match(/aria-current="page"/g)).toHaveLength(2);
    expect(markup).toMatch(/data-testid="link-blog"[^>]*aria-current="page"/);
    expect(markup).toMatch(/data-testid="link-mobile-blog"[^>]*aria-current="page"/);
    expect(markup).not.toMatch(/data-testid="link-stratos"[^>]*aria-current="page"/);
    expect(markup).not.toMatch(/data-testid="link-portfolio"[^>]*aria-current="page"/);
  });

  it('leaves navigation unselected on pages outside the primary sections', () => {
    expect(renderToStaticMarkup(<SiteHeader />)).not.toContain('aria-current="page"');
  });
});
