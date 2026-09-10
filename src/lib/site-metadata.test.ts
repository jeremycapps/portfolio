import { describe, expect, it } from 'vitest';
import {
  canonicalUrl,
  jsonLdForMetadata,
  metadataForPath,
  staticPageMetadata,
} from './site-metadata';

describe('site metadata', () => {
  it('discovers every public article from generated blog metadata', () => {
    const paths = staticPageMetadata().map((page) => page.path);

    expect(paths).toContain('/');
    expect(paths).toContain('/blog/method');
    expect(paths).toContain('/stratos-flow');
    expect(paths).not.toContain('/about');
    expect(paths).toContain('/blog/query-compiler-induced');
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('positions the StratOS method as the accountability framework, under /blog', () => {
    const metadata = metadataForPath('/blog/method');

    expect(metadata?.title).toContain('StratOS Method');
    expect(metadata?.description).toContain('twelve poles');
    expect(metadata && canonicalUrl(metadata)).toBe(
      'https://www.jeremycapps.com/blog/method',
    );
  });

  it('positions the StratOS flow as the bounded decision experience', () => {
    const metadata = metadataForPath('/stratos-flow');

    expect(metadata?.title).toContain('Klarna AI Rollout Case Study');
    expect(metadata?.description).toContain('human exception capacity');
    expect(metadata && canonicalUrl(metadata)).toBe(
      'https://www.jeremycapps.com/stratos-flow',
    );
  });

  it('normalizes route URLs and gives articles distinct metadata', () => {
    const metadata = metadataForPath('/blog/query-compiler-induced/?ref=test');

    expect(metadata?.kind).toBe('article');
    expect(metadata?.title).toContain('Query Compiler');
    expect(metadata?.alternateMarkdown).toBe('/blog/query-compiler-induced.md');
    expect(metadata && canonicalUrl(metadata)).toBe(
      'https://www.jeremycapps.com/blog/query-compiler-induced',
    );
  });

  it('emits BlogPosting structured data for articles', () => {
    const metadata = metadataForPath('/blog/query-compiler-induced')!;
    const structuredData = jsonLdForMetadata(metadata);

    expect(structuredData['@type']).toBe('BlogPosting');
    expect(structuredData).toMatchObject({
      datePublished: '2026-09-02',
      author: { '@type': 'Person', name: 'Jeremy Capps' },
    });
  });
});
