# AGENTS.md

**This file is _how_ the work is built — the conventions agents reason with. It
is not part of the domain.** `domain.yaml` and `docs/stack/architecture.md` are
_what_ is being built. Keeping the two apart is deliberate: it separates the
construction process from the thing constructed.

## Read these first, in order

1. **`domain.yaml`** — this repo declared as its own domain (objective,
   observation, meaning, accountability). The authored logic; everything else
   executes or presents it.
2. **`docs/stack/architecture.md`** — the canonical architecture: the five
   engine terms (Timpos · Libera · Domain · Corus · Facia), the L0–L7
   responsibility layers, and the lineage. Source of truth.

## Invariants you must not violate

- **Libera = Runtime (L6, executes).** Not the L0 location layer. L0's locate
  role is **Locus** (space), paired with **Timpos** (time).
- **Reconcile only from `docs/stack/architecture.md`.** The Google Drive draft
  _Domain Architectural Layers_ is **superseded** — never treat it as canonical.
- **Responsibility rule:** the pattern may repeat, responsibility must not. Put
  each concern at the smallest layer that can own it (see the L0–L7 table).

## Naming & reasoning conventions

- **Titles are legible and self-describing.** A cold agent or a new person
  should know what a file is from its name alone, without opening it. Prefer the
  plain descriptor over the insider metaphor.
- **Legibility over obscurity.** This repo is public on purpose — so any agent,
  local or not, can find it and reason from it. Optimize for being understood,
  not for being hidden.
- **Canonical beats dated.** When two documents disagree, the one named
  canonical (here, `architecture.md`) governs; a dated draft never does.

## Where things live

- Canonical architecture: `docs/stack/architecture.md`
- This repo's domain declaration: `domain.yaml`
- Related engines (separate repos): **libera** (Runtime), **timpos**
  (Observation + Corus / Accountability), **ontology** (the induced convergence
  kernel).
