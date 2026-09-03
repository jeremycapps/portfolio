// The specification for the baked standard resume, kept side-effect-free so both
// the generator (scripts/gen-resume-default.ts) and its test can import it
// without triggering file generation.
//
// The standard resume is modeled after a Forward Deployed AI Engineer / Lead
// role: this JD is written to route to the reviewed `forward-deployed-solutions`
// summary and to rank the AI/agent + API-integration work up so the Projects
// section populates.

export const STANDARD_RESUME_JD = [
  'Forward Deployed AI Engineer / Lead.',
  'Customer-facing engineer who owns technical delivery end to end, embedded with',
  'customers to design, build, and ship AI solutions in production. Build external',
  'API integrations and connectors, stand up multi-provider LLM orchestration,',
  'Model Context Protocol (MCP) servers, and Agent APIs. Scope migrations with',
  'stakeholders, drive GTM and solutions delivery, and translate business',
  'requirements into production systems. Strongest fit: forward deployed /',
  'solutions engineering across API integration, AI workflows (MCP, Agent APIs,',
  'LLM orchestration), evaluation, and large-scale data migration.',
].join(' ');

export const EXPECTED_SUMMARY_ID = 'forward-deployed-solutions';
