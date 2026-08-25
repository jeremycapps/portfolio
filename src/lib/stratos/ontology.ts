// StratOS v5.1 six-tension ontology — the data the instrument stands on.
//
// Ported from _metadata/Tension_Model.md and _metadata/Ownership_Model.md.
// Pure data, no @facia/core runtime: safe to import from both the browser
// (for pole names, functions, colours) and the build-time recipe generator.

export type RoleKey =
  | 'CSO' | 'CMO' | 'CEO' | 'CDO' | 'CKO' | 'CGO'
  | 'COO' | 'CIO' | 'CPO' | 'CFO' | 'CRO' | 'CTO';

export type PoleSide = 'l' | 'neutral' | 'r';
export type PlacedSide = 'l' | 'r';

export interface Role {
  /** Full officer title, kept for accessibility labels only. */
  readonly title: string;
  /** The function word shown in the UI — lighter than the officer title. */
  readonly fn: string;
  readonly mandate: string;
  readonly lens: string;
  readonly questions: readonly string[];
}

export interface Tension {
  readonly id: string;
  readonly pair: 'Economics' | 'Commitment' | 'Renewal';
  readonly layer: 'StratOps' | 'BizOps';
  readonly name: string;
  readonly question: string;
  readonly left: string;
  readonly right: string;
  readonly leftOwner: RoleKey;
  readonly rightOwner: RoleKey;
  readonly proofLeft: string;
  readonly proofRight: string;
  readonly metric: string;
  readonly lensLeft: string;
  readonly lensRight: string;
}

export const ROLES: Record<RoleKey, Role> = {
  CSO: { title: 'Chief Strategy Officer', fn: 'Strategy',
    mandate: 'Protect the activities, assets, and economics the firm must own to remain defensible.',
    lens: 'Define the minimum viable control position: own the differentiators; open the rest.',
    questions: ['What must the firm own for its promise to remain credible?', 'Where is partner dependence becoming concentration risk?', 'Which reusable assets need explicit economic accountability?'] },
  CMO: { title: 'Chief Marketing Officer', fn: 'Marketing',
    mandate: 'Turn partner, expert, client, alumni, and technology participation into measurable market value.',
    lens: 'Move from partnership announcements to participant economics.',
    questions: ['Which participants create value rather than just reach?', 'Where do network effects exist, and where is the firm subcontracting?', 'How is ecosystem value shared across clients, contributors, and the firm?'] },
  CEO: { title: 'Chief Executive Officer', fn: 'Executive',
    mandate: 'Set clear theses, decision rights, and commitment discipline without premature closure.',
    lens: 'Distinguish productive conviction from premature closure.',
    questions: ['What must be decided now?', 'What evidence would justify delaying commitment?', 'Which decisions are reversible, and who owns reversal?'] },
  CDO: { title: 'Chief Data Officer', fn: 'Data',
    mandate: 'Ensure external evidence, disconfirming data, and alternative interpretations can change commitments before lock-in.',
    lens: 'Make uncertainty visible before executive commitment.',
    questions: ['What evidence could change the current thesis?', 'Is disconfirming evidence visible before resource commitment?', 'Where do incentives encourage confirmation?'] },
  CKO: { title: 'Chief Knowledge Officer', fn: 'Knowledge',
    mandate: 'Turn experience into reusable institutional capability without flattening expert judgment.',
    lens: 'Codify what improves quality, speed, and resilience.',
    questions: ['What knowledge is strategically reusable?', 'Which expertise cannot be separated from practitioner judgment?', 'How quickly does this knowledge become obsolete?'] },
  CGO: { title: 'Chief Growth Officer', fn: 'Growth',
    mandate: 'Create offerings that customers adopt, pay for, renew, or use to define a new category of need.',
    lens: 'Validate renewal through adoption, revenue, and repeatability.',
    questions: ['What proves an offering is genuinely new?', 'Has the market adopted or renewed it?', 'Does it create repeatable economics?'] },
  COO: { title: 'Chief Operating Officer', fn: 'Operations',
    mandate: 'Preserve reliable human execution, exception handling, and quality as delivery systems automate.',
    lens: 'Automate avoidable effort while preserving expert intervention.',
    questions: ['Which tasks require professional judgment?', 'Where are exceptions concentrated?', 'Can the operation recover when automated systems fail?'] },
  CIO: { title: 'Chief Information Officer', fn: 'Information',
    mandate: 'Use systems to remove avoidable effort and improve end-to-end client-visible speed, reliability, and quality.',
    lens: 'Prioritize client-visible flow, not tool installation.',
    questions: ['Where is the true end-to-end constraint?', 'What evidence proves flow improved?', 'Are systems interoperable across units and partners?'] },
  CPO: { title: 'Chief People Officer', fn: 'People',
    mandate: 'Protect skill coverage, retention, learning, resilience, and readiness as RPE and automation pressures rise.',
    lens: 'Treat workforce capacity as a strategic asset, not a utilization pool.',
    questions: ['Which capabilities are becoming scarce?', 'How is AI changing apprenticeship?', 'Is RPE rising because capability is increasing or being depleted?'] },
  CFO: { title: 'Chief Financial Officer', fn: 'Finance',
    mandate: 'Convert workforce, systems, IP, acquisitions, relationships, and data into durable economic return.',
    lens: 'Use RPE diagnostically — never as a standalone target.',
    questions: ['What drives RPE?', 'Is return recurring or engagement-dependent?', 'Does system investment reduce marginal delivery cost?'] },
  CRO: { title: 'Chief Risk Officer', fn: 'Risk',
    mandate: 'Keep autonomous action, professional judgment, and client exposure bounded, traceable, and accountable.',
    lens: 'Build differentiated control paths by risk level.',
    questions: ['What could cause irreversible harm?', 'Which actions require human authorization?', 'Can the firm reconstruct how a conclusion was produced?'] },
  CTO: { title: 'Chief Technology Officer', fn: 'Technology',
    mandate: 'Ship reversible, observable improvements fast enough to create adoption, feedback, and measurable value.',
    lens: 'Create bounded release velocity.',
    questions: ['What can safely ship now?', 'Is the release reversible?', 'Did deployment create adoption and measurable value?'] },
};

