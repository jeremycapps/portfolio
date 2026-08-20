import type {
  DisclosureDepth,
  InspectionControl,
  InspectionReasonCode,
  InspectionState,
  PatternReasonCode,
  PresentationPattern,
  SemanticComponentDescriptor,
} from "./answer-set-v2.js";
import { PATTERN_DECISION_MANIFEST, type PatternDecisionRule } from "./decision-manifests.js";

type DecisionValues<T> = readonly T[] | "any";

export type InspectionCapability =
  | "singular" | "singular-evidence" | "singular-trace" | "singular-trace-evidence"
  | "collection" | "collection-evidence" | "collection-trace" | "collection-trace-evidence"
  | "dimension" | "dimension-evidence" | "dimension-trace" | "dimension-trace-evidence";

export interface InspectionDecisionInput {
  inspection: InspectionState;
  capability: InspectionCapability;
  depth: DisclosureDepth;
}

export interface InspectionDecisionRule {
  precedence: number;
  reasonCode: InspectionReasonCode;
  controls: readonly InspectionControl[];
  explanation: string;
  match: {
    inspections: DecisionValues<InspectionState>;
    capabilities: DecisionValues<InspectionCapability>;
    depths: DecisionValues<DisclosureDepth>;
  };
}

const inspectionRule = (
  precedence: number,
  reasonCode: InspectionReasonCode,
  controls: readonly InspectionControl[],
  match: InspectionDecisionRule["match"],
): InspectionDecisionRule => ({
  precedence,
  reasonCode,
  controls,
  explanation: `${reasonCode} selects ${controls.length} semantic inspection control(s).`,
  match,
});

const SINGULAR_CAPABILITIES: readonly InspectionCapability[] = [
  "singular", "singular-evidence", "singular-trace", "singular-trace-evidence",
];
const COLLECTION_CAPABILITIES: readonly InspectionCapability[] = [
  "collection", "collection-evidence", "collection-trace", "collection-trace-evidence",
];
const DIMENSION_CAPABILITIES: readonly InspectionCapability[] = [
  "dimension", "dimension-evidence", "dimension-trace", "dimension-trace-evidence",
];

/**
 * Normative inspection-control table. Audit-only evidence and trace controls
 * are withheld at shallower depths; topology controls enter at focus.
 */
export const INSPECTION_DECISION_MANIFEST = [
  inspectionRule(500, "INSPECTION_NONE", [], {
    inspections: ["none"], capabilities: "any", depths: "any",
  }),
  inspectionRule(400, "INSPECTION_AVAILABLE_GLANCE", ["inspect"], {
    inspections: ["available"], capabilities: "any", depths: ["glance"],
  }),
  inspectionRule(300, "INSPECTION_AVAILABLE_INSPECT", ["inspect", "expand"], {
    inspections: ["available"], capabilities: "any", depths: ["inspect"],
  }),
  inspectionRule(230, "INSPECTION_FOCUS_DIMENSION", ["inspect", "expand", "filter", "sort", "compare", "drill-down"], {
    inspections: ["available"], capabilities: DIMENSION_CAPABILITIES, depths: ["focus"],
  }),
  inspectionRule(220, "INSPECTION_FOCUS_COLLECTION", ["inspect", "expand", "filter", "sort"], {
    inspections: ["available"], capabilities: COLLECTION_CAPABILITIES, depths: ["focus"],
  }),
  inspectionRule(210, "INSPECTION_FOCUS_SINGULAR", ["inspect", "expand"], {
    inspections: ["available"], capabilities: SINGULAR_CAPABILITIES, depths: ["focus"],
  }),
  inspectionRule(120, "INSPECTION_AUDIT_SINGULAR", ["inspect", "expand"], {
    inspections: ["available"], capabilities: ["singular"], depths: ["audit"],
  }),
  inspectionRule(119, "INSPECTION_AUDIT_SINGULAR_EVIDENCE", ["inspect", "expand", "view-evidence"], {
    inspections: ["available"], capabilities: ["singular-evidence"], depths: ["audit"],
  }),
  inspectionRule(118, "INSPECTION_AUDIT_SINGULAR_TRACE", ["inspect", "expand", "view-trace"], {
    inspections: ["available"], capabilities: ["singular-trace"], depths: ["audit"],
  }),
  inspectionRule(117, "INSPECTION_AUDIT_SINGULAR_TRACE_EVIDENCE", ["inspect", "expand", "view-evidence", "view-trace"], {
    inspections: ["available"], capabilities: ["singular-trace-evidence"], depths: ["audit"],
  }),
  inspectionRule(116, "INSPECTION_AUDIT_COLLECTION", ["inspect", "expand", "filter", "sort"], {
    inspections: ["available"], capabilities: ["collection"], depths: ["audit"],
  }),
  inspectionRule(115, "INSPECTION_AUDIT_COLLECTION_EVIDENCE", ["inspect", "expand", "filter", "sort", "view-evidence"], {
    inspections: ["available"], capabilities: ["collection-evidence"], depths: ["audit"],
  }),
  inspectionRule(114, "INSPECTION_AUDIT_COLLECTION_TRACE", ["inspect", "expand", "filter", "sort", "view-trace"], {
    inspections: ["available"], capabilities: ["collection-trace"], depths: ["audit"],
  }),
  inspectionRule(113, "INSPECTION_AUDIT_COLLECTION_TRACE_EVIDENCE", ["inspect", "expand", "filter", "sort", "view-evidence", "view-trace"], {
    inspections: ["available"], capabilities: ["collection-trace-evidence"], depths: ["audit"],
  }),
  inspectionRule(112, "INSPECTION_AUDIT_DIMENSION", ["inspect", "expand", "filter", "sort", "compare", "drill-down"], {
    inspections: ["available"], capabilities: ["dimension"], depths: ["audit"],
  }),
  inspectionRule(111, "INSPECTION_AUDIT_DIMENSION_EVIDENCE", ["inspect", "expand", "filter", "sort", "compare", "drill-down", "view-evidence"], {
    inspections: ["available"], capabilities: ["dimension-evidence"], depths: ["audit"],
  }),
  inspectionRule(110, "INSPECTION_AUDIT_DIMENSION_TRACE", ["inspect", "expand", "filter", "sort", "compare", "drill-down", "view-trace"], {
    inspections: ["available"], capabilities: ["dimension-trace"], depths: ["audit"],
  }),
  inspectionRule(109, "INSPECTION_AUDIT_DIMENSION_TRACE_EVIDENCE", ["inspect", "expand", "filter", "sort", "compare", "drill-down", "view-evidence", "view-trace"], {
    inspections: ["available"], capabilities: ["dimension-trace-evidence"], depths: ["audit"],
  }),
] as const satisfies readonly InspectionDecisionRule[];

