import { describe, expect, it } from 'vitest';
import { buildOfficerAnswerSet, buildTensionAnswerSet } from './answer-sets';
import { TENSIONS } from './ontology';

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
