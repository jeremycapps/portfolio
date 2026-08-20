import type { ErrorObject } from "ajv";
import * as Ajv2020Module from "ajv/dist/2020.js";

import answerSetSchema from "../schemas/facia-answer-set.v2.schema.json" with {
  type: "json",
};
import type {
  AnswerSetV2,
  JsonValue,
  SemanticValidationErrorCode,
  StructuralValidationErrorCode,
  ValidationError,
  ValidationErrorCode,
  ValidationResult,
} from "./answer-set-v2.js";

type Ajv2020Constructor = typeof import("ajv/dist/2020.js").default;
const Ajv2020 = (
  Ajv2020Module as unknown as { default: Ajv2020Constructor }
).default;

const ajv = new Ajv2020({ allErrors: true, strict: true });
const validateCanonicalSchema = ajv.compile(answerSetSchema);

type PreflightResult =
  | { ok: true; value: JsonValue }
  | { ok: false; error: ValidationError };

const STRUCTURAL_RANK: Record<StructuralValidationErrorCode, number> = {
  INVALID_ANSWER_SET: 1,
  ANSWER_SET_SCHEMA_UNSUPPORTED: 2,
  REQUIRED_MEMBER_MISSING: 3,
  RETIRED_MEMBER: 4,
  FIELDS_SCOPE_INVALID: 5,
  UNKNOWN_MEMBER: 6,
  INVALID_ENUM_VALUE: 7,
  INVALID_STRING_VALUE: 8,
  INVALID_INTEGER_VALUE: 9,
  ANSWER_SET_EMPTY_ITEMS: 10,
  ANSWER_KIND_MISMATCH: 11,
  INVALID_OPERATION_DESCRIPTOR: 12,
  INVALID_FIELD_INFO: 13,
  INVALID_PROMOTION_CONDITION: 14,
  INVALID_TRACE: 15,
  SINGULAR_STRUCTURE_FORBIDDEN: 16,
  SEQUENCE_KIND_REQUIRED: 17,
  SEQUENCE_KIND_FORBIDDEN: 18,
  ACTIONABILITY_MISMATCH: 19,
};

const ENVELOPE_MEMBER_ORDER = [
  "schema",
  "question",
  "answerType",
  "path",
  "inspection",
  "actionable",
  "items",
  "operations",
  "structure",
  "sequenceKind",
  "trace",
  "density",
];

const MESSAGES: Record<StructuralValidationErrorCode, string> = {
  INVALID_ANSWER_SET: "AnswerSet must be a non-array object.",
  ANSWER_SET_SCHEMA_UNSUPPORTED: "AnswerSet schema must be facia.answer-set/2.",
  REQUIRED_MEMBER_MISSING: "A required member is missing.",
  RETIRED_MEMBER: "Retired transform or transition vocabulary is forbidden.",
  FIELDS_SCOPE_INVALID: "Field information is item-local and cannot appear on the envelope.",
  UNKNOWN_MEMBER: "A closed contract object contains an unknown member.",
  INVALID_ENUM_VALUE: "A value is outside its closed contract enumeration.",
  INVALID_STRING_VALUE: "A required non-empty string is malformed.",
  INVALID_INTEGER_VALUE: "An integer value is outside its contract bounds.",
  ANSWER_SET_EMPTY_ITEMS: "AnswerSet items must be a non-empty array.",
  ANSWER_KIND_MISMATCH: "An item does not match the role selected by answerType.",
  INVALID_OPERATION_DESCRIPTOR: "An operation descriptor or operation record is malformed.",
  INVALID_FIELD_INFO: "Field priority or promotion metadata is malformed.",
  INVALID_PROMOTION_CONDITION: "A promotion condition must use exactly one supported operator.",
  INVALID_TRACE: "Trace or history data is malformed.",
  SINGULAR_STRUCTURE_FORBIDDEN: "A singular AnswerSet cannot declare structure or sequenceKind.",
  SEQUENCE_KIND_REQUIRED: "A sequence structure requires sequenceKind.",
  SEQUENCE_KIND_FORBIDDEN: "sequenceKind is forbidden without sequence structure.",
  ACTIONABILITY_MISMATCH: "actionable must equal whether operations is non-empty.",
};

