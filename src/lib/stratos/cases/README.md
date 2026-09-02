# StratOS case profiles

These files are dated evidence profiles for public-company strategy cases. They
are inputs to StratOS scorecards, not company ratings and not claims that
public disclosures reveal the full internal organization.

## Initial cases

- `target-canada-2012-2015`: bounded market-entry failure.
- `adobe-creative-cloud-2012-2016`: completed business-model transition.
- `dominos-growth-2018-2025`: explicit endpoints missed amid continued growth.
- `ford-model-e-2022-2026`: ongoing transformation with re-timed milestones.
- `va-ehr-modernization-2018-2025`: public-sector program whose verdict recovers.

The VA case is the library's worked example. It is the only case scored at four
consecutive decisions where the verdict moves in both directions — fog at the
authorization, floor at the first release and again at the expansion, then fog
at the reset — which is what demonstrates that the engine reads the increment
in front of it rather than the program's reputation. It is also the only case
whose sources are audit reports rather than the subject's own disclosures.

## Documented sources

[`SOURCES.md`](./SOURCES.md) lists every document in the library with the facts
resting on it and the date a public analyst could first use it. It is generated
from the profiles by `npm run gen:case-sources` and guarded by a drift test, so
it cannot fall behind the code it documents. Edit the profiles, not the sheet.

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
