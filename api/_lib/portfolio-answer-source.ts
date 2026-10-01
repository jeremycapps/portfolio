// Deterministic portfolio answer sets and the router that selects one.
//
// Every answer here is hand-authored from the profile and rendered as a Facia
// card (timeline, structured cells). There is no model in this path and no
// grammar classifier: a small set of tight keyword predicates map a question to
// one deterministic set, and anything they do not claim returns null — the
// caller then answers it as grounded prose. This is the surviving half of the
// former facia stack; the verb×arity classifier and the model-JSON providers
// that fed it were removed, along with the misroutes they produced.
import type { AnswerSetV2, FieldInfoV2 } from '@facia/core';
import { supportsTensionQuestion, tensionAnswerSet } from './tension-answer-source';

const CANONICAL_QUESTION = 'What did Jeremy work on at Zocdoc?';

const QUESTION_TERMS = ['work', 'build', 'do', 'design system', 'accessibility', 'header'];

function normalizedQuestion(question: string): string {
  return question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

// ── Zocdoc ──────────────────────────────────────────────────────────────────

export function supportsPortfolioQuestion(question: string): boolean {
  const normalized = normalizedQuestion(question);
  const words = new Set(normalized.split(' '));
  return words.has('zocdoc') && QUESTION_TERMS.some((term) => (
    term.includes(' ') ? normalized.includes(term) : words.has(term)
  ));
}

export function zocdocAnswerSet(): AnswerSetV2 {
  const fields: FieldInfoV2 = {
    priority: {
      primary: ['title', 'contribution'],
      secondary: ['outcome'],
      supporting: ['scope'],
      audit: ['evidenceTier', 'source'],
    },
  };

  return {
    schema: 'facia.answer-set/2',
    question: CANONICAL_QUESTION,
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [
      {
        type: 'Value',
        payload: {
          title: 'Accessible design-system migration',
          contribution: 'Rebuilt and migrated assigned React components under a company-wide accessibility mandate.',
          outcome: 'Delivered reusable buttons, links, form inputs, and Header components for product-team adoption.',
          scope: 'Jeremy owned assigned components and participated in the initial audit; he did not lead the company-wide accessibility program.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md#career-history',
        },
        value: 'Accessible design-system migration',
        evidence: {
          status: 'profile-grounded',
          sourceRefs: ['content/profile.md#career-history'],
        },
        fields,
      },
      {
        type: 'Value',
        payload: {
          title: 'Header migration experiment',
          contribution: "Applied Zocdoc's existing A/B testing framework to the design-system team's first frontend-component experiment.",
          outcome: 'Supported a gradual test/control rollout across browsers and mobile.',
          scope: 'Jeremy applied the existing engineering-wide experimentation framework; he did not design that framework.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md#career-history',
        },
        value: 'Header migration experiment',
        evidence: {
          status: 'profile-grounded',
          sourceRefs: ['content/profile.md#career-history'],
        },
        fields,
      },
      {
        type: 'Value',
        payload: {
          title: 'Delivery workflow improvements',
          contribution: 'Built Jira dashboards, split initiatives into smaller tickets, and introduced a pull-request merge template.',
          outcome: 'Velocity increased by roughly 2–3 points per sprint, and average merge time fell by about one workday.',
          scope: 'These are delivery-process contributions, not a claim of formal people management.',
          evidenceTier: 'profile-grounded',
          source: 'content/profile.md#career-history',
        },
        value: 'Delivery workflow improvements',
        evidence: {
          status: 'profile-grounded',
          sourceRefs: ['content/profile.md#career-history'],
        },
        fields,
      },
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.zocdoc-work.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.zocdoc-work' },
        { step: 'source.loaded', value: 'content/profile.md#career-history' },
        { step: 'answer.emitted', value: 3 },
      ],
    },
  };
}

// ── Technologies ──────────────────────────────────────────────────────────────

const TECHNOLOGY_TERMS = [
  'technology',
  'technologies',
  'tech',
  'stack',
  'language',
  'languages',
  'skills',
  'framework',
  'frameworks',
];

export function supportsTechnologiesQuestion(question: string): boolean {
  const normalized = normalizedQuestion(question);
  const words = new Set(normalized.split(' '));
  return TECHNOLOGY_TERMS.some((term) => words.has(term)) || normalized.includes('worked with');
}

function technologyFields(withRepo: boolean): FieldInfoV2 {
  return {
    priority: {
      primary: withRepo ? ['name', 'repo'] : ['name'],
      secondary: ['category'],
      supporting: [],
      audit: ['evidenceTier', 'source'],
    },
  };
}

