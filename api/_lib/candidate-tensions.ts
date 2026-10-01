// A demand-side index over the material already in RESUME_CORPUS and
// PORTFOLIO_EVIDENCE.
//
// The corpus is organised by supply: it describes what Jeremy did, and 159
// themes plus 79 role targets fall out of describing it. Every entry answers
// "what is true about Jeremy?" — a fact, tagged.
//
// Recruiters ask in the other direction. Eleven questions in eval/questions.yaml
// use two-pole grammar — "is it X, or Y?" — which no amount of tagging can
// answer, because breadth accumulates without ever becoming a position.
//
// This file adds no facts. Every pole cites engagement ids and evidence ids that
// already exist, and every placement is derived from bullets and cautions
// already written. `candidate-tensions.test.ts` fails if any id here does not
// resolve, so a tension can never reference material that isn't there.

import { PORTFOLIO_EVIDENCE, type EvidenceId } from './portfolio-evidence';
import { RESUME_CORPUS } from './resume-corpus.generated';

export type EngagementId = (typeof RESUME_CORPUS)['engagements'][number]['id'];

/** Where the evidence puts him. `shifting` means the poles are separated by
 *  time rather than by contradiction — the material for both is real, and the
 *  recent material sits on one side. Those are the trajectory questions. */
export type Placement = 'left' | 'right' | 'both' | 'shifting';

export interface TensionPole {
  name: string;
  engagements: readonly EngagementId[];
  evidence: readonly EvidenceId[];
}

export interface CandidateTension {
  id: string;
  /** Verbatim from eval/questions.yaml, so the index is traceable to demand. */
  question: string;
  left: TensionPole;
  right: TensionPole;
  placement: Placement;
  /** One sentence, derived only from corpus bullets and cautions. */
  basis: string;
  /** Carried from the corpus where a caution governs what may be claimed. */
  caution?: string;
}

