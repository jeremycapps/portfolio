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

  it('completes see → trust → understand by graduating into method and the Klarna case', () => {
    const html = renderToStaticMarkup(<ZocdocPage />);

    expect(html).toContain('href="/method"');
    expect(html).toContain('href="/stratos-flow#case-study"');
    expect(html).toContain('href="/blog/zocdoc-header-migration"');
  });
});