const SEMANTIC_MESSAGES: Record<SemanticValidationErrorCode, string> = {
  DUPLICATE_OPERATION_ID: "Operation descriptor ids must be unique.",
  FIELD_PRIORITY_DUPLICATE: "A field may occur in only one declared priority bucket.",
  PROMOTION_TARGET_UNDECLARED: "A promotion target must have a declared priority.",
  FIELD_REFERENCE_DOTTED: "Field references must be top-level, non-dotted keys.",
  FIELD_REFERENCE_ENVELOPE: "Field references cannot address AnswerSet or item members.",
  FIELD_REFERENCE_NESTED: "Field references cannot address nested payload members.",
  FIELD_REFERENCE_WRONG_ITEM: "Field references are scoped to their owning item's payload.",
  FIELD_REFERENCE_MISSING: "Field references must exist on their owning item's payload.",
  TRACE_HISTORY_CARDINALITY: "History must contain exactly one record for every item.",
  TRACE_HISTORY_INDEX: "History records must use exact zero-based item order.",
  CONVERGENCE_PROVENANCE_REQUIRED:
    "Convergence requires a singular direct trace or qualifying trace-sequence history.",
};

function error(code: ValidationErrorCode, path: string, message: string): ValidationError {
  return { code, path, message };
}

function propertyPath(parent: string, key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
    ? `${parent}.${key}`
    : `${parent}[${JSON.stringify(key)}]`;
}

/**
 * Maximum container nesting preflight will descend into.
 *
 * Preflight, the canonical schema validator, and the semantic walkers all
 * recurse per nesting level, so an unbounded walk turns hostile input into a
 * stack overflow. The contract has no legitimate use for nesting this deep, and
 * the bound sits far below the engine's stack budget so every later phase is
 * transitively protected.
 */
const MAX_JSON_DEPTH = 512;

function preflight(value: unknown): PreflightResult {
  return cloneJsonValue(value, "$", new Set<object>(), 0);
}

