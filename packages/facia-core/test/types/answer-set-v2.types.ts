import type {
  ActionAffordance,
  AffordanceResult,
  AnswerDensity,
  AnswerPath,
  AnswerRole,
  AnswerSetV2,
  AnswerShape,
  AnswerStructure,
  AnswerTraceV2,
  BoundedVerdictV1,
  ComponentRecipe,
  ConvergenceAnswerSetV2,
  ConvergenceState,
  DirectTraceV2,
  DisclosureDepth,
  InspectionState,
  JsonValue,
  OperationDescriptorV2,
  OperationAnswerSetV2,
  OperationV2,
  PatternResult,
  RecipeResult,
  ResolveContext,
  SequenceKind,
  ShapeResult,
  ValidationResult,
  ValueAnswerV2,
  ValueAnswerSetV2,
  VerdictAnswerSetV2,
} from "../../src/index.js";

type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends
  (<T>() => T extends TRight ? 1 : 2)
    ? true
    : false;
type Expect<TValue extends true> = TValue;

type _ExactAnswerRoles = Expect<
  Equal<AnswerRole, "value" | "verdict" | "operation" | "convergence">
>;
type _ExactAnswerPaths = Expect<Equal<AnswerPath, "meaning" | "execution">>;
type _ExactInspectionStates = Expect<Equal<InspectionState, "none" | "available">>;
type _ExactStructures = Expect<Equal<AnswerStructure, "dimension" | "group" | "sequence">>;
type _ExactSequenceKinds = Expect<Equal<SequenceKind, "temporal" | "dependency" | "trace">>;
type _ExactDensities = Expect<Equal<AnswerDensity, 1 | 2 | 3>>;
type _ExactDepths = Expect<Equal<DisclosureDepth, "glance" | "inspect" | "focus" | "audit">>;
type _ExactConvergenceStates = Expect<
  Equal<ConvergenceState, "converging" | "diverging" | "stalled" | "reached">
>;
type _ExactShapes = Expect<
  Equal<
    AnswerShape,
    | "singular-value"
    | "singular-verdict"
    | "singular-operation"
    | "singular-convergence"
    | "collection"
    | "dimension"
    | "group"
    | "temporal-sequence"
    | "dependency-sequence"
    | "trace-sequence"
  >
>;

const valueAnswer = {
  schema: "facia.answer-set/2",
  question: "Who owns this task?",
  answerType: "value",
  path: "meaning",
  inspection: "available",
  actionable: false,
  items: [
    {
      type: "Value",
      payload: { owner: "Ada", blocked: false },
      value: "Ada",
      fields: {
        priority: {
          primary: ["owner"],
          secondary: [],
          supporting: ["blocked"],
          audit: [],
        },
        promotion: [{ when: { field: "blocked", isFalse: true }, promote: ["blocked"] }],
      },
    },
  ],
  operations: [],
} satisfies AnswerSetV2;

const verdictAnswer = {
  schema: "facia.answer-set/2",
  question: "Is it ready?",
  answerType: "verdict",
  path: "meaning",
  inspection: "none",
  actionable: false,
  items: [
    {
      type: "Verdict",
      contract: "LegacyBooleanVerdictV0",
      payload: {},
      conforms: true,
    },
  ],
  operations: [],
  density: 1,
} satisfies VerdictAnswerSetV2;

const operationAnswer = {
  schema: "facia.answer-set/2",
  question: "What change is offered?",
  answerType: "operation",
  path: "execution",
  inspection: "available",
  actionable: true,
  items: [
    {
      type: "Operation",
      payload: { status: "ready" },
      operation: { id: "publish", name: "Publish" },
      input: { draft: 1 },
      output: { release: 1 },
    },
  ],
  operations: [
    {
      id: "publish",
      label: "Publish",
      invocation: "model-operation",
      reference: "release.publish",
      inputSchema: { type: "object" },
    },
  ],
} satisfies OperationAnswerSetV2;

