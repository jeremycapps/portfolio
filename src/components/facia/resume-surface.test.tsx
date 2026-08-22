import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { ResumeProvenance, ResumeView } from '@/lib/resume';
import { ResumeSurface } from './resume-surface';

const view: ResumeView = {
  header: { name: 'Jeremy Capps', contacts: ['jeremy@nycwork.space', 'New York, NY'] },
  summary: { text: 'Tailored summary.', engine: 'model' },
  experience: [
    {
      organization: 'Aroko',
      roleContext: ['Head of Operations'],
      timePeriod: '2024–Present',
      bullets: ['Built a budgeting system.', 'Ran vendor negotiations.'],
      sourceRefs: ['aroko-1'],
    },
  ],
  skills: [{ group: 'Frontend', items: ['React', 'TypeScript'] }],
  education: [{ degree: 'BFA, Graphic Design' }],
  projects: [
    { id: 'facia', name: 'Facia', text: 'Deterministic answer resolver.', sourceRefs: ['facia-1'] },
  ],
  awards: [{ name: 'NEW INC Fellowship, Social Architecture', year: 2025 }],
};

const provenance: ResumeProvenance = {
  deterministicPct: 91,
  modelPct: 9,
  operations: [
    { kind: 'selection', engine: 'deterministic', detail: '4 bullets scored' },
    { kind: 'summary', engine: 'model', detail: '1 model call' },
  ],
};

function render(next: Partial<{ view: ResumeView; provenance: ResumeProvenance }> = {}) {
  return renderToStaticMarkup(
    <ResumeSurface view={next.view ?? view} provenance={next.provenance ?? provenance} />,
  );
}

describe('ResumeSurface', () => {
  it('renders the verbatim bullet, header, and provenance headline', () => {
    const html = render();
    expect(html).toContain('Built a budgeting system.');
    expect(html).toContain('Jeremy Capps');
    expect(html).toContain('jeremy@nycwork.space');
    expect(html).toContain('91% deterministic');
    expect(html).toContain('9% model');
  });

  it('marks the summary as model-authored', () => {
    const html = render();
    expect(html).toContain('data-engine="model"');
    expect(html).toContain('model-written');
  });

  it('omits the model-authored tag when the summary is deterministic', () => {
    const html = render({ view: { ...view, summary: { text: 'Source summary.', engine: 'deterministic' } } });
    expect(html).toContain('data-engine="deterministic"');
    expect(html).not.toContain('model-written');
  });

  it('collapses the provenance audit trail until the badge is expanded', () => {
    const html = render();
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('4 bullets scored');
  });

  it('renders skills, education, projects, and awards sections', () => {
    const html = render();
    expect(html).toContain('Frontend');
    expect(html).toContain('React, TypeScript');
    expect(html).toContain('BFA, Graphic Design');
    expect(html).toContain('Deterministic answer resolver.');
    expect(html).toContain('Awards');
    expect(html).toContain('NEW INC Fellowship, Social Architecture');
    expect(html).toContain('2025');
  });

  it('drops optional sections that have no entries', () => {
    const html = render({ view: { ...view, skills: [], education: [], projects: [], awards: [] } });
    expect(html).not.toContain('Skills');
    expect(html).not.toContain('Education');
    expect(html).not.toContain('Projects');
    expect(html).not.toContain('Awards');
    expect(html).toContain('Experience');
  });
});