function cloneJsonValue(
  value: unknown,
  path: string,
  activeAncestors: Set<object>,
  depth: number,
): PreflightResult {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return { ok: true, value };
  }
  if (typeof value === "number") {
    return Number.isFinite(value)
      ? { ok: true, value }
      : {
          ok: false,
          error: error("JSON_NUMBER_NON_FINITE", path, "JSON numbers must be finite."),
        };
  }
  if (typeof value !== "object") {
    return {
      ok: false,
      error: error(
        "JSON_VALUE_UNSUPPORTED",
        path,
        "The value is not representable in JSON.",
      ),
    };
  }

  if (activeAncestors.has(value)) {
    return {
      ok: false,
      error: error("JSON_CYCLE", path, "JSON values cannot contain cycles."),
    };
  }

  if (depth >= MAX_JSON_DEPTH) {
    return {
      ok: false,
      error: error(
        "JSON_DEPTH_EXCEEDED",
        path,
        "JSON values exceed the maximum supported nesting depth.",
      ),
    };
  }

  let isArray: boolean;
  let prototype: object | null;
  let keys: PropertyKey[];
  let descriptors: PropertyDescriptorMap;
  try {
    isArray = Array.isArray(value);
    prototype = Object.getPrototypeOf(value) as object | null;
    keys = Reflect.ownKeys(value);
    descriptors = Object.getOwnPropertyDescriptors(value);
  } catch {
    return {
      ok: false,
      error: error(
        "JSON_INSPECTION_FAILED",
        path,
        "The value could not be safely inspected.",
      ),
    };
  }

  if (!isArray && prototype !== Object.prototype && prototype !== null) {
    return {
      ok: false,
      error: error("JSON_NON_PLAIN_OBJECT", path, "JSON objects must be plain objects."),
    };
  }
  if (keys.some((key) => typeof key === "symbol")) {
    return {
      ok: false,
      error: error(
        "JSON_SYMBOL_KEY_FORBIDDEN",
        path,
        "JSON objects and arrays cannot have symbol keys.",
      ),
    };
  }

  for (const key of keys as string[]) {
    const descriptor = descriptors[key];
    if (!descriptor) {
      return {
        ok: false,
        error: error("JSON_INSPECTION_FAILED", path, "An own property could not be inspected."),
      };
    }
    if ("get" in descriptor || "set" in descriptor) {
      return {
        ok: false,
        error: error(
          "JSON_ACCESSOR_FORBIDDEN",
          propertyPath(path, key),
          "JSON values cannot contain accessors.",
        ),
      };
    }
  }

  activeAncestors.add(value);
  try {
    if (isArray) {
      const lengthDescriptor = descriptors.length;
      const length = lengthDescriptor && "value" in lengthDescriptor
        ? lengthDescriptor.value as number
        : 0;
      const clone: JsonValue[] = [];
      for (let index = 0; index < length; index += 1) {
        const descriptor = descriptors[String(index)];
        const itemPath = `${path}[${index}]`;
        if (!descriptor || !("value" in descriptor)) {
          return {
            ok: false,
            error: error("JSON_ARRAY_HOLE", itemPath, "JSON arrays cannot contain holes."),
          };
        }
        const item = cloneJsonValue(descriptor.value, itemPath, activeAncestors, depth + 1);
        if (!item.ok) return item;
        clone.push(item.value);
      }
      return { ok: true, value: clone };
    }

    const clone: Record<string, JsonValue> = Object.create(null) as Record<string, JsonValue>;
    for (const key of keys as string[]) {
      const descriptor = descriptors[key];
      if (!descriptor?.enumerable || !("value" in descriptor)) continue;
      const item = cloneJsonValue(
        descriptor.value,
        propertyPath(path, key),
        activeAncestors,
        depth + 1,
      );
      if (!item.ok) return item;
      Object.defineProperty(clone, key, {
        value: item.value,
        enumerable: true,
        configurable: true,
        writable: true,
      });
    }
    return { ok: true, value: clone };
  } finally {
    activeAncestors.delete(value);
  }
}

function pointerSegments(pointer: string): string[] {
  if (pointer === "") return [];
  return pointer.slice(1).split("/").map((segment) =>
    segment.replace(/~1/g, "/").replace(/~0/g, "~")
  );
}

function pointerPath(pointer: string, document: JsonValue): string {
  let path = "$";
  let current: unknown = document;
  for (const segment of pointerSegments(pointer)) {
    if (Array.isArray(current) && /^\d+$/.test(segment)) {
      const index = Number(segment);
      path += `[${index}]`;
      current = current[index];
    } else {
      path = propertyPath(path, segment);
      current = current !== null && typeof current === "object"
        ? (current as Record<string, unknown>)[segment]
        : undefined;
    }
  }
  return path;
}

function pathWithProperty(pointer: string, property: string, document: JsonValue): string {
  return propertyPath(pointerPath(pointer, document), property);
}

function itemRoleMismatch(document: JsonValue, pointer: string): boolean {
  const match = /^\/items\/(\d+)(?:\/|$)/.exec(pointer);
  if (!match || document === null || Array.isArray(document) || typeof document !== "object") {
    return false;
  }
  const envelope = document as Record<string, unknown>;
  const item = Array.isArray(envelope.items) ? envelope.items[Number(match[1])] : undefined;
  if (item === null || Array.isArray(item) || typeof item !== "object") return true;
  const candidate = item as Record<string, unknown>;
  switch (envelope.answerType) {
    case "value": return candidate.type !== "Value";
    case "verdict":
      return candidate.type !== "Verdict"
        || (candidate.contract !== "LegacyBooleanVerdictV0"
          && candidate.contract !== "BoundedVerdictV1");
    case "operation": return candidate.type !== "Operation";
    case "convergence": return candidate.type !== "Convergence";
    default: return true;
  }
}

