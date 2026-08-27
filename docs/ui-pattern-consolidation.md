# UI pattern consolidation — audit and proposal

*2026-08-27. Read-only audit of `src/index.css`, `src/pages/{stratos,blog,about}.css`
and the six React surfaces that use them.*

## The short version

The site has no design-system problem. It has a copy-paste problem, and the
copies have started to drift. Four stylesheets independently re-solve the same
four UI patterns, landing on nearly identical numbers each time — which is the
strongest possible evidence that the patterns are real and should exist once.

The win is that 21 copy-pasted values become three tokens that can only drift
once. Net line count barely moves — this is substitution, not deletion.

## What was measured

58 rules across the four stylesheets set a border radius alongside a background
or border. Between them they use **18 distinct radius values**. Meanwhile the
`--radius: 0.75rem` token defined in `:root` is referenced exactly once, by
`.starter-panel`.

### Cluster 1 — the card, written six times

```
about.css:74     border-radius: 17px    box-shadow: 0 12px 34px rgba(59, 77, 95, 0.055)
blog.css:33      border-radius: 17px    box-shadow: 0 12px 34px rgba(59, 77, 95, 0.055)
blog.css:137     border-radius: 17px
stratos.css:102  border-radius: 17px    box-shadow: 0 12px 34px rgba(59, 77, 95, 0.06)
stratos.css:608  border-radius: 17px    box-shadow: 0 12px 34px rgba(59, 77, 95, 0.06)
index.css:282    border-radius: 17px
```

Same radius six times, same shadow four times — except the alpha has already
split into `0.055` and `0.06`. Nobody chose that difference; it is copy-paste
drift, and it is the whole argument for consolidating.

### Cluster 2 — the pill, eleven times

`border-radius: 999px` appears 11 times across all four files: starter chips,
repo chips, pattern badges, the resume provenance badge, blog kind tags, the
about project status, StratOS affordance chips, the thinking indicator.

### Cluster 3 — the evidence panel, written twice, identically

```css
.stratos .reveal {                    .semantic-item-evidence {
  margin-top: 12px;                     margin-top: 12px;
  padding: 11px 12px;                   padding: 11px 12px;
  border-radius: 9px;                   border-radius: 9px;
  background: #eef3f7;                  background: #eef3f7;
  color: var(--st-ink-3);   /*7b899b*/  color: #56677c;
}                                     }
```

Four declarations byte-identical, including the hardcoded hex. The fifth is two
greys that were meant to be the same and aren't.

### Cluster 4 — the control chip, twice, with drifted alphas

```
.stratos .aff                      .semantic-affordance-row button
  border-radius: 8px                 border-radius: 8px
  border: 1px solid                  border: 1px solid
    rgba(116, 139, 162, 0.24)          rgba(116, 139, 162, 0.22)
  background:                        background:
    rgba(247, 250, 252, 0.56)          rgba(247, 250, 252, 0.8)
```

Same radius, same two colours, two independently drifted alphas.

### Bonus: a dead rule

`.stratos .aff` is declared twice in `stratos.css` — at line 511 with
`border-radius: 999px`, and again at line 565 with `border-radius: 8px`. There
is no media query between them, so the first rule's `border-radius` never
applies. Only that one declaration is dead — the rule's other eight properties
are live, so the pair needs merging rather than deleting. It is also why the
pill count above says two for StratOS when only one is real.

## Proposal

Tight scope. Three changes, no new vocabulary, no new dependencies.

1. **Tokenize the copy-pasted values** into the `:root` block that already
   exists in `index.css` — `--surface-radius`, `--surface-shadow`,
   `--pill-radius`, `--panel-radius`. This extends the token set that is
   already driving the app shell rather than inventing a second one. The
   `0.055`/`0.06` shadow drift resolves to one value; the difference is not
   perceptible.
2. **No shared surface class.** The four cards share a radius and a shadow but
   their backgrounds genuinely differ (`0.44 / 0.58 / 0.68 / 0.8`) — that is
   deliberate translucency per surface, not drift. Tokenize what is shared and
   leave the rest alone.
3. **Pills and control chips get the tokens, not a shared class.** They vary
   too much in padding, type, and colour to share a rule body, but none of them
   should hardcode `999px` or a one-off grey again.
4. **Delete the dead `.stratos .aff` rule** at line 511.

### Deliberately not doing

