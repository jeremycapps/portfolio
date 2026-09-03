import { describe, expect, it } from 'vitest';
import { assembleResume } from '../../api/_lib/resume-source';
import { loadResumeCorpus } from '../../api/_lib/resume-corpus';
import { matchSummary } from '../../api/_lib/summary-router';
import { EXPECTED_SUMMARY_ID, STANDARD_RESUME_JD } from '../../scripts/resume-default-spec';
import { DEFAULT_RESUME } from './default-resume.generated';

describe('DEFAULT_RESUME (baked standard resume)', () => {
  it('matches assembleResume for the standard JD — the snapshot is not stale', async () => {
    const { view, provenance } = await assembleResume(STANDARD_RESUME_JD, loadResumeCorpus(), {
      hasModel: false,
    });
    expect(DEFAULT_RESUME).toEqual({ protocol: 'portfolio.resume/1', view, provenance });
  });

  it('leads with the reviewed forward-deployed summary, retrieved not generated', () => {
    expect(matchSummary(STANDARD_RESUME_JD)?.id).toBe(EXPECTED_SUMMARY_ID);
    expect(DEFAULT_RESUME.view.summary.engine).toBe('retrieved');
  });

  it('never depends on the model, so it can ship with the page', () => {
    expect(DEFAULT_RESUME.view.summary.engine).not.toBe('model');
    expect(DEFAULT_RESUME.provenance.modelPct).toBe(0);
    expect(DEFAULT_RESUME.provenance.deterministicPct).toBe(100);
  });

  it('renders a complete resume — real roles and projects, each with content', () => {
    expect(DEFAULT_RESUME.view.summary.text.length).toBeGreaterThan(0);

    expect(DEFAULT_RESUME.view.experience.length).toBeGreaterThan(0);
    for (const role of DEFAULT_RESUME.view.experience) {
      expect(role.organization).toBeTruthy();
      expect(role.bullets.length).toBeGreaterThan(0);
    }

    // The forward-deployed framing must surface the AI/agent project work as a
    // sentence each — the standard resume should never render project-less.
    expect(DEFAULT_RESUME.view.projects.length).toBeGreaterThan(0);
    for (const project of DEFAULT_RESUME.view.projects) {
      expect(project.name).toBeTruthy();
      expect(project.text.length).toBeGreaterThan(0);
    }
  });
});
