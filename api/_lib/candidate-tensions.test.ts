import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CANDIDATE_TENSIONS, danglingReferences, uncitedPoles,
} from './candidate-tensions';

describe('the candidate tension index', () => {
  it('cites no engagement or evidence id the corpus does not hold', () => {
    expect(danglingReferences()).toEqual([]);
  });

  it('traces every tension to a question a recruiter actually asked', () => {
    const asked = readFileSync('eval/questions.yaml', 'utf8');
    const missing = CANDIDATE_TENSIONS
      .filter((t) => !asked.includes(t.question))
      .map((t) => `${t.id}: ${t.question}`);
    expect(missing).toEqual([]);
  });

  it('records an uncited pole only where the evidence genuinely places him elsewhere', () => {
    // A pole with no citations asserts an absence. Each of these is deliberate:
    // the corpus contains nothing supporting that side, which is the finding.
    expect(uncitedPoles().map((p) => `${p.tension}.${p.pole}`)).toEqual([
      'practice-depth.left',    // no evidence he was an accessibility specialist
      'stack-reach.left',       // no evidence he is frontend-only
      'system-status.left',     // no evidence Domain/Corus is a production system
      'ai-depth.right',         // the AI work is engineering, not interest
      'leadership-form.left',   // no evidence of formal people management
    ]);
  });

  it('carries a caution wherever the corpus constrains what may be claimed', () => {
    const governed = ['practice-depth', 'output-maturity', 'system-status', 'ai-depth', 'leadership-form'];
    for (const id of governed) {
      const t = CANDIDATE_TENSIONS.find((x) => x.id === id);
      expect(t?.caution, `${id} must carry its corpus caution`).toBeTruthy();
    }
  });

  it('gives every tension a basis sentence and a placement', () => {
    for (const t of CANDIDATE_TENSIONS) {
      expect(t.basis.length, `${t.id} basis`).toBeGreaterThan(40);
      expect(['left', 'right', 'both', 'shifting']).toContain(t.placement);
    }
  });
});
