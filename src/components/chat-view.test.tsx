import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChatView } from './chat-view';
import { validateMarkdownLink } from './markdown-content';

describe('ChatView', () => {
  it('renders every assistant response as safe Markdown inside its chat bubble', () => {
    const html = renderToStaticMarkup(
      <ChatView
        messages={[
          { role: 'user', content: 'Show **literal input**.' },
          {
            role: 'assistant',
            content: {
              kind: 'markdown',
              markdown: '# Answer\n\nA **strong** answer.\n\n- One\n- Two\n\n`inline()`',
            },
          },
        ]}
        streaming={false}
        error={null}
      />,
    );

    expect(html).toContain('chat-bubble-assistant');
    expect(html).toContain('class="prose max-w-none chat-markdown"');
    expect(html).toContain('<h1>Answer</h1>');
    expect(html).toContain('<strong>strong</strong>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<code>inline()</code>');
    expect(html).toContain('Show **literal input**.');
  });

  it('drops raw HTML and makes HTTPS, mailto, and safe portfolio links clickable', () => {
    const html = renderToStaticMarkup(
      <ChatView
        messages={[{
          role: 'assistant',
          content: {
            kind: 'markdown',
            markdown: [
              '<script>alert(1)</script>',
              '[secure](https://example.com)',
              '[email](mailto:hello@example.com)',
              '[http](http://example.com)',
              '[script](javascript:alert(2))',
              '[relative](/internal)',
              '[protocol-relative](//evil.example)',
            ].join('\n\n'),
          },
        }]}
        streaming={false}
        error={null}
      />,
    );

    expect(html).not.toContain('<script');
    expect(html).toContain('href="https://example.com" target="_blank" rel="noreferrer noopener"');
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html).toContain('href="/internal"');
    expect(html.match(/<a /g)).toHaveLength(3);
    expect(html).not.toContain('href="http:');
    expect(html).not.toContain('href="//evil.example"');
    expect(validateMarkdownLink('/\\evil.example')).toBeNull();
  });
});
