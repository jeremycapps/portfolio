import ReactMarkdown from 'react-markdown';

type AllowedLink = { protocol: 'https:' | 'mailto:' | 'internal'; href: string };

const INTERNAL_LINK_ORIGIN = 'https://portfolio.invalid';

export function validateMarkdownLink(href: string | undefined): AllowedLink | null {
  if (!href) return null;

  // Assistant answers can point to another surface in this portfolio, but may
  // not use protocol-relative URLs (or backslashes that browsers normalize
  // into them) to escape to an untrusted origin.
  if (href.startsWith('/') && !href.startsWith('//') && !href.includes('\\')) {
    try {
      const url = new URL(href, INTERNAL_LINK_ORIGIN);
      if (url.origin !== INTERNAL_LINK_ORIGIN) return null;
      return {
        protocol: 'internal',
        href: `${url.pathname}${url.search}${url.hash}`,
      };
    } catch {
      return null;
    }
  }

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
