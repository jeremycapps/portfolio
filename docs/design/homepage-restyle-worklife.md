# Homepage restyle — the WORK/LIFE editorial direction

**Status:** spec, ready to implement
**Scope:** the home route (`/`) — header, hero, Work, Experience, Ask CTA. Other routes
(`/ask`, `/method`, `/blog`, `/work/zocdoc`, `/stratos*`) are out of scope for this pass and
keep the current palette until a follow-up migrates them.
**Visual source of truth:** the approved mock at
`scratchpad/restyle-mock.html` (rendered iteratively with Jeremy). When a pixel detail here is
ambiguous, the mock wins.
**Reference the mock was derived from:** `https://work-nyc-b78d2c.webflow.io/` — fonts and
colors only, simplified.

---

## 1. What changes, in one paragraph

The home moves from a cool blue-gray "instrument" surface (amber accent, three per-project
accent colors, glossy rounded cards, soft shadows, Manrope) to a **warm-paper, fully
monochrome, square, editorial** surface (Geist + Inter Tight, near-black on cream, hairline
rules, flat). The three glossy genre cards become **numbered editorial rows** that invert to a
dark band on hover and crossfade a "what → why" line. The two-column "now" cards become a
**left-aligned three-column ledger** (role · company · dates) that inverts on the same hover.
The Ask CTA becomes an **inverted dark band**. Copy is rewritten throughout (see §9).

### Locked design decisions
- **Monochrome.** No amber accent, no `--a-libera/facia/stratos` dots. One ink, one paper.
- **Square / flat.** Radii → 0, shadows removed on home surfaces. Hairline `1px` rules instead.
- **Type:** Geist (display + body), Inter Tight (labels, nav, meta). Space Mono retired on the
  home. A serif italic accent is available but currently unused.
- **Interaction:** hover inverts a whole row to the dark band; in Work, hover also crossfades
  the `what` line to the `why` line. 320ms, `cubic-bezier(.2,.75,.25,1)`.

---

## 2. Files touched

| File | Change |
|---|---|
| `src/index.css` (line 1 import; `:root` L46–143; home block L2272–2798) | Palette tokens, font import + wiring, flatten shell, rewrite `.home-*` rules |
| `src/App.tsx` (`HOME_GENRES` L17–60; `Home()` L62–190) | Reorder + reshape genre data, restructure genre and now JSX, new hero copy, drop eyebrow |
| `src/components/site-header.tsx` | Nav restyle; decisions in §5 |
| `src/App.test.tsx` | Rewrite home assertions (they assert old copy — see §10) |
| `src/components/site-header.test.tsx`, `project-cards.test.tsx` | Re-check against new labels/markup |

No new dependencies. Geist and Inter Tight are Google Fonts (the reference loads exactly these).

---

## 3. Design tokens (`src/index.css` `:root`, L46–143)

Replace the canonical palette values. **Keep the token *names*** — every component resolves
through them, so a value swap restyles the whole surface without touching component rules.

