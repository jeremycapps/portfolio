import { describe, expect, it } from 'vitest';
import { loadQuestions } from './questions';

const valid = `
- id: zocdoc-work
  persona: recruiter
  turns:
    - "What did Jeremy work on at Zocdoc?"
- id: current-focus
  persona: peer
  notes: probes freshness
  turns:
    - "What is Jeremy building right now?"
    - "How does Facia relate to that?"
`;

describe('loadQuestions', () => {
  it('parses valid single- and multi-turn questions', () => {
    const questions = loadQuestions(valid);
    expect(questions).toHaveLength(2);
    expect(questions[0]).toEqual({
      id: 'zocdoc-work',
      persona: 'recruiter',
      turns: ['What did Jeremy work on at Zocdoc?'],
    });
    expect(questions[1].turns).toHaveLength(2);
    expect(questions[1].notes).toBe('probes freshness');
  });

  it('rejects duplicate ids', () => {
    const duplicate = `
- id: a
  persona: peer
  turns: ["x"]
- id: a
  persona: peer
  turns: ["y"]
`;
    expect(() => loadQuestions(duplicate)).toThrow(/duplicate id: a/i);
  });

  it('rejects an unknown persona', () => {
    expect(() => loadQuestions(`- id: a\n  persona: hiring-bot\n  turns: ["x"]`)).toThrow(/persona/i);
  });

  it('rejects empty turns and more than five turns', () => {
    expect(() => loadQuestions(`- id: a\n  persona: peer\n  turns: []`)).toThrow(/1 to 5/i);
    expect(() => loadQuestions(`- id: a\n  persona: peer\n  turns: ["1","2","3","4","5","6"]`)).toThrow(/1 to 5/i);
  });

  it('rejects a blank turn', () => {
    expect(() => loadQuestions(`- id: a\n  persona: peer\n  turns: ["  "]`)).toThrow(/non-empty/i);
  });

  it('rejects non-string notes', () => {
    expect(() => loadQuestions(`- id: a\n  persona: peer\n  notes: 42\n  turns: ["x"]`)).toThrow(/notes/i);
  });
});
