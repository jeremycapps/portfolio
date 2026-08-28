// Curated tailored summaries, borrowed from the reviewed CVs in
// claude-job-application. Each was written and approved for a real job, so
// routing a new JD to the nearest one returns a strong summary without
// regenerating it — the same retrieval move the tension index and the bullet
// ranker already use.
//
// ⚠️ CURATION: these are lightly cleaned extractions. Jeremy has flagged quirks
// in some generated CVs; treat this file as the place to fix them by hand. The
// matcher and the portfolio never touch the source HTML — only this list.
//
// `signal` is the authored routing key: the domains and role shapes this
// summary was tailored for. The matcher scores a JD against signal plus the
// summary text, so a sharpened signal beats leaning on the prose alone.

export interface TailoredSummary {
  id: string;
  signal: readonly string[];
  summary: string;
  /** The single most-apt title per organization, as the reviewed CV chose it.
   *  Keyed by the organization label in RESUME_CORPUS. */
  roles: Readonly<Record<string, string>>;
}

export const SUMMARY_CORPUS: readonly TailoredSummary[] = [
  {
    id: 'integration-engineer',
    signal: ['integration', 'integrations', 'api', 'implementation', 'implementation engineer',
      'payments', 'authentication', 'data mapping', 'customer', 'client', 'go-live',
      'forward deployed', 'solutions', 'connectors'],
    summary:
      'Implementation-minded engineer who takes client integrations from design through launch: '
      + 'API research, authentication, data mapping, testing, release support, and customer '
      + 'troubleshooting. Inherited and extended a multi-platform data-integration product’s '
      + 'connectors to four external systems end-to-end, working directly with technical customers '
      + 'through go-live. Also owns production front-end (React/TypeScript), so I can consult on '
      + 'both sides of an integration and translate business requirements into technical solutions.',
    roles: {
      "Aroko": "Technical Director, Client Web Work",
      "Zocdoc": "Design Systems Engineer",
      "Applied Software": "Software Engineer (360Sync)",
      "Genesco": "Software Engineer"
    },
  },
  {
    id: 'applied-ai-agents',
    signal: ['applied ai', 'agents', 'agent', 'evaluation', 'eval', 'reliability', 'llm',
      'orchestration', 'langgraph', 'runtime', 'observability', 'guardrails', 'harness'],
    summary:
      'Applied-AI engineer focused on making agents reliable and measurable, not just capable. '
      + 'I built a multi-provider LLM orchestration system with an evaluation harness that scores '
      + 'every run on evidence accuracy and unsupported claims against a golden baseline, and a '
      + 'deterministic agent runtime on LangGraph with enforced role boundaries and crash-recovery '
      + 'testing. The through-line of my work is closing the gap between an agent that looks good '
      + 'in a demo and one dependable enough to run unattended. Backend fundamentals from years of '
      + 'API-integration delivery; React/TypeScript from production design-systems work.',
    roles: {
      "Aroko": "Head of Operations / Technical Director",
      "Zocdoc": "Design Systems Engineer",
      "Applied Software": "Software / Product Engineer (360Sync)",
      "Genesco": "Software Engineer / Legacy Modernization"
    },
  },
  {
    id: 'zero-to-one-generalist',
    signal: ['0-to-1', 'zero to one', 'founder', 'founding', 'generalist', 'ambiguous',
      'internal tooling', 'high agency', 'special projects', 'ai-native', 'first principles',
      'prototype', 'builder'],
    summary:
      'High-agency builder who takes ambiguous 0-to-1 problems from first principles to working '
      + 'systems, and who works AI-natively by default. I took an independent AI product through '
      + 'five generations end to end (now live at jeremycapps.com/stratos), built internal '
      + 'source-of-truth tooling that ran real operations, and direct multiple AI coding agents '
      + 'across research, implementation, and validation while owning every schema and claim '
      + 'myself. My instinct is to ask why a process exists before automating it, then build the '
      + 'smallest thing that actually moves the outcome. Engineering background across product, '
      + 'operations, and integration.',
    roles: {
      "Aroko": "Head of Operations",
      "Zocdoc": "Design Systems Engineer",
      "Applied Software": "Software Engineer (360Sync)"
    },
  },
  {
    id: 'builder-operator',
    signal: ['builder-operator', 'operator', 'cross-functional', 'product', 'operations',
      'entrepreneur', 'eir', 'entrepreneur in residence', 'range', 'generalist', 'breadth'],
    summary:
      'Builder-operator and product-minded engineer who moves across product, operations, design, '
      + 'and engineering without losing depth in any of them. Engineering is the hard skill; the '
      + 'range is the edge. Ships real work: led technical delivery on an enterprise corporate-site '
      + 'rebuild that remains live, owned production design-system components in a healthcare '
      + 'product, and delivered customer-facing API integrations. For the past year, building AI '
      + 'infrastructure 0-to-1: multi-provider LLM orchestration, a deterministic agent runtime, '
      + 'and evaluation harnesses that make unsupported model claims a measured metric. Live work '
      + 'is public at jeremycapps.com and jeremycapps.com/stratos.',
    roles: {
      "Aroko": "Technical Director, Client Web Work",
      "Zocdoc": "Design Systems Engineer",
      "Applied Software": "Software Engineer (360Sync)"
    },
  },
  {
    id: 'frontend-design-systems',
    signal: ['frontend', 'front-end', 'react', 'typescript', 'design systems', 'design-system',
      'developer tools', 'developer-facing', 'ui', 'components', 'observability', 'evals',
      'agent tooling'],
    summary:
      'Senior frontend engineer specializing in TypeScript/React design systems and '
      + 'developer-facing product surfaces. At Zocdoc I owned a portfolio of shared production '
      + 'React components and drove their migration across healthcare surfaces, shipping behind '
      + 'A/B experiments. I pair that frontend depth with deep fluency in the agent-tooling domain '
      + 'observability and evals products serve: I built an agent runtime on LangGraph and an '
      + 'evaluation harness that scores LLM runs for accuracy and unsupported claims, so I '
      + 'understand the product from the user’s side, not just the UI’s.',
    roles: {
      "Aroko": "Head of Operations / Lead Web Designer / Technical Director",
      "Zocdoc": "Design Systems Engineer",
      "Applied Software": "Software / Product Engineer (360Sync)"
    },
  },
  {
    id: 'forward-deployed-solutions',
    signal: ['forward deployed', 'forward-deployed', 'solutions engineer', 'solutions',
      'customer-facing', 'mcp', 'model context protocol', 'migration', 'api', 'integrations',
      'gtm', 'stakeholders', 'agent apis'],
    summary:
      'Customer-facing engineer who owns technical delivery end to end: from building external API '
      + 'integrations start-to-completion for a construction-software platform, to designing a '
      + 'multi-provider LLM orchestration system and a Model Context Protocol (MCP) server that '
      + 'exposes a provenance-attached corpus as queryable tools. Fluent moving between production '
      + 'code, migration scoping with stakeholders, and explaining architectural tradeoffs to '
      + 'technical and business audiences. Strongest fit: forward-deployed / solutions engineering '
      + 'across API integration, AI workflows (MCP, Agent APIs, LLM orchestration), and '
      + 'large-scale data migration.',
    roles: {
      "Aroko": "Head of Operations / Lead Web Designer / Technical Director",
      "Zocdoc": "Design Systems Engineer",
      "Applied Software": "Software / Product Engineer (360Sync)",
      "Genesco": "Software Engineer / Legacy Modernization"
    },
  },
] as const;