```css
:root {
  /* ── ground & surfaces (warm paper) ── */
  --ground:      #F1EDE3;   /* was #eceef2 */
  --body-grad:   #F1EDE3;   /* was a cool gradient — now a flat paper fill */
  --surface:     #F5F2EA;   /* raised paper (was #ffffff) */
  --surface-2:   #ECE7DB;   /* was #f3f5f9 */
  --surface-grad:#F5F2EA;   /* flat, no gradient */

  /* ── ink (warm near-black) ── */
  --ink:      #1A1A1A;      /* was #161b23 */
  --ink-2:    #2D2828;      /* warm dark (was #3a4250) */
  --ink-soft: #6B6660;      /* was #5e6773 */
  --faint:    #9A938A;      /* was #6c7682 */

  /* ── hairlines ── */
  --line:      #D9D3C6;     /* was #dce1e9 */
  --line-soft: #E4DED2;     /* was #e8ecf2 */

  /* ── accent → collapsed to ink (monochrome) ── */
  --accent:     #1A1A1A;    /* was #b4761a — used for borders/hover/labels; now ink */
  --accent-ink: #2D2828;    /* was #8a5a12 */

  /* ── domain accents → ink (dots are removed; keep mapped so any stray use is mono) ── */
  --a-libera:  #1A1A1A;
  --a-facia:   #1A1A1A;
  --a-stratos: #1A1A1A;

  /* ── the dark band used by hover-invert and the Ask CTA ── */
  --invert:     #1A1A1A;
  --invert-ink: #F1EDE3;
  --invert-faint:#8A847A;   /* muted text on the dark band */
  --invert-soft:#C9C3B7;    /* secondary text on the dark band */

  /* ── inverted controls (primary buttons) ── */
  --control-primary-bg:   #1A1A1A;  /* was #2b394d */
  --control-primary-hover:#2D2828;
  --control-primary-ink:  #F1EDE3;

  /* ── shape → square ── */
  --radius:         0px;    /* was 0.75rem */
  --surface-radius: 0px;    /* was 17px */
  --control-radius: 0px;    /* was 8px */
  --pill-radius:    0px;    /* was 999px — the editorial look has no pills */

  /* ── elevation → flat ── */
  --shadow:    none;        /* home surfaces are flat; rules carry separation */
  --shadow-sm: none;
  --shadow-md: none;

  /* ── fonts ── */
  --app-font-sans: 'Geist', system-ui, sans-serif;   /* was 'DM Sans' */
  --app-font-alt:  'Inter Tight', var(--app-font-sans); /* NEW — labels, nav, meta */
  --app-font-serif:'Georgia', serif;                 /* optional editorial italic; unused in v1 */
  /* --app-font-mono retained for other routes; NOT used on the home anymore */

  /* --focus keeps a visible ring; make it ink so focus stays monochrome */
  --focus: #1A1A1A;
}
```

Notes:
- Anything still referencing `--accent` (borders, hover) now renders ink — intended.
- `--shadow: none` etc. flattens cards that used `box-shadow: var(--shadow)`. Where a card
  needs an edge, it already also sets `border: 1px solid var(--line)`, which becomes the
  separation. Verify no home surface relies on shadow alone for legibility.

---

## 4. Fonts (`src/index.css` L1) and the Manrope problem

Replace the `@import` with the two faces the reference uses:

```css
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Inter+Tight:wght@400;500;600&display=swap');
```

**Important:** the home block hardcodes `font-family: 'Manrope', var(--app-font-sans)` in many
places (`.home-hero`, `.home-thesis`, `.home-eyebrow`, `.home-question-chip`, `.home-connect*`).
Do a scoped find/replace within the home block: **`'Manrope', var(--app-font-sans)` →
`var(--app-font-sans)`** (which is now Geist). Labels/nav/meta that should be Inter Tight get
`var(--app-font-alt)` explicitly (called out per-selector below). `.home-genre-kind` currently
uses `var(--app-font-mono)` (Space Mono) → change to `var(--app-font-alt)`.

If Manrope/DM Sans/Instrument Serif/Space Mono are only used by home + this pass, trim them
from the import; if other routes still use them, leave them until those routes migrate.

---

## 5. Header (`site-header.tsx` + `.topbar/.brand/.nav-link`, index.css L202–289)

The mock uses a **text-only uppercase wordmark** and a three-item nav (`Work · Experience ·
Ask`) with an underline-grow hover. The live header has a Sparkles brand-mark, a `Jeremy Capps`
wordmark, a site-wide nav (`Method · Blog · About · Ask`) and a `JC` avatar button.

Two decisions (see §11), with recommended defaults baked in here:

1. **Wordmark:** drop the `brand-mark` Sparkles for the editorial look; keep the text, set it
   uppercase. `©` is **not** used (already removed in the mock).
2. **Nav model:** the live nav is cross-route and should stay cross-route — do **not** replace
   it with in-page anchors. Keep `Method · Blog · About · Ask`, restyle only.

