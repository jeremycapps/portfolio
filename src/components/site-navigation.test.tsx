import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MobileNavigation, SiteBrand, SiteNavigation } from './site-navigation';

describe('SiteNavigation', () => {
  it('renders the shared Domain home brand', () => {
    const brand = renderToStaticMarkup(<SiteBrand />);

    expect(brand).toContain('href="/"');
    expect(brand).toContain('Domain');
    expect(brand).toContain('link-brand');
  });

  it('omits the placeholder Journal action from desktop and mobile navigation', () => {
    const desktop = renderToStaticMarkup(
      <SiteNavigation menuOpen={false} onMenuToggle={() => undefined} onNotice={() => undefined} />,
    );
    const mobile = renderToStaticMarkup(<MobileNavigation onNotice={() => undefined} />);

    expect(desktop).not.toContain('Journal');
    expect(mobile).not.toContain('Journal');
    expect(desktop).toContain('button-about');
    expect(mobile).toContain('button-mobile-about');
    expect(desktop).toContain('href="/stratos"');
    expect(desktop).toContain('link-stratos');
    expect(mobile).toContain('href="/stratos"');
    expect(mobile).toContain('link-mobile-stratos');
  });
});