const convergenceAnswer = {
  schema: "facia.answer-set/2",
  question: "Are the changes converging?",
  answerType: "convergence",
  path: "execution",
  inspection: "available",
  actionable: false,
  items: [
    {
      type: "Convergence",
      payload: { delta: 1 },
      state: "converging",
      goal: "released",
    },
  ],
  operations: [],
  trace: {
    kind: "direct",
    id: "trace-1",
    entries: [{ step: "publish", value: { delta: 1 } }],
  },
} satisfies ConvergenceAnswerSetV2;

const temporalValueSequence = {
  schema: "facia.answer-set/2",
  question: "How did ownership change?",
  answerType: "value",
  path: "meaning",
  inspection: "available",
  actionable: false,
  structure: "sequence",
  sequenceKind: "temporal",
  items: [
    { type: "Value", payload: { owner: "Ada" }, value: "Ada" },
    { type: "Value", payload: { owner: "Grace" }, value: "Grace" },
  ],
  operations: [],
} satisfies ValueAnswerSetV2;

const historyTrace = {
  kind: "history",
  records: [
    {
      itemIndex: 0,
      trace: {
        kind: "direct",
        id: "history-0",
        entries: [{ step: "observe", value: null }],
      },
    },
  ],
} satisfies AnswerTraceV2;

const completeDescriptor = {
  id: "publish",
  label: "Publish",
  invocation: "host-callback",
  reference: "release.publish",
  inputSchema: { type: "object", required: ["draft"] },
  confirmation: "Publish this draft?",
} satisfies OperationDescriptorV2;

const context = { depth: "audit", audience: "human" } satisfies ResolveContext;

declare const validation: ValidationResult;
if (validation.valid) {
  const answer: AnswerSetV2 = validation.value;
  void answer;
} else {
  const code = validation.errors[0].code;
  void code;
}

declare const shapeResult: ShapeResult;
if (shapeResult.ok) {
  const reason: `SHAPE_${string}` = shapeResult.reasonCode;
  void reason;
} else {
  const code: "VALIDATION_REQUIRED" | "SHAPE_REQUIRED" | "PATTERN_UNSUPPORTED" | "SEMANTIC_SPEC_REQUIRED" =
    shapeResult.code;
  void code;
}

declare const patternResult: PatternResult;
if (patternResult.ok) {
  const reason: `PATTERN_${Uppercase<string>}` = patternResult.reasonCode;
  void reason;
} else {
  const code = patternResult.code;
  void code;
}

declare const affordanceResult: AffordanceResult;
if (affordanceResult.ok) {
  const actions: ActionAffordance[] = affordanceResult.actions;
  void actions;
} else {
  const code = affordanceResult.code;
  void code;
}

declare const recipeResult: RecipeResult;
if (recipeResult.ok) {
  const roundTrippableData: ComponentRecipe = recipeResult.recipe;
  void roundTrippableData;
} else {
  const code = recipeResult.code;
  void code;
}

const recipe: ComponentRecipe = {
  pattern: "detail",
  patternReasonCode: "PATTERN_DENSE_VALUE",
  components: [{ id: "ValueDetail", semantics: { emphasis: "primary" } }],
  inspectionControls: [],
  actionControls: [],
  answer: valueAnswer,
  context: { depth: context.depth, audience: context.audience },
  density: { density: 1, source: "derived" },
  visibleFields: [
    {
      itemIndex: 0,
      fields: [
        {
          key: "owner",
          value: "Ada",
          declaredPriority: "primary",
          effectivePriority: "primary",
          promotionRuleIndices: [],
        },
      ],
    },
  ],
  boundary: "Renderer consumes semantic specs; it does not evaluate Domain truth.",
};

// @ts-expect-error the retired role is not part of AnswerSet v2
const retiredRole: AnswerRole = "transform";

// @ts-expect-error the v2 schema discriminator is exact
const retiredSchema: AnswerSetV2["schema"] = "facia.answer-set/1";

const retiredSurface = {
  surface: "catalog.products",
  anchor: "catalog",
  lens: "products",
  chain: ["catalog", "product"],
};
declare function acceptAnswerSet(value: AnswerSetV2): void;
// @ts-expect-error the retired surface model is not an AnswerSet
acceptAnswerSet(retiredSurface);

