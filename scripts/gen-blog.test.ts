import { describe, expect, it } from 'vitest';
import { buildBlogData, parseBlogSource } from './gen-blog.mjs';

const validArticle = `---
title: A useful system
slug: useful-system
date: 2026-08-26
summary: A short description.
kind: article
status: Draft · August 2026
---
# The body

Article copy.
`;

describe('gen-blog', () => {
  it('parses article metadata and captures its Markdown body', () => {
    const parsed = parseBlogSource(validArticle, 'useful-system.md');

    expect(parsed.meta).toEqual({
      title: 'A useful system',
      slug: 'useful-system',
      date: '2026-08-26',
      summary: 'A short description.',
      kind: 'article',
      status: 'Draft · August 2026',
    });
    expect(parsed.body).toContain('# The body');
  });

  it('rejects a missing required field', () => {
    expect(() => parseBlogSource(validArticle.replace('summary: A short description.\n', ''), 'missing.md'))
      .toThrow(/missing\.md: frontmatter field "summary"/);
  });

  it('rejects an invalid calendar date with a file-specific error', () => {
    expect(() => parseBlogSource(validArticle.replace('2026-08-26', '2026-99-99'), 'bad-date.md'))
      .toThrow(/bad-date\.md: frontmatter field "date"/);
  });

  it('rejects duplicate slugs', () => {
    expect(() => buildBlogData([
      { fileName: 'one.md', source: validArticle },
      { fileName: 'two.md', source: validArticle.replace('A useful system', 'Another system') },
    ])).toThrow(/two\.md: duplicate slug "useful-system"/);
  });

  it('rejects a paper without an artifact destination', () => {
    const paper = validArticle.replace('kind: article', 'kind: paper');
    expect(() => parseBlogSource(paper, 'paper.md'))
      .toThrow(/paper\.md: paper posts require/);
  });

  it('sorts metadata newest first and only captures article bodies', () => {
    const olderPaper = `---
title: Linked paper
slug: linked-paper
date: 2026-01-02
summary: A linked artifact.
kind: paper
sourceUrl: https://example.com/paper
---
Ignored paper body.
`;
    const result = buildBlogData([
      { fileName: 'paper.md', source: olderPaper },
      { fileName: 'article.md', source: validArticle },
    ]);

    expect(result.posts.map((post) => post.slug)).toEqual(['useful-system', 'linked-paper']);
    expect(result.articleBodies).toEqual({ 'useful-system': expect.stringContaining('# The body') });
  });
});