function includes<T>(values: DecisionValues<T>, value: T): boolean {
  return values === "any" || values.includes(value);
}

export function inspectionDecisionMatches(
  rule: InspectionDecisionRule,
  input: InspectionDecisionInput,
): boolean {
  return includes(rule.match.inspections, input.inspection)
    && includes(rule.match.capabilities, input.capability)
    && includes(rule.match.depths, input.depth);
}

export function selectInspectionDecisionRule(
  input: InspectionDecisionInput,
  rules: readonly InspectionDecisionRule[] = INSPECTION_DECISION_MANIFEST,
): InspectionDecisionRule | undefined {
  return rules
    .filter((rule) => inspectionDecisionMatches(rule, input))
    .reduce<InspectionDecisionRule | undefined>(
      (winner, rule) => winner === undefined || rule.precedence > winner.precedence ? rule : winner,
      undefined,
    );
}

const INSPECTION_CAPABILITIES: readonly InspectionCapability[] = [
  ...SINGULAR_CAPABILITIES, ...COLLECTION_CAPABILITIES, ...DIMENSION_CAPABILITIES,
];
const INSPECTION_DEPTHS: readonly DisclosureDepth[] = ["glance", "inspect", "focus", "audit"];

export function enumerateInspectionDecisionInputs(): InspectionDecisionInput[] {
  const inputs: InspectionDecisionInput[] = [];
  for (const inspection of ["none", "available"] as const) {
    for (const capability of INSPECTION_CAPABILITIES) {
      for (const depth of INSPECTION_DEPTHS) inputs.push({ inspection, capability, depth });
    }
  }
  return inputs;
}

export type ManifestAuditErrorCode =
  | "MISSING_MAPPING" | "AMBIGUOUS_MAPPING" | "DUPLICATE_MAPPING" | "UNREACHABLE_MAPPING";

export interface ManifestAuditError {
  code: ManifestAuditErrorCode;
  message: string;
}

export interface ManifestAudit {
  valid: boolean;
  errors: ManifestAuditError[];
}

export function auditInspectionDecisionManifest(
  rules: readonly InspectionDecisionRule[] = INSPECTION_DECISION_MANIFEST,
  inputs: readonly InspectionDecisionInput[] = enumerateInspectionDecisionInputs(),
): ManifestAudit {
  const errors: ManifestAuditError[] = [];
  const reasons = new Set<string>();
  const signatures = new Set<string>();
  for (const rule of rules) {
    if (reasons.has(rule.reasonCode)) {
      errors.push({ code: "DUPLICATE_MAPPING", message: `Duplicate reason ${rule.reasonCode}.` });
    }
    reasons.add(rule.reasonCode);
    const signature = JSON.stringify(rule.match);
    if (signatures.has(signature)) {
      errors.push({ code: "DUPLICATE_MAPPING", message: `Duplicate selector ${signature}.` });
    }
    signatures.add(signature);
  }

  const winners = new Set<string>();
  for (const input of inputs) {
    const matches = rules.filter((rule) => inspectionDecisionMatches(rule, input));
    if (matches.length === 0) {
      errors.push({ code: "MISSING_MAPPING", message: `No inspection mapping for ${JSON.stringify(input)}.` });
      continue;
    }
    const precedence = Math.max(...matches.map((rule) => rule.precedence));
    const highest = matches.filter((rule) => rule.precedence === precedence);
    if (highest.length !== 1) {
      errors.push({ code: "AMBIGUOUS_MAPPING", message: `Ambiguous inspection mapping for ${JSON.stringify(input)}.` });
      continue;
    }
    winners.add(highest[0].reasonCode);
  }
  for (const rule of rules) {
    if (!winners.has(rule.reasonCode)) {
      errors.push({ code: "UNREACHABLE_MAPPING", message: `${rule.reasonCode} never wins.` });
    }
  }
  return { valid: errors.length === 0, errors };
}

