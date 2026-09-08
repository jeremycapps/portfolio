import type { PageMetadata } from '../src/lib/site-metadata';

export function pageHead(
  metadata: PageMetadata,
  canonical: string,
  structuredData: Record<string, unknown>,
): string;

export function pageDocument(
  template: string,
  appHtml: string,
  metadata: PageMetadata,
  canonical: string,
  structuredData: Record<string, unknown>,
): string;

export function sitemapXml(
  pages: readonly PageMetadata[],
  canonicalForPage: (page: PageMetadata) => string,
): string;

export function llmsText(
  pages: readonly PageMetadata[],
  canonicalForPage: (page: PageMetadata) => string,
): string;

export function prerender(options?: {
  outputDir?: string;
  serverEntry?: string;
}): Promise<readonly PageMetadata[]>;
