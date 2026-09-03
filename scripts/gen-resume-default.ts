// AUTO-GENERATES src/lib/default-resume.generated.ts
//
// Bakes the standard resume at build time. The standard resume is modeled after
// a Forward Deployed AI Engineer / Lead role: we seed assembleResume with a
// canonical JD for that role so the summary routes to the reviewed
// forward-deployed-solutions entry and the AI/agent + integration bullets rank
// up (which populates the Projects section). With hasModel:false the summary is
// retrieved from the reviewed corpus, never generated — so the result is fully
// deterministic and the exact resume /api/resume would return for this JD,
// minus the network. The browser renders it the instant the resume chip is
// clicked; only tailoring (a different job description) ever hits the API.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleResume } from '../api/_lib/resume-source';
import { loadResumeCorpus } from '../api/_lib/resume-corpus';
import { matchSummary } from '../api/_lib/summary-router';
import { EXPECTED_SUMMARY_ID, STANDARD_RESUME_JD } from './resume-default-spec';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(root, 'src/lib/default-resume.generated.ts');

const routed = matchSummary(STANDARD_RESUME_JD);
if (routed?.id !== EXPECTED_SUMMARY_ID) {
  throw new Error(
    `gen-resume-default: standard JD routed to ${routed?.id ?? 'no match'}, expected ` +
      `${EXPECTED_SUMMARY_ID}. Adjust STANDARD_RESUME_JD or the summary corpus.`,
  );
}

const { view, provenance } = await assembleResume(STANDARD_RESUME_JD, loadResumeCorpus(), {
  hasModel: false,
});

if (view.summary.engine === 'model') {
  throw new Error('gen-resume-default: standard resume must not depend on the model.');
}

const response = { protocol: 'portfolio.resume/1' as const, view, provenance };

const body = `// AUTO-GENERATED from the resume corpus by scripts/gen-resume-default.ts.
// Do not edit by hand. This is the standard resume assembled from the canonical
// forward-deployed JD; it is baked so the resume chip renders with no API call.
import type { ResumeResponse } from './resume';

export const DEFAULT_RESUME: ResumeResponse = ${JSON.stringify(response, null, 2)};
`;

mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, body, 'utf8');
console.log(
  `gen-resume-default: wrote ${view.experience.length} roles · ${view.projects.length} projects (${provenance.deterministicPct}% deterministic) -> ${out}`,
);