function classifySchemaError(
  schemaError: ErrorObject,
  document: JsonValue,
): ValidationError | undefined {
  const pointer = schemaError.instancePath;
  const path = pointerPath(pointer, document);
  const params = schemaError.params as Record<string, unknown>;
  const propertyName = typeof (schemaError as ErrorObject & { propertyName?: unknown }).propertyName === "string"
    ? (schemaError as ErrorObject & { propertyName: string }).propertyName
    : undefined;

  if (schemaError.keyword === "if" || schemaError.keyword === "oneOf") return undefined;

  if ((schemaError.keyword === "propertyNames" || schemaError.keyword === "not")
    && (propertyName === "transform" || propertyName === "transition")) {
    return structuralError("RETIRED_MEMBER", propertyPath(path, propertyName));
  }

  if (schemaError.keyword === "additionalProperties") {
    const member = String(params.additionalProperty);
    const memberPath = propertyPath(path, member);
    if (member === "transform" || member === "transition") {
      return structuralError("RETIRED_MEMBER", memberPath);
    }
    if (pointer === "" && member === "fields") {
      return structuralError("FIELDS_SCOPE_INVALID", memberPath);
    }
    if (/\/fields\/promotion\/\d+\/when$/.test(pointer)) {
      return structuralError("INVALID_PROMOTION_CONDITION", path);
    }
    if (pointer === "/trace") {
      const trace = valueAtPointer(document, pointer) as Record<string, unknown> | undefined;
      const selectedMembers = trace?.kind === "direct"
        ? ["kind", "id", "entries"]
        : trace?.kind === "history" ? ["kind", "records"] : [];
      if (selectedMembers.includes(member)) return undefined;
    }
    if (itemRoleMismatch(document, pointer)) {
      const itemPointer = /^\/items\/\d+/.exec(pointer)?.[0] ?? pointer;
      return structuralError("ANSWER_KIND_MISMATCH", pointerPath(itemPointer, document));
    }
    return structuralError("UNKNOWN_MEMBER", memberPath);
  }

  if (schemaError.keyword === "required") {
    const member = String(params.missingProperty);
    const missingPath = pathWithProperty(pointer, member, document);
    if (pointer === "" && member === "schema") {
      return structuralError("ANSWER_SET_SCHEMA_UNSUPPORTED", "$.schema");
    }
    if (member === "sequenceKind" && pointer === "") {
      return structuralError("SEQUENCE_KIND_REQUIRED", "$.sequenceKind");
    }
    if (/^\/operations(?:\/|$)/.test(pointer) || /\/operation(?:\/|$)/.test(pointer)) {
      return structuralError("INVALID_OPERATION_DESCRIPTOR", missingPath);
    }
    if (/\/fields\/promotion\/\d+\/when$/.test(pointer)) {
      return structuralError("INVALID_PROMOTION_CONDITION", path);
    }
    if (/\/fields(?:\/|$)/.test(pointer)) {
      return structuralError("INVALID_FIELD_INFO", missingPath);
    }
    if (/^\/trace(?:\/|$)/.test(pointer)) {
      return structuralError("INVALID_TRACE", missingPath);
    }
    if (/^\/items\/\d+$/.test(pointer) && itemRoleMismatch(document, pointer)) {
      return structuralError("ANSWER_KIND_MISMATCH", path);
    }
    return structuralError("REQUIRED_MEMBER_MISSING", missingPath);
  }

  if (schemaError.keyword === "false schema") {
    if (pointer === "/structure" || pointer === "/sequenceKind") {
      const envelope = document as Record<string, unknown>;
      const items = envelope.items;
      if (Array.isArray(items) && items.length === 1) {
        return structuralError(
          "SINGULAR_STRUCTURE_FORBIDDEN",
          Object.hasOwn(envelope, "structure") ? "$.structure" : "$.sequenceKind",
        );
      }
      return structuralError("SEQUENCE_KIND_FORBIDDEN", "$.sequenceKind");
    }
  }

  if (schemaError.keyword === "const" || schemaError.keyword === "enum") {
    if (pointer === "/schema") {
      return structuralError("ANSWER_SET_SCHEMA_UNSUPPORTED", "$.schema");
    }
    if (pointer === "/answerType") {
      return structuralError("ANSWER_KIND_MISMATCH", "$.answerType");
    }
    if (/^\/items\/\d+\/type$/.test(pointer)) {
      const actual = valueAtPointer(document, pointer);
      if (actual === "Transform") return structuralError("RETIRED_MEMBER", path);
      return structuralError("ANSWER_KIND_MISMATCH", pointerPath(pointer.replace(/\/type$/, ""), document));
    }
    if (/^\/items\/\d+\/contract$/.test(pointer)) {
      return structuralError("ANSWER_KIND_MISMATCH", pointerPath(pointer.replace(/\/contract$/, ""), document));
    }
    if (/\/fields\/promotion\/\d+\/when\/(?:isFalse|isNonEmpty)$/.test(pointer)) {
      return structuralError("INVALID_PROMOTION_CONDITION", path);
    }
    if (pointer === "/trace/kind") {
      const actual = valueAtPointer(document, pointer);
      if (actual === "direct" || actual === "history") return undefined;
      return structuralError("INVALID_TRACE", path);
    }
    if (/^\/trace(?:\/|$)/.test(pointer)) {
      return structuralError("INVALID_TRACE", path);
    }
    return structuralError("INVALID_ENUM_VALUE", path);
  }

  if (schemaError.keyword === "maxItems" && pointer === "/operations") {
    return structuralError("ACTIONABILITY_MISMATCH", "$.actionable");
  }
  if (schemaError.keyword === "minItems" && pointer === "/operations") {
    return structuralError("ACTIONABILITY_MISMATCH", "$.actionable");
  }
  if ((schemaError.keyword === "type" || schemaError.keyword === "minItems")
    && pointer === "/items") {
    return structuralError("ANSWER_SET_EMPTY_ITEMS", "$.items");
  }
  if (schemaError.keyword === "type" && pointer === "") {
    return structuralError("INVALID_ANSWER_SET", "$");
  }

  if (/^\/operations(?:\/|$)/.test(pointer) || /\/operation(?:\/|$)/.test(pointer)) {
    return structuralError("INVALID_OPERATION_DESCRIPTOR", path);
  }
  if (/\/fields\/promotion\/\d+\/when(?:\/|$)/.test(pointer)) {
    return structuralError("INVALID_PROMOTION_CONDITION", path);
  }
  if (/\/fields(?:\/|$)/.test(pointer)) {
    return structuralError("INVALID_FIELD_INFO", path);
  }
  if (/^\/trace(?:\/|$)/.test(pointer)) {
    if ((schemaError.keyword === "type" || schemaError.keyword === "minimum")
      && /\/itemIndex$/.test(pointer)) {
      return structuralError("INVALID_INTEGER_VALUE", path);
    }
    return structuralError("INVALID_TRACE", path);
  }
  if (pointer === "/density") {
    return schemaError.keyword === "type"
      ? structuralError("INVALID_INTEGER_VALUE", path)
      : structuralError("INVALID_ENUM_VALUE", path);
  }
  if (pointer === "/question" && (schemaError.keyword === "type" || schemaError.keyword === "minLength")) {
    return structuralError("INVALID_STRING_VALUE", path);
  }
  if (/^\/items\/\d+(?:\/|$)/.test(pointer)) {
    return structuralError(
      "ANSWER_KIND_MISMATCH",
      pointerPath(/^\/items\/\d+/.exec(pointer)?.[0] ?? pointer, document),
    );
  }
  return structuralError("INVALID_ENUM_VALUE", path);
}

