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
      'forward deployed', 'solutions', 'connectors', 'workflow', 'deployment', 'adoption'],
    summary:
      'Implementation-minded engineer who moves customer workflows from discovery through deployment: '
      + 'API research, authentication, data mapping, testing, release support, adoption, and '
      + 'troubleshooting. I inherited and extended a multi-platform data-integration product’s '
      + 'connectors to four external systems end to end, working directly with technical customers '
      + 'through go-live. Production React/TypeScript experience lets me work on both sides of an '
      + 'integration and turn business requirements into reusable technical patterns.',
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
      'Applied-AI engineer focused on making AI systems reliable, measurable, and reusable in real '
      + 'workflows. I built multi-provider LLM orchestration with an evaluation harness that scores '
      + 'evidence accuracy and unsupported claims against a golden baseline, then extended that '
      + 'deterministic-first approach into Libera’s semantic runtime and Facia’s shipped '
      + 'answer-to-interface package. The through-line is turning ambiguous model behavior into '
      + 'explicit contracts, testable decisions, and software other systems can safely use.',
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
      'prototype', 'builder', 'discovery', 'deployment', 'constraint'],
    summary:
      'High-agency builder who takes ambiguous 0-to-1 problems from workflow discovery to working '
      + 'systems. I designed and built StratOS, a public commitment-judgment prototype, alongside '
      + 'internal operating tools and independent AI infrastructure for reusable context and '
      + 'interfaces. My instinct is to learn why a process exists, identify the binding constraint, '
      + 'build the smallest mechanism that can change the outcome, and make the result measurable. '
      + 'Engineering background across product, operations, and integration.',
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
      + 'and engineering without losing technical depth. I learn the workflow, identify the real '
      + 'constraint, and own the path from implementation through measurable outcome: enterprise '
      + 'web delivery, production healthcare design systems, customer-facing API integrations, and '
      + 'internal operating infrastructure. Recent independent work turns domain knowledge into '
      + 'reusable AI context, deterministic decisions, and interfaces, with public product '
      + 'expressions in Libera, Facia, and StratOS.',
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
      'agent tooling', 'deployment', 'interface infrastructure'],
    summary:
      'Senior frontend engineer specializing in TypeScript/React design systems and '
      + 'developer-facing product surfaces. At Zocdoc I owned a portfolio of shared production '
      + 'React components and drove their migration across healthcare workflows through progressive '
      + 'deployment and A/B experiments. I pair that frontend depth with firsthand AI-interface '
      + 'infrastructure: Facia is a shipped TypeScript package that turns validated answers into '
      + 'reusable UI recipes, and this portfolio runs it. That combination supports both the '
      + 'product surface and the contracts, evaluation, and context beneath it.',
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
      'gtm', 'stakeholders', 'agent apis', 'workflow', 'discovery', 'deployment',
      'implementation', 'adoption', 'reusable'],
    summary:
      'Customer-facing engineer who moves from workflow discovery through implementation, '
      + 'deployment, and durable handoff. I built external API integrations end to end for a '
      + 'construction-software platform, scoped migrations with stakeholders, shipped production '
      + 'React systems, and built internal operating tools around real business constraints. Recent '
      + 'independent work turns discovered domain knowledge into reusable AI context and interfaces. '
      + 'Strongest fit: forward-deployed and solutions engineering across integrations, AI workflows, '
      + 'technical discovery, and product feedback.',
    roles: {
      "Aroko": "Head of Operations / Lead Web Designer / Technical Director",
      "Zocdoc": "Design Systems Engineer",
      "Applied Software": "Software / Product Engineer (360Sync)",
      "Genesco": "Software Engineer / Legacy Modernization"
    },
  },
] as const;