function technologyItem(entry: {
  name: string;
  category: string;
  repo?: string;
  sourceRefs: string[];
}) {
  const withRepo = typeof entry.repo === 'string';
  const payload = {
    name: entry.name,
    category: entry.category,
    ...(withRepo ? { repo: entry.repo as string } : {}),
    evidenceTier: 'profile-grounded',
    source: entry.sourceRefs.join(', '),
  };

  return {
    type: 'Value' as const,
    payload,
    value: entry.name,
    evidence: {
      status: 'profile-grounded' as const,
      sourceRefs: entry.sourceRefs,
    },
    fields: technologyFields(withRepo),
  };
}

export function technologiesAnswerSet(): AnswerSetV2 {
  const skillsRef = 'content/profile.md#skills-tools';
  return {
    schema: 'facia.answer-set/2',
    question: 'What technologies has Jeremy worked with?',
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [
      technologyItem({ name: 'TypeScript', category: 'Language', sourceRefs: [skillsRef] }),
      technologyItem({ name: 'React', category: 'UI library', sourceRefs: [skillsRef] }),
      technologyItem({
        name: 'Python',
        category: 'Language',
        repo: 'https://github.com/jeremycapps/corus',
        sourceRefs: [skillsRef, 'content/profile.md#domain-corus'],
      }),
      technologyItem({ name: 'C# / .NET', category: 'Language & runtime', sourceRefs: [skillsRef] }),
      technologyItem({ name: 'Java', category: 'Language', sourceRefs: [skillsRef] }),
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.technologies.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.technologies' },
        { step: 'source.loaded', value: skillsRef },
        { step: 'answer.emitted', value: 5 },
      ],
    },
  };
}

// ── Career history ────────────────────────────────────────────────────────────

const CAREER_TERMS = [
  'career',
  'history',
  'experience',
  'background',
  'resume',
  'cv',
  'timeline',
  'title',
  'titles',
  'roles',
  'jobs',
  'worked',
];

export function supportsCareerQuestion(question: string): boolean {
  const normalized = normalizedQuestion(question);
  const words = new Set(normalized.split(' '));
  // The career spine answers "what is his history" — a value shown as a timeline.
  // Grammar-free shape guards keep it off questions whose real shape is something
  // else, even when they share a keyword ("experience", "roles", "worked"):
  //   - a relational/synthesis question ("how/why …") → grounded prose
  //   - a polar or either/or verdict ("does he …", "… or …") → tension or prose
  if (/^(how|why)\b/.test(normalized)) return false;
  if (/^(did|does|do|is|are|was|were|can|could|will|would|should|has|have)\b/.test(normalized)) return false;
  if (/\bor\b/.test(normalized)) return false;
  // Sibling sets own their intent even though they share career keywords.
  if (supportsLookingForQuestion(question)) return false;
  if (supportsTechnologiesQuestion(question)) return false;
  if (supportsPortfolioQuestion(question)) return false;
  if (CAREER_TERMS.some((term) => words.has(term))) return true;
  return normalized.includes('current')
    && (words.has('role') || words.has('job') || words.has('position'));
}

const CAREER_REF = 'content/profile.md#career-history';

function careerFields(): FieldInfoV2 {
  return {
    priority: {
      primary: ['role', 'organization', 'period'],
      secondary: ['focus'],
      supporting: ['highlight'],
      audit: ['evidenceTier', 'source'],
    },
  };
}

function careerItem(entry: {
  role: string;
  organization: string;
  period: string;
  focus: string;
  highlight: string;
  sourceRef: string;
}) {
  return {
    type: 'Value' as const,
    payload: {
      role: entry.role,
      organization: entry.organization,
      period: entry.period,
      focus: entry.focus,
      highlight: entry.highlight,
      evidenceTier: 'profile-grounded',
      source: entry.sourceRef,
    },
    value: entry.role,
    evidence: {
      status: 'profile-grounded' as const,
      sourceRefs: [entry.sourceRef],
    },
    fields: careerFields(),
  };
}

