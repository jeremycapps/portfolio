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
  'Systems-oriented technical operator and product-minded engineer who moves from '
  + 'workflow discovery through deployment: learning how a system actually works, '
  + 'identifying the binding constraint, building the technical or operational '
  + 'mechanism required to change it, and measuring the result. Experience spans '
  + 'internal operations, production design systems, customer-facing API integrations, '
  + 'and independent AI infrastructure that turns domain knowledge into reusable '
  + 'context. Strongest fit: forward-deployed engineering, AI operations, solutions '
  + 'architecture, and product/platform engineering.';

/** The identity and through-line, without the fit clause — the part a tailored
 *  summary must keep. Used to anchor the model and to check tailoring preserved
 *  the spine. */
export const SUMMARY_SPINE =
  'systems-oriented technical operator and product-minded engineer';
