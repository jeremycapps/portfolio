# Bucket-Weighted Resume Tailoring & Classifier Harness — Design

**Date:** 2026-08-21
**Status:** Approved for planning
**Scope:** Portfolio (`/Users/jeremycapps/Dev/portfolio`)
**Builds on:** `2026-08-20-deterministic-resume-surface-design.md`

## Context & problem

The deterministic resume surface assembles a resume body from source-verbatim
bullets and confines the model to bullet selection + the summary paragraph. Two
iterations exposed a deeper problem than ordering:

1. When bullet *selection* was model-driven, a job posting could rank a core
   role's bullets low and the whole role vanished — the current job (Aroko) fell
   off a forward-deployed-engineer resume entirely.
2. The fix ("always include every employer") over-corrected: it puts **NEW INC /
   music curation on a software-engineering resume** — irrelevant content that
   reads as noise to an engineering recruiter, and vice versa.

The root cause is that relevance is being judged at the **whole-role** level —
fuzzy, per-JD-per-role, hard to make correct or to evaluate. A role is not
uniformly "relevant" or not; a single role contains claims that matter to
different audiences.

Two reframes resolve this:

- **NEW INC is not a role.** It is a fellowship. Framed as an **award** ("NEW
  INC Fellowship, Social Architecture"), it adds selectivity signal to any
  resume without competing as work experience, and it stops being the outlier
  that the rest of the history has to be reconciled against.
- **Buckets belong on claims, not roles.** Each bullet carries a weighted vector
  over a small bucket vocabulary; the JD carries a profile over the same
  vocabulary; relevance is a weighted match. One role can then read differently
  per JD — Aroko surfaces operations bullets for an ops posting and
  technical-direction bullets for an engineering one — *same role, different
  face*. A role appears because its bullets scored, not because of a role label.

This collapses the intractable "is this resume good?" judgment into one small,
gradable decision — **classify the JD into a bucket profile** — with everything
downstream deterministic.

## North-star claim

A tailored on-page resume whose section membership and bullet selection are a
**deterministic function of two inputs**: (a) static, authored per-claim bucket
weights baked into the corpus, and (b) a single per-request JD → bucket-profile
classification. The only model call that shapes *which* content appears is that
one classification, and it is covered by an evaluation harness that scores it
against curated, labeled job descriptions. Wrong content (music on an
engineering JD) becomes impossible-by-construction rather than
prevented-by-heuristic.

## Goals

1. Reframe NEW INC as an **Awards** entry; remove its two records from
   Experience.
2. Introduce a **5-bucket vocabulary** and a **weight vector per claim**
   (bullets and projects), authored offline and baked into the corpus.
3. Add a **JD classifier** that emits a bucket profile — model when a key is
   present, deterministic keyword fallback otherwise (same `hasModel` shape as
   selection/summary; endpoint still works with zero model calls).
4. Make **assembly deterministic** given the classification: roles by recency,
   3–5 relevance-sorted bullets above a floor, projects as 2-sentence summaries,
   awards always shown.
5. Build a **classifier harness**: curated JDs labeled with expected bucket
   profiles, scored for classification accuracy, mirroring `eval/`.
6. Preserve the provenance badge; add classification as a labeled operation.

## Non-goals

- Rebuilding or editing the sibling `claude-job-application` repo. Bucket weights
  and awards live in the **portfolio**; the sibling `engagements.yaml` stays
  read-only. (The baked corpus already originates from a manual build step.)
- Auto-deriving bucket weights at runtime. Weights are static authored data; the
  model may *assist* the first authoring pass offline, but the frozen values are
  reviewed by Jeremy and baked.
- PDF/DOCX export, cover letters, job discovery — out of scope, as before.
- Changing the `@facia/core` schema.
- A model-authored resume body. The body stays source-verbatim; the model
  contributes the summary paragraph and the JD classification only.

## Decisions (locked with Jeremy)

- **Bucket vocabulary (5):** `engineering`, `operations`, `product`, `program`,
  `creative_cultural`.
- **Weights are per-claim and multi-valued** — a vector in `[0,1]^5`, not a
  single label. Example: Aroko web-migration bullet ≈ `{engineering: 0.6,
  program: 0.7, operations: 0.5, product: 0.3, creative_cultural: 0.0}`.
- **NEW INC → Award:** `"NEW INC Fellowship, Social Architecture"`, year `2025`,
  no bullets. Its two Experience engagements are excluded from the Experience
  section.
- **Awards are always shown**, independent of the JD.
- **Projects are weighted too** and tailor like bullets; rendered as a 2-sentence
  summary.
- **JD classification** is the single per-request judgment; model + deterministic
  fallback.
- **Inclusion is a floor + 3–5 cap**, not a fixed count.
- **Sections:** Summary · Experience · Projects · Awards · Education.

## Data model

### Bucket vocabulary

```ts
export const BUCKETS = [
  'engineering', 'operations', 'product', 'program', 'creative_cultural',
] as const;
export type Bucket = (typeof BUCKETS)[number];
export type BucketVector = Record<Bucket, number>; // each in [0, 1]
```

### Claim weights (authored, baked)

- Every `ResumeBullet` and `ResumeProject` gains `buckets: BucketVector`.
- Weights are authored in a **portfolio-owned source** —
  `scripts/resume-buckets.yaml` — keyed by bullet id (`<engagementId>.b<n>`) and
  project id. `build-resume-corpus.mjs` merges these into the baked
  `resume-corpus.generated.ts`.
- **Build-time coverage check:** the build fails if any corpus bullet/project
  lacks a weight entry, or if a weight entry references an unknown id. This
  guards against the positional-id fragility (`engId.bN` shifts if source bullet
  order changes) by forcing every id to be accounted for on every rebuild.
- First authoring pass is generated model-assisted offline (a one-off script,
  not part of the runtime), reviewed by Jeremy, then committed as static YAML.

### Awards (authored, baked)

```ts
export interface ResumeAward { name: string; year: number; }
```

- Authored in the build script / a small portfolio source; baked into the
  corpus. v1 content: `{ name: 'NEW INC Fellowship, Social Architecture', year: 2025 }`.

### View additions

- `ResumeView` gains `awards: ResumeAward[]`.
- `ResumeProject` keeps `{ id, name, text }` (no dates — removed in the prior
  iteration) and internally carries `buckets` for scoring.

## JD classification

```ts
export interface Classification { profile: BucketVector; engine: 'model' | 'deterministic'; }
export function classifyJob(job: string, deps: AssembleDeps): Promise<Classification>;
```

- **Model path** (`hasModel`): one call. System prompt asks for a JSON object
  scoring the posting 0–1 on each of the five buckets. Parse defensively (reuse
  `parseIdList`-style JSON extraction), clamp to `[0,1]`, drop unknown keys,
  default missing buckets to 0.
- **Deterministic fallback:** a seed keyword lexicon per bucket (e.g.
  engineering → `typescript, react, api, backend, latency, …`; program →
  `roadmap, stakeholder, delivery, milestone, …`; creative_cultural →
  `curation, editorial, exhibition, community, …`). Score = normalized keyword
  hit counts over the tokenized JD.
- **Normalization:** both paths normalize so the dominant bucket = 1.0 (relative
  emphasis), keeping the dot-product scale stable regardless of engine.
- **Failure/empty** → fall back to deterministic, then to an
  all-engineering-leaning default if the JD is unclassifiable, so the endpoint
  always produces a resume.

## Assembly algorithm (deterministic given the profile)

Let `p` = classification profile, `w(b)` = a claim's weight vector.
`relevance(claim) = Σ_bucket w(b) · p(b)`.

Constants (tunable during planning): `FLOOR = 0.2`, `MIN_BULLETS = 3`,
`MAX_BULLETS = 5`, `MAX_PROJECTS = 3`.

1. **Experience.** Group employer engagements by organization (merge Aroko's 3
   and Zocdoc's 2 records; NEW INC excluded — it is an award). For each org:
   - Compute `relevance` for every bullet.
   - A role **qualifies** if it has ≥1 bullet with `relevance ≥ FLOOR`, **or** it
     is the single most-recent employer (guarantees the current role is never
     dropped for a plausibly-matching JD).
   - Selected bullets = those with `relevance ≥ FLOOR`, sorted by relevance desc;
     if fewer than `MIN_BULLETS`, top up from the role's remaining bullets by
     relevance; cap at `MAX_BULLETS`.
   - Order qualifying roles by **recency** (newest first).
2. **Projects.** Score each project; include those with `relevance ≥ FLOOR`,
   ordered by relevance desc, capped at `MAX_PROJECTS`; render top-2 bullets as a
   2-sentence summary.
3. **Awards.** Always emitted, ordered by year desc.
4. **Summary.** Unchanged: model-written from the selected claims when
   `hasModel`, deterministic assembly otherwise.

Consequences: a music JD classifies `creative_cultural`-dominant → engineering
projects fall below the floor and recede, while the NEW INC award still shows. An
engineering JD → NEW INC never enters Experience, projects surface, Aroko shows
its engineering-weighted bullets.

## Harness

- **Fixtures:** `eval/resume-jds.yaml` — entries `{ id, title, jd, expect }`
  where `expect` is either a labeled top bucket or a full expected profile.
- **Runner:** mirrors `eval/run.ts` / `produce.ts` — runs `classifyJob` through
  the production classifier, appends JSONL to `eval/reports/`, supports
  `--dry-run` / `--filter` / `--limit`.
- **Judge (scoring):** top-bucket accuracy plus profile cosine similarity to the
  expected vector; a per-run summary. Judging can re-run over saved records
  without re-calling the model (same split as the coverage harness).
- Everything downstream of the classifier is deterministic → covered by ordinary
  unit tests, not the harness.

## Provenance impact

- Add a `classification` operation to the audit list, engine `model` or
  `deterministic`.
- The char-based deterministic/model percentage is unchanged in principle:
  classification emits no user-visible chars (like `selection` today); the
  summary remains the only model char contributor. Classification is surfaced in
  the audit list as a labeled model touch-point.

## Affected interfaces (summary)

- `resume-corpus.ts`: `Bucket`, `BucketVector`, `buckets` on `ResumeBullet` /
  `ResumeProject`, `ResumeAward`, `awards` on `ResumeCorpus`.
- `resume-source.ts`: `classifyJob`, bucket scoring, rewritten `buildExperience`
  / `buildProjects`, `awards` in `ResumeView`, provenance op.
- `src/lib/resume.ts` + `resume.test.ts` contract mirror: `awards`.
- `resume-surface.tsx`: Awards section render.
- `scripts/build-resume-corpus.mjs` + `scripts/resume-buckets.yaml`: weight
  merge + coverage check + awards.
- `eval/resume-jds.yaml` + runner/judge.

## Testing strategy

- **Scoring:** dot-product relevance; normalization invariants (dominant = 1).
- **Classifier fallback:** keyword lexicon produces expected dominant bucket on
  representative JDs; model path parses/clamps/normalizes; malformed model output
  falls back.
- **Assembly:** NEW INC never in Experience; award always present; engineering JD
  includes projects + Aroko(eng bullets), excludes nothing musical from Experience
  because there's nothing musical there; music JD recedes projects; floor +
  3–5 cap; recency order; current-role guarantee.
- **Build:** coverage check fails on missing/unknown weight ids.
- **Harness:** fixture schema, dry-run estimate, judge scoring math.

## Open questions / risks

- **Weight authoring subjectivity.** Mitigated by a reviewed first pass and the
  build-time coverage check; weights are visible, versioned, and tunable.
- **Constant tuning** (`FLOOR`, caps) — set defaults now, tune against the
  harness fixtures during implementation.
- **Positional bullet ids.** Mitigated by the build-time coverage check; a future
  cleanup could give bullets stable slugs, out of scope here.

## Rollout

Single branch. Land data-model + build changes (weights author pass, awards)
first so the corpus is valid, then the classifier + assembly, then the harness.
Behind the existing deterministic fallback throughout, so no runtime depends on a
model key.
