import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Home', () => {
  const homeMarkup = () => renderToStaticMarkup(<App initialPath="/" />);

  it('leads with engineering on AI systems, with Aroko as the spine', () => {
    const html = homeMarkup();
    expect(html).toContain('I build production AI systems');
    expect(html).not.toContain('Technical Project Manager');
    expect(html).toContain('Strategic Projects Lead'); // the real Aroko title, in Experience
    expect(html).toContain('Aroko');
    // The operations-delivery proof, not the old discernment thesis.
    expect(html).toContain('90-day operating plan');
    expect(html).not.toContain('Eight years across engineering, product, and operations');
    expect(html).not.toContain('which piece carries the load');
  });

  it('shows every role as a uniform expandable card and drops the retired Zocdoc page', () => {
    const html = homeMarkup();
    // All four roles render, each with its bullets in the DOM (collapsed panels included).
    expect(html).toContain('Aroko');
    expect(html).toContain('Zocdoc');
    expect(html).toContain('Applied Software');
    expect(html).toContain('Genesco');
    expect(html).toContain('aria-expanded');
    expect(html).toContain('360Sync'); // an Applied Software bullet is present, not just a bare row
    // The retired Zocdoc case page is gone; the independent-work story stays off the home.
    expect(html).not.toContain('/work/zocdoc');
    expect(html).not.toContain('Professional Work');
    expect(html).not.toContain('href="/blog/method"');
    expect(html).not.toContain('href="/stratos"');
    expect(html).not.toContain('/stratos-flow');
  });

  it('unifies both CTA spots on chat + see how it works', () => {
    const html = homeMarkup();
    expect(html).toContain('Chat with my assistant');
    expect(html).toContain('See how it works');
    expect(html).toContain('href="/blog/production-rag-personal-corpus"');
    expect(html).not.toContain('See the Zocdoc case study');
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
