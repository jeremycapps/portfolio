import { describe, expect, it } from 'vitest';
import { validateAnswerSet } from '@facia/core';
import { buildOfficerAnswerSet, buildTensionAnswerSet, buildVerdictAnswerSet } from './answer-sets';
import { ownerOf, TENSIONS, type PlacedSide, type PoleSide } from './ontology';

describe('StratOS board agenda answers', () => {
  it('explains the agenda item with the tension and pole, not a representative value', () => {
    const answer = buildOfficerAnswerSet(TENSIONS[0], 'l');
    const payload = answer.items[0].payload as Record<string, unknown>;

    expect(payload.because).toBe('Advantage · Controlled value chain');
    expect(payload.because).not.toContain('0.50');
  });

  it('reserves the mandate for the board agenda answer', () => {
    const tensionAnswer = buildTensionAnswerSet(TENSIONS[0], 'l');
    const tensionPayload = tensionAnswer.items[0].payload as Record<string, unknown>;
    const agendaAnswer = buildOfficerAnswerSet(TENSIONS[0], 'l');
    const agendaPayload = agendaAnswer.items[0].payload as Record<string, unknown>;

    expect(tensionPayload).not.toHaveProperty('mandate');
    expect(tensionPayload).toHaveProperty('growthLens');
    expect(agendaPayload).toHaveProperty('mandate');
  });
});

describe('StratOS answer sets are contract-valid', () => {
  it('validates every tension placement, officer, and the verdict', () => {
    const built = [buildVerdictAnswerSet()];
    for (const tension of TENSIONS) {
      for (const side of ['l', 'neutral', 'r'] as PoleSide[]) {
        built.push(buildTensionAnswerSet(tension, side));
      }
      for (const side of ['l', 'r'] as PlacedSide[]) {
        built.push(buildOfficerAnswerSet(tension, side));
      }
    }

    const failures = built
      .map((answer) => validateAnswerSet(answer))
      .filter((result) => !result.valid);

    expect(failures).toEqual([]);
  });
});

describe('the tension trace records only what resolved', () => {
  it('omits the declared position, which is not a resolution input', () => {
    const answer = buildTensionAnswerSet(TENSIONS[0], 'l');
    const steps = answer.trace?.kind === 'direct'
      ? answer.trace.entries.map((entry) => entry.step)
      : [];

    expect(steps).toEqual(['pole.resolved', 'owner.resolved']);
    expect(steps).not.toContain('position.declared');
  });
});

describe('the placed pole is field-addressable', () => {
  it('carries the pole in payload, not only in the non-projectable output member', () => {
    const answer = buildTensionAnswerSet(TENSIONS[0], 'l');
    const payload = answer.items[0].payload as Record<string, unknown>;

    expect(payload.pole).toBe('Controlled value chain');
    expect(payload.growthLens).toBeDefined();
  });

  it('declares pole primary and growthLens secondary', () => {
    const answer = buildTensionAnswerSet(TENSIONS[0], 'l');
    expect(answer.items[0].fields?.priority.primary).toEqual(['pole']);
    expect(answer.items[0].fields?.priority.secondary).toEqual(['growthLens']);
  });
});

describe('officer questions are structured data', () => {
  it('carries questions as an array rather than a delimited string', () => {
    const answer = buildOfficerAnswerSet(TENSIONS[0], 'l');
    const payload = answer.items[0].payload as Record<string, unknown>;

    expect(Array.isArray(payload.questions)).toBe(true);
    expect(payload.questions).toEqual(ownerOf(TENSIONS[0], 'l').questions);
  });
});
