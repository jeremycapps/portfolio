export const PORTFOLIO_EVIDENCE = {
  'profile.identity': {
    tier: 'profile-grounded',
    source: 'content/profile.md#who-jeremy-is-one-paragraph',
    grounding: 'Jeremy is a systems-oriented technical operator and product-minded engineer working across product, operations, design, and engineering.',
  },
  'profile.aroko': {
    tier: 'profile-grounded',
    source: 'content/profile.md#what-hes-doing-now',
    grounding: 'At Aroko, Jeremy is Head of Operations and leads operational systems and client web delivery; the $135,000 revenue result is a company outcome, not solely his.',
  },
  'profile.zocdoc': {
    tier: 'profile-grounded',
    source: 'content/profile.md#career-history',
    grounding: 'At Zocdoc, Jeremy contributed to a TypeScript/React design-system migration, owned assigned components, coordinated migrations and QA, applied the existing A/B framework, and improved delivery workflows.',
  },
  'profile.applied-software': {
    tier: 'profile-grounded',
    source: 'content/profile.md#career-history',
    grounding: 'At Applied Software, Jeremy built construction-data integrations and REST wrappers, helped build an Azure authentication service, added trace logging, and collaborated on roadmap delivery.',
  },
  'profile.genesco': {
    tier: 'profile-grounded',
    source: 'content/profile.md#career-history',
    grounding: 'At Genesco, Jeremy contributed to modernizing legacy COBOL systems into Java replacement workflows.',
  },
  'profile.weill-cornell': {
    tier: 'profile-grounded',
    source: 'content/profile.md#career-history',
    grounding: 'For Weill Cornell Medicine, Jeremy built a Python-to-Google-Sheets admissions-data integration.',
  },
  'profile.domain-corus': {
    tier: 'profile-grounded',
    source: 'content/profile.md#selected-projects',
    grounding: 'Domain/Corus is an independent prototype for source-bound workflow context, evidence, decisions, validation, audit logs, and recovery; it is not a deployed production platform.',
  },
  'profile.tempo': {
    tier: 'profile-grounded',
    source: 'content/profile.md#selected-projects',
    grounding: 'Tempo is an exploratory Obsidian strategy-framework modeling prototype and precursor to Domain; its heuristic weights are not validated business measures.',
  },
  'profile.cultural-work': {
    tier: 'profile-grounded',
    source: 'content/profile.md#cultural-work-new-inc-new-museum',
    grounding: 'Jeremy conducts cultural-systems research through NEW INC and curated guest-specific Spotify playlists for Big Shot.',
  },
  'profile.skills': {
    tier: 'profile-grounded',
    source: 'content/profile.md#skills-tools',
    grounding: 'Jeremy works with TypeScript, React, C#, Python, Java, REST APIs, design systems, operations systems, context architecture, product design, and cultural research.',
  },
} as const;

export type EvidenceId = keyof typeof PORTFOLIO_EVIDENCE;
export const EVIDENCE_IDS = Object.keys(PORTFOLIO_EVIDENCE) as EvidenceId[];

export function evidencePromptIndex(): string {
  return EVIDENCE_IDS.map((id) => `${id}: ${PORTFOLIO_EVIDENCE[id].grounding}`).join('\n');
}
