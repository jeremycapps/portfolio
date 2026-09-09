---
title: "Zocdoc: The Migration Was Blocked by Review, Not Code"
slug: zocdoc-header-migration
date: 2026-09-08
summary: Replacing the header on every page of Zocdoc, across four to five codebases, under a company accessibility mandate. The work was correct long before it could land — and the fix was changing the size of the reviewable unit, then measuring each step of the rollout before widening it.
kind: article
status: Published · September 2026
---

## The constraint wasn't the code, it was the size of the reviewable unit

I was a frontend engineer on Mezzanine, Zocdoc's design system, and I owned the
migration that replaced the site header — the one component that appears on
every page of the product.

Partway through, I got performance feedback that I needed to push more code to
production. The obvious reading is that I was working too slowly. That wasn't
it. The components were built and correct; they sat in review, in branches that
drifted while product teams kept editing the codebases underneath them.

The work wasn't blocked by how much I produced. It was blocked by how large and
how illegible each unit of it was by the time someone had to review it.

Changing the shape of the work — not the amount — is what moved it. That is the
part I'd bring to any migration of this kind.

## A compliance mandate, every page on the site, five codebases

The context set the stakes. The company was under an accessibility mandate,
working toward a fully WCAG-compliant site by fall 2024. Mezzanine's components
were the mechanism: fix them once, and every product surface consuming them
inherits the fix.

The header was the highest-reach instance of that. It carried:

- presence on every page in the product;
- a legacy API that had to be replaced, not wrapped;
- WCAG requirements — ARIA attributes, keyboard traversal, screen-reader
  behavior, contrast, semantic links;
- mobile and desktop variants;
- consumers spread across roughly four to five product codebases, each
  independently owned;
- and a package-upgrade path through all of them.

Three of us coordinated it — me and two senior engineers.

I did not design the replacement from a specification. I audited the legacy
header's props and then went and read how downstream teams were *actually*
calling it — what values and structures they passed in practice. Real usage
defined the migration requirements, because real usage is what would break. The
replacement composed existing Mezzanine primitives into a shared base header
holding the cross-cutting accessibility behavior, extended into mobile and
desktop variants.

## Why a correct component still wouldn't land

A migration like this has a delivery shape that fights it. The normal flow is:
change the core library, get it reviewed, move into each product codebase,
upgrade the package, repair whatever breaks, coordinate with code owners —
and repeat, while both the library and those codebases keep changing.

Over several sprints that produced branch drift, accumulating merge conflicts,
oversized PRs, review threads that expanded into open-ended architecture debate,
and branches abandoned and recreated.

Every one of those is a symptom of the same thing: the unit of work being
reviewed was too large to hold in your head, and nothing about it said where it
sat in the larger migration.

## Sequencing: make each step small enough to land

I split the migration into smaller dependent changes on a shared migration
branch, with explicit parent-child relationships between PRs — an adaptation of
stacked diffs, which I read about while looking for prior art rather than
invented.

The more useful half was what I added to the team's existing PR template. It
already covered testing instructions, Storybook updates, and rollout status. I
added a sequencing layer:

- a link to the parent or preceding PR;
- a checklist of what was already landed;
- a checklist of what was still coming;
- and a statement of where this specific PR sat inside the larger migration.

That is a small change and it did most of the work. A reviewer opening a PR
could see the whole shape without reconstructing it, which made review surfaces
small, kept upstream work moving while downstream work waited, and made
dependencies explicit instead of tribal.

By my own account of that period: reviews got smaller and faster, back-and-forth
and off-scope debate dropped, fewer branches were abandoned, and in the relevant
quarter I closed more tickets and shipped a comparable number of PRs as the
senior engineers on the team. I don't have exact before-and-after figures, so
treat those as my direct testimony rather than a measured result.

The convention outlived the header. Splitting work into smaller connected PRs
continued after the migration finished.

## Rollout: 10, 25, 50, 100 — with a query at each gate

Landing it is not shipping it. Before production the work went through PR review,
design review, Percy visual-regression diffs, and QA against the complicated
workflows.

Then it went out behind a feature flag with rollback logic and monitoring, at
10%, 25%, 50%, and 100%. At each stage I queried Snowflake to compare visitors
on the new header against the old one, segmented by device and browser, checking
that pages kept functioning and that click-through stayed consistent. It ran
about two weeks. Click-through was near-identical between groups, which is the
result you want from an accessibility migration — the evidence said nothing had
broken, so exposure could widen.

That is the point worth carrying: the gates weren't there to prove the header
was better. They were there to make each increase in exposure a decision backed
by a measurement, on a component with nowhere to hide.

## What I owned, and what I didn't

I owned the header's component lifecycle, the API proposal and implementation,
the migration within a three-engineer effort, the feature-flag mechanics, the
rollout percentages, rollback and monitoring, the Snowflake analysis, and the
cross-team communication.

I did not own Zocdoc's accessibility program or its initial audit, the Mezzanine
roadmap, or the company's experimentation framework — that already existed, and
my engineering manager proposed using it. I applied it to a design-system
migration. I didn't invent stacked diffs, didn't manage the other two engineers,
and can't claim the team's broader delivery improvements were mine alone.

The header work is stronger stated at its real size than inflated, and knowing
which is which is most of the skill.

## Legibility is a delivery mechanism

The recurring lesson is that on large migrations, the binding constraint is
usually not capability or effort. It's that the structure, sequence, and current
state of the work aren't visible to the people who have to approve it and to the
teams who have to absorb it.

Making that legible — a sequencing layer in a PR template, a rollout gate tied
to a query — is not process overhead around the engineering. On work at this
scale it *is* the engineering, and it is what turns a correct component into a
shipped one.