CSS:
```css
.topbar { border-top: 3px solid var(--ink); height: 74px; } /* editorial top rule */
.brand { font-family: var(--app-font-sans); font-weight: 700; letter-spacing: -0.03em;
         text-transform: uppercase; font-size: 19px; gap: 0; }
.brand-mark { display: none; }               /* or delete the <span> in the TSX */
.nav-link {
  font-family: var(--app-font-alt); font-size: 15px; font-weight: 500;
  letter-spacing: -0.01em; color: var(--ink); background: transparent;
  border-radius: 0; padding: 4px 0; position: relative; text-transform: none;
}
.nav-actions { gap: 34px; }
.nav-link::after { content:''; position:absolute; left:0; right:100%; bottom:-1px;
  height:1.5px; background:var(--ink); transition:right .28s cubic-bezier(.2,.75,.25,1); }
.nav-link:hover::after, .nav-link[aria-current='page']::after { right:0; }
.avatar-button { border-radius: 0; } /* or drop it — the mock has no avatar */
```

---

## 6. Hero (`.home-hero` block L2272–2363 + `App.tsx` L67–84)

**JSX changes in `Home()`:**
- **Remove** the `.home-eyebrow` `<p>` (and its `data-testid="text-eyebrow"`).
- `.home-thesis` becomes the headline; drop the inner `<span>`/`<b>` accent markup.
- `.home-sub` carries the four-clause summary.
- Keep `.home-hero-actions` (two links), restyle square.

**Copy (verbatim, §9 collects all copy):**
- Headline: `Eight years across engineering, product, and operations.`
- Summary: the four-sentence "discernment" paragraph in §9.

**CSS deltas:**
```css
.home-thesis {
  max-width: 18ch;
  font-family: var(--app-font-sans);
  font-weight: 700;               /* was 300 */
  font-size: clamp(40px, 6.4vw, 84px);
  line-height: 1.0;
  letter-spacing: -0.04em;
  color: var(--ink);
}
.home-sub {
  max-width: 60ch; margin-top: 28px;
  color: var(--ink-2); font-size: clamp(16px, 1.6vw, 19px); line-height: 1.55;
}
.home-hero-actions a {                /* square, flat */
  border-radius: 0; font-family: var(--app-font-alt); font-weight: 500;
  font-size: 15px; padding: 13px 22px; min-height: 0;
  background: transparent; border: 1.5px solid var(--line); color: var(--ink);
}
.home-hero-actions a:first-child {    /* primary = filled ink */
  background: var(--ink); border-color: var(--ink); color: var(--paper, var(--invert-ink));
}
.home-hero-actions a:hover { transform: none; border-color: var(--ink); }
.home-hero-actions a:first-child:hover { background: transparent; color: var(--ink); }
```

---

## 7. Work section — editorial rows (`.home-genres`, App.tsx `HOME_GENRES`)

This is the largest change: **cards → numbered rows with hover-invert + what/why crossfade.**

### 7.1 Data (`HOME_GENRES`, App.tsx L17–60)
Reorder to **Zocdoc, Klarna, StratOS** and reshape each item:
```ts
type Genre = { num: string; kind: string; name: string; what: string; why: string;
               href: string; testid: string };
// 01 Professional Work → Zocdoc → /work/zocdoc
// 02 Case Study        → Klarna → /stratos-flow#case-study
// 03 Method            → StratOS→ /method
```
Drop the old `question`, `blurb`, `cta`, `accent` fields. Copy in §9.

### 7.2 JSX (per row)
```
<a class="home-genre-row" href={href} data-testid={testid}>
  <span class="home-genre-num">{num}</span>
  <div class="home-genre-mid">
    <p class="home-genre-kind">{kind}</p>
    <p class="home-genre-title">{name}</p>
  </div>
  <div class="home-genre-summary">
    <p class="home-genre-what">{what}</p>
    <p class="home-genre-why">{why}</p>
  </div>
  <span class="home-genre-more"><ArrowUpRight aria-hidden="true" /></span>
</a>
```
Remove `.home-genre-dot`, `.home-genre-q`. The container becomes `.home-genres` wrapping the
rows directly (drop `.home-genre-grid`).