export const CANDIDATE_TENSIONS: readonly CandidateTension[] = [
  {
    id: 'practice-depth',
    question: 'Is Jeremy an accessibility specialist, or a generalist who has worked under accessibility requirements?',
    left: {
      name: 'Accessibility specialist',
      engagements: [],
      evidence: [],
    },
    right: {
      name: 'Generalist working under accessibility requirements',
      engagements: ['zocdoc_design_system_migrations'],
      evidence: ['profile.zocdoc'],
    },
    placement: 'right',
    basis: 'The corpus records participation in an audit and migration of assigned components under a company-wide mandate — not ownership of the programme.',
    caution: 'Do not claim he led the accessibility programme; the corpus supports contribution under a mandate only.',
  },
  {
    id: 'practice-breadth',
    question: 'Across his roles, is Jeremy more of a specialist or a broad generalist?',
    left: {
      name: 'Specialist',
      engagements: ['zocdoc_design_system_migrations'],
      evidence: ['profile.zocdoc'],
    },
    right: {
      name: 'Broad generalist',
      engagements: [
        'genesco_legacy_modernization',
        'applied_software_api_customer_workflows',
        'zocdoc_design_system_migrations',
        'weill_cornell_data_pipeline',
        'aroko_operations_source_of_truth',
        'jeremy_domain_ai_multi_provider_llm_orchestration',
        'new_inc_cultural_systems_research',
      ],
      evidence: ['profile.identity', 'profile.skills'],
    },
    placement: 'right',
    basis: 'Seventeen engagements span COBOL-to-Java modernization, C# integration APIs, TypeScript design systems, Python data work, agency operations, and cultural research.',
  },
  {
    id: 'current-mode',
    question: 'Is Jeremy currently in a hands-on engineering role or an operations role?',
    left: {
      name: 'Hands-on engineering',
      engagements: [
        'jeremy_domain_ai_multi_provider_llm_orchestration',
        'jeremy_domain_langgraph_reference_runtime',
      ],
      evidence: ['profile.system-spine', 'profile.libera'],
    },
    right: {
      name: 'Operations',
      engagements: [
        'aroko_operations_source_of_truth',
        'aroko_design_program_management',
        'aroko_web_migration_technical_direction',
      ],
      evidence: ['profile.aroko'],
    },
    placement: 'both',
    basis: 'The title since 2024 is Head of Operations; concurrently the independent work is ~15,700 lines of TypeScript orchestration and a 3,694-line Python runtime.',
    caution: 'The independent engineering is single-operator with no external users; do not present it as employed engineering work.',
  },
  {
    id: 'output-maturity',
    question: 'Do Jeremy\'s current projects show he can still ship production engineering, or is he mostly prototyping now?',
    left: {
      name: 'Production shipping',
      engagements: [
        'zocdoc_design_system_migrations',
        'applied_software_api_customer_workflows',
        'genesco_legacy_modernization',
      ],
      evidence: ['profile.zocdoc', 'profile.applied-software', 'profile.genesco'],
    },
    right: {
      name: 'Prototyping',
      engagements: [
        'domain_corus_agentic_context_infrastructure',
        'tempo_stratos_v5_governed_decision_product',
        'jeremy_domain_langgraph_reference_runtime',
      ],
      evidence: ['profile.tempo', 'profile.protocols'],
    },
    placement: 'shifting',
    basis: 'Production delivery runs 2017–2024 across three employers; everything from 2024 is independent prototype work the corpus explicitly forbids describing as shipped.',
    caution: 'Never describe the independent projects as shipped, adopted, or used by anyone else.',
  },
  {
    id: 'stack-reach',
    question: 'Does Jeremy have backend and API experience, or is he frontend-only?',
    left: {
      name: 'Frontend only',
      engagements: [],
      evidence: [],
    },
    right: {
      name: 'Backend and API',
      engagements: [
        'applied_software_api_customer_workflows',
        'genesco_legacy_modernization',
        'weill_cornell_data_pipeline',
        'jeremy_domain_langgraph_reference_runtime',
      ],
      evidence: ['profile.applied-software', 'profile.genesco', 'profile.skills'],
    },
    placement: 'right',
    basis: 'C# integrations with 5+ authored REST wrapper libraries, Java legacy translation, a Python data pipeline, and a Python reference runtime.',
  },
  {
    id: 'origination',
    question: 'Did Jeremy design Zocdoc\'s A/B testing framework, or use an existing one?',
    left: {
      name: 'Designed the framework',
      engagements: [
        'jeremy_domain_langgraph_reference_runtime',
        'jeremy_domain_corus_chatbot_filesystem_runtime_contract',
        'applied_software_api_customer_workflows',
      ],
      evidence: ['profile.protocols', 'profile.facia'],
    },
    right: {
      name: 'Used an existing framework',
      engagements: ['zocdoc_design_system_migrations'],
      evidence: ['profile.zocdoc'],
    },
    placement: 'both',
    basis: 'At Zocdoc he applied the existing engineering-wide A/B framework to a Header rollout; the protocol and library authorship sits in the independent and Applied Software work.',
    caution: 'He applied the existing experimentation framework at Zocdoc; he did not design it.',
  },
  {
    id: 'codebase-context',
    question: 'Has Jeremy done real legacy-modernization work, or only greenfield projects?',
    left: {
      name: 'Legacy modernization',
      engagements: ['genesco_legacy_modernization', 'zocdoc_design_system_migrations'],
      evidence: ['profile.genesco', 'profile.zocdoc'],
    },
    right: {
      name: 'Greenfield',
      engagements: [
        'domain_corus_agentic_context_infrastructure',
        'jeremy_domain_ai_multi_provider_llm_orchestration',
        'tempo_strategy_framework_model',
      ],
      evidence: ['profile.system-spine', 'profile.tempo'],
    },
    placement: 'shifting',
    basis: 'COBOL-to-Java modernization ran 2017–2019 and design-system migration 2021–2024; all work since 2024 starts from nothing.',
  },
  {
    id: 'system-status',
    question: 'Is Domain/Corus a production system or a prototype?',
    left: {
      name: 'Production system',
      engagements: [],
      evidence: [],
    },
    right: {
      name: 'Prototype',
      engagements: [
        'domain_corus_agentic_context_infrastructure',
        'jeremy_domain_corus_chatbot_filesystem_runtime_contract',
      ],
      evidence: ['profile.protocols', 'profile.system-spine'],
    },
    placement: 'right',
    basis: 'The corpus records a specification and acceptance contract with no located implementation, and states the acceptance suite has never been executed.',
    caution: 'Describe it as designed and tested-by-contract, never as built or running, and never claim the acceptance suite passes.',
  },
  {
    id: 'ai-depth',
    question: 'Does Jeremy have real AI and agentic engineering experience, or just interest?',
    left: {
      name: 'Real agentic engineering',
      engagements: [
        'jeremy_domain_ai_multi_provider_llm_orchestration',
        'jeremy_domain_langgraph_reference_runtime',
        'domain_corus_agentic_context_infrastructure',
      ],
      evidence: ['profile.system-spine', 'profile.libera'],
    },
    right: {
      name: 'Interest without engineering',
      engagements: [],
      evidence: [],
    },
    placement: 'left',
    basis: 'A multi-provider orchestration system runs live against three model providers with token-budget and data-egress guardrails and a scoring evaluation harness.',
    caution: 'Single-operator, no external users; the harness exists and is enforced, but the sampled run scored low. Cite that the measurement exists, not that it scores well.',
  },
  {
    id: 'leadership-form',
    question: 'Has Jeremy managed people, or is his leadership project-based?',
    left: {
      name: 'Formal people management',
      engagements: [],
      evidence: [],
    },
    right: {
      name: 'Project and contributor leadership',
      engagements: ['aroko_junior_contributor_leadership', 'aroko_design_program_management'],
      evidence: ['profile.aroko'],
    },
    placement: 'right',
    basis: 'He led junior contributors through scoped projects with feedback cycles and delivery review; the corpus carries an explicit caution against a management claim.',
    caution: 'Frame as project and contributor leadership, not formal people management.',
  },
  {
    id: 'domain-exposure',
    question: 'Has Jeremy worked in a regulated or healthcare domain?',
    left: {
      name: 'Regulated or healthcare',
      engagements: ['zocdoc_design_system_migrations', 'weill_cornell_data_pipeline'],
      evidence: ['profile.zocdoc', 'profile.weill-cornell'],
    },
    right: {
      name: 'General commercial',
      engagements: [
        'applied_software_api_customer_workflows',
        'genesco_legacy_modernization',
        'aroko_operations_source_of_truth',
      ],
      evidence: ['profile.applied-software', 'profile.genesco', 'profile.aroko'],
    },
    placement: 'both',
    basis: 'Production healthcare surfaces at Zocdoc and an admissions data pipeline at Weill Cornell Medicine, alongside construction, retail, and agency work.',
  },
] as const;