const valueWithRetiredMember: ValueAnswerV2 = {
  type: "Value",
  payload: {},
  value: 1,
  // @ts-expect-error retired members are forbidden on v2 items
  transition: "publish",
};

const valueWithRetiredTransform: ValueAnswerV2 = {
  type: "Value",
  payload: {},
  value: 1,
  // @ts-expect-error retired transform members are forbidden on v2 items
  transform: "publish",
};

const valueWithWrongRoleMember: ValueAnswerV2 = {
  type: "Value",
  payload: {},
  value: 1,
  // @ts-expect-error verdict members are forbidden on value items
  conforms: true,
};

const legacyVerdictWithState: VerdictAnswerSetV2 = {
  schema: "facia.answer-set/2",
  question: "Is it ready?",
  answerType: "verdict",
  path: "meaning",
  inspection: "none",
  actionable: false,
  // @ts-expect-error legacy verdicts explicitly forbid state
  items: [{
    type: "Verdict",
    contract: "LegacyBooleanVerdictV0",
    payload: {},
    conforms: true,
    state: "ready",
  }],
  operations: [],
};

const boundedVerdictMissingState = {
  type: "Verdict",
  contract: "BoundedVerdictV1",
  payload: {},
  // @ts-expect-error bounded verdicts require state
} satisfies BoundedVerdictV1;

const operationWithVerdictMember: OperationV2 = {
  type: "Operation",
  payload: {},
  operation: { id: "publish", name: "Publish" },
  input: null,
  output: null,
  // @ts-expect-error verdict members are forbidden on operation items
  conforms: true,
};

const executableOperationRecord: OperationV2 = {
  type: "Operation",
  payload: {},
  operation: {
    id: "publish",
    name: "Publish",
    // @ts-expect-error operation records contain data, never executable code
    execute: () => undefined,
  },
  input: null,
  output: null,
};

const directTraceWithHistoryMember: DirectTraceV2 = {
  kind: "direct",
  id: "trace-1",
  entries: [{ step: "observe", value: true }],
  // @ts-expect-error direct traces are closed and cannot contain history records
  records: [],
};

const descriptorWithCallback: OperationDescriptorV2 = {
  id: "publish",
  label: "Publish",
  invocation: "host-callback",
  reference: "release.publish",
  // @ts-expect-error operation descriptors cannot expose callbacks
  callback: () => undefined,
};

const incompleteDescriptor = {
  id: "publish",
  label: "Publish",
  invocation: "model-operation",
  // @ts-expect-error operation descriptors require a reference
} satisfies OperationDescriptorV2;

const contextWithRendererData: ResolveContext = {
  depth: "focus",
  // @ts-expect-error resolve context is closed and renderer-neutral
  style: { color: "red" },
};

// @ts-expect-error functions are not JSON-serializable values
const executableJson: JsonValue = () => undefined;

const actionWithExecution: ActionAffordance = {
  operation: completeDescriptor,
  reasonCode: "ACTION_OPERATION_DESCRIPTOR",
  // @ts-expect-error action affordances describe operations but cannot execute them
  execute: () => undefined,
};

const recipeWithCss: ComponentRecipe = {
  ...recipe,
  // @ts-expect-error recipes are renderer-neutral and cannot contain CSS
  css: ".answer { color: red; }",
};

const componentWithCallback: ComponentRecipe = {
  ...recipe,
  components: [{
    id: "ValueDetail",
    semantics: {
      // @ts-expect-error semantic component data must remain JSON-serializable
      onSelect: () => undefined,
    },
  }],
};

void verdictAnswer;
void operationAnswer;
void convergenceAnswer;
void temporalValueSequence;
void historyTrace;
void completeDescriptor;
void recipe;
void retiredRole;
void retiredSchema;
void valueWithRetiredMember;
void valueWithRetiredTransform;
void valueWithWrongRoleMember;
void legacyVerdictWithState;
void boundedVerdictMissingState;
void operationWithVerdictMember;
void executableOperationRecord;
void directTraceWithHistoryMember;
void descriptorWithCallback;
void incompleteDescriptor;
void contextWithRendererData;
void executableJson;
void actionWithExecution;
void recipeWithCss;
void componentWithCallback;
