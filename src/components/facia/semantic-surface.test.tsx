import { resolveAnswerSet } from '@facia/core';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { answerPortfolioQuestion } from '../../../api/_lib/portfolio-answer-source';
import { produceMarkdownAnswer } from '../../../api/_lib/markdown-answer-producer';
import { SemanticSurface, validateMarkdownLink } from './semantic-surface';

describe('SemanticSurface', () => {
  it('renders a Facia list recipe without re-resolving its presentation pattern', () => {
    const answer = answerPortfolioQuestion('What did Jeremy work on at Zocdoc?');
    const result = resolveAnswerSet(answer, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} onDepthChange={async () => undefined} />,
    );

    expect(html).toContain('Deterministic answer · Facia v2');
    expect(html).toContain('Accessible design-system migration');
    expect(html).toContain('data-testid="semantic-list"');
    expect(html).not.toContain('Evidence and trace');
  });

  it('renders complete Markdown documents as nested prose without internal metadata', () => {
    const answer = produceMarkdownAnswer('Explain the project', [
      '# Project',
      '',
      'A paragraph with **strong** and *emphasized* text plus `inline()`.',
      '',
      '1. First',
      '2. Second',
      '',
      '- Alpha',
      '- Beta',
      '',
      '> A useful note.',
      '',
      '```ts',
      'const safe = true;',
      '```',
    ].join('\n'));
    const result = resolveAnswerSet(answer, { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} onDepthChange={async () => undefined} />,
    );

    expect(html).toContain('class="prose max-w-none semantic-markdown"');
    expect(html).toContain('<h1>Project</h1>');
    expect(html).toContain('<strong>strong</strong>');
    expect(html).toContain('<em>emphasized</em>');
    expect(html).toContain('<code>inline()</code>');
    expect(html).toContain('<ol>');
    expect(html).toContain('<ul>');
    expect(html).toContain('<blockquote>');
    expect(html).toContain('<pre><code class="language-ts">const safe = true;');
    expect(html).not.toContain('Deterministic answer · Facia v2');
    expect(html).not.toContain('semantic-pattern');
    expect(html).not.toContain('density:');
    expect(html).not.toContain('_provenance');
    expect(html).not.toContain('Scope');
  });

  it('renders only exact HTTPS and mailto destinations as links', () => {
    const markdown = [
      '[secure](https://example.com/path)',
      '[email](mailto:hello@example.com)',
      '[http](http://example.com)',
      '[script](javascript:alert(1))',
      '[data](data:text/plain,no)',
      '[file](file:///tmp/no)',
      '[relative](/internal)',
      '[protocol relative](//example.com)',
      '[malformed](not a url)',
    ].join('\n\n');
    const result = resolveAnswerSet(produceMarkdownAnswer('Links?', markdown), { depth: 'glance' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} onDepthChange={async () => undefined} />,
    );

    expect(html).toContain('href="https://example.com/path" target="_blank" rel="noreferrer noopener"');
    expect(html).toContain('href="mailto:hello@example.com"');
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('href="http:');
    expect(html).not.toContain('href="/internal"');
  });

  it('drops raw HTML instead of executing or mounting it', () => {
    const result = resolveAnswerSet(
      produceMarkdownAnswer('Safe?', '<script>alert(1)</script>\n<img src=x onerror="alert(2)">\n\nStill here.'),
      { depth: 'glance' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const html = renderToStaticMarkup(
      <SemanticSurface recipe={result.recipe} onDepthChange={async () => undefined} />,
    );

    expect(html).not.toContain('<script');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('onerror');
    expect(html).toContain('Still here.');
  });

  it('validates protocols independently of Markdown parsing', () => {
    expect(validateMarkdownLink('https://example.com')).toMatchObject({ protocol: 'https:' });
    expect(validateMarkdownLink('mailto:hello@example.com')).toMatchObject({ protocol: 'mailto:' });
    expect(validateMarkdownLink('HTTPS://example.com')).toMatchObject({ protocol: 'https:' });
    expect(validateMarkdownLink('http://example.com')).toBeNull();
    expect(validateMarkdownLink('//example.com')).toBeNull();
    expect(validateMarkdownLink('javascript:alert(1)')).toBeNull();
    expect(validateMarkdownLink(undefined)).toBeNull();
  });
});