const ENGAGEMENT_IDS = new Set(RESUME_CORPUS.engagements.map((e) => e.id));
const EVIDENCE_ID_SET = new Set(Object.keys(PORTFOLIO_EVIDENCE));

/** Every id a tension cites, paired with whether the corpus actually holds it. */
export function danglingReferences(
  tensions: readonly CandidateTension[] = CANDIDATE_TENSIONS,
): { tension: string; pole: string; kind: 'engagement' | 'evidence'; id: string }[] {
  const bad: { tension: string; pole: string; kind: 'engagement' | 'evidence'; id: string }[] = [];
  for (const t of tensions) {
    for (const [side, pole] of [['left', t.left], ['right', t.right]] as const) {
      for (const id of pole.engagements) {
        if (!ENGAGEMENT_IDS.has(id)) bad.push({ tension: t.id, pole: side, kind: 'engagement', id });
      }
      for (const id of pole.evidence) {
        if (!EVIDENCE_ID_SET.has(id)) bad.push({ tension: t.id, pole: side, kind: 'evidence', id });
      }
    }
  }
  return bad;
}

/** A pole with no citations is an asserted absence — the evidence does not place
 *  him there. That is a legitimate finding, not an error, but it must be
 *  deliberate, so it is reported separately from dangling ids. */
export function uncitedPoles(
  tensions: readonly CandidateTension[] = CANDIDATE_TENSIONS,
): { tension: string; pole: 'left' | 'right'; name: string }[] {
  const out: { tension: string; pole: 'left' | 'right'; name: string }[] = [];
  for (const t of tensions) {
    for (const [side, pole] of [['left', t.left], ['right', t.right]] as const) {
      if (pole.engagements.length === 0 && pole.evidence.length === 0) {
        out.push({ tension: t.id, pole: side, name: pole.name });
      }
    }
  }
  return out;
}
