# Shaped answers — shape from result, not from question

*Think-out-loud, 2026-09-28. Filed for later, not a plan.*

## The realization

The reason I was obsessed with the facia UI recipes early on: when I ask something
that compares across shared properties I want a **table**; when I ask for a set of
things I want **bullets**; a single fact wants a **sentence**. I want the answer
rendered in the shape that fits it. Saying it out loud, this is close to
*natural-language queries for HTML*.

## Why the first attempt broke, and what to keep

Facia's grammar router tried to pick the shape **from the question** — parse
verb × arity, guess a recipe. That's predicting output shape from the surface
grammar of the input, and it collides (the "roles"/"worked"/"or" keyword
misroutes I carved out in the #13 router removal). Brittle by construction.

The fix is to pick the shape **from the result**:

- retrieval returns N entities sharing a field set → that *is* a table, structurally
- retrieval returns a ranked set of items → bullets
- retrieval returns one fact → a sentence

"Comparison" isn't a thing to detect in the words *compare X and Y* — it's what it
looks like when the data comes back as ≥2 rows over shared columns. Shape is a
property of the answer's cardinality and schema, computed **after** retrieval, not
a prediction made before it.

The good half already exists and I kept it on purpose: `AnswerSetV2`
(`structure` + `items` with shared `fields`) resolved by `resolveAnswerSet` into a
`ComponentRecipe` **is** "typed data → HTML shape." The part I deleted was the
pre-retrieval guesser. Lesson: the UI instinct was right and pointed at the wrong
end of the pipe.

## The grounded vs naive line

The field calls the naive version *generative UI* — model emits the markup. Don't
build that one: ungrounded, the exact regeneration hazard the evidence pipeline is
designed against (see ontology `docs/pipeline.md`, "deterministic factual
realization"). The grounded version is **NL → typed retrieval → data-shape drives
component**: model localizes, code realizes the shape. Same split as the pipeline,
one layer up.

## The bridge, when I want it

Evidence claims today are free text (`subject` + `claim`), which can only render as
prose or a flat list. A comparison table needs claims that share a **schema** across
subjects — each engagement emitting `role` / `span` / `outcome` as fields, not a
sentence. The day some claims are emitted as typed records, "compare X across
engagements" becomes a table for free, because the renderer already knows what to do
with N same-typed rows. That's the seam where the shaped-UI instinct plugs back into
the evidence pipeline — no router required.