function valueAtPointer(document: JsonValue, pointer: string): unknown {
  let value: unknown = document;
  for (const segment of pointerSegments(pointer)) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[segment];
  }
  return value;
}

function structuralError(code: StructuralValidationErrorCode, path: string): ValidationError {
  return error(code, path, MESSAGES[code]);
}

function tokenizePath(path: string): Array<string | number> {
  const tokens: Array<string | number> = [];
  const matcher = /\.([A-Za-z_$][A-Za-z0-9_$]*)|\[(\d+)\]|\[("(?:[^"\\]|\\.)*")\]/g;
  for (const match of path.matchAll(matcher)) {
    if (match[1] !== undefined) tokens.push(match[1]);
    else if (match[2] !== undefined) tokens.push(Number(match[2]));
    else if (match[3] !== undefined) tokens.push(JSON.parse(match[3]) as string);
  }
  return tokens;
}

function comparePaths(left: string, right: string): number {
  const leftTokens = tokenizePath(left);
  const rightTokens = tokenizePath(right);
  for (let index = 0; index < Math.min(leftTokens.length, rightTokens.length); index += 1) {
    const a = leftTokens[index];
    const b = rightTokens[index];
    if (a === b) continue;
    if (typeof a === "number" && typeof b === "number") return a - b;
    if (typeof a === "number") return 1;
    if (typeof b === "number") return -1;
    if (index === 0) {
      const aRank = ENVELOPE_MEMBER_ORDER.indexOf(a);
      const bRank = ENVELOPE_MEMBER_ORDER.indexOf(b);
      if (aRank >= 0 || bRank >= 0) {
        if (aRank < 0) return 1;
        if (bRank < 0) return -1;
        return aRank - bRank;
      }
    }
    return a < b ? -1 : 1;
  }
  return leftTokens.length - rightTokens.length;
}

