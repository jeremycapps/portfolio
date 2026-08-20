import type {
  AnswerPath,
  AnswerRole,
  AnswerShape,
  AnswerStructure,
  DensityState,
  DisclosureDepth,
  PatternReasonCode,
  PresentationPattern,
  SequenceKind,
  ShapeReasonCode,
} from "./answer-set-v2.js";

type DecisionValues<T> = readonly T[] | "any";

export interface ShapeDecisionInput {
  cardinality: "single" | "many";
  role: AnswerRole;
  structure: AnswerStructure | undefined;
  sequenceKind: SequenceKind | undefined;
}

export interface ShapeDecisionRule {
  precedence: number;
  reasonCode: ShapeReasonCode;
  shape: AnswerShape;
  explanation: string;
  match: {
    cardinalities: readonly ShapeDecisionInput["cardinality"][];
    roles: DecisionValues<AnswerRole>;
    structures: DecisionValues<AnswerStructure | undefined>;
    sequenceKinds: DecisionValues<SequenceKind | undefined>;
  };
}

/**
 * Normative shape branch order. The numeric precedence is data, not incidental
 * source order: singular role, unstructured collection, sequence kind, then
 * dimension/group.
 */
export const SHAPE_DECISION_MANIFEST = [
  {
    precedence: 400,
    reasonCode: "SHAPE_SINGULAR_VALUE",
    shape: "singular-value",
    explanation: "A single value item resolves to the singular value shape.",
    match: { cardinalities: ["single"], roles: ["value"], structures: "any", sequenceKinds: "any" },
  },
  {
    precedence: 399,
    reasonCode: "SHAPE_SINGULAR_VERDICT",
    shape: "singular-verdict",
    explanation: "A single verdict item resolves to the singular verdict shape.",
    match: { cardinalities: ["single"], roles: ["verdict"], structures: "any", sequenceKinds: "any" },
  },
  {
    precedence: 398,
    reasonCode: "SHAPE_SINGULAR_OPERATION",
    shape: "singular-operation",
    explanation: "A single operation item resolves to the singular operation shape.",
    match: { cardinalities: ["single"], roles: ["operation"], structures: "any", sequenceKinds: "any" },
  },
  {
    precedence: 397,
    reasonCode: "SHAPE_SINGULAR_CONVERGENCE",
    shape: "singular-convergence",
    explanation: "A single convergence item resolves to the singular convergence shape.",
    match: { cardinalities: ["single"], roles: ["convergence"], structures: "any", sequenceKinds: "any" },
  },
  {
    precedence: 300,
    reasonCode: "SHAPE_COLLECTION",
    shape: "collection",
    explanation: "Multiple items without declared structure resolve to a collection.",
    match: { cardinalities: ["many"], roles: "any", structures: [undefined], sequenceKinds: "any" },
  },
  {
    precedence: 230,
    reasonCode: "SHAPE_TEMPORAL_SEQUENCE",
    shape: "temporal-sequence",
    explanation: "A temporal sequence resolves before dimension or group branches.",
    match: { cardinalities: ["many"], roles: "any", structures: ["sequence"], sequenceKinds: ["temporal"] },
  },
  {
    precedence: 229,
    reasonCode: "SHAPE_DEPENDENCY_SEQUENCE",
    shape: "dependency-sequence",
    explanation: "A dependency sequence resolves before dimension or group branches.",
    match: { cardinalities: ["many"], roles: "any", structures: ["sequence"], sequenceKinds: ["dependency"] },
  },
  {
    precedence: 228,
    reasonCode: "SHAPE_TRACE_SEQUENCE",
    shape: "trace-sequence",
    explanation: "A trace sequence resolves before dimension or group branches.",
    match: { cardinalities: ["many"], roles: "any", structures: ["sequence"], sequenceKinds: ["trace"] },
  },
  {
    precedence: 120,
    reasonCode: "SHAPE_DIMENSION",
    shape: "dimension",
    explanation: "Multiple dimension-structured items resolve to a dimension.",
    match: { cardinalities: ["many"], roles: "any", structures: ["dimension"], sequenceKinds: "any" },
  },
  {
    precedence: 119,
    reasonCode: "SHAPE_GROUP",
    shape: "group",
    explanation: "Multiple group-structured items resolve to a group.",
    match: { cardinalities: ["many"], roles: "any", structures: ["group"], sequenceKinds: "any" },
  },
] as const satisfies readonly ShapeDecisionRule[];

