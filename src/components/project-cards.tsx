import { PORTFOLIO_PROJECTS, type PortfolioProject } from '../lib/projects';

interface ProjectCardsProps {
  projects?: readonly PortfolioProject[];
}

function ProjectCardContent({ project, index, total }: {
  project: PortfolioProject;
  index: number;
  total: number;
}) {
  return (
    <>
      <div className="document-topline">
        <span>{project.category}</span>
        <span>{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      </div>
      <div className="document-body">
        <h3>{project.name}</h3>
        <div className="document-rule" />
        <p className="document-copy">{project.description}</p>
        <div className="document-chart" aria-hidden="true"><span /><span /><span /><span /><span /></div>
      </div>
    </>
  );
}

export function ProjectCards({ projects = PORTFOLIO_PROJECTS }: ProjectCardsProps) {
  return (
    <div className="document-grid">
      {projects.map((project, index) => project.repositoryUrl ? (
        <a
          className="document-card"
          key={project.id}
          href={project.repositoryUrl}
          target="_blank"
          rel="noreferrer noopener"
          aria-label={`${project.name} on GitHub`}
          data-testid={`card-${project.id}`}
        >
          <ProjectCardContent project={project} index={index} total={projects.length} />
        </a>
      ) : (
        <article className="document-card" key={project.id} data-testid={`card-${project.id}`}>
          <ProjectCardContent project={project} index={index} total={projects.length} />
        </article>
      ))}
    </div>
  );
}
