# Case study — Zocdoc: migrating a design system the whole company shipped on

*Decision-framed case study. Template: **Context → Decision → Result → Judgment**.
Through-line across every case: build the instrument that measures the boundary,
then let evidence confirm the change. Tone: positive, opportunity-first.*

**Role.** Design Systems Engineer / Frontend Engineer, 2021–2024.

## Context

A company-wide accessibility commitment (WCAG) opened the opportunity to
modernize an established TypeScript/React design system — the components many
teams built their products on. Because so many teams relied on them, improving
the components raised quality across all of those products at once.

## Decision

Move with evidence and coordination.

- A page-by-page migration workflow that identified engineering ownership,
  brought stakeholders in early, and lined up QA ahead of each change — so every
  dependent team advanced together.
- Prove the highest-traffic piece — the Header — through Zocdoc's
  engineering-wide A/B framework. This was the design-system team's first
  frontend-component experiment: a gradual rollout, measured across browsers and
  mobile, with test/control analysis.

## Result

- A measured, confident rollout the dependent teams could build on.
- Smaller, well-scoped tickets lifted delivery velocity 2–3 points per sprint.
- A PR merge template returned a full workday of merge time to the team.

## Judgment

Treat a load-bearing change as a shared, measurable commitment: coordinate
everyone who depends on it, and let the evidence confirm the change is good. It
is the same move as the Klarna decision — three years earlier, and in code.
