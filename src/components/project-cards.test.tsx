import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PortfolioProject } from '../lib/projects';
import { ProjectCards } from './project-cards';

describe('ProjectCards', () => {
  it('renders repository links from shared project data with safe external behavior', () => {
    const html = renderToStaticMarkup(<ProjectCards onDescribe={() => undefined} />);

    expect(html).toContain('href="https://github.com/jeremycapps/libera"');
    expect(html).toContain('href="https://github.com/jeremycapps/facia"');
    expect(html).toContain('href="https://github.com/jeremycapps/corus-workbench"');
    expect(html.match(/target="_blank"/g)).toHaveLength(3);
    expect(html.match(/rel="noreferrer noopener"/g)).toHaveLength(3);
  });

  it('omits the repository action when a project has no public URL', () => {
    const privateProject: PortfolioProject = {
      id: 'libera',
      name: 'Private study',
      category: 'Research',
      description: 'Not public.',
      toast: 'Private study.',
    };
    const html = renderToStaticMarkup(
      <ProjectCards projects={[privateProject]} onDescribe={() => undefined} />,
    );

    expect(html).not.toContain('document-repository');
    expect(html).not.toContain('href=');
  });
});
