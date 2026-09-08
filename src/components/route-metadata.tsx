import { useEffect } from 'react';
import { useLocation } from 'wouter';
import {
  canonicalUrl,
  jsonLdForMetadata,
  metadataForPath,
} from '@/lib/site-metadata';

function setMeta(selector: string, attributes: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.append(element);
  }
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
}

export function RouteMetadata() {
  const [location] = useLocation();

  useEffect(() => {
    const metadata = metadataForPath(location);
    if (!metadata) return;

    const canonical = canonicalUrl(metadata);
    document.title = metadata.title;
    setMeta('meta[name="description"]', { name: 'description', content: metadata.description });
    setMeta('meta[name="robots"]', { name: 'robots', content: 'index, follow' });
    setMeta('meta[property="og:title"]', { property: 'og:title', content: metadata.title });
    setMeta('meta[property="og:description"]', {
      property: 'og:description',
      content: metadata.description,
    });
    setMeta('meta[property="og:type"]', {
      property: 'og:type',
      content: metadata.kind === 'article' ? 'article' : 'website',
    });
    setMeta('meta[property="og:url"]', { property: 'og:url', content: canonical });
    setMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
    setMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: metadata.title });
    setMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: metadata.description,
    });

    let canonicalLink = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.append(canonicalLink);
    }
    canonicalLink.href = canonical;

    let structuredData = document.head.querySelector<HTMLScriptElement>('#page-structured-data');
    if (!structuredData) {
      structuredData = document.createElement('script');
      structuredData.id = 'page-structured-data';
      structuredData.type = 'application/ld+json';
      document.head.append(structuredData);
    }
    structuredData.textContent = JSON.stringify(jsonLdForMetadata(metadata));
  }, [location]);

  return null;
}
