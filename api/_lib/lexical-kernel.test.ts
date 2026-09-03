import { describe, expect, it } from 'vitest';
import {
  compileLexicalDocuments,
  lexicalTerms,
  lexicalTokens,
  matchingTokenCount,
  overlapCount,
} from './lexical-kernel';

describe('lexical retrieval kernel', () => {
  it('normalizes words and optionally retains adjacent authored signals', () => {
    expect(lexicalTerms('Data mapping / API!', { minLength: 3 })).toEqual(
      new Set(['data', 'mapping', 'api']),
    );
    expect(lexicalTerms('Data mapping / API!', { minLength: 3, bigrams: true })).toEqual(
      new Set(['data', 'mapping', 'api', 'data mapping', 'mapping api']),
    );
  });

  it('counts query terms present in a compiled document', () => {
    expect(overlapCount(new Set(['api', 'mapping']), new Set(['api', 'client']))).toBe(1);
    expect(lexicalTokens('API api mapping')).toEqual(['api', 'api', 'mapping']);
    expect(matchingTokenCount(['api', 'api', 'mapping'], new Set(['api']))).toBe(2);
  });

  it('compiles immutable document terms once per source object and options', () => {
    const source = [{ id: 'a', text: 'API data mapping' }];
    const extract = (item: (typeof source)[number]) => item.text;
    const first = compileLexicalDocuments(source, extract, { minLength: 3 });
    const second = compileLexicalDocuments(source, extract, { minLength: 3 });

    expect(second).toBe(first);
    expect(first[0]).toEqual({ item: source[0], terms: new Set(['api', 'data', 'mapping']) });
  });
});
