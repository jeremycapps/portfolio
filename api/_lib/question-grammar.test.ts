import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseQuestion, roleOf } from './question-grammar';

describe('question grammar', () => {
  it('reads one open place as a value', () => {
    const p = parseQuestion("What was Jeremy's title at Zocdoc?");
    expect(p).toMatchObject({ word: 'what', arity: '1·open', role: 'value' });
  });

  it('reads a fronted auxiliary as a closed judgment', () => {
    const p = parseQuestion('Did Jeremy lead the accessibility program at Zocdoc?');
    expect(p).toMatchObject({ word: '∅', verb: 'polar', arity: '1·closed', role: 'verdict' });
  });

  it('reads two named alternatives as a bounded judgment', () => {
    const p = parseQuestion('Is Jeremy an accessibility specialist, or a generalist who has worked under accessibility requirements?');
    expect(p).toMatchObject({ arity: '2·alternative', role: 'verdict' });
  });

  it('reads two terms joined by a relation as an operation', () => {
    const p = parseQuestion("How would Jeremy's design-system experience apply to building a component library at a fintech?");
    expect(p).toMatchObject({ verb: 'relational', arity: '2·relational', role: 'operation' });
  });

  it('reads a range over a sequence as a convergence', () => {
    const p = parseQuestion('Across his roles, is Jeremy more of a specialist or a broad generalist?');
    expect(p).toMatchObject({ arity: 'n·sequential', role: 'convergence' });
  });

  it('classifies a company question by the same rules as a candidate question', () => {
    expect(roleOf('Does advantage come from assets the company controls or interactions it enables?'))
      .toBe(roleOf('Is Jeremy an accessibility specialist, or a generalist who has worked under accessibility requirements?'));
  });

  // Not a correctness claim — a regression guard. The labels in questions.yaml
  // are themselves arguable; this pins the measured agreement so a change to
  // the grammar cannot silently degrade it.
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
