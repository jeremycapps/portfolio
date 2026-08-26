# Blog section — Design

**Date:** 2026-08-26
**Status:** approved for implementation
**Author:** Jeremy Capps (design brainstormed with Claude)
**Related research:** [`docs/writing-section-candidates.md`](../../writing-section-candidates.md) — the ranked survey of source material this section draws on.

## Goal

Add a blog section to the portfolio that surfaces Jeremy's written work — primarily
the Domain / Facia / systems whitepapers — as first-class, linkable pages. The driving
use case (from the "Jonathan" thread, Claude conversation #226): a senior reader should
be able to **skim and download the papers without going through the chat interface**.
The chat is what they find *after* they're convinced, not a toll booth in front of the
work.

## Non-goals

- No CMS, no admin UI, no comments, no tags/taxonomy, no RSS. Authoring is editing
  Markdown files in the repo.
- No runtime filesystem access or server route. The blog is static, compiled at build
  time like the rest of the site.
- No changes to the chat renderer, the chat/answer APIs, or the Facia surfaces.
- Not converting every paper to an on-page article (see Presentation below).

## Presentation model (decided: hybrid)

Each post is one of two kinds:

- **`article`** — renders as an in-page web article at `/blog/:slug`. Used for pieces
  that already exist as Markdown and read well on-page.
- **`paper`** — a card in the index that links out to a source artifact (a PDF served
  from `/public`, or a GitHub URL). No in-page body. Used for PDF-first pieces where
  on-page conversion would lose fidelity or isn't worth the effort.

This honors the skim/download intent, avoids risky PDF→Markdown conversion, and still
lets the strongest already-Markdown pieces read as real articles.

## Architecture

The blog follows the site's existing **author-Markdown → compile-to-TS → import** pattern
(exactly how `content/profile.md` becomes `api/_lib/profile.generated.ts` via
`scripts/gen-profile.mjs`, and how StratOS recipes become
`src/lib/stratos/recipes.generated.ts`).

```
content/blog/*.md ──(scripts/gen-blog.mjs, at predev/prebuild)──▶ src/lib/blog/posts.generated.ts
                                                                          │
                                                          ┌───────────────┴───────────────┐
                                                     /blog (index)                 /blog/:slug (article)
                                                     src/pages/blog.tsx            src/pages/blog-post.tsx
                                                                          │
                                                              src/components/blog-content.tsx
                                                              (react-markdown + remark-gfm)
```

### 1. Content model — `content/blog/*.md`

One Markdown file per post. YAML frontmatter, then the body. Frontmatter schema:

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `title` | yes | string | Display title. |
| `slug` | yes | string | URL segment, kebab-case. Must be unique. |
| `date` | yes | string | ISO `YYYY-MM-DD`. Sort key (newest first). |
| `summary` | yes | string | One–two sentences for the index card. |
| `kind` | yes | `"article"` \| `"paper"` | Determines routing and whether the body is used. |
| `status` | no | string | Honest status line, e.g. `"Draft · July 2026"`. Shown as card/article metadata. |
| `pdf` | no | string | Path under `/public`, e.g. `/blog/domain-second-order-convergence.pdf`. Required when `kind: paper` unless `sourceUrl` is set. |
| `sourceUrl` | no | string | `https://` link (e.g. a GitHub repo/doc) for `paper` posts without a hosted PDF. |

Rules:
- `article` posts use their Markdown body; `paper` posts may have an empty body (the
  index card links out).
- Every `paper` post must have at least one of `pdf` or `sourceUrl`.
- PDFs live in `public/blog/`.

### 2. Build step — `scripts/gen-blog.mjs`

Modeled on the existing `scripts/gen-profile.mjs`.

- Read every `content/blog/*.md`.
- Parse frontmatter with the already-installed `yaml` package (no new dependency for
  parsing). Split on the leading `---` fence.
- Validate each file against the schema above; **fail the build loudly** on a missing
  required field, a duplicate `slug`, a `paper` with neither `pdf` nor `sourceUrl`, or a
  `pdf` path that does not resolve to a file in `public/`.
- Emit `src/lib/blog/posts.generated.ts`:
  - `BLOG_POSTS`: a readonly array of post **metadata** (all frontmatter fields, no
    body), sorted by `date` descending — this powers the index.
  - `BLOG_ARTICLE_BODIES`: a `Record<slug, string>` of raw Markdown bodies for `article`
    posts only — imported by the article page.
  - Exported TypeScript types (`BlogPostMeta`, `BlogKind`).
- Header comment marking the file auto-generated, matching the other generators.
- The generated file is **committed** (matching `recipes.generated.ts`), and regenerated
  by the `predev`/`prebuild` hooks.

Wire into `package.json`:
- Add `"gen:blog": "node scripts/gen-blog.mjs"`.
- Add `npm run gen:blog` to both `predev` and `prebuild`, after `gen:profile`.

### 3. Routes & pages

Both routes are **lazy-loaded**, exactly like `/stratos` in `src/App.tsx` (own chunk,
`Suspense` fallback, inside the existing `RoutedErrorBoundary`):

```tsx
<Route path="/blog" component={/* lazy */ BlogPage} />
<Route path="/blog/:slug">{(params) => <Suspense…><BlogPostPage slug={params.slug} /></Suspense>}</Route>
```

- **`src/pages/blog.tsx`** — the index. Reuses `SiteBrand` and the site header. Renders
  `BLOG_POSTS` as a list of cards: title, `date`, `summary`, a small tag showing
  `kind` ("Essay" / "Paper") and `status` if present.
  - `article` card → internal link to `/blog/:slug`.
  - `paper` card → link to `pdf` (served from `/public`) or `sourceUrl`; external links
    open in a new tab with `rel="noreferrer noopener"`.
- **`src/pages/blog-post.tsx`** — one article. Looks up the slug in `BLOG_POSTS`.
  - If found and `kind: article`: render title, date/status, and the body via
    `BlogContent`. Include a "← Blog" back link.
  - If found and `kind: paper`: redirect to its `pdf`/`sourceUrl` (papers have no
    on-page body).
  - If not found: render the existing `NotFound` page (or its content), consistent with
    the app's 404 handling.

### 4. Rendering — `src/components/blog-content.tsx`

A blog-specific Markdown renderer, separate from the chat's `MarkdownContent` (which
stays untouched):

