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
  'profile.system-spine': {
    tier: 'profile-grounded',
    source: 'content/profile.md#selected-projects',
    grounding: "Jeremy's independent projects form one system, not unrelated side projects: a question maps to a deterministic path, which produces a checkable answer, which renders as a deterministic interface. Libera is the left half (question → query), Facia the right half (answer → recipe), with Domain, Timpos, and Corus as supporting protocols between them. The stated throughline is accountability — whether work is approaching what was declared, or moving away from it.",
  },
  'profile.libera': {
    tier: 'profile-grounded',
    source: 'content/profile.md#selected-projects',
    grounding: 'Libera is an independent page-based platform for composing, sharing, and deploying executable semantic models (page → package → deployment). Built today is its deterministic runtime — layered kernel, modelir, address, domain, and strategy over Value_out = Evaluate(Expression, Props), with an Address protocol recording where state motion happened and a layering test enforcing the architecture. Written in Mojo with 898 test assertions; a repository experiment on semantic reconstruction cost recorded a continue verdict. The page/package/deployment layers are not built yet. It is an independent prototype and architecture project, not a deployed product. Public repo: github.com/jeremycapps/libera.',
  },
  'profile.facia': {
    tier: 'profile-grounded',
    source: 'content/profile.md#selected-projects',
    grounding: 'Facia deterministically turns an answer into a UI recipe: answer → shape → pattern → affordances → component recipe, every stage a pure total function. Its facia.answer-set/2 contract defines four answer roles — value (what is known), verdict (what has been judged), operation (what change is enacted or offered), and convergence (whether repeated motion approaches the goal) — plus consumer-supplied disclosure depth (glance, inspect, focus, audit). It never interprets questions, evaluates domain truth, executes operations, or renders pixels. Shipped as the @facia/core TypeScript package, and it renders the structured answers on this portfolio. Public repo: github.com/jeremycapps/facia.',
  },
  'profile.protocols': {
    tier: 'profile-grounded',
    source: 'content/profile.md#selected-projects',
    grounding: 'Three narrow supporting protocols connect Libera to Facia. Domain binds addresses to meaning (Contract → Result → Verdict → CurrentState → Snapshot) and is built as a layer inside Libera. Timpos is a YAML-first v1 protocol spec for recording source-located state changes at addressable paths for replay and diff, with no implementation yet. Corus is a v1 protocol spec for coordinating objective state — a requirement declares an anticipated value at a Libera path, an objective relates requirements and carries completion criteria, and satisfaction is derived rather than authored — with no implementation yet; it is the accountability layer that answers whether declared objectives were satisfied. Note that an earlier, superseded Python prototype also called Corus is dormant and is not the public repository.',
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
