export interface LexicalOptions {
  readonly stopwords?: ReadonlySet<string>;
  readonly minLength?: number;
  readonly bigrams?: boolean;
}

export interface CompiledLexicalDocument<T> {
  readonly item: T;
  readonly terms: ReadonlySet<string>;
}

const compiledCache = new WeakMap<
  object,
  WeakMap<Function, Map<string, readonly CompiledLexicalDocument<unknown>[]>>
>();

function optionKey(options: LexicalOptions): string {
  const stopwords = options.stopwords ? [...options.stopwords].sort().join(',') : '';
  return `${options.minLength ?? 1}:${options.bigrams === true}:${stopwords}`;
}

/** Normalize text into deterministic lexical tokens, preserving occurrences. */
export function lexicalTokens(text: string, options: LexicalOptions = {}): string[] {
  const minLength = options.minLength ?? 1;
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? [])
    .filter((word) => word.length >= minLength && !options.stopwords?.has(word));
}

/** Normalize text into unique lexical features with optional adjacent bigrams. */
export function lexicalTerms(text: string, options: LexicalOptions = {}): Set<string> {
  const words = lexicalTokens(text, options);
  const terms = new Set(words);
  if (options.bigrams) {
    for (let index = 0; index < words.length - 1; index += 1) {
      terms.add(`${words[index]} ${words[index + 1]}`);
    }
  }
  return terms;
}

export function overlapCount(left: ReadonlySet<string>, right: ReadonlySet<string>): number {
  let count = 0;
  for (const term of left) if (right.has(term)) count += 1;
  return count;
}

export function matchingTokenCount(
  tokens: readonly string[],
  query: ReadonlySet<string>,
): number {
  return tokens.reduce((count, token) => count + (query.has(token) ? 1 : 0), 0);
}

/** Compile static corpus prose once; repeated queries reuse the same term sets. */
export function compileLexicalDocuments<T>(
  source: readonly T[],
  extract: (item: T) => string,
  options: LexicalOptions = {},
): readonly CompiledLexicalDocument<T>[] {
  let byExtractor = compiledCache.get(source);
  if (!byExtractor) {
    byExtractor = new WeakMap();
    compiledCache.set(source, byExtractor);
  }
  let byOptions = byExtractor.get(extract);
  if (!byOptions) {
    byOptions = new Map();
    byExtractor.set(extract, byOptions);
  }
  const key = optionKey(options);
  const cached = byOptions.get(key);
  if (cached) return cached as readonly CompiledLexicalDocument<T>[];

  const compiled = source.map((item) => ({ item, terms: lexicalTerms(extract(item), options) }));
  byOptions.set(key, compiled);
  return compiled;
}