// Reverse-chronological spine of full-time roles — the answer a recruiter scans
// for "current and last title" and drills into for the arc. Freelance and
// cultural work live in their own models, not on this timeline.
export function careerHistoryAnswerSet(): AnswerSetV2 {
  return {
    schema: 'facia.answer-set/2',
    question: "What is Jeremy's career history?",
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    structure: 'sequence',
    sequenceKind: 'temporal',
    items: [
      careerItem({
        role: 'Head of Operations',
        organization: 'Aroko',
        period: '2024–present',
        focus: 'Leads operations and technical delivery at a cooperative agency.',
        highlight: 'Authored an approved 90-day operating plan and built a Notion budgeting and estimating system.',
        sourceRef: 'content/profile.md#what-hes-doing-now',
      }),
      careerItem({
        role: 'Design Systems / Frontend Engineer',
        organization: 'Zocdoc',
        period: '2021–2024',
        focus: 'Rebuilt and migrated an outdated TypeScript/React design system under an accessibility mandate.',
        highlight: "Ran the design-system team's first frontend A/B experiment and cut average merge time by about a workday.",
        sourceRef: CAREER_REF,
      }),
      careerItem({
        role: 'Software / Product Engineer, C#',
        organization: 'Applied Software',
        period: '2019–2021',
        focus: 'Built construction-data integrations end to end on the 360Sync product.',
        highlight: 'Authored 5+ REST API wrapper libraries and trace logging that cut customer troubleshooting by 3–4 days.',
        sourceRef: CAREER_REF,
      }),
      careerItem({
        role: 'Software Engineer, legacy modernization',
        organization: 'Genesco',
        period: '2017–2019',
        focus: 'Modernized legacy COBOL systems into Java-based replacement workflows.',
        highlight: 'Translated embedded business logic and legacy data flows without disrupting operational continuity.',
        sourceRef: CAREER_REF,
      }),
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.career-history.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.career-history' },
        { step: 'source.loaded', value: CAREER_REF },
        { step: 'answer.emitted', value: 4 },
      ],
    },
  };
}

// ── What he's looking for ─────────────────────────────────────────────────────

// "What roles fit Jeremy / what's he looking for" is a forward-looking question
// about the work he wants next, not a lookup on the work he has done.
const ASPIRATION_TERMS = [
  'looking', 'seeking', 'targeting', 'target', 'want', 'wants', 'wanting',
  'fit', 'fits', 'suit', 'suits', 'suited', 'ideal', 'aspiration', 'aspirations',
];
const ROLE_SUBJECT_TERMS = [
  'role', 'roles', 'job', 'jobs', 'position', 'positions', 'work', 'title', 'titles',
];

export function supportsLookingForQuestion(question: string): boolean {
  const normalized = normalizedQuestion(question);
  const words = new Set(normalized.split(' '));
  // "How does X fit Y" is a relational mapping, not a question about what he wants.
  if (normalized.startsWith('how ')) return false;
  if (normalized.includes('looking for')) return true;
  const aspires = ASPIRATION_TERMS.some((term) => words.has(term));
  const aboutRoles = ROLE_SUBJECT_TERMS.some((term) => words.has(term));
  return aspires && aboutRoles;
}

const LOOKING_FOR_REF = 'content/profile.md#what-jeremy-is-looking-for';

function targetRoleFields(): FieldInfoV2 {
  return {
    priority: {
      primary: ['role'],
      secondary: ['fit'],
      supporting: ['context'],
      audit: ['evidenceTier', 'source'],
    },
  };
}

function targetRoleItem(entry: { role: string; fit: string; context: string }) {
  return {
    type: 'Value' as const,
    payload: {
      role: entry.role,
      fit: entry.fit,
      context: entry.context,
      evidenceTier: 'profile-grounded',
      source: LOOKING_FOR_REF,
    },
    value: entry.role,
    evidence: {
      status: 'profile-grounded' as const,
      sourceRefs: [LOOKING_FOR_REF],
    },
    fields: targetRoleFields(),
  };
}

// The roles Jeremy is targeting, drawn from the profile's "what he's looking for"
// section — the answer a recruiter scans first. Authored deterministically so it
// never depends on model behavior for the portfolio's most load-bearing question.
export function lookingForAnswerSet(): AnswerSetV2 {
  return {
    schema: 'facia.answer-set/2',
    question: 'What roles is Jeremy looking for?',
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [
      targetRoleItem({
        role: 'Forward Deployed Engineer',
        fit: 'Works directly with the people who own the problem — scoping it with them, building the system, and staying through adoption.',
        context: 'Primary client contact at Aroko, translating business and technical requirements into scopes and technical handoff; built customer API integrations end to end at Applied Software.',
      }),
      targetRoleItem({
        role: 'Member of Technical Staff',
        fit: 'Builds and ships production systems end to end — frontend architecture, API integrations, data, and AI.',
        context: "Production design-system and experimentation work at Zocdoc; this site's assistant, a production RAG agent built on his own work logs.",
      }),
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.looking-for.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.looking-for' },
        { step: 'source.loaded', value: LOOKING_FOR_REF },
        { step: 'answer.emitted', value: 2 },
      ],
    },
  };
}

// ── Aroko (current role) ──────────────────────────────────────────────────────

