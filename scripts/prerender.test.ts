import { describe, expect, it } from 'vitest';
import type { PageMetadata } from '../src/lib/site-metadata';
import { llmsText, pageDocument, sitemapXml } from './prerender.mjs';

const metadata: PageMetadata = {
  path: '/blog/readable-page',
  title: 'Readable & useful — Jeremy Capps',
  description: 'A page agents can read before JavaScript runs.',
  kind: 'article',
  lastModified: '2026-09-07',
  alternateMarkdown: '/blog/readable-page.md',
};
const canonical = () => 'https://www.jeremycapps.com/blog/readable-page';

describe('prerender', () => {
  it('injects server-rendered content and route-specific head metadata', () => {
    const template = '<html><head><!--app-head-start--><title>Old</title><!--app-head-end--></head><body><div id="root"></div></body></html>';
    const document = pageDocument(
      template,
      '<main><h1>Readable page</h1></main>',
      metadata,
      canonical(),
      { '@context': 'https://schema.org', '@type': 'BlogPosting' },
    );

    expect(document).toContain('<div id="root"><main><h1>Readable page</h1></main></div>');
    expect(document).toContain('<title>Readable &amp; useful — Jeremy Capps</title>');
    expect(document).toContain('rel="canonical" href="https://www.jeremycapps.com/blog/readable-page"');
    expect(document).toContain('type="text/markdown" href="/blog/readable-page.md"');
    expect(document).toContain('"@type":"BlogPosting"');
  });

  it('builds discovery files from the same route list', () => {
    const sitemap = sitemapXml([metadata], canonical);
    const llms = llmsText([metadata], canonical);

    expect(sitemap).toContain('<lastmod>2026-09-07</lastmod>');
    expect(llms).toContain('[Readable & useful — Jeremy Capps]');
    expect(llms).toContain('https://www.jeremycapps.com/blog/readable-page');
  });

  it('advertises the agent index from the homepage head', () => {
    const home = { ...metadata, path: '/', kind: 'home' as const };
    const template = '<html><head><!--app-head-start--><!--app-head-end--></head><body><div id="root"></div></body></html>';
    const document = pageDocument(template, '<main><h1>Home</h1></main>', home, 'https://www.jeremycapps.com/', {});

    expect(document).toContain('type="text/plain" href="/llms.txt"');
  });
});