### 7.3 CSS (replaces L2552–2639)
```css
.home-genres { margin-inline: -24px; }         /* full-bleed hover band, content aligns to wrap */
.home-genre-row {
  display: grid; grid-template-columns: 56px 210px 1fr 40px; gap: 28px; align-items: start;
  padding: 30px 24px; border-top: 1px solid var(--line); text-decoration: none; color: var(--ink);
  transition: padding-left .32s cubic-bezier(.2,.75,.25,1), background-color .32s ease, color .32s ease;
}
.home-genre-row:last-child { border-bottom: 1px solid var(--line); }
.home-genre-row:hover { padding-left: 38px; background: var(--invert); color: var(--invert-ink); }

.home-genre-num  { font-family: var(--app-font-alt); font-size: 14px; font-weight: 600;
                   color: var(--faint); padding-top: 9px; transition: color .32s ease; }
.home-genre-kind { margin: 0 0 6px; font-family: var(--app-font-alt); font-weight: 600;
                   font-size: 12px; letter-spacing: .13em; text-transform: uppercase;
                   color: var(--ink-soft); transition: color .32s ease; }
.home-genre-title{ margin: 0; font-weight: 700; font-size: 30px; letter-spacing: -0.035em;
                   line-height: 1; color: var(--ink); transition: color .32s ease; }

.home-genre-summary { display: grid; max-width: 46ch; padding-top: 6px; }
.home-genre-summary > p { grid-area: 1/1; margin: 0; font-size: 15px; line-height: 1.55;
                          transition: opacity .32s cubic-bezier(.2,.75,.25,1), color .32s ease; }
.home-genre-what { color: var(--ink-2); opacity: 1; }
.home-genre-why  { color: var(--ink); font-weight: 500; opacity: 0; }
.home-genre-more { justify-self: end; padding-top: 4px; color: var(--ink);
                   transition: color .32s ease; }

/* invert on hover */
.home-genre-row:hover .home-genre-num   { color: var(--invert-faint); }
.home-genre-row:hover .home-genre-kind  { color: var(--invert-soft); }
.home-genre-row:hover .home-genre-title,
.home-genre-row:hover .home-genre-why,
.home-genre-row:hover .home-genre-more  { color: var(--invert-ink); }
.home-genre-row:hover .home-genre-what  { opacity: 0; }
.home-genre-row:hover .home-genre-why   { opacity: 1; }
```

### 7.4 Section head
`.home-sec-tag` copy → `Work`; **remove** `.home-sec-note` (the "see it/trust it" note is gone).
Restyle the tag to Inter Tight:
```css
.home-sec-tag { font-family: var(--app-font-alt); color: var(--ink);
                font-size: clamp(22px,2.6vw,30px); font-weight: 700; letter-spacing: -0.03em;
                text-transform: none; }
```
(The tag is now a real section heading, not a micro-label — the mock's "Work"/"Experience"
read at heading scale.)

---

## 8. Experience ledger (`.home-now`, App.tsx L106–166) and Ask CTA

### 8.1 Data / JSX
- `.home-sec-tag` → `Experience`; remove `.home-sec-note`.
- Drop every `.home-now-dot`.
- Each row is `role · org · dates`, three columns. Keep the existing mix of `<a>` (Aroko, New
  Museum) and static `<div>` (Zocdoc, Applied, Genesco).
- **Copy fixes:** Aroko org = `Aroko` (drop "cooperative agency"); Aroko meta = `2025 –`
  (drop "present" and the skill tail); second row role = `Cultural Researcher and Fellow`,
  org = `New Museum` (was "NEW INC / New Museum"). Strip the `· skills…` tail from every
  `.home-now-meta`, leaving years only.

### 8.2 CSS (replaces L2471–2549)
```css
.home-now-grid { display: grid; grid-template-columns: 1fr; gap: 0; margin-inline: -24px; }
.home-now-item {
  display: grid; grid-template-columns: minmax(0,1.1fr) minmax(0,1fr) 120px; gap: 56px;
  align-items: baseline; padding: 20px 24px; border-top: 1px solid var(--line-soft);
  border-radius: 0; background: transparent; box-shadow: none; color: var(--ink);
  text-decoration: none;
  transition: padding-left .32s cubic-bezier(.2,.75,.25,1), background-color .32s ease, color .32s ease;
}
.home-now-item:last-child { border-bottom: 1px solid var(--line-soft); }
.home-now-item:hover { padding-left: 38px; background: var(--invert); color: var(--invert-ink); }
.home-now-role { font-family: var(--app-font-sans); font-weight: 600; font-size: 17px;
                 letter-spacing: -0.02em; transition: color .32s ease; }
.home-now-org  { font-size: 15px; color: var(--ink-2); text-align: left; transition: color .32s ease; }
.home-now-meta { font-family: var(--app-font-alt); font-size: 13.5px; color: var(--faint);
                 text-align: left; white-space: nowrap; transition: color .32s ease; }
.home-now-item:hover .home-now-role,
.home-now-item:hover .home-now-org  { color: var(--invert-ink); }
.home-now-item:hover .home-now-meta { color: var(--invert-faint); }
.home-now-role svg { /* the ↗ on link rows only — keep, invert on hover */ }
```
The date column is a **fixed 120px** on purpose: it makes every independent row-grid resolve
identically so the three columns share left edges (a fluid date column pushed them out of
alignment — that was a real bug we fixed in the mock).