const AROKO_REF = 'content/profile.md#what-hes-doing-now';

export function supportsArokoQuestion(question: string): boolean {
  const normalized = normalizedQuestion(question);
  const words = new Set(normalized.split(' '));
  // Same grammar-free shape guards as the career spine: the card answers "what
  // he does at Aroko", a value — not a verdict, relational, or synthesis question.
  if (/^(how|why)\b/.test(normalized)) return false;
  if (/^(did|does|do|is|are|was|were|can|could|will|would|should|has|have)\b/.test(normalized)) return false;
  if (/\bor\b/.test(normalized)) return false;
  return words.has('aroko');
}

function arokoFields(): FieldInfoV2 {
  return {
    priority: {
      primary: ['title', 'contribution'],
      secondary: ['outcome'],
      supporting: ['scope'],
      audit: ['evidenceTier', 'source'],
    },
  };
}

function arokoItem(entry: { title: string; contribution: string; outcome: string; scope: string }) {
  return {
    type: 'Value' as const,
    payload: {
      title: entry.title,
      contribution: entry.contribution,
      outcome: entry.outcome,
      scope: entry.scope,
      evidenceTier: 'profile-grounded',
      source: AROKO_REF,
    },
    value: entry.title,
    evidence: {
      status: 'profile-grounded' as const,
      sourceRefs: [AROKO_REF],
    },
    fields: arokoFields(),
  };
}

// Jeremy's current role — the "what's he doing now" answer, authored from the
// profile so the headline role never depends on model behavior. Revenue is framed
// honestly as a company outcome, matching the grounding elsewhere in the corpus.
export function arokoAnswerSet(): AnswerSetV2 {
  return {
    schema: 'facia.answer-set/2',
    question: 'What does Jeremy do at Aroko?',
    answerType: 'value',
    path: 'meaning',
    inspection: 'available',
    actionable: false,
    items: [
      arokoItem({
        title: 'Operating plan and financial visibility',
        contribution: 'Authored and secured approval for a 90-day operating plan spanning finance, costing, and delivery — without pre-existing positional authority.',
        outcome: "Established the cooperative's first per-project pricing model and delivered its year-to-date financial review.",
        scope: 'Joined as lead web designer for a Shutterstock engagement, then took on operations and technical delivery.',
      }),
      arokoItem({
        title: 'Notion source-of-truth system',
        contribution: 'Built a Notion system connecting timesheets, roles, projects, and budgets, with queries and rollups for budget consumption and remaining capacity.',
        outcome: 'Reconciled data across YNAB, Bill.com, Notion, and spreadsheets to clarify payments, hours, work categories, and source reliability.',
        scope: 'Uses historical delivery data to inform estimates.',
      }),
      arokoItem({
        title: 'Unified delivery workflow',
        contribution: 'Diagnosed a design-to-development bottleneck and introduced a unified Framer-first workflow.',
        outcome: 'Cut web-project delivery time by roughly 50%; led an enterprise WordPress-to-Framer rebuild to launch on a weekly cadence and 48-hour review SLA.',
        scope: 'Served as Tech Lead and implementation owner through a mid-project disruption.',
      }),
      arokoItem({
        title: 'Revenue result',
        contribution: 'Aroko matched its full-year 2025 revenue of $135,000 during the first half of 2026.',
        outcome: 'Informed by the pricing and delivery systems he built.',
        scope: 'A company outcome, not solely his contribution.',
      }),
    ],
    operations: [],
    trace: {
      kind: 'direct',
      id: 'portfolio.aroko-work.v1',
      entries: [
        { step: 'question.selected', value: 'portfolio.aroko-work' },
        { step: 'source.loaded', value: AROKO_REF },
        { step: 'answer.emitted', value: 4 },
      ],
    },
  };
}

// ── Router ────────────────────────────────────────────────────────────────────

// The whole router: ordered deterministic card matchers. Tension runs first (a
// two-pole verdict must not be claimed by a keyword), then the intent-specific
// sets, then the career spine. A miss returns null — the caller answers as prose.
export function resolvePortfolioAnswer(question: string): AnswerSetV2 | null {
  if (supportsTensionQuestion(question)) return tensionAnswerSet(question);
  if (supportsLookingForQuestion(question)) return lookingForAnswerSet();
  if (supportsTechnologiesQuestion(question)) return technologiesAnswerSet();
  if (supportsPortfolioQuestion(question)) return zocdocAnswerSet();
  if (supportsArokoQuestion(question)) return arokoAnswerSet();
  if (supportsCareerQuestion(question)) return careerHistoryAnswerSet();
  return null;
}
