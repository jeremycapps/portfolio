import { Github } from 'lucide-react';
import { PORTFOLIO_PROJECTS, type PortfolioProject } from '../lib/projects';

interface ProjectCardsProps {
  projects?: readonly PortfolioProject[];
  onDescribe: (message: string) => void;
}

export function ProjectCards({ projects = PORTFOLIO_PROJECTS, onDescribe }: ProjectCardsProps) {
  return (
    <div className="document-grid">
      {projects.map((project, index) => (
        <article className="document-card" key={project.id} data-testid={`card-${project.id}`}>
          <button
            className="document-card-summary"
            type="button"
            onClick={() => onDescribe(project.toast)}
            aria-label={`Learn about ${project.name}`}
          >
            <div className="document-topline">
              <span>{project.category}</span>
              <span>{String(index + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}</span>
            </div>
            <div className="document-body">
              <h3>{project.name}</h3>
              <div className="document-rule" />
              <p className="document-copy">{project.description}</p>
              <div className="document-chart" aria-hidden="true"><span /><span /><span /><span /><span /></div>
            </div>
          </button>
          {project.repositoryUrl && (
            <a
              className="document-repository"
              href={project.repositoryUrl}
              target="_blank"
              rel="noreferrer noopener"
              data-testid={`link-repository-${project.id}`}
            >
              <Github aria-hidden="true" /> GitHub
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
