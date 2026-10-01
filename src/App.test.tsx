import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('Home', () => {
  const homeMarkup = () => renderToStaticMarkup(<App initialPath="/" />);

  it('leads with the tools operators use, with Aroko as the spine', () => {
    const html = homeMarkup();
    expect(html).toContain('I build the tools operators use');
    expect(html).not.toContain('Technical Project Manager');
    expect(html).toContain('Head of Operations'); // the real Aroko title, in Experience
    expect(html).toContain('Aroko');
    // The operations-delivery proof, not the old discernment thesis.
    expect(html).toContain('90-day operating plan');
    expect(html).not.toContain('Eight years across engineering, product, and operations');
    expect(html).not.toContain('which piece carries the load');
  });

  it('lists NEW INC under Awards as the same expandable card, not under Experience', () => {
    const html = homeMarkup();
    const awards = html.slice(html.indexOf('id="home-awards-title"'));
    const experience = html.slice(html.indexOf('id="home-exp-title"'), html.indexOf('id="home-awards-title"'));
    expect(awards).toContain('data-testid="award-newinc"');
    expect(awards).toContain('class="home-role"');
    expect(awards).toContain('aria-expanded="false"');
    expect(experience).not.toContain('NEW INC');
  });

  it('lists the pole review map under Projects, linking in-site to /pole-review', () => {
    const html = homeMarkup();
    const projects = html.slice(html.indexOf('id="home-projects-title"'), html.indexOf('id="home-awards-title"'));
    expect(projects).toContain('data-testid="project-pole-review"');
    expect(projects).toContain('aria-expanded="false"');
    expect(projects).toContain('href="/pole-review"');
    expect(projects).not.toContain('target="_blank"');
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