### 8.3 Ask CTA (`.home-ask-cta`, L2642–2665) — inverted band
```css
.home-ask-cta { margin-inline: -24px; padding: clamp(48px,7vw,88px) 24px; border: 0;
  border-radius: 0; background: var(--invert); color: var(--invert-ink); text-align: left; }
.home-ask-cta-title { color: var(--invert-ink); font-size: clamp(28px,4vw,48px);
  font-weight: 700; letter-spacing: -0.03em; }
.home-ask-cta-note  { margin: 16px 0 26px; color: var(--invert-soft); font-size: 17px; max-width: 48ch; }
.home-ask-cta-link  { border-radius: 0; background: transparent; color: var(--invert-ink);
  border: 1.5px solid var(--invert-faint); font-family: var(--app-font-alt); }
.home-ask-cta-link:hover { background: var(--invert-ink); color: var(--ink); border-color: var(--invert-ink); }
```

---

## 9. Final copy (verbatim)

**Nav:** `Method · Blog · About · Ask` (unchanged if we keep the site nav — see §11). Wordmark:
`JEREMY CAPPS`.

**Hero headline:** `Eight years across engineering, product, and operations.`

**Hero summary:**
> The discernment is in what to build, before it's built. In engineering, I carried the
> business logic that still mattered out of legacy COBOL and left the rest. In product, I
> fought for the dashboard leaders judged our value by, over the flashier work beside it. In
> operations, I built the costing system that made delivery legible, not more process. An AI
> product is the same call, and it's mine to make: which piece carries the load, chosen before
> it's built.

**Hero actions:** `See the Klarna decision` → `/stratos-flow#case-study` · `Ask the assistant` → `/ask`

**Work** (section tag: `Work`)
| # | Kind | Name | What (rest) | Why (hover) | href |
|---|---|---|---|---|---|
| 01 | Professional Work | Zocdoc | A design-system migration across product teams, run as a measured product decision. | A change that size shipped without a regression. | `/work/zocdoc` |
| 02 | Case Study | Klarna | A call on whether to scale an AI support pilot. | I split it into two questions: what share automation can carry, and what load the rest leaves on the team. | `/stratos-flow#case-study` |
| 03 | Method | StratOS | A twelve-signal model of how an organization decides. | It surfaces where signals diverge, and where to intervene, before the top-line metric breaks. | `/method` |

**Experience** (section tag: `Experience`)
| Role | Company | Dates | href |
|---|---|---|---|
| Head of Operations ↗ | Aroko | 2025 – | `https://aroko.coop` |
| Cultural Researcher and Fellow ↗ | New Museum | 2025 – 2026 | New Museum person page |
| Design Systems / Frontend Engineer | Zocdoc | 2021 – 2024 | (static) |
| Software / Product Engineer | Applied Software | 2019 – 2021 | (static) |
| Software Engineer | Genesco | 2017 – 2019 | (static) |

**Ask CTA:** title `Want to go deeper?` · note `Ask the assistant about any project, decision,
or the throughline across them.` · link `Ask the assistant ↗` → `/ask`

**Footer:** `Jeremy Capps · 2026` (no ©).

> Voice rules applied (memory): no em-dashes in visible copy; no negatives; the summary carries
> the *why*; continuity is shown, not announced. Keep these when editing copy later.

---

## 10. Accessibility & behavior (do not skip)