function includes<T>(values: DecisionValues<T>, value: T): boolean {
  return values === "any" || values.includes(value);
}

export function shapeDecisionMatches(
  rule: ShapeDecisionRule,
  input: ShapeDecisionInput,
): boolean {
  return rule.match.cardinalities.includes(input.cardinality)
    && includes(rule.match.roles, input.role)
    && includes(rule.match.structures, input.structure)
    && includes(rule.match.sequenceKinds, input.sequenceKind);
}

export function selectShapeDecisionRule(
  input: ShapeDecisionInput,
  rules: readonly ShapeDecisionRule[] = SHAPE_DECISION_MANIFEST,
): ShapeDecisionRule | undefined {
  return rules
    .filter((rule) => shapeDecisionMatches(rule, input))
    .reduce<ShapeDecisionRule | undefined>(
      (winner, rule) => winner === undefined || rule.precedence > winner.precedence ? rule : winner,
      undefined,
    );
}

export type PatternValueKind = "scalar" | "structured" | "not-applicable";

export interface PatternDecisionInput {
  shape: AnswerShape;
  role: AnswerRole;
  actionable: boolean;
  density: DensityState;
  depth: DisclosureDepth;
  path: AnswerPath;
  valueKind: PatternValueKind;
}

export interface PatternDecisionRule {
  precedence: number;
  reasonCode: PatternReasonCode;
  pattern: PresentationPattern;
  explanation: string;
  match: {
    shapes: DecisionValues<AnswerShape>;
    roles: DecisionValues<AnswerRole>;
    actionable: DecisionValues<boolean>;
    densities: DecisionValues<DensityState>;
    depths: DecisionValues<DisclosureDepth>;
    paths: DecisionValues<AnswerPath>;
    valueKinds: DecisionValues<PatternValueKind>;
  };
}

const patternRule = (
  precedence: number,
  reasonCode: PatternReasonCode,
  pattern: PresentationPattern,
  match: PatternDecisionRule["match"],
): PatternDecisionRule => ({
  precedence,
  reasonCode,
  pattern,
  explanation: `${reasonCode} selects the renderer-neutral ${pattern} pattern.`,
  match,
});

/**
 * Normative presentation decision table. Every discriminator is present on
 * every row; `any` is an explicit generic fallback rather than hidden control
 * flow. Density-absent behavior is always represented by its own row.
 */
