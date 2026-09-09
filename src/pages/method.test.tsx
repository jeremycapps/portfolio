import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import MethodPage from './method';

describe('MethodPage', () => {
  it('teaches the StratOS method in five progressive chunks', () => {
    const html = renderToStaticMarkup(<MethodPage />);

    expect(html).toContain('Three questions define the decision.');
    expect(html).toContain('3 questions × 2 altitudes × 2 loci');
    expect(html).toContain('The disagreement is the signal.');
    expect(html).toContain('Move at the level that owns the condition.');
    expect(html).toContain('Did we get what we said we wanted?');
  });

  it('connects the framework to both its applied case and full instrument', () => {
    const html = renderToStaticMarkup(<MethodPage />);

    expect(html).toContain('href="/stratos-flow#case-study"');
    expect(html).toContain('href="/stratos"');
  });
});