1. **Hover reveals need a no-hover fallback.** The Work `why` line and both invert states are
   hover-only; touch users never see them. Add:
   ```css
   @media (hover: none) {
     .home-genre-what { opacity: 0; }   /* show the why by default on touch… */
     .home-genre-why  { opacity: 1; }   /* …since there is no hover to reveal it */
     .home-genre-summary { /* they overlap in one grid cell; showing the why is enough */ }
   }
   ```
   Decide whether touch shows `why` (recommended) or both stacked.
2. **Reduced motion.** Keep the color invert, drop the slide/crossfade:
   ```css
   @media (prefers-reduced-motion: reduce) {
     .home-genre-row, .home-now-item { transition: background-color .01ms, color .01ms; padding-left: 24px !important; }
     .home-genre-summary > p { transition: none; }
   }
   ```
   (A global reduced-motion block already exists near L1339 — fold these in there.)
3. **Focus states.** `:focus-visible` on rows/links must show a visible ring in monochrome —
   `outline: 2px solid var(--ink); outline-offset: 3px;`. On the inverted Ask CTA, use
   `var(--invert-ink)`.
4. **Contrast.** `--invert-faint #8A847A` on `--invert #1A1A1A` ≈ 4.6:1 (passes AA for the
   14px meta). `--faint #9A938A` on `--ground #F1EDE3` ≈ 2.4:1 — **fine for decorative micro
   text only** (numbers, dates); do not put body copy on `--faint`.
5. **Static ledger rows invert on hover but aren't links** (Zocdoc/Applied/Genesco). See §11.

---

## 11. Open decisions (need Jeremy)

1. **Nav model.** Keep the site-wide `Method · Blog · About · Ask` (recommended — restyle only),
   or adopt the mock's in-page `Work · Experience · Ask` anchors? The mock labels imply anchor
   scrolling to home sections, which changes the nav's job.
2. **Brand-mark.** Drop the Sparkles mark (recommended, matches the reference) or keep it?
3. **Static ledger rows.** Zocdoc/Applied/Genesco invert on hover but don't navigate. Options:
   (a) uniform highlight, accept no-nav; (b) only the two link rows invert; (c) give the three
   a destination. Recommend (b) for honesty, or (c) if pages exist.
4. **Dark mode.** The home is already light-only (its dark block is gated on `body:has(.composer)`,
   which the home lacks), so paper renders in both themes. Ship light-only for v1, or add a
   monochrome-dark token set (invert paper↔ink) in a follow-up?
5. **Serif italic accent.** Retired in the final hero. Keep `--app-font-serif` wired for future
   editorial accents, or remove entirely?

---

## 12. Suggested order

1. Tokens + fonts + shell flatten (§3–4) — the whole page reskins; verify nothing depends on
   shadow/gradient/radius for legibility.
2. Header (§5).
3. Hero copy + CSS (§6).
4. Work rows: data → JSX → CSS (§7). The biggest structural diff.
5. Experience ledger + Ask CTA (§8).
6. Accessibility passes (§10).
7. Update `App.test.tsx` (§below) and re-run `site-header.test.tsx`, `project-cards.test.tsx`.
8. Verify in the browser preview against `scratchpad/restyle-mock.html`.

### Tests to rewrite (`src/App.test.tsx`)
Current assertions fail by design:
- L10 `'Nine years across engineering, operations, and product'` → new headline string.
- L11 `'taken products from zero to one'` → gone; assert a phrase from the new summary
  (e.g. `'which piece carries the load'`).
- L18–20 `'Perspective' / 'Practice' / 'Method'` → `'Professional Work' / 'Case Study' / 'Method'`.
- L21–23 hrefs still valid (`/stratos-flow#case-study`, `/work/zocdoc`, `/method`) — keep.
- Add: section tags `Work` and `Experience` present; eyebrow testid `text-eyebrow` absent.
- L26–33 (assistant off home) still hold — keep.
```

---

**Definition of done:** the home renders the mock's layout and copy in the browser preview,
`npm test` passes with updated assertions, keyboard focus is visible on every row/link, touch
shows the `why` lines, and no home surface references amber, a domain-accent dot, a gradient,
a shadow, or a non-zero radius.
