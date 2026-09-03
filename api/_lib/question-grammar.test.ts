import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  isEnumerating,
  isPolar,
  namesAlternatives,
  relatesTwoFrames,
  weighsEvidence,
  parseQuestion,
  roleOf,
  isTwoPole,
} from './question-grammar';

describe('feature detectors', () => {
  describe('isEnumerating', () => {
    it('is true for "which X"', () => {
      expect(isEnumerating('which components did jeremy build')).toBe(true);
    });
    it('is true for "what kind(s) of X"', () => {
      expect(isEnumerating('what kinds of roles is jeremy looking for')).toBe(true);
    });
    it('is false for a plain "what" lookup', () => {
      expect(isEnumerating("what was jeremy's title at zocdoc")).toBe(false);
    });
  });

  describe('isPolar', () => {
    it('is true for a fronted auxiliary', () => {
      expect(isPolar('did jeremy lead the accessibility program')).toBe(true);
    });
    it('is false when the question opens with a content word', () => {
      expect(isPolar('what was jeremy\'s title')).toBe(false);
    });
  });

  describe('namesAlternatives', () => {
    it('is true when the question offers two named alternatives', () => {
      expect(namesAlternatives('is jeremy a specialist, or a generalist')).toBe(true);
    });
    it('is true for a bare "or" without a comma', () => {
      expect(namesAlternatives('is domain/corus a production system or a prototype')).toBe(true);
    });
    it('is false for "or not"', () => {
      expect(namesAlternatives('did it ship or not')).toBe(false);
    });
    it('defers to enumeration — "which" is a set, not two alternatives', () => {
      expect(namesAlternatives('which product integrations did jeremy build on 360sync')).toBe(false);
    });
  });

  describe('relatesTwoFrames', () => {
    it('is true for a relational verb with a second argument', () => {
      expect(relatesTwoFrames('how does this compare to the other one')).toBe(true);
    });
    it('is true for "apply to"', () => {
      expect(relatesTwoFrames("how would jeremy's experience apply to a fintech role")).toBe(true);
    });
    it('is true for "build on"', () => {
      expect(relatesTwoFrames("how does this work build on his earlier roles")).toBe(true);
    });
    it('is true for the noun "impact" — a cause naming its effect', () => {
      expect(relatesTwoFrames('what measurable impact did jeremy have at zocdoc')).toBe(true);
    });
    it('is false for an unrelated verb', () => {
      expect(relatesTwoFrames('what did jeremy work on at zocdoc')).toBe(false);
    });
    it('generalizes beyond the eval vocabulary to an unseen relational verb', () => {
      expect(relatesTwoFrames('how does this framework connect to the older one')).toBe(true);
    });
  });

  describe('weighsEvidence', () => {
    it('is true for an evidence-weighing opener', () => {
      expect(weighsEvidence('based on his history, how quickly could jeremy ramp')).toBe(true);
      expect(weighsEvidence('given his shift into operations, where is his career heading')).toBe(true);
      expect(weighsEvidence('weighing his component ownership, how deep is his expertise')).toBe(true);
    });
    it('is true for an explicit range over roles or career', () => {
      expect(weighsEvidence('across his roles, is jeremy a specialist or a generalist')).toBe(true);
    });
    it('is true for the recommendation idiom "why should"', () => {
      expect(weighsEvidence('why should a team hire jeremy')).toBe(true);
    });
    it('is true for a temporal-continuity marker like "still"', () => {
      expect(weighsEvidence('can jeremy still ship production engineering, or is he mostly prototyping now')).toBe(true);
    });
    it('is true for evaluative-fit vocabulary (strongest, suited, ready, seniority)', () => {
      expect(weighsEvidence("what is jeremy's strongest technical area")).toBe(true);
      expect(weighsEvidence('what kind of team would suit his working style')).toBe(true);
      expect(weighsEvidence('what seniority level is jeremy a fit for')).toBe(true);
    });
    it('is false for a plain fact lookup', () => {
      expect(weighsEvidence("what was jeremy's title at zocdoc")).toBe(false);
    });
    it('does not fire on "interest" — no bare morphological superlative rule', () => {
      expect(weighsEvidence('does jeremy have real experience, or just interest')).toBe(false);
    });
    it('does not fire on the relational verb "fit" used as a two-frame map', () => {
      expect(weighsEvidence('how well would jeremy\'s stack fit a typescript-heavy role')).toBe(false);
    });
  });
});

