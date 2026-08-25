import ReactMarkdown from 'react-markdown';

type AllowedLink = { protocol: 'https:' | 'mailto:'; href: string };

export function validateMarkdownLink(href: string | undefined): AllowedLink | null {
  if (!href) return null;
  try {
    const url = new URL(href);
    if (url.protocol !== 'https:' && url.protocol !== 'mailto:') return null;
    return { protocol: url.protocol, href };
  } catch {
    return null;
  }
}

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="prose max-w-none chat-markdown" data-testid="chat-markdown">
      <ReactMarkdown
        skipHtml
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
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