- `react-markdown` + **`remark-gfm`** (new dependency, `^4`) so Markdown **tables** and
  GFM lists render — the chat renderer omits gfm and cannot show the tables that
  Facia v2 and the Domain papers rely on.
- Keep `skipHtml` and reuse the same link-safety policy as `MarkdownContent`
  (`validateMarkdownLink`: allow `https:`, `mailto:`, and root-relative internal links
  only; `https` opens in a new tab). Factor `validateMarkdownLink` out so both renderers
  share it rather than duplicating the rule.
- Fenced code blocks render as-is (the papers use ```text ASCII diagrams). Syntax
  highlighting is out of scope for v1.

### 5. Navigation

Add a "Blog" link next to "StratOS" in both `SiteNavigation` and `MobileNavigation`
(`src/components/site-navigation.tsx`), pointing to `/blog`, with `data-testid`s
following the existing `link-stratos` / `link-mobile-stratos` convention.

## Data flow

1. Author writes/edits `content/blog/<slug>.md`; drops any PDF in `public/blog/`.
2. `predev`/`prebuild` runs `gen-blog.mjs` → validates → writes
   `src/lib/blog/posts.generated.ts`.
3. `/blog` imports `BLOG_POSTS` (metadata only) and renders cards.
4. `/blog/:slug` imports `BLOG_POSTS` + `BLOG_ARTICLE_BODIES`, resolves the slug, and
   renders via `BlogContent`.

## Error handling & edge cases

- **Bad frontmatter / invalid post** → build fails with a clear message naming the file
  and the problem. Nothing invalid reaches runtime.
- **Unknown slug at `/blog/:slug`** → 404 via the existing NotFound path.
- **`paper` slug hit directly** → redirect to its external artifact.
- **Empty blog** (`content/blog/` has no files) → `gen-blog.mjs` emits an empty
  `BLOG_POSTS`; `/blog` renders an empty-state message; build still succeeds.
- **Link safety** → identical policy to the chat renderer; no raw HTML, no images.

## Testing

Follow existing patterns (`src/lib/**/*.test.ts`, `src/components/*.test.tsx`,
`src/pages` covered via component tests like `stratos`):

- **`gen-blog` / frontmatter parser** — unit tests: valid file parses to the right
  metadata; missing required field throws; duplicate slug throws; `paper` without
  `pdf`/`sourceUrl` throws; `article` body is captured. (Extract the parse/validate
  logic into a testable module the script calls.)
- **`blog-content`** — renders a Markdown table (proves gfm is active) and applies the
  link policy (external → new tab, disallowed protocol → stripped).
- **`blog` index** — renders a card per post, newest first; `article` cards link
  internally, `paper` cards link to `pdf`/`sourceUrl`.
- **`blog-post`** — renders a known article; unknown slug → 404; `paper` slug →
  redirect.

`npm run typecheck` and `npm test` must pass.

## File manifest

New:
- `content/blog/*.md` (the posts)
- `public/blog/*.pdf` (paper artifacts)
- `scripts/gen-blog.mjs`
- `src/lib/blog/posts.generated.ts` (generated, committed)
- `src/pages/blog.tsx`
- `src/pages/blog-post.tsx`
- `src/components/blog-content.tsx`
- tests for the above

Edited:
- `src/App.tsx` (two routes, lazy imports)
- `src/components/site-navigation.tsx` (Blog nav link, desktop + mobile)
- `src/components/markdown-content.tsx` (export `validateMarkdownLink` for reuse)
- `package.json` (`gen:blog` script; add to `predev`/`prebuild`; add `remark-gfm`)

## Launch set (content — author decides before/at authoring time)

The implementation above is content-agnostic. The initial posts are an authoring
decision, not an implementation blocker. Recommended v1 set, drawn from the ranked
candidates doc:

| Slug (suggested) | Kind | Source | Note |
|---|---|---|---|
| `domain-all-execution-requires-meaning` | article | `Drive/domain/.../domain-white-paper.md` | **Resolve the two-revision version conflict first** (see candidates doc §Tier 1.1 — the "Program Cloud/Services" vs "Program Runtime/Products" abstracts differ, and the Drive copy is byte-identical to the file filed as `[outdated]`). |
| `domain-second-order-convergence` | paper | `Domain_Second_Order_Convergence_Architecture.pdf` → `public/blog/` | The designed 10-page PDF. This is also the paper most likely to be the one referenced in the Jonathan thread. |
| `facia-v2-design` | article | `~/Dev/facia/docs/facia-v2-design.md` | The engine running this very site; strongest "built, not just proposed" proof. Uses tables → needs the gfm renderer. |
| `human-led-automation` | article | `Drive/domain/.../10-human-led-automation-…docx` | Most readable to a non-specialist; nearly blog-ready as prose. |
| `executable-interpretation` | paper *or* article | `~/Downloads/Domain- Executable Interpretation….pdf` | Cleanest single-idea essay; convert to article if time allows, else ship as a paper card. |

Explicitly **excluded from v1** (per prior decisions in this project):
- **TIMPOS / UTID material** — held out entirely. Three-referent naming collision plus an
  open patent-disclosure question (PPAs dated May 2026). See candidates doc Appendix B.
- **The Neara demo** — a strong FDE case study, but frame-sensitive (superseded
  workbench lineage; NYC DOT open data, not Neara's; the ledger replays a pre-built file
  rather than reading LiDAR live). Candidate for a *later* post, not v1. See candidates
  doc Appendix A.

## Open decisions for the author (do not block implementation)

1. **Domain flagship revision** — which of the two July-13 versions is canonical.
2. **`executable-interpretation`** — ship as a `paper` card or invest in Markdown
   conversion to an `article`.
3. **PDF hosting** — confirm the designed PDFs may be served publicly from `/public`
   (no confidentiality markings on the chosen set; the HFT/Geospatial doc is already
   excluded).