describe('parseQuestion / operator precedence', () => {
  it('reads one open place as a lookup -> value', () => {
    const p = parseQuestion("What was Jeremy's title at Zocdoc?");
    expect(p).toMatchObject({ lead: 'what', operator: 'lookup', role: 'value' });
  });

  it('reads a fronted auxiliary as a judge -> verdict', () => {
    const p = parseQuestion('Did Jeremy lead the accessibility program at Zocdoc?');
    expect(p).toMatchObject({ lead: '∅', operator: 'judge', role: 'verdict' });
  });

  it('reads two named alternatives as a judge -> verdict', () => {
    const p = parseQuestion('Is Jeremy an accessibility specialist, or a generalist who has worked under accessibility requirements?');
    expect(p).toMatchObject({ operator: 'judge', role: 'verdict' });
  });

  it('reads a relation between two terms as a map -> operation', () => {
    const p = parseQuestion("How would Jeremy's design-system experience apply to building a component library at a fintech?");
    expect(p).toMatchObject({ operator: 'map', role: 'operation' });
  });

  it('reads a range over evidence as a trace -> convergence', () => {
    const p = parseQuestion('Across his roles, is Jeremy more of a specialist or a broad generalist?');
    expect(p).toMatchObject({ operator: 'trace', role: 'convergence' });
  });

  it('enumeration outranks a relational verb inside it — a set has one open place', () => {
    const p = parseQuestion('Which product integrations did Jeremy build on 360Sync?');
    expect(p).toMatchObject({ operator: 'lookup', role: 'value' });
  });

  it('evidence outranks named alternatives — "still X, or Y" asks for a trajectory', () => {
    const p = parseQuestion('Do Jeremy\'s current projects show he can still ship production engineering, or is he mostly prototyping now?');
    expect(p).toMatchObject({ operator: 'trace', role: 'convergence' });
  });

  it('classifies a company question by the same rules as a candidate question', () => {
    expect(roleOf('Does advantage come from assets the company controls or interactions it enables?'))
      .toBe(roleOf('Is Jeremy an accessibility specialist, or a generalist who has worked under accessibility requirements?'));
  });
});

describe('isTwoPole', () => {
  it('is true for a judged, named two-way alternative', () => {
    expect(isTwoPole('Is Jeremy an accessibility specialist, or a generalist who has worked under accessibility requirements?')).toBe(true);
  });
  it('is false when the alternatives are subordinate to an evidence trace', () => {
    expect(isTwoPole('Across his roles, is Jeremy more of a specialist or a broad generalist?')).toBe(false);
  });
  it('is false when the alternatives are subordinate to a temporal-continuity trace', () => {
    expect(isTwoPole('Do Jeremy\'s current projects show he can still ship production engineering, or is he mostly prototyping now?')).toBe(false);
  });
  it('is false for a plain polar question with no named alternatives', () => {
    expect(isTwoPole('Did Jeremy lead the accessibility program at Zocdoc?')).toBe(false);
  });
});

describe('recruiter eval set agreement', () => {
  // Not a correctness claim — a regression guard. The labels in questions.yaml
  // are themselves arguable; this pins the measured agreement so a change to
  // the grammar cannot silently degrade it. Baseline measured against the
  // regex classifier this module replaces: 46/50 (92%).
  it('agrees with at least 85% of the labels a human put on the recruiter set', () => {
    const yaml = readFileSync('eval/questions.yaml', 'utf8');
    const MAP: Record<string, string> = {
      atomic: 'value', composite: 'verdict', operational: 'operation', converging: 'convergence',
    };
    let asked = 0;
    let agreed = 0;
    for (const entry of yaml.split(/\n(?=- id: )/)) {
      if (!/persona: recruiter/.test(entry)) continue;
      const declared = MAP[/pattern: (\S+)/.exec(entry)?.[1] ?? ''];
      if (!declared) continue;
      for (const m of entry.matchAll(/^\s+- "(.+)"$/gm)) {
        asked += 1;
        if (roleOf(m[1]) === declared) agreed += 1;
      }
    }
    expect(asked).toBeGreaterThan(40);
    expect(agreed / asked).toBeGreaterThanOrEqual(0.85);
  });
});
