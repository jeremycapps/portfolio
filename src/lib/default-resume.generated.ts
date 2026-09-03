// AUTO-GENERATED from the resume corpus by scripts/gen-resume-default.ts.
// Do not edit by hand. This is the standard resume assembled from the canonical
// forward-deployed JD; it is baked so the resume chip renders with no API call.
import type { ResumeResponse } from './resume';

export const DEFAULT_RESUME: ResumeResponse = {
  "protocol": "portfolio.resume/1",
  "view": {
    "header": {
      "name": "Jeremy Capps",
      "contacts": [
        "jeremy@nycwork.space",
        "linkedin.com/in/jeremycapps",
        "New York, NY"
      ]
    },
    "summary": {
      "text": "Customer-facing engineer who moves from workflow discovery through implementation, deployment, and durable handoff. I built external API integrations end to end for a construction-software platform, scoped migrations with stakeholders, shipped production React systems, and built internal operating tools around real business constraints. Recent independent work turns discovered domain knowledge into reusable AI context and interfaces. Strongest fit: forward-deployed and solutions engineering across integrations, AI workflows, technical discovery, and product feedback.",
      "engine": "retrieved"
    },
    "experience": [
      {
        "organization": "Aroko",
        "roleContext": [
          "Head of Operations / Lead Web Designer / Technical Director"
        ],
        "timePeriod": "2024–Present",
        "bullets": [
          "Built a Notion-based project budgeting and estimating system that connected timesheets to an existing projects board and calculated budget consumption from hours worked.",
          "Wrote queries and rollups to surface remaining project budget or capacity and used historical delivery data to improve future estimates."
        ],
        "sourceRefs": [
          "engagements.yaml#aroko_operations_source_of_truth"
        ]
      },
      {
        "organization": "Zocdoc",
        "roleContext": [
          "Design Systems Engineer"
        ],
        "timePeriod": "2021–2024",
        "bullets": [
          "Owned a portfolio of shared TypeScript/React design-system components and supported their migration across production healthcare surfaces under Zocdoc's accessibility program.",
          "Participated in an accessibility audit across production pages and components, then contributed component reconciliation and migration work toward the team's WCAG-compliance objective."
        ],
        "sourceRefs": [
          "engagements.yaml#zocdoc_design_system_migrations"
        ]
      },
      {
        "organization": "Applied Software",
        "roleContext": [
          "Software / Product Engineer (360Sync)"
        ],
        "timePeriod": "2019–2021",
        "bullets": [
          "Owned end-to-end integration delivery across API research, authentication, data mapping, implementation, testing, release support, and customer troubleshooting for construction software workflows.",
          "Worked with technical customers and internal stakeholders to translate workflow needs, integration requirements, and support pain points into implementation-ready software."
        ],
        "sourceRefs": [
          "engagements.yaml#applied_software_api_customer_workflows"
        ]
      },
      {
        "organization": "Weill Cornell Medicine",
        "roleContext": [
          "Freelance Developer"
        ],
        "timePeriod": "2020–2021",
        "bullets": [
          "Developed a Python-to-Google-Sheets integration to parse, clean, and update admissions data for Weill Cornell Medicine."
        ],
        "sourceRefs": [
          "engagements.yaml#weill_cornell_data_pipeline"
        ]
      },
      {
        "organization": "Genesco",
        "roleContext": [
          "Software Engineer / Legacy Modernization"
        ],
        "timePeriod": "2017–2019",
        "bullets": [
          "Contributed to modernization work involving legacy COBOL systems and Java-based replacement workflows, translating embedded business logic into maintainable implementation.",
          "Worked with legacy data flows, production constraints, and cross-functional stakeholders to support incremental migration without disrupting operational continuity."
        ],
        "sourceRefs": [
          "engagements.yaml#genesco_legacy_modernization"
        ]
      }
    ],
    "skills": [],
    "education": [
      {
        "degree": "Bachelor's Degree, minor in Mathematics"
      }
    ],
    "projects": [
      {
        "id": "jeremy_domain_ai_multi_provider_llm_orchestration",
        "name": "Corus — LLM Orchestration & Evaluation Harness",
        "text": "Built a Model Context Protocol (MCP) server exposing a provenance-attached experience corpus as queryable tools, with an append-only write path that verifies content re-parses before writing and records each immutable snapshot with a sha256 in a version ledger. Built a multi-provider LLM orchestration system (~15,700 lines of TypeScript) executing live against Anthropic Claude Sonnet 5, OpenAI GPT-5.5 Pro, and Google Gemini 3.1 Flash Lite through a single provider-neutral execution boundary normalizing three distinct API surfaces.",
        "sourceRefs": [
          "engagements.yaml#jeremy_domain_ai_multi_provider_llm_orchestration"
        ]
      },
      {
        "id": "jeremy_domain_langgraph_reference_runtime",
        "name": "Domain — Deterministic Agent Runtime on LangGraph",
        "text": "Built a provider-neutral deterministic reference runtime for an agent-orchestration protocol in Python on LangGraph (3,694 lines across 50 modules, 2,317 lines of tests), separating a deterministic protocol kernel from the execution framework so that snapshots remain valid without LangGraph or a database. Authored ~4,500 lines of specification across five canonical documents pinned by sha256 in an author frontier with an explicit authority ordering and recorded conflict assessment, then drove 19 auditable implementer iterations to a conforming verdict with 25 defects resolved.",
        "sourceRefs": [
          "engagements.yaml#jeremy_domain_langgraph_reference_runtime"
        ]
      },
      {
        "id": "tempo_stratos_v5_governed_decision_product",
        "name": "StratOS — Commitment Judgment Prototype",
        "text": "Designed and built an active 0-to-1 decision prototype that tests whether a strategic commitment fits the available evidence, operating capacity, time, and risk. It returns a bounded next action, release gate, and reassessment rule while keeping uncertainty and unsupported assumptions visible.",
        "sourceRefs": [
          "engagements.yaml#tempo_stratos_v5_governed_decision_product"
        ]
      }
    ],
    "awards": [
      {
        "name": "NEW INC Fellowship, Social Architecture",
        "year": 2025
      }
    ]
  },
  "provenance": {
    "deterministicPct": 100,
    "modelPct": 0,
    "operations": [
      {
        "kind": "corpus-load",
        "engine": "deterministic",
        "detail": "baked snapshot"
      },
      {
        "kind": "pre-rank",
        "engine": "deterministic",
        "detail": "theme / role_fit match"
      },
      {
        "kind": "selection",
        "engine": "deterministic",
        "detail": "18 bounded candidates"
      },
      {
        "kind": "summary",
        "engine": "retrieved",
        "detail": "assembled from source"
      },
      {
        "kind": "emit",
        "engine": "deterministic",
        "detail": "5 roles · 3 projects"
      }
    ]
  }
};
