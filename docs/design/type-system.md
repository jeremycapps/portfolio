# Type system

Two font families. Nothing else is loaded or referenced.

| Token | Family | Use for |
|---|---|---|
| `--app-font-sans` | Geist | All text: body, headings, post titles, nav, buttons, cards |
| `--app-font-mono` | Space Mono | Code, and small metadata — dates, kind labels, kickers, table headers |

## Rules

- **Always go through the token.** Write `font-family: var(--app-font-sans)` or
  `var(--app-font-mono)`, never a family name. A literal family name is how the
  site drifted to six fonts before.
- **Hierarchy comes from size, weight, and color — not a new family.** If a
  heading needs to stand apart, change its size or weight.
- **Adding a family is a design decision, not a styling one.** It means a new
  token in `:root` in `src/index.css`, a new entry in the Google Fonts
  `@import` on line 1, and a row in this table.

## History

Before 2026-09-28 a blog post rendered four families (Geist, Georgia, Space
Mono, Inter Tight) and the site loaded six (plus Manrope and an unused Inter).
The `--app-font-alt` (Inter Tight) and `--app-font-serif` (Georgia) tokens were
removed and their uses folded into `--app-font-sans`.