function normalizeSchemaErrors(errors: ErrorObject[], document: JsonValue): ValidationError[] {
  let normalized = errors
    .map((schemaError) => classifySchemaError(schemaError, document))
    .filter((item): item is ValidationError => item !== undefined);
  normalized = normalized.filter((item) => {
    if (item.code !== "ANSWER_KIND_MISMATCH") return true;
    const match = /^\$\.items\[(\d+)\]$/.exec(item.path);
    if (!match || itemRoleMismatch(document, `/items/${match[1]}`)) return true;
    return !normalized.some((other) =>
      other !== item
      && other.code !== "ANSWER_KIND_MISMATCH"
      && (other.path.startsWith(`${item.path}.`) || other.path.startsWith(`${item.path}[`))
    );
  });
  const unique = new Map<string, ValidationError>();
  for (const item of normalized) unique.set(`${item.code}\u0000${item.path}`, item);
  return [...unique.values()].sort((left, right) => {
    const rank = STRUCTURAL_RANK[left.code as StructuralValidationErrorCode]
      - STRUCTURAL_RANK[right.code as StructuralValidationErrorCode];
    return rank || comparePaths(left.path, right.path);
  });
}

function semanticError(
  code: SemanticValidationErrorCode,
  path: string,
  context?: ValidationError["context"],
): ValidationError {
  const result: ValidationError = { code, path, message: SEMANTIC_MESSAGES[code] };
  if (context !== undefined) result.context = context;
  return result;
}

/**
 * Applies the runtime-owned invariants in the normative contract's stable order.
 *
 * Schema-owned cross-field rules are deliberately not repeated here. History
 * errors precede convergence provenance so callers receive the specific
 * topology failures as well as the final convergence failure.
 */
