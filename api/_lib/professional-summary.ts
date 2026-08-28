// A canonical professional summary — the resume's identity statement, authored,
// not concatenated from bullets. It borrows the synthesis of the
// claude-job-application generated summaries: an identity, a through-line, the
// recent focus, and a fit clause, rather than a list of what was done.
//
// The deterministic path returns this as-is. The model path tailors it to a
// specific job, keeping the identity and through-line and adjusting emphasis and
// the fit clause — so the summary reads like a summary whether or not a model is
// in the loop. Voice: plain, specific, no em-dashes.

export const CANONICAL_SUMMARY =
  'Systems-oriented technical operator and product-minded engineer who works '
  + 'across product, operations, design, and engineering. The through-line is '
  + 'building the source-of-truth and context layer for messy workflows: turning '
  + 'scattered, ambiguous work into structured systems people can actually run, '
  + 'from internal budgeting and cross-system reconciliation to production '
  + 'design-system ownership and API integration delivery. Recent independent '
  + 'work centers on agentic AI infrastructure: multi-provider LLM orchestration, '
  + 'deterministic agent runtimes with enforced role boundaries, and evaluation '
  + 'harnesses that make unsupported claims a measured metric rather than an '
  + 'assumed risk. Strongest fit: AI platform and agent infrastructure, technical '
  + 'product operations, and product-systems architecture.';

/** The identity and through-line, without the fit clause — the part a tailored
 *  summary must keep. Used to anchor the model and to check tailoring preserved
 *  the spine. */
export const SUMMARY_SPINE =
  'systems-oriented technical operator and product-minded engineer';
