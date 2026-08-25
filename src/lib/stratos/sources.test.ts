import { describe, expect, it } from 'vitest';
import { TENSIONS } from './ontology';
import { lensCitations } from './sources';

describe('StratOS source citations', () => {
  it('resolves every ontology lens to a source and role-specific framing', () => {
    const citations = TENSIONS.flatMap((tension) => [
      ...lensCitations(tension.lensLeft),
      ...lensCitations(tension.lensRight),
    ]);

    expect(citations).toHaveLength(18);
    expect(new Set(citations.map((citation) => citation.id)).size).toBe(15);
    expect(citations.every((citation) => citation.framing.length > 0)).toBe(true);
  });

  it('attributes workforce capacity to Ton and the Human Economics lens', () => {
    const resource = TENSIONS.find((tension) => tension.id === 'resource');
    expect(resource).toBeDefined();

    expect(lensCitations(resource!.lensLeft)[0]).toMatchObject({
      id: 'ton_10',
      author: 'Zeynep Ton',
      year: 2023,
      pillar: 'Human Economics',
      role: 'counterweight',
    });
  });
});