function validateSemantics(answerSet: AnswerSetV2): ValidationError[] {
  const errors: ValidationError[] = [];

  const operationIds = new Set<string>();
  answerSet.operations.forEach((operation, index) => {
    if (operationIds.has(operation.id)) {
      errors.push(semanticError(
        "DUPLICATE_OPERATION_ID",
        `$.operations[${index}].id`,
        { id: operation.id },
      ));
    } else {
      operationIds.add(operation.id);
    }
  });

  const priorities = ["primary", "secondary", "supporting", "audit"] as const;

  // Cross-bucket duplicates precede every other field-information invariant.
  answerSet.items.forEach((item, itemIndex) => {
    if (!item.fields) return;
    const declared = new Set<string>();
    for (const priority of priorities) {
      item.fields.priority[priority].forEach((key, keyIndex) => {
        if (declared.has(key)) {
          errors.push(semanticError(
            "FIELD_PRIORITY_DUPLICATE",
            `$.items[${itemIndex}].fields.priority.${priority}[${keyIndex}]`,
            { key },
          ));
        } else {
          declared.add(key);
        }
      });
    }
  });

  // A promoted key needs a declaration even when its condition does not hold.
  answerSet.items.forEach((item, itemIndex) => {
    if (!item.fields) return;
    const declared = new Set(priorities.flatMap(
      (priority) => item.fields!.priority[priority],
    ));
    for (const [ruleIndex, rule] of (item.fields.promotion ?? []).entries()) {
      rule.promote.forEach((key, keyIndex) => {
        if (!declared.has(key)) {
          errors.push(semanticError(
            "PROMOTION_TARGET_UNDECLARED",
            `$.items[${itemIndex}].fields.promotion[${ruleIndex}].promote[${keyIndex}]`,
            { key },
          ));
        }
      });
    }
  });

  const envelopeKeys = new Set([
    "schema",
    "question",
    "answerType",
    "path",
    "inspection",
    "actionable",
    "items",
    "operations",
    "structure",
    "sequenceKind",
    "trace",
    "density",
  ]);

  function itemContractKeys(item: AnswerSetV2["items"][number]): Set<string> {
    const common = ["type", "payload", "fields"];
    switch (item.type) {
      case "Value":
        return new Set([...common, "value", "evidence"]);
      case "Verdict":
        return new Set([
          ...common,
          "contract",
          "conforms",
          "state",
          "finding",
          "reason",
          "expected",
          "actual",
          "evidence",
        ]);
      case "Operation":
        return new Set([
          ...common,
          "operation",
          "input",
          "output",
          "before",
          "after",
          "evidence",
        ]);
      case "Convergence":
        return new Set([...common, "state", "goal", "from", "to", "evidence"]);
    }
  }

  // Recursion depth here is bounded by MAX_JSON_DEPTH: semantics run only on
  // values that already passed preflight's nesting bound.
  function hasNestedKey(value: JsonValue, key: string): boolean {
    if (value === null || typeof value !== "object") return false;
    if (!Array.isArray(value) && Object.hasOwn(value, key)) return true;
    return Object.values(value).some((nested) => hasNestedKey(nested, key));
  }

  function referenceErrorCode(itemIndex: number, key: string): SemanticValidationErrorCode | undefined {
    const item = answerSet.items[itemIndex];
    if (key.includes(".")) return "FIELD_REFERENCE_DOTTED";
    if (Object.hasOwn(item.payload, key)) return undefined;

    if (envelopeKeys.has(key) || itemContractKeys(item).has(key)) {
      return "FIELD_REFERENCE_ENVELOPE";
    }
    if (Object.values(item.payload).some((value) => hasNestedKey(value, key))) {
      return "FIELD_REFERENCE_NESTED";
    }
    if (answerSet.items.some((candidate, candidateIndex) =>
      candidateIndex !== itemIndex && Object.hasOwn(candidate.payload, key)
    )) {
      return "FIELD_REFERENCE_WRONG_ITEM";
    }
    return "FIELD_REFERENCE_MISSING";
  }

  function checkReference(itemIndex: number, key: string, path: string): void {
    const code = referenceErrorCode(itemIndex, key);
    if (code) errors.push(semanticError(code, path, { key }));
  }

  // References are visited in item/document order after the higher-ranked
  // duplicate and declaration invariants have completed for every item.
  answerSet.items.forEach((item, itemIndex) => {
    if (!item.fields) return;
    for (const priority of priorities) {
      item.fields.priority[priority].forEach((key, keyIndex) => {
        checkReference(
          itemIndex,
          key,
          `$.items[${itemIndex}].fields.priority.${priority}[${keyIndex}]`,
        );
      });
    }
    for (const [ruleIndex, rule] of (item.fields.promotion ?? []).entries()) {
      checkReference(
        itemIndex,
        rule.when.field,
        `$.items[${itemIndex}].fields.promotion[${ruleIndex}].when.field`,
      );
      rule.promote.forEach((key, keyIndex) => {
        checkReference(
          itemIndex,
          key,
          `$.items[${itemIndex}].fields.promotion[${ruleIndex}].promote[${keyIndex}]`,
        );
      });
    }
  });

  let qualifyingHistory = false;
  if (answerSet.trace?.kind === "history") {
    const records = answerSet.trace.records;
    const cardinalityMatches = records.length === answerSet.items.length;
    if (!cardinalityMatches) {
      errors.push(semanticError(
        "TRACE_HISTORY_CARDINALITY",
        "$.trace.records",
        { actual: records.length, expected: answerSet.items.length },
      ));
    }

    let indicesMatch = true;
    records.forEach((record, index) => {
      if (record.itemIndex !== index) {
        indicesMatch = false;
        errors.push(semanticError(
          "TRACE_HISTORY_INDEX",
          `$.trace.records[${index}].itemIndex`,
          { actual: record.itemIndex, expected: index },
        ));
      }
    });
    qualifyingHistory = cardinalityMatches && indicesMatch;
  }

  if (answerSet.answerType === "convergence") {
    const hasSingularDirectTrace = answerSet.items.length === 1
      && answerSet.structure === undefined
      && answerSet.sequenceKind === undefined
      && answerSet.trace?.kind === "direct";
    const hasTraceSequenceHistory = answerSet.items.length >= 2
      && answerSet.structure === "sequence"
      && answerSet.sequenceKind === "trace"
      && answerSet.trace?.kind === "history"
      && qualifyingHistory;

    if (!hasSingularDirectTrace && !hasTraceSequenceHistory) {
      errors.push(semanticError("CONVERGENCE_PROVENANCE_REQUIRED", "$.trace"));
    }
  }

  return errors;
}

