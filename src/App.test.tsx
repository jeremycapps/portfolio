import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Home', () => {
  const homeMarkup = () => renderToStaticMarkup(<App initialPath="/" />);

  it('leads with a summary of experience, showing rather than asserting the role', () => {
    const html = homeMarkup();
    expect(html).toContain('Eight years across engineering, product, and operations');
    // Show, don't tell: the discernment thesis, not an asserted title.
    expect(html).toContain('which piece carries the load');
    expect(html).not.toContain('the technical PM who owns the call');
  });

  it('presents the work as Professional Work and Method, with Klarna hidden for now', () => {
    const html = homeMarkup();
    expect(html).toContain('Professional Work');
    expect(html).toContain('Method');
    expect(html).toContain('href="/work/zocdoc"');
    expect(html).toContain('href="/blog/method"');
    // Klarna is hidden for now: no Case Study row and no link to its page.
    expect(html).not.toContain('Case Study');
    expect(html).not.toContain('/stratos-flow');
  });

  it('moves the assistant off the home and links to it instead', () => {
    const html = homeMarkup();
    // The composer/chat no longer lives on the home page.
    expect(html).not.toContain('data-testid="input-prompt"');
    expect(html).not.toContain('data-testid="form-prompt"');
    // It has its own destination.
    expect(html).toContain('href="/ask"');
  });
});
