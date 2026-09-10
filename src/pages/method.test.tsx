import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MethodPage from './method';

describe('MethodPage', () => {
  it('teaches the StratOS method as a sequence of progressive chunks', () => {
    const html = renderToStaticMarkup(<MethodPage />);

    expect(html).toContain('Three questions define the decision.');
    expect(html).toContain('Ask each question at two altitudes.');
    expect(html).toContain('Split each tension by where its proof lives.');
    expect(html).toContain('The disagreement is the signal.');
    expect(html).toContain('Move at the level that owns the condition.');
    expect(html).toContain('Did we get what we said we wanted?');
  });

  it('lets the reader assemble the model, one multiplication at a time', () => {
    const html = renderToStaticMarkup(<MethodPage />);

    // The running tally grows across the altitude and locus steps rather than
    // handing the reader all twelve poles at once.
    expect(html).toContain('3 questions × 2 altitudes = 6 tensions');
    expect(html).toContain('3 questions × 2 altitudes × 2 loci = 12 poles');
  });

  it('connects the framework to the live practice case and the full instrument', () => {
    const html = renderToStaticMarkup(<MethodPage />);

    // The hidden Klarna page is no longer linked; the applied case is Zocdoc.
    expect(html).toContain('href="/work/zocdoc"');
    expect(html).toContain('href="/stratos"');
    expect(html).not.toContain('/stratos-flow');
  });

  it('brings the instrument sources into the method page', () => {
    const html = renderToStaticMarkup(<MethodPage />);

    expect(html).toContain('The works the lenses draw on.');
    expect(html).toContain('Michael E. Porter');
    expect(html).toContain('id="source-porter_01"');
  });
});