- **No `useDisclosure` hook.** Four surfaces implement toggle-a-panel, but each
  is three lines of `useState`. Consolidating that buys nothing and adds an
  indirection. The duplication that costs anything is in the CSS.
- **Not touching Tailwind.** It is live in four components, two of which
  (`Toaster`, `TooltipProvider`) are app-wide providers in `App.tsx`. Removing
  it means reimplementing toast and tooltip, and fixes none of the above. Keep
  it where it is; add no Tailwind classes to new work.
- **Not building a component library.** See the next section for why the
  temptation exists and why it is still a separate decision.

## What this means for the Facia recipes

This is the part worth pausing on.

Facia's `ComponentRecipe` carries a `components` array of semantic ids —
`Card`, `StateBadge`, `EvidenceDisclosure`, `InspectionToolbar`, `Stat`,
`DetailView`, and twenty more. **Nothing renders from that field.** `AnswerPanel`
in `stratos.tsx` ignores it entirely. `SemanticSurface` does read it, but only as
a capability check — `componentIds.has('List')`, `has('Timeline')`,
`has('InspectionToolbar')` — so it branches on three of the twenty-five ids and
maps none of them to a component.

Now line the duplication clusters up against those ids:

| Facia component id | StratOS implementation | Chat-surface implementation | Agreement |
|---|---|---|---|
| `EvidenceDisclosure` | `.stratos .reveal` | `.semantic-item-evidence` | 4 of 5 declarations identical |
| `InspectionToolbar` | `.stratos .aff` | `.semantic-affordance-row button` | same radius, same 2 colours, alphas drifted |
| `Card` / `DetailView` | `.panel[data-depth="focus"]` 13px/16px | `.semantic-item` 13px/18px | same radius |
| `StateBadge` | `.aff` pill | `.semantic-pattern` pill | both `999px` |

**The duplication clusters are the Facia component ids.** Two renderers, written
at different times, both discarding the recipe field that names the component,
independently re-derived the same visual vocabulary — and landed within an alpha
value of each other every time.

Three consequences:

**1. The vocabulary is validated, in the only way that counts.** If two
independent authors converge on the same six CSS declarations for the thing
Facia calls `EvidenceDisclosure`, that id is carving reality at a joint. This is
much stronger evidence than agreeing the manifest looks reasonable. Caveat: the
site only reaches 10 of the 25 ids, and the CSS evidence covers 4 of those. This
validates a corner of the vocabulary, not all of it.

**2. Name the shared classes after the component ids.** `.evidence-disclosure`,
not `.reveal-panel`. It costs nothing today — it is a naming choice inside a
refactor that is happening anyway — and it means a future renderer that wants to
honour `recipe.components` can map id to class directly instead of needing a
translation table. This is the entire on-ramp, and it is free.

**3. It does not mean building the component library now.** The consolidation
stands on its own: the drift is real and worth fixing whether or not Facia ever
gets a renderer. Wiring `recipe.components` is a separate decision with its own
open question — the manifest is a *flat ordered array*
(`Card → StateBadge → DetailList → EvidenceDisclosure → OperationControls`) and
nothing in the contract says whether `Card` wraps the others or sits beside
them. That question does not need answering to delete duplicated CSS.

The useful order is therefore: consolidate first, decide about `recipe.components`
after. Doing it the other way round would mean building a renderer against four
stylesheets that disagree with each other by an alpha value.


---

## Postscript — what implementation changed

Written after the consolidation landed (`933e3ec`), correcting this document
against what the code turned out to be.

- **The shared surface class was dropped.** See the corrected item 2 above: the
  four card backgrounds differ on purpose.
- **A `--panel-radius` token was dropped too.** The eight `9px` sites are a form
  field, a submit button, and a disclosure panel that happen to agree on a
  number. Tokenizing them would assert a shared concept that is not there.
- **The control-chip colours were left alone.** `.stratos .aff` and
  `.semantic-affordance-row button` drifted on two alphas, but StratOS's border
  comes from `--st-rule`, which is used 77 times for unrelated things. Merging
  the chips would have moved all of them.
- **Verification note.** The first browser check was invalid: a dev server was
  running from `worktrees/silent-comet-20260827`, so both the before and after
  measurements read files that were never edited. The check that actually worked
  was textual — expand each token back to its literal value and diff against
  `HEAD`. `blog.css` and `about.css` came out byte-identical. Prefer that check;
  it cannot be fooled by a stale server.
