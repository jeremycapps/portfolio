/** Recursive plain-JSON data accepted and emitted by Facia. */
export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject { [key: string]: JsonValue }
export type NonEmptyArray<T> = [T, ...T[]];

export type AnswerRole = "value" | "verdict" | "operation" | "convergence";
export type AnswerPath = "meaning" | "execution";
export type InspectionState = "none" | "available";
export type AnswerStructure = "dimension" | "group" | "sequence";
export type SequenceKind = "temporal" | "dependency" | "trace";
export type AnswerDensity = 1 | 2 | 3;
export type DisclosureDepth = "glance" | "inspect" | "focus" | "audit";
export type FieldPriority = "primary" | "secondary" | "supporting" | "audit";
export type FieldKey = string;

export interface EqualsPromotionConditionV2 {
  field: FieldKey;
  equals: JsonValue;
  isFalse?: never;
  isNonEmpty?: never;
}
export interface FalsePromotionConditionV2 {
  field: FieldKey;
  equals?: never;
  isFalse: true;
  isNonEmpty?: never;
}
export interface NonEmptyPromotionConditionV2 {
  field: FieldKey;
  equals?: never;
  isFalse?: never;
  isNonEmpty: true;
}
export type PromotionConditionV2 =
  | EqualsPromotionConditionV2
  | FalsePromotionConditionV2
  | NonEmptyPromotionConditionV2;
export interface PromotionRuleV2 {
  when: PromotionConditionV2;
  promote: NonEmptyArray<FieldKey>;
}
export interface FieldPriorityV2 {
  primary: FieldKey[];
  secondary: FieldKey[];
  supporting: FieldKey[];
  audit: FieldKey[];
}
export interface FieldInfoV2 {
  priority: FieldPriorityV2;
  promotion?: PromotionRuleV2[];
}

interface AnswerItemBaseV2 { payload: JsonObject; fields?: FieldInfoV2 }
export interface ValueAnswerV2 extends AnswerItemBaseV2 {
  type: "Value";
  value: JsonValue;
  evidence?: JsonValue;
}
export interface LegacyBooleanVerdictV0 extends AnswerItemBaseV2 {
  type: "Verdict";
  contract: "LegacyBooleanVerdictV0";
  conforms: boolean;
  state?: never;
  finding?: JsonValue;
  reason?: JsonValue;
  expected?: JsonValue;
  actual?: JsonValue;
  evidence?: JsonValue;
}
export interface BoundedVerdictV1 extends AnswerItemBaseV2 {
  type: "Verdict";
  contract: "BoundedVerdictV1";
  state: string;
  conforms?: boolean;
  finding?: JsonValue;
  reason?: JsonValue;
  expected?: JsonValue;
  actual?: JsonValue;
  evidence?: JsonValue;
}
export type VerdictAnswerV2 = LegacyBooleanVerdictV0 | BoundedVerdictV1;
export interface OperationRecordV2 { id: string; name: string }
export interface OperationV2 extends AnswerItemBaseV2 {
  type: "Operation";
  operation: OperationRecordV2;
  input: JsonValue;
  output: JsonValue;
  before?: JsonValue;
  after?: JsonValue;
  evidence?: JsonValue;
}
export type ConvergenceState = "converging" | "diverging" | "stalled" | "reached";
export interface ConvergenceV2 extends AnswerItemBaseV2 {
  type: "Convergence";
  state: ConvergenceState;
  goal?: JsonValue;
  from?: JsonValue;
  to?: JsonValue;
  evidence?: JsonValue;
}
export type AnswerItemV2 = ValueAnswerV2 | VerdictAnswerV2 | OperationV2 | ConvergenceV2;

export interface OperationDescriptorV2 {
  id: string;
  label: string;
  invocation: "model-operation" | "host-callback";
  reference: string;
  inputSchema?: JsonObject;
  confirmation?: string;
}
export interface TraceEntryV2 { step: string; value: JsonValue }
export interface DirectTraceV2 {
  kind: "direct";
  id: string;
  entries: NonEmptyArray<TraceEntryV2>;
}
export interface HistoryRecordV2 { itemIndex: number; trace: DirectTraceV2 }
export interface HistoryTraceV2 {
  kind: "history";
  records: NonEmptyArray<HistoryRecordV2>;
}
export type AnswerTraceV2 = DirectTraceV2 | HistoryTraceV2;

