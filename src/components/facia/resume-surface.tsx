import { useState } from 'react';
import type { ResumeProvenance, ResumeView } from '@/lib/resume';

interface ResumeSurfaceProps {
  view: ResumeView;
  provenance: ResumeProvenance;
}

export function ResumeSurface({ view, provenance }: ResumeSurfaceProps) {
  const [showAudit, setShowAudit] = useState(false);

  return (
    <section className="resume-surface" aria-label="Tailored resume" data-testid="resume-surface">
      <div className="resume-provenance" data-testid="resume-provenance">
        <button
          type="button"
          className="resume-provenance-badge"
          aria-expanded={showAudit}
          onClick={() => setShowAudit((open) => !open)}
          data-testid="button-resume-provenance"
        >
          <strong>{provenance.deterministicPct}% deterministic</strong>
          <span>/ {provenance.modelPct}% model</span>
        </button>

        {showAudit && (
          <ul className="resume-audit" data-testid="resume-audit">
            {provenance.operations.map((operation, index) => (
              <li key={`${operation.kind}-${index}`} data-engine={operation.engine}>
                <span className="resume-audit-kind">{operation.kind}</span>
                <span className="resume-audit-engine">{operation.engine}</span>
                <span className="resume-audit-detail">{operation.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <header className="resume-header">
        <h2>{view.header.name}</h2>
        <p className="resume-contacts">{view.header.contacts.join(' · ')}</p>
      </header>

      <section className="resume-block">
        <h3>Summary</h3>
        <p className="resume-summary" data-engine={view.summary.engine} data-testid="resume-summary">
          {view.summary.text}
          {view.summary.engine === 'model' && <span className="resume-model-tag"> · model-written</span>}
        </p>
      </section>

      <section className="resume-block">
        <h3>Experience</h3>
        {view.experience.map((experience, index) => (
          <article className="resume-exp" key={`${experience.organization}-${index}`}>
            <div className="resume-exp-head">
              <span className="resume-exp-org">{experience.organization}</span>
              <span className="resume-exp-period">{experience.timePeriod}</span>
            </div>
            <p className="resume-exp-role">{experience.roleContext.join(' · ')}</p>
            <ul>
              {experience.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {view.skills.length > 0 && (
        <section className="resume-block">
          <h3>Skills</h3>
          {view.skills.map((skill) => (
            <p className="resume-skill" key={skill.group}>
              <strong>{skill.group}:</strong> {skill.items.join(', ')}
            </p>
          ))}
        </section>
      )}

      {view.education.length > 0 && (
        <section className="resume-block">
          <h3>Education</h3>
          {view.education.map((entry, index) => (
            <p key={`${entry.degree}-${index}`}>{entry.degree}</p>
          ))}
        </section>
      )}

      {view.projects.length > 0 && (
        <section className="resume-block">
          <h3>Projects</h3>
          {view.projects.map((project) => (
            <article className="resume-exp" key={project.id}>
              <div className="resume-exp-head">
                <span className="resume-exp-org">{project.name}</span>
              </div>
              <p>{project.text}</p>
            </article>
          ))}
        </section>
      )}
    </section>
  );
}
