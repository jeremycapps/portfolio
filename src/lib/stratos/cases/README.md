# StratOS case profiles

These files are dated evidence profiles for public-company strategy cases. They
are inputs to StratOS scorecards, not company ratings and not claims that
public disclosures reveal the full internal organization.

## Initial cases

- `target-canada-2012-2015`: bounded market-entry failure.
- `adobe-creative-cloud-2012-2016`: completed business-model transition.
- `dominos-growth-2018-2025`: explicit endpoints missed amid continued growth.
- `ford-model-e-2022-2026`: ongoing transformation with re-timed milestones.

Each profile contains public sources, atomic facts, a declared commitment, and
knowledge-cutoff snapshots. Every snapshot explicitly assesses all six StratOS
systems and all four shared constraints. An assessment may say that evidence is
insufficient; missing evidence must not be silently converted into a neutral or
zero score.

## Evidence rules

1. A source's `publishedAt` date is when a public analyst could first use it.
2. A fact's `observedAt` is when the underlying event occurred or reporting
   period ended. It may use year or month precision when the source does not
   support a calendar day.
3. Snapshot assessments may only reference facts whose sources were public by
   the snapshot's `knowledgeCutoff`.
4. Reported facts reproduce a company's disclosed measure. Derived facts must
   disclose their calculation and cite every reported input.
5. Production run rate, shipments, wholesale volume, revenue, ARR, and margin
   are different measures and must not be substituted for one another.
6. Company statements support what management committed to and reported. They
   do not, by themselves, prove causation.

## Scoring boundary

The v1 profiles link to calibrated scorecards under `../scoring`: completed
cases use outcome-calibrated retrodictions, while the ongoing Ford case uses its
latest included evidence. Separate commitment-only scorecards remain available
and exclude later facts. All scorecards use disclosed categorical anchors,
uncertainty ranges, and documented derivations. `reachable`, capacity fit, and
colliding models remain outputs rather than values copied into a profile.

Run `npm run test:app -- src/lib/stratos/cases/profile.test.ts` to validate
source references, time cutoffs, required assessments, and the boundary between
completed and ongoing cases.