interface AnswerSetEnvelopeV2<TRole extends AnswerRole, TItem extends AnswerItemV2> {
  schema: "facia.answer-set/2";
  question: string;
  answerType: TRole;
  path: AnswerPath;
  inspection: InspectionState;
  actionable: boolean;
  items: NonEmptyArray<TItem>;
  operations: OperationDescriptorV2[];
  structure?: AnswerStructure;
  sequenceKind?: SequenceKind;
  trace?: AnswerTraceV2;
  density?: AnswerDensity;
}
export type ValueAnswerSetV2 = AnswerSetEnvelopeV2<"value", ValueAnswerV2>;
export type VerdictAnswerSetV2 = AnswerSetEnvelopeV2<"verdict", VerdictAnswerV2>;
export type OperationAnswerSetV2 = AnswerSetEnvelopeV2<"operation", OperationV2>;
export type ConvergenceAnswerSetV2 = AnswerSetEnvelopeV2<"convergence", ConvergenceV2>;
export type AnswerSetV2 =
  | ValueAnswerSetV2
  | VerdictAnswerSetV2
  | OperationAnswerSetV2
  | ConvergenceAnswerSetV2;

export interface ResolveContext { depth: DisclosureDepth; audience?: string }

export type JsonPreflightErrorCode =
  | "JSON_INSPECTION_FAILED" | "JSON_ACCESSOR_FORBIDDEN" | "JSON_SYMBOL_KEY_FORBIDDEN"
  | "JSON_NON_PLAIN_OBJECT" | "JSON_CYCLE" | "JSON_ARRAY_HOLE"
  | "JSON_VALUE_UNSUPPORTED" | "JSON_NUMBER_NON_FINITE" | "JSON_DEPTH_EXCEEDED";
export type StructuralValidationErrorCode =
  | "INVALID_ANSWER_SET" | "ANSWER_SET_SCHEMA_UNSUPPORTED" | "REQUIRED_MEMBER_MISSING"
  | "RETIRED_MEMBER" | "FIELDS_SCOPE_INVALID" | "UNKNOWN_MEMBER" | "INVALID_ENUM_VALUE"
  | "INVALID_STRING_VALUE" | "INVALID_INTEGER_VALUE" | "ANSWER_SET_EMPTY_ITEMS"
  | "ANSWER_KIND_MISMATCH" | "INVALID_OPERATION_DESCRIPTOR" | "INVALID_FIELD_INFO"
  | "INVALID_PROMOTION_CONDITION" | "INVALID_TRACE" | "SINGULAR_STRUCTURE_FORBIDDEN"
  | "SEQUENCE_KIND_REQUIRED" | "SEQUENCE_KIND_FORBIDDEN" | "ACTIONABILITY_MISMATCH";
export type SemanticValidationErrorCode =
  | "DUPLICATE_OPERATION_ID" | "FIELD_PRIORITY_DUPLICATE" | "PROMOTION_TARGET_UNDECLARED"
  | "FIELD_REFERENCE_DOTTED" | "FIELD_REFERENCE_ENVELOPE" | "FIELD_REFERENCE_NESTED"
  | "FIELD_REFERENCE_WRONG_ITEM" | "FIELD_REFERENCE_MISSING"
  | "TRACE_HISTORY_CARDINALITY" | "TRACE_HISTORY_INDEX" | "CONVERGENCE_PROVENANCE_REQUIRED";
export type ValidationErrorCode =
  | JsonPreflightErrorCode | StructuralValidationErrorCode | SemanticValidationErrorCode;
export interface ValidationError {
  code: ValidationErrorCode;
  path: string;
  message: string;
  context?: JsonObject;
}
export interface ValidationSuccess { valid: true; value: AnswerSetV2 }
export interface ValidationFailure { valid: false; errors: NonEmptyArray<ValidationError> }
export type ValidationResult = ValidationSuccess | ValidationFailure;

export type AnswerShape =
  | "singular-value" | "singular-verdict" | "singular-operation" | "singular-convergence"
  | "collection" | "dimension" | "group"
  | "temporal-sequence" | "dependency-sequence" | "trace-sequence";
export type ShapeReasonCode =
  | "SHAPE_SINGULAR_VALUE" | "SHAPE_SINGULAR_VERDICT" | "SHAPE_SINGULAR_OPERATION"
  | "SHAPE_SINGULAR_CONVERGENCE" | "SHAPE_COLLECTION" | "SHAPE_DIMENSION" | "SHAPE_GROUP"
  | "SHAPE_TEMPORAL_SEQUENCE" | "SHAPE_DEPENDENCY_SEQUENCE" | "SHAPE_TRACE_SEQUENCE";
