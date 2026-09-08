import { PassThrough } from 'node:stream';
import { renderToPipeableStream } from 'react-dom/server';
import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';
import { BLOG_ARTICLE_BODIES, BLOG_POSTS } from '@/lib/blog/posts.generated';
import { staticPageMetadata } from '@/lib/site-metadata';

export { canonicalUrl, jsonLdForMetadata, staticPageMetadata } from '@/lib/site-metadata';
export type { PageMetadata } from '@/lib/site-metadata';

export function renderPath(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let renderError: unknown;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      abort();
      reject(new Error(`Timed out while pre-rendering ${path}`));
    }, 15_000);

    const { pipe, abort } = renderToPipeableStream(
      <ErrorBoundary>
        <App initialPath={path} />
      </ErrorBoundary>,
      {
        onAllReady() {
          if (settled) return;
          const stream = new PassThrough();
          let html = '';
          stream.setEncoding('utf8');
          stream.on('data', (chunk: string) => { html += chunk; });
          stream.on('error', (error) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            reject(error);
          });
          stream.on('end', () => {
            if (settled) return;
            settled = true;
            clearTimeout(timeout);
            if (renderError) reject(renderError);
            else resolve(html);
          });
          pipe(stream);
        },
        onShellError(error) {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          reject(error);
        },
        onError(error) {
          renderError = error;
        },
      },
    );
  });
}

export function getStaticPages() {
  const bodies = BLOG_ARTICLE_BODIES as Readonly<Record<string, string>>;
  return staticPageMetadata().map((page) => {
    if (page.kind !== 'article') return page;
    const slug = page.path.slice('/blog/'.length);
    const post = BLOG_POSTS.find((candidate) => candidate.slug === slug);
    const body = bodies[slug];
    if (!post || body === undefined) return page;
    return {
      ...page,
      markdown: `# ${post.title}\n\n${post.summary}\n\n${body.trim()}\n`,
    };
  });
}
