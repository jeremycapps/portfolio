import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import ZocdocPage from './zocdoc';

describe('ZocdocPage', () => {
  it('recasts the engineering work as a product decision', () => {
    const html = renderToStaticMarkup(<ZocdocPage />);

    expect(html).toContain('The work was correct long before it could land.');
    expect(html).toContain('Move with evidence and coordination.');
    // The Practice through-line: the same judgment as Klarna, earlier and in code.
    expect(html).toContain('the same instinct as the Klarna');
  });

  it('carries the real, grounded outcomes', () => {
    const html = renderToStaticMarkup(<ZocdocPage />);

    expect(html).toContain('+2–3');
    expect(html).toContain('Velocity points per sprint');
    expect(html).toContain('Returned to the team');
  });

  it('links to the full write-up, and no longer surfaces method or the hidden Klarna page', () => {
    const html = renderToStaticMarkup(<ZocdocPage />);

    expect(html).toContain('href="/blog/zocdoc-header-migration"');
    // The closing CTAs were removed: no "See the method", and no link to the
    // now-hidden Klarna page. (The site nav's /method link is unrelated.)
    expect(html).not.toContain('See the method');
    expect(html).not.toContain('/stratos-flow');
  });
});