export interface ComponentRecipeManifestRow {
  pattern: PresentationPattern;
  components: readonly SemanticComponentDescriptor[];
}

const componentRow = (
  pattern: PresentationPattern,
  ...ids: string[]
): ComponentRecipeManifestRow => ({ pattern, components: ids.map((id) => ({ id })) });

/** Exact ordered semantic component sequence for every emitted pattern. */
export const COMPONENT_RECIPE_MANIFEST = [
  componentRow("review-panel", "Card", "StateBadge", "DetailList", "EvidenceDisclosure", "OperationControls"),
  componentRow("action-panel", "Card", "OperationDetail", "EvidenceDisclosure", "OperationControls"),
  componentRow("edit-form", "Form", "OperationControls"),
  componentRow("operation-detail", "Card", "OperationDetail", "EvidenceDisclosure"),
  componentRow("convergence-panel", "ConvergencePanel", "TraceSummary", "EvidenceDisclosure", "OperationControls"),
  componentRow("detail", "DetailView", "EvidenceDisclosure"),
  componentRow("badge", "StateBadge"),
  componentRow("stat", "Stat"),
  componentRow("compact-card", "CompactCard"),
  componentRow("list", "List", "InspectionToolbar"),
  componentRow("grid", "Grid", "InspectionToolbar"),
  componentRow("table", "DataTable", "InspectionToolbar"),
  componentRow("comparison-matrix", "ComparisonMatrix", "InspectionToolbar"),
  componentRow("board", "Board", "InspectionToolbar", "OperationControls"),
  componentRow("queue", "QueueList", "InspectionToolbar", "OperationControls"),
  componentRow("grouped-list", "GroupedList", "InspectionToolbar"),
  componentRow("timeline", "Timeline", "InspectionToolbar"),
  componentRow("dependency-list", "DependencyList", "InspectionToolbar"),
  componentRow("dependency-tree", "DependencyTree", "InspectionToolbar"),
  componentRow("replay-panel", "ReplayPanel", "EvidenceDisclosure", "OperationControls"),
  componentRow("audit-trail", "AuditTrail", "EvidenceDisclosure"),
] as const satisfies readonly ComponentRecipeManifestRow[];

export function selectComponentRecipeRow(
  pattern: PresentationPattern,
  rows: readonly ComponentRecipeManifestRow[] = COMPONENT_RECIPE_MANIFEST,
): ComponentRecipeManifestRow | undefined {
  return rows.find((row) => row.pattern === pattern);
}

export function auditComponentRecipeManifest(
  rows: readonly ComponentRecipeManifestRow[] = COMPONENT_RECIPE_MANIFEST,
  patternRules: readonly PatternDecisionRule[] = PATTERN_DECISION_MANIFEST,
): ManifestAudit {
  const errors: ManifestAuditError[] = [];
  const emitted = new Set<PresentationPattern>(patternRules.map(({ pattern }) => pattern));
  const counts = new Map<PresentationPattern, number>();
  for (const row of rows) counts.set(row.pattern, (counts.get(row.pattern) ?? 0) + 1);

  for (const pattern of emitted) {
    const count = counts.get(pattern) ?? 0;
    if (count === 0) {
      errors.push({ code: "MISSING_MAPPING", message: `No component recipe for ${pattern}.` });
    } else if (count > 1) {
      errors.push({ code: "AMBIGUOUS_MAPPING", message: `Multiple component recipes for ${pattern}.` });
    }
  }
  for (const row of rows) {
    if (!emitted.has(row.pattern)) {
      errors.push({ code: "UNREACHABLE_MAPPING", message: `${row.pattern} is not emitted by any pattern rule.` });
    }
  }
  if (new Set(rows.map(({ pattern }) => pattern)).size !== rows.length) {
    errors.push({ code: "DUPLICATE_MAPPING", message: "The component manifest contains duplicate patterns." });
  }
  return { valid: errors.length === 0, errors };
}

export function assertPresentationManifests(): void {
  const errors = [
    ...auditInspectionDecisionManifest().errors,
    ...auditComponentRecipeManifest().errors,
  ];
  if (errors.length > 0) {
    throw new Error(`Invalid presentation manifests: ${[...new Set(errors.map(({ code }) => code))].join(", ")}`);
  }
}
