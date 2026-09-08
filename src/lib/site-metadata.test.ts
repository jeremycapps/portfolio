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
    expect(paths).toContain('/about');
    expect(paths).toContain('/blog/query-compiler-induced');
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('normalizes route URLs and gives articles distinct metadata', () => {
    const metadata = metadataForPath('/blog/executable-interpretation/?ref=test');

    expect(metadata?.kind).toBe('article');
    expect(metadata?.title).toContain('Executable Interpretation');
    expect(metadata?.alternateMarkdown).toBe('/blog/executable-interpretation.md');
    expect(metadata && canonicalUrl(metadata)).toBe(
      'https://www.jeremycapps.com/blog/executable-interpretation',
    );
  });

  it('emits BlogPosting structured data for articles', () => {
    const metadata = metadataForPath('/blog/executable-interpretation')!;
    const structuredData = jsonLdForMetadata(metadata);

    expect(structuredData['@type']).toBe('BlogPosting');
    expect(structuredData).toMatchObject({
      datePublished: '2026-05-28',
      author: { '@type': 'Person', name: 'Jeremy Capps' },
    });
  });
});