export const PATTERN_DECISION_MANIFEST = [
  patternRule(290, "PATTERN_ACTIONABLE_VERDICT", "review-panel", {
    shapes: ["singular-verdict"], roles: ["verdict"], actionable: [true],
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(289, "PATTERN_ACTIONABLE_OPERATION", "action-panel", {
    shapes: ["singular-operation"], roles: ["operation"], actionable: [true],
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(288, "PATTERN_ACTIONABLE_VALUE", "edit-form", {
    shapes: ["singular-value"], roles: ["value"], actionable: [true],
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(287, "PATTERN_ACTIONABLE_REPLAY", "replay-panel", {
    shapes: ["trace-sequence"], roles: ["operation"], actionable: [true],
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(280, "PATTERN_CONVERGENCE_PANEL", "convergence-panel", {
    shapes: ["singular-convergence"], roles: ["convergence"], actionable: "any",
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(279, "PATTERN_OPERATION_DETAIL", "operation-detail", {
    shapes: ["singular-operation"], roles: ["operation"], actionable: [false],
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(270, "PATTERN_DEEP_VERDICT", "detail", {
    shapes: ["singular-verdict"], roles: ["verdict"], actionable: [false],
    densities: "any", depths: ["focus", "audit"], paths: "any", valueKinds: "any",
  }),
  patternRule(269, "PATTERN_DEEP_VALUE", "detail", {
    shapes: ["singular-value"], roles: ["value"], actionable: [false],
    densities: "any", depths: ["focus", "audit"], paths: "any", valueKinds: "any",
  }),
  patternRule(260, "PATTERN_COMPACT_VERDICT", "badge", {
    shapes: ["singular-verdict"], roles: ["verdict"], actionable: [false],
    densities: [1], depths: ["glance", "inspect"], paths: "any", valueKinds: "any",
  }),
  patternRule(259, "PATTERN_DENSE_VERDICT", "detail", {
    shapes: ["singular-verdict"], roles: ["verdict"], actionable: [false],
    densities: [2, 3], depths: ["glance", "inspect"], paths: "any", valueKinds: "any",
  }),
  patternRule(258, "PATTERN_ABSENT_VERDICT", "detail", {
    shapes: ["singular-verdict"], roles: ["verdict"], actionable: [false],
    densities: ["absent"], depths: ["glance", "inspect"], paths: "any", valueKinds: "any",
  }),
  patternRule(250, "PATTERN_COMPACT_SCALAR", "stat", {
    shapes: ["singular-value"], roles: ["value"], actionable: [false],
    densities: [1], depths: ["glance", "inspect"], paths: "any", valueKinds: ["scalar"],
  }),
  patternRule(249, "PATTERN_COMPACT_OBJECT", "compact-card", {
    shapes: ["singular-value"], roles: ["value"], actionable: [false],
    densities: [1], depths: ["glance", "inspect"], paths: "any", valueKinds: ["structured"],
  }),
  patternRule(248, "PATTERN_DENSE_VALUE", "detail", {
    shapes: ["singular-value"], roles: ["value"], actionable: [false],
    densities: [2, 3], depths: ["glance", "inspect"], paths: "any", valueKinds: "any",
  }),
  patternRule(247, "PATTERN_ABSENT_VALUE", "detail", {
    shapes: ["singular-value"], roles: ["value"], actionable: [false],
    densities: ["absent"], depths: ["glance", "inspect"], paths: "any", valueKinds: "any",
  }),
  patternRule(230, "PATTERN_OPERATION_BOARD", "board", {
    shapes: ["group"], roles: ["operation"], actionable: "any",
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(229, "PATTERN_ACTION_QUEUE", "queue", {
    shapes: ["group"], roles: ["value", "verdict", "convergence"], actionable: [true],
    densities: "any", depths: "any", paths: ["execution"], valueKinds: "any",
  }),
  patternRule(220, "PATTERN_COLLECTION_LIST", "list", {
    shapes: ["collection"], roles: "any", actionable: "any",
    densities: [1, 2], depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(219, "PATTERN_COLLECTION_GRID", "grid", {
    shapes: ["collection"], roles: "any", actionable: "any",
    densities: [3], depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(218, "PATTERN_COLLECTION_ABSENT_GRID", "grid", {
    shapes: ["collection"], roles: "any", actionable: "any",
    densities: ["absent"], depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(210, "PATTERN_DIMENSION_TABLE", "table", {
    shapes: ["dimension"], roles: "any", actionable: "any",
    densities: [1, 2], depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(209, "PATTERN_DIMENSION_MATRIX", "comparison-matrix", {
    shapes: ["dimension"], roles: "any", actionable: "any",
    densities: [3], depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(208, "PATTERN_DIMENSION_ABSENT_MATRIX", "comparison-matrix", {
    shapes: ["dimension"], roles: "any", actionable: "any",
    densities: ["absent"], depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(200, "PATTERN_GROUPED_LIST", "grouped-list", {
    shapes: ["group"], roles: "any", actionable: "any",
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(190, "PATTERN_TEMPORAL_TIMELINE", "timeline", {
    shapes: ["temporal-sequence"], roles: "any", actionable: "any",
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(180, "PATTERN_DEPENDENCY_LIST", "dependency-list", {
    shapes: ["dependency-sequence"], roles: "any", actionable: "any",
    densities: [1], depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(179, "PATTERN_DEPENDENCY_TREE", "dependency-tree", {
    shapes: ["dependency-sequence"], roles: "any", actionable: "any",
    densities: [2, 3], depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(178, "PATTERN_DEPENDENCY_ABSENT_TREE", "dependency-tree", {
    shapes: ["dependency-sequence"], roles: "any", actionable: "any",
    densities: ["absent"], depths: "any", paths: "any", valueKinds: "any",
  }),
  patternRule(170, "PATTERN_TRACE_AUDIT", "audit-trail", {
    shapes: ["trace-sequence"], roles: "any", actionable: "any",
    densities: "any", depths: "any", paths: "any", valueKinds: "any",
  }),
] as const satisfies readonly PatternDecisionRule[];

export function patternDecisionMatches(
  rule: PatternDecisionRule,
  input: PatternDecisionInput,
): boolean {
  return includes(rule.match.shapes, input.shape)
    && includes(rule.match.roles, input.role)
    && includes(rule.match.actionable, input.actionable)
    && includes(rule.match.densities, input.density)
    && includes(rule.match.depths, input.depth)
    && includes(rule.match.paths, input.path)
    && includes(rule.match.valueKinds, input.valueKind);
}

export function selectPatternDecisionRule(
  input: PatternDecisionInput,
  rules: readonly PatternDecisionRule[] = PATTERN_DECISION_MANIFEST,
): PatternDecisionRule | undefined {
  return rules
    .filter((rule) => patternDecisionMatches(rule, input))
    .reduce<PatternDecisionRule | undefined>(
      (winner, rule) => winner === undefined || rule.precedence > winner.precedence ? rule : winner,
      undefined,
    );
}

const ANSWER_SHAPES: readonly AnswerShape[] = [
  "singular-value", "singular-verdict", "singular-operation", "singular-convergence",
  "collection", "dimension", "group",
  "temporal-sequence", "dependency-sequence", "trace-sequence",
];
const ANSWER_ROLES: readonly AnswerRole[] = ["value", "verdict", "operation", "convergence"];
const DENSITIES: readonly DensityState[] = [1, 2, 3, "absent"];
const DEPTHS: readonly DisclosureDepth[] = ["glance", "inspect", "focus", "audit"];
const PATHS: readonly AnswerPath[] = ["meaning", "execution"];

function validRoles(shape: AnswerShape): readonly AnswerRole[] {
  switch (shape) {
    case "singular-value": return ["value"];
    case "singular-verdict": return ["verdict"];
    case "singular-operation": return ["operation"];
    case "singular-convergence": return ["convergence"];
    default: return ANSWER_ROLES;
  }
}

/** Enumerate every valid normalized decision input covered by the manifest. */
export function enumeratePatternDecisionInputs(): PatternDecisionInput[] {
  const inputs: PatternDecisionInput[] = [];
  for (const shape of ANSWER_SHAPES) {
    const valueKinds: readonly PatternValueKind[] = shape === "singular-value"
      ? ["scalar", "structured"]
      : ["not-applicable"];
    for (const role of validRoles(shape)) {
      for (const actionable of [false, true] as const) {
        for (const density of DENSITIES) {
          for (const depth of DEPTHS) {
            for (const path of PATHS) {
              for (const valueKind of valueKinds) {
                inputs.push({ shape, role, actionable, density, depth, path, valueKind });
              }
            }
          }
        }
      }
    }
  }
  return inputs;
}

export type PatternManifestAuditErrorCode =
  | "UNCOVERED_INPUT" | "HIGHEST_PRECEDENCE_TIE"
  | "UNREACHABLE_RULE" | "DUPLICATE_REASON" | "DUPLICATE_RULE";

export interface PatternManifestAuditError {
  code: PatternManifestAuditErrorCode;
  message: string;
  reasonCodes?: PatternReasonCode[];
  input?: PatternDecisionInput;
}

export interface PatternManifestAudit {
  valid: boolean;
  inputCount: number;
  winningRuleCount: number;
  errors: PatternManifestAuditError[];
}

function selectorSignature(rule: PatternDecisionRule): string {
  return JSON.stringify(rule.match);
}

/**
 * Prove coverage, deterministic highest precedence, and reachability across
 * the complete valid Cartesian input space.
 */
export function auditPatternDecisionManifest(
  rules: readonly PatternDecisionRule[] = PATTERN_DECISION_MANIFEST,
  inputs: readonly PatternDecisionInput[] = enumeratePatternDecisionInputs(),
): PatternManifestAudit {
  const errors: PatternManifestAuditError[] = [];
  const reasonOwners = new Map<PatternReasonCode, number>();
  const selectorOwners = new Map<string, PatternReasonCode>();

  rules.forEach((rule, index) => {
    const reasonOwner = reasonOwners.get(rule.reasonCode);
    if (reasonOwner !== undefined) {
      errors.push({
        code: "DUPLICATE_REASON",
        reasonCodes: [rules[reasonOwner].reasonCode, rule.reasonCode],
        message: `Reason ${rule.reasonCode} is used by more than one manifest row.`,
      });
    } else {
      reasonOwners.set(rule.reasonCode, index);
    }

    const signature = selectorSignature(rule);
    const selectorOwner = selectorOwners.get(signature);
    if (selectorOwner !== undefined) {
      errors.push({
        code: "DUPLICATE_RULE",
        reasonCodes: [selectorOwner, rule.reasonCode],
        message: `${rule.reasonCode} duplicates the selector owned by ${selectorOwner}.`,
      });
    } else {
      selectorOwners.set(signature, rule.reasonCode);
    }
  });

  const winners = new Set<PatternReasonCode>();
  for (const input of inputs) {
    const matches = rules.filter((rule) => patternDecisionMatches(rule, input));
    if (matches.length === 0) {
      errors.push({ code: "UNCOVERED_INPUT", input, message: "No pattern row matches this input." });
      continue;
    }
    const highestPrecedence = Math.max(...matches.map((rule) => rule.precedence));
    const highest = matches.filter((rule) => rule.precedence === highestPrecedence);
    if (highest.length > 1) {
      errors.push({
        code: "HIGHEST_PRECEDENCE_TIE",
        input,
        reasonCodes: highest.map((rule) => rule.reasonCode),
        message: "More than one pattern row ties at highest precedence.",
      });
      continue;
    }
    winners.add(highest[0].reasonCode);
  }

  for (const rule of rules) {
    if (!winners.has(rule.reasonCode)) {
      errors.push({
        code: "UNREACHABLE_RULE",
        reasonCodes: [rule.reasonCode],
        message: `${rule.reasonCode} never wins for a valid input.`,
      });
    }
  }

  return {
    valid: errors.length === 0,
    inputCount: inputs.length,
    winningRuleCount: winners.size,
    errors,
  };
}

export function assertPatternDecisionManifest(
  rules: readonly PatternDecisionRule[] = PATTERN_DECISION_MANIFEST,
): void {
  const audit = auditPatternDecisionManifest(rules);
  if (!audit.valid) {
    const codes = [...new Set(audit.errors.map(({ code }) => code))].join(", ");
    throw new Error(`Invalid pattern decision manifest: ${codes}`);
  }
}
