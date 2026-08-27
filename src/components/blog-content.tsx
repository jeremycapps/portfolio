import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { validateMarkdownLink } from './markdown-content';

export function BlogContent({ content }: { content: string }) {
  return (
    <div className="prose max-w-none blog-markdown" data-testid="blog-markdown">
      <ReactMarkdown
        skipHtml
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => url}
        components={{
          a: ({ node: _node, href, children, ...props }) => {
            const allowed = validateMarkdownLink(href);
            if (!allowed) return <>{children}</>;
            return (
              <a
                {...props}
                href={allowed.href}
                {...(allowed.protocol === 'https:'
                  ? { target: '_blank', rel: 'noreferrer noopener' }
                  : {})}
              >
                {children}
              </a>
            );
          },
          img: () => null,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
