import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

describe('StratOS v2 crawl surface', () => {
  it('ships meaningful route-specific HTML before JavaScript runs', () => {
    const html = projectFile('stratos-v2/index.html');

    expect(html).toContain('<h1>Make the next commitment fit the evidence.</h1>');
    expect(html).toContain('<h2>What is the largest commitment we can responsibly make next?</h2>');
    expect(html).toContain('Commitment: CHANGE — hold additional store releases.');
    expect(html).toContain('Path: CHANGE — redesign the rollout configuration.');
    expect(html).toContain('<h2>Six conversion systems</h2>');
    expect(html).toContain('rel="canonical" href="https://www.jeremycapps.com/stratos-v2"');
    expect(html).toContain('property="og:url" content="https://www.jeremycapps.com/stratos-v2"');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('href="/stratos-v2#commitment-review"');
  });

  it('advertises the sitemap to crawlers', () => {
    expect(projectFile('public/robots.txt')).toContain(
      'Sitemap: https://www.jeremycapps.com/sitemap.xml',
    );
    expect(projectFile('public/sitemap.xml')).toContain(
      '<loc>https://www.jeremycapps.com/stratos-v2</loc>',
    );
  });
});
