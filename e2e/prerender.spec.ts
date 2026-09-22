import { expect, test } from '@playwright/test';

const publicRoutes = [
  ['/', 'I turn ambiguous, high-pressure work into measurable systems and reliable delivery.'],
  ['/blog', 'Notes on delivery, process, and shipping under constraint'],
  ['/blog/domain-graph-harness', 'A Domain Graph, Measured Against What It Forgot'],
  ['/stratos', 'Drag each axis to set a position'],
  ['/stratos-flow', 'I turn ambiguous AI rollouts'],
] as const;

test.describe('agent-readable static HTML', () => {
  for (const [path, heading] of publicRoutes) {
    test(`${path} includes its primary content in the HTTP response`, async ({ request }) => {
      const response = await request.get(path);
      const html = await response.text();

      expect(response.ok()).toBe(true);
      expect(response.headers()['content-type']).toContain('text/html');
      expect(html).toContain('<div id="root">');
      expect(html).not.toContain('<div id="root"></div>');
      expect(html).toContain('<h1');
      expect(html).toContain(heading);
      expect(html).toContain('rel="canonical"');
    });
  }

  test('discovery and Markdown endpoints are emitted', async ({ request }) => {
    const [llms, sitemap, article] = await Promise.all([
      request.get('/llms.txt'),
      request.get('/sitemap.xml'),
      request.get('/blog/domain-graph-harness.md'),
    ]);

    await expect(llms).toBeOK();
    await expect(sitemap).toBeOK();
    await expect(article).toBeOK();
    expect(await llms.text()).toContain('# Jeremy Capps');
    expect(await sitemap.text()).toContain('/blog/ai-ops-allocation');
    expect(await article.text()).toContain('The harness is the point');
  });
});
