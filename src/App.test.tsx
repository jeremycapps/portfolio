import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Home', () => {
  const homeMarkup = () => renderToStaticMarkup(<App initialPath="/" />);

  it('leads with the technical-PM decision the hero owns', () => {
    const html = homeMarkup();
    expect(html).toContain('Technical product management');
    expect(html).toContain('the technical PM who owns the call');
  });

  it('presents the three genres as see → trust → understand doors', () => {
    const html = homeMarkup();
    expect(html).toContain('Perspective');
    expect(html).toContain('Practice');
    expect(html).toContain('Method');
    expect(html).toContain('href="/stratos-flow#case-study"');
    expect(html).toContain('href="/work/zocdoc"');
    expect(html).toContain('href="/method"');
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
