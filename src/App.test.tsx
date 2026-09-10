import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Home', () => {
  const homeMarkup = () => renderToStaticMarkup(<App initialPath="/" />);

  it('leads as Strategic Projects Lead, with Aroko as the spine', () => {
    const html = homeMarkup();
    expect(html).toContain('Strategic Projects Lead');
    expect(html).toContain('Aroko');
    // The operations-delivery proof, not the old discernment thesis.
    expect(html).toContain('90-day operating plan');
    expect(html).not.toContain('Eight years across engineering, product, and operations');
    expect(html).not.toContain('which piece carries the load');
  });

  it('shows the experience ledger and keeps the Zocdoc case study reachable', () => {
    const html = homeMarkup();
    expect(html).toContain('href="/work/zocdoc"');
    // The independent-work story is off the home now.
    expect(html).not.toContain('Professional Work');
    expect(html).not.toContain('href="/blog/method"');
    expect(html).not.toContain('href="/stratos"');
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
