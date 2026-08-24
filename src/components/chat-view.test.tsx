import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChatView } from './chat-view';

describe('ChatView', () => {
  it('renders every assistant response as safe Markdown inside its chat bubble', () => {
    const html = renderToStaticMarkup(
      <ChatView
        messages={[
          { role: 'user', content: 'Show **literal input**.' },
          {
            role: 'assistant',
            content: '# Answer\n\nA **strong** answer.\n\n- One\n- Two\n\n`inline()`',
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

  it('drops raw HTML and makes only HTTPS and mailto links clickable', () => {
    const html = renderToStaticMarkup(
      <ChatView
        messages={[{
          role: 'assistant',
          content: [
            '<script>alert(1)</script>',
            '[secure](https://example.com)',
            '[email](mailto:hello@example.com)',
            '[http](http://example.com)',
            '[script](javascript:alert(2))',
            '[relative](/internal)',
          ].join('\n\n'),
        }]}
        streaming={false}
        error={null}
      />,
    );

    expect(html).not.toContain('<script');
    expect(html).toContain('href="https://example.com" target="_blank" rel="noreferrer noopener"');
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(html).not.toContain('href="http:');
    expect(html).not.toContain('href="/internal"');
  });
});
