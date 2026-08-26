import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PortfolioProject } from '../lib/projects';
import { ProjectCards } from './project-cards';

describe('ProjectCards', () => {
  it('renders each public project card as its safe external repository link', () => {
    const html = renderToStaticMarkup(<ProjectCards />);

    expect(html).toContain('href="https://github.com/jeremycapps/libera"');
    expect(html).toContain('href="https://github.com/jeremycapps/facia"');
    expect(html.match(/target="_blank"/g)).toHaveLength(2);
    expect(html.match(/rel="noreferrer noopener"/g)).toHaveLength(2);
    expect(html.match(/class="document-card"/g)).toHaveLength(2);
    expect(html).not.toContain('document-repository');
    expect(html).not.toContain('<button');
  });

  it('omits the repository action when a project has no public URL', () => {
    const privateProject: PortfolioProject = {
      id: 'libera',
      name: 'Private study',
      category: 'Research',
      description: 'Not public.',
    };
    const html = renderToStaticMarkup(<ProjectCards projects={[privateProject]} />);

    expect(html).not.toContain('href=');
    expect(html).toContain('<article class="document-card"');
  });
});