export const TENSIONS: readonly Tension[] = [
  { id: 'advantage', pair: 'Economics', layer: 'StratOps', name: 'Advantage',
    question: 'Does advantage come from assets the firm controls or interactions it enables?',
    left: 'Controlled value chain', right: 'Orchestrated ecosystem', leftOwner: 'CSO', rightOwner: 'CMO',
    proofLeft: 'Controlled activities, proprietary capability, owned economics',
    proofRight: 'Partner-produced value, participant activity, network effects',
    metric: 'External Value Creation Share',
    lensLeft: 'porter_01 thesis · maister_07 supporting', lensRight: 'parker_11 counterweight' },
  { id: 'resource', pair: 'Economics', layer: 'BizOps', name: 'Resource',
    question: 'Is the firm preserving the capacity that produces value, and does that capacity realize a durable return?',
    left: 'Workforce capacity', right: 'Capital return', leftOwner: 'CPO', rightOwner: 'CFO',
    proofLeft: 'Skill coverage, capacity buffer, retention, learning readiness',
    proofRight: 'ROIC, free cash flow, economic profit, durable capital productivity',
    metric: 'Extraction Balance',
    lensLeft: 'ton_10 counterweight', lensRight: 'dupont_03 thesis' },
  { id: 'discernment', pair: 'Commitment', layer: 'StratOps', name: 'Discernment',
    question: 'When should the firm impose a clear answer, and when keep the problem open?',
    left: 'Structured conviction', right: 'Open inquiry', leftOwner: 'CEO', rightOwner: 'CDO',
    proofLeft: 'Decision rights, thesis clarity, commitment discipline',
    proofRight: 'Disconfirming evidence incorporated before commitment',
    metric: 'Discovery Before Commitment Rate',
    lensLeft: 'minto_02 thesis', lensRight: 'edmondson_09 counterweight · parker_11 supporting' },
  { id: 'execution', pair: 'Commitment', layer: 'BizOps', name: 'Execution',
    question: 'What must be assured inside the firm, and what is ready to be released into the environment?',
    left: 'Risk friction', right: 'Release', leftOwner: 'CRO', rightOwner: 'CTO',
    proofLeft: 'Control effectiveness, bounded exposure, reversibility',
    proofRight: 'Production release, adoption, and realized time-to-value',
    metric: 'Delivery Assurance Balance',
    lensLeft: 'nist_12 governance foundation · anthropic_13 runtime control', lensRight: 'dora_15 thesis · teamops_14 supporting' },
  { id: 'invention', pair: 'Renewal', layer: 'StratOps', name: 'Invention',
    question: 'Does renewal come from deepening what the firm knows, or creating what the market has not seen?',
    left: 'Codified fluency', right: 'Novel offering creation', leftOwner: 'CKO', rightOwner: 'CGO',
    proofLeft: 'Knowledge reuse, redundancy, practitioner fluency',
    proofRight: 'Adoption and revenue from genuinely category-setting offers',
    metric: 'Renewal Balance',
    lensLeft: 'nonaka_17 thesis · apqc_05 supporting', lensRight: 'aaker_16 thesis' },
  { id: 'operations', pair: 'Renewal', layer: 'BizOps', name: 'Operations',
    question: 'Does output come from applied effort or from systems that remove the need for it?',
    left: 'Execution discipline', right: 'Systems and flow', leftOwner: 'COO', rightOwner: 'CIO',
    proofLeft: 'Reliable human execution and exception handling',
    proofRight: 'Customer-visible end-to-end flow, cycle time, and reliability',
    metric: 'Systematisation Balance',
    lensLeft: 'goldratt_04 thesis · dora_15 supporting', lensRight: 'apqc_05 thesis' },
];

export const PAIR_QUESTION: Record<Tension['pair'], string> = {
  Economics: 'Where the spread comes from / what sustaining it costs',
  Commitment: 'When to lock an answer / when to ship it',
  Renewal: 'Making the new / running the known',
};

// The validation-locus convention, quoted from Tension_Model.md § Polarity convention.
export const LOCUS: Record<PlacedSide, { where: string; protects: string }> = {
  l: { where: 'Evidence principally inside the enterprise', protects: 'the institutional condition required to act' },
  r: { where: 'Response at the enterprise boundary or beyond it', protects: 'the realized consequence of action' },
};

export const ONTOLOGY_SOURCES = ['_metadata/Tension_Model.md', '_metadata/Ownership_Model.md'] as const;
export const CSUITE_SOURCE = 'StratOS_v5_CSuite_Micro_Reports.docx';

export const ownerOf = (t: Tension, side: PlacedSide): Role =>
  ROLES[side === 'l' ? t.leftOwner : t.rightOwner];
export const counterweightOf = (t: Tension, side: PlacedSide): Role =>
  ROLES[side === 'l' ? t.rightOwner : t.leftOwner];
export const poleName = (t: Tension, side: PlacedSide): string =>
  side === 'l' ? t.left : t.right;
export const proofOf = (t: Tension, side: PlacedSide): string =>
  side === 'l' ? t.proofLeft : t.proofRight;
export const lensOf = (t: Tension, side: PlacedSide): string =>
  side === 'l' ? t.lensLeft : t.lensRight;