export interface ShapeResolution {
  ok: true;
  shape: AnswerShape;
  reasonCode: ShapeReasonCode;
  explanation: string;
}
export type DensityState = AnswerDensity | "absent";
export type DensitySource = "declared" | "derived" | "absent";
export interface DensityResolution { density: DensityState; source: DensitySource }
export type PresentationPattern =
  | "review-panel" | "action-panel" | "edit-form" | "operation-detail"
  | "convergence-panel" | "detail" | "badge" | "stat" | "compact-card"
  | "list" | "grid" | "table" | "comparison-matrix"
  | "board" | "queue" | "grouped-list"
  | "timeline" | "dependency-list" | "dependency-tree"
  | "replay-panel" | "audit-trail";
export type PatternReasonCode =
  | "PATTERN_ACTIONABLE_VERDICT" | "PATTERN_ACTIONABLE_OPERATION"
  | "PATTERN_ACTIONABLE_VALUE" | "PATTERN_CONVERGENCE_PANEL"
  | "PATTERN_OPERATION_DETAIL" | "PATTERN_DEEP_VERDICT"
  | "PATTERN_COMPACT_VERDICT" | "PATTERN_DENSE_VERDICT"
  | "PATTERN_ABSENT_VERDICT" | "PATTERN_DEEP_VALUE"
  | "PATTERN_COMPACT_SCALAR" | "PATTERN_COMPACT_OBJECT"
  | "PATTERN_DENSE_VALUE" | "PATTERN_ABSENT_VALUE"
  | "PATTERN_COLLECTION_LIST" | "PATTERN_COLLECTION_GRID"
  | "PATTERN_COLLECTION_ABSENT_GRID" | "PATTERN_DIMENSION_TABLE"
  | "PATTERN_DIMENSION_MATRIX" | "PATTERN_DIMENSION_ABSENT_MATRIX"
  | "PATTERN_OPERATION_BOARD" | "PATTERN_ACTION_QUEUE"
  | "PATTERN_GROUPED_LIST" | "PATTERN_TEMPORAL_TIMELINE"
  | "PATTERN_DEPENDENCY_LIST" | "PATTERN_DEPENDENCY_TREE"
  | "PATTERN_DEPENDENCY_ABSENT_TREE" | "PATTERN_ACTIONABLE_REPLAY"
  | "PATTERN_TRACE_AUDIT";
export interface PatternResolution {
  ok: true;
  pattern: PresentationPattern;
  reasonCode: PatternReasonCode;
  explanation: string;
  density: DensityResolution;
}
export type ResolutionFailureCode =
  | "VALIDATION_REQUIRED" | "SHAPE_REQUIRED" | "PATTERN_UNSUPPORTED" | "SEMANTIC_SPEC_REQUIRED";
export interface ResolutionFailure {
  ok: false;
  code: ResolutionFailureCode;
  explanation: string;
  errors?: ValidationError[];
}
export type ShapeResult = ShapeResolution | ResolutionFailure;
export type PatternResult = PatternResolution | ResolutionFailure;

export type InspectionControl =
  | "inspect" | "expand" | "filter" | "sort" | "compare" | "drill-down"
  | "view-evidence" | "view-trace";
export type InspectionReasonCode = `INSPECTION_${Uppercase<string>}`;
export interface InspectionAffordanceResolution {
  controls: InspectionControl[];
  reasonCode: InspectionReasonCode;
  explanation: string;
}
export interface ActionAffordance {
  operation: OperationDescriptorV2;
  reasonCode: "ACTION_OPERATION_DESCRIPTOR";
}
export interface AffordanceResolution {
  ok: true;
  inspection: InspectionAffordanceResolution;
  actions: ActionAffordance[];
}
export type AffordanceResult = AffordanceResolution | ResolutionFailure;

export interface ResolvedFieldV2 {
  key: FieldKey;
  value: JsonValue;
  declaredPriority: FieldPriority;
  effectivePriority: FieldPriority;
  promotionRuleIndices: number[];
}
export interface ResolvedItemFieldsV2 { itemIndex: number; fields: ResolvedFieldV2[] }
export interface SemanticComponentDescriptor { id: string; semantics?: JsonObject }
export interface ComponentRecipe {
  pattern: PresentationPattern;
  patternReasonCode: PatternReasonCode;
  components: SemanticComponentDescriptor[];
  inspectionControls: InspectionControl[];
  actionControls: ActionAffordance[];
  answer: AnswerSetV2;
  context: { depth: DisclosureDepth; audience: string };
  density: DensityResolution;
  visibleFields: ResolvedItemFieldsV2[];
  boundary: "Renderer consumes semantic specs; it does not evaluate Domain truth.";
}
export interface RecipeSuccess { ok: true; recipe: ComponentRecipe }
export type RecipeResult = RecipeSuccess | ResolutionFailure;