/**
 * Total validation boundary for arbitrary JavaScript values.
 *
 * Validation proceeds through guarded JSON preflight, canonical-schema
 * validation, and deterministic runtime semantic validation. A later phase is
 * entered only when the prior phase succeeds.
 */
export function validateAnswerSet(input: unknown): ValidationResult {
  let inspected: PreflightResult;
  try {
    inspected = preflight(input);
  } catch {
    return {
      valid: false,
      errors: [structuralError("INVALID_ANSWER_SET", "$")],
    };
  }
  if (!inspected.ok) return { valid: false, errors: [inspected.error] };

  let valid: boolean;
  try {
    valid = validateCanonicalSchema(inspected.value) as boolean;
  } catch {
    return {
      valid: false,
      errors: [structuralError("INVALID_ANSWER_SET", "$")],
    };
  }
  if (valid) {
    const value = inspected.value as unknown as AnswerSetV2;
    const semanticErrors = validateSemantics(value);
    return semanticErrors.length > 0
      ? { valid: false, errors: semanticErrors as [ValidationError, ...ValidationError[]] }
      : { valid: true, value };
  }

  const errors = normalizeSchemaErrors(validateCanonicalSchema.errors ?? [], inspected.value);
  return {
    valid: false,
    errors: errors.length > 0
      ? errors as [ValidationError, ...ValidationError[]]
      : [structuralError("INVALID_ANSWER_SET", "$")],
  };
}
