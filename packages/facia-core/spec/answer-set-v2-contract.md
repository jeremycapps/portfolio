# AnswerSet v2 normative contract

- Status: ratified implementation gate
- Contract id: `facia.answer-set/2`
- Canonical schema path: `packages/facia-core/schemas/facia-answer-set.v2.schema.json`
- Canonical schema `$id`: `facia.answer-set/2`

This document is normative for the TypeScript model, JSON Schema, validator,
fixtures, resolvers, affordances, recipes, and schema pin in `@facia/core`.
Those artifacts may refine types or diagnostics, but may not add fields, accept
aliases, or choose behavior not stated here. In a conflict, this document and
the canonical schema must be reconciled before implementation continues.

Authoring constructors (`src/authoring.ts`, published as
`@facia/core/authoring`) are explicitly **not** normative contract surface. They
are producer-side convenience constructors over the normative types above: they
add no members, accept no aliases, and check nothing beyond the cardinality
rules the tuple types already encode. Every semantic invariant remains owned by
`validateAnswerSet` as specified below. A change to a constructor is not a
contract change and does not move the schema pin.

## Canonical schema identity and pin

- Schema identifier: `facia.answer-set/2`
- Public package path: `@facia/core/schemas/facia-answer-set.v2.schema.json`
- SHA-256 of the exact canonical schema bytes:
  `0fa2230a3db63be2684230c9e8b9da490b8705033974afd155856b28388dc45b`
- Machine-readable pin: `@facia/core/schemas/facia-answer-set.v2.pin.json`

`npm run schema:pin:check` is the stale-pin guard. An intentional schema change
must be followed by `npm run schema:pin` and review of both generated pin files.

## Imported source and review boundary

The tested spine was extracted from `@facia/answer-runtime` in the Libera
repository at immutable Git commit
`c73a0fce1379f9231fb88461aac5947096aa32b2` (the commit checked out by branch
`pale-peak-20260816` during extraction). The reviewed source comprises
`facia/src/types.d.ts`, `facia/src/validate.mjs`, `facia/src/resolve.mjs`,
`facia/src/affordances.mjs`, `facia/src/renderer.mjs`,
`facia/schemas/facia-answer-set.v1.schema.json`, and the `facia/fixtures` and
`facia/tests` trees at that commit. A branch name is not the pin; the full
40-character commit above is.

The ratified local design is `docs/facia-v2-design.md` at Facia commit
`487a337642d6c149377102561cc2fadb5bf0a353`. This contract closes details that
the design intentionally left for contract extraction.

## Closed v1-to-v2 delta ledger

Every reviewed change from the imported v1 contract is listed here.

| Area | Imported v1 | Ratified v2 |
|---|---|---|
| Contract identity | `facia.answer-set/1`; density required | `facia.answer-set/2`; density optional |
| Roles | `value`, `verdict`, `transform` | `value`, `verdict`, `operation`, `convergence` |
| Retired words | `Transform`, `transform`; older Facia prose also used `transition` | Both `transform` and `transition` are forbidden contract vocabulary; there is no alias |
| Change record | `TransformV1` | `OperationV2`, preserving operation/input/output/before/after/evidence semantics |
| Convergence | Missing | `ConvergenceV2`, with required direct or history provenance as specified below |
| Item payload | No single field-addressable object | Every item has exactly one required `payload` object; this is the only field-addressable domain data |
| Field information | Missing | Optional item-local `fields` with four priority buckets and closed promotion rules |
| Disclosure | Not modeled | Consumer-owned `ResolveContext.depth`; never stored in an AnswerSet |
| Density | Required producer scalar | Optional declared scalar; otherwise derived from item-local fields; otherwise absent |
| Trace | Unconstrained `unknown` | Closed `DirectTraceV2` / `HistoryTraceV2` union containing closed records and JSON values |
| JSON values | TypeScript/schema accepted arbitrary runtime values | Recursive JSON values only: null, boolean, finite number, string, array, or string-keyed object |
| Object closure | Some values and nested objects remained open | Every contract object is closed; JSON domain objects alone have arbitrary string keys whose values are JSON values |
| Shapes | Prose said nine and v1 had three singular roles | Ten explicit v2 outcomes: four singular roles, collection, dimension, group, and three sequences |
| Validation | Hand validation and schema partially overlapped | Canonical schema owns structure; deterministic runtime checks own referential and other semantic invariants |
| Package model | `FaciaSurface` prototype coexisted locally | AnswerSet-to-recipe is the only supported package contract; no compatibility layer |

All unchanged v1 facts remain deliberate: the two paths, two inspection states,
three structures, three sequence kinds, non-empty items, complete operation
descriptors, unique operation ids, exact actionability, and the legacy and
bounded verdict variants.

## Notation and closure rules

- **Required** means the property must be an own enumerable JSON member.
- **Optional** means it may be absent. `undefined`, holes, symbols, bigint,
  functions, non-finite numbers, class instances, maps, sets, and cyclic values
  are not JSON values and are invalid rather than silently normalized.
- Every object table below has `additionalProperties: false` unless the table
  explicitly says **JSON object**. A JSON object permits arbitrary string keys,
  but every value recursively satisfies `JsonValue`.
- A forbidden member is invalid even when its value is `null`. In particular,
  no object may carry `transform` or `transition` merely as ignored metadata.
- Strings marked non-empty have `minLength: 1`. Arrays marked non-empty have
  `minItems: 1`.
- `JsonNumber` is a finite JSON number. Runtime validation rejects `NaN` and
  positive/negative infinity before semantic resolution.
- Validation of an arbitrary JavaScript input begins with the guarded JSON
  preflight defined below. JSON Schema is never asked to traverse a value that
  failed that preflight.

## JSON values

`JsonValue = null | boolean | JsonNumber | string | JsonValue[] | JsonObject`.

| Object | Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|---|
| `JsonObject` | none | any string key mapped to `JsonValue` | keys `transform` and `transition`; keys whose values are not `JsonValue`; prototype/inherited members are not serialized members | allowed except the two forbidden property names, values constrained to `JsonValue` |

JSON arrays are ordered and may be empty. JSON objects do not carry ordering
semantics except where an enclosing contract represents order with an array.
The two retired vocabulary keys are forbidden recursively in JSON objects as
well as in contract objects, so the schema requirement to reject them
everywhere is literal.

## AnswerSetV2 envelope

| Member | Required | Type and rule |
|---|---:|---|
| `schema` | yes | literal `"facia.answer-set/2"` |
| `question` | yes | non-empty string |
| `answerType` | yes | `"value" | "verdict" | "operation" | "convergence"` |
| `path` | yes | `"meaning" | "execution"` |
| `inspection` | yes | `"none" | "available"` |
| `actionable` | yes | boolean |
| `items` | yes | non-empty array; every item is the role branch selected by `answerType` |
| `operations` | yes | ordered array of `OperationDescriptorV2` |
| `structure` | no | `"dimension" | "group" | "sequence"` |
| `sequenceKind` | no | `"temporal" | "dependency" | "trace"` |
| `trace` | no | `DirectTraceV2 | HistoryTraceV2` |
| `density` | no | integer literal `1 | 2 | 3` |

The envelope is closed. `fields`, `depth`, `audience`, `transform`, and
`transition` are forbidden at the envelope. `fields` is item-local; depth and
audience belong to `ResolveContext`.

## The one-payload and field-scoping rule

Every item has exactly one required top-level member named `payload`, typed as
`JsonObject`. It is the item's sole domain-payload object for field information.
Role members such as `value`, `finding`, `input`, `output`, `state`, and
`evidence` retain answer semantics but are not field-addressable. There is no
fallback from `payload` to the item envelope and no implicit merging of those
members into `payload`.

Each item may carry its own `fields`. A rule on item index `i` is evaluated only
against `items[i].payload`; it never applies to every item and cannot reference
another item's payload. This explicit item ownership is normative.

A field key is a non-empty top-level property name in that same payload. It may
not contain `.`. Thus `owner` is admissible when it is an own key of the scoped
payload; `owner.name`, `items.0.owner`, an envelope key such as `question`, a
nested-only key, and a key present only on a different item are invalid. Empty
keys are invalid even if JSON would otherwise permit them.

## Role-specific item contracts

### ValueAnswerV2

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `type: "Value"`, `payload: JsonObject`, `value: JsonValue` | `evidence: JsonValue`, `fields: FieldInfoV2` | every Verdict, Operation, or Convergence member; `transform`; `transition` | false |

`value` may be scalar, array, or object. `payload` remains required even for a
scalar value so field projection has one stable target; it may be `{}` when no
field information is declared.

### LegacyBooleanVerdictV0

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `type: "Verdict"`, `contract: "LegacyBooleanVerdictV0"`, `payload: JsonObject`, `conforms: boolean` | `finding`, `reason`, `expected`, `actual`, `evidence`: each `JsonValue`; `fields: FieldInfoV2` | `state`; every Operation/Convergence member; `transform`; `transition` | false |

### BoundedVerdictV1

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `type: "Verdict"`, `contract: "BoundedVerdictV1"`, `payload: JsonObject`, `state: non-empty string` | `conforms: boolean`; `finding`, `reason`, `expected`, `actual`, `evidence`: each `JsonValue`; `fields: FieldInfoV2` | every Operation/Convergence member; `transform`; `transition` | false |

`conforms` is not derived from `state` in either direction. Verdict state names
do not imply convergence.

### OperationV2

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `type: "Operation"`, `payload: JsonObject`, `operation: OperationRecordV2`, `input: JsonValue`, `output: JsonValue` | `before`, `after`, `evidence`: each `JsonValue`; `fields: FieldInfoV2` | `type: "Transform"`; every Verdict/Convergence member; `transform`; `transition` | false |

`OperationRecordV2` is closed:

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `id: non-empty string`, `name: non-empty string` | none | all unlisted members, including executable code | false |

An Operation item is a record of an offered or enacted change. It is never
execution authority.

### ConvergenceV2

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `type: "Convergence"`, `payload: JsonObject`, `state`: one of `converging`, `diverging`, `stalled`, `reached` | `goal`, `from`, `to`, `evidence`: each `JsonValue`; `fields: FieldInfoV2` | every Verdict/Operation member; `transform`; `transition` | false |

The state names describe the trajectory only. Domain truth, goal evaluation,
and operation choice are producer responsibilities. Provenance is on the
AnswerSet envelope so a single trace can explain the answer as a whole.

## OperationDescriptorV2

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `id: non-empty string`, `label: non-empty string`, `invocation`: one of `model-operation`, `host-callback`; `reference: non-empty string` | `inputSchema: JsonObject`, `confirmation: non-empty string` | callbacks, functions, executable bodies, and all unlisted members | false |

Descriptor order is significant and is preserved one-to-one in action
affordances. `inputSchema` is data; Facia neither compiles nor executes it.

## FieldInfoV2 and promotion

`FieldInfoV2` is closed:

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `priority: FieldPriorityV2` | `promotion: PromotionRuleV2[]` | all unlisted members | false |

`FieldPriorityV2` is closed and requires all four members:

| Member | Type |
|---|---|
| `primary` | ordered array of `FieldKey` |
| `secondary` | ordered array of `FieldKey` |
| `supporting` | ordered array of `FieldKey` |
| `audit` | ordered array of `FieldKey` |

`FieldKey` is a non-empty string without `.`. Each priority array has unique
items structurally. A key may occur in exactly one declared bucket; cross-bucket
duplicates are a semantic error. Omitting a payload key from all buckets is
valid and means it is not projected, but such a key may not be named by
`PromotionRuleV2.promote`. Every promotion target must already have exactly one
declared priority so recipe `declaredPriority` is always defined.

`PromotionRuleV2` is closed:

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `when: PromotionConditionV2`, `promote: non-empty ordered unique FieldKey[]` | none | all unlisted members | false |

`PromotionConditionV2` is exactly one of these three closed shapes:

| Condition | Required members | Forbidden members | Meaning |
|---|---|---|---|
| equals | `field: FieldKey`, `equals: JsonValue` | `isFalse`, `isNonEmpty`, all others | strict JSON structural equality with the payload value |
| false | `field: FieldKey`, `isFalse: true` | `equals`, `isNonEmpty`, all others | payload value is boolean `false` |
| non-empty | `field: FieldKey`, `isNonEmpty: true` | `equals`, `isFalse`, all others | non-empty string, array, or object; numbers, booleans, and null never match |

Zero condition operators and multiple condition operators are structurally
invalid. Rules evaluate independently, in declared order, against their owning
item. Matching rules raise every named field to effective `primary`; they do
not move or delete declarations. A field promoted by multiple rules is emitted
once. Visible ordering is stable: declared primary fields first, then promoted
fields in rule order and each rule's `promote` order, then unpromoted fields in
their declared bucket order. Recipe metadata retains both declared and
effective priority and the zero-based indices of matching promotion rules.

Disclosure is cumulative over effective priority:

| Depth | Visible effective priorities |
|---|---|
| `glance` | primary |
| `inspect` | primary, secondary |
| `focus` | primary, secondary, supporting |
| `audit` | primary, secondary, supporting, audit |

## Trace and history records

The envelope `trace` is a closed discriminated union.

### DirectTraceV2

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `kind: "direct"`, `id: non-empty string`, `entries: non-empty TraceEntryV2[]` | none | `records` and all unlisted members | false |

### TraceEntryV2

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `step: non-empty string`, `value: JsonValue` | none | all unlisted members | false |

Entry order is the trace order. Facia does not interpret `step` names.

### HistoryTraceV2

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `kind: "history"`, `records: non-empty HistoryRecordV2[]` | none | `id`, `entries`, and all unlisted members | false |

### HistoryRecordV2

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `itemIndex: integer >= 0`, `trace: DirectTraceV2` | none | all unlisted members | false |

A qualifying history has one record for every item, in item order:
`records.length === items.length` and `records[i].itemIndex === i`. This rule
simultaneously gives uniqueness, coverage, bounds, and deterministic order.

For `answerType: "convergence"`, provenance is valid in exactly one of these
forms:

1. Singular: one item, no structure or sequence kind, and a `DirectTraceV2`.
2. History: two or more items, `structure: "sequence"`,
   `sequenceKind: "trace"`, and a qualifying `HistoryTraceV2`.

A convergence answer in any other topology, with no trace, or with the wrong
trace discriminator is semantically invalid. Non-convergence answers may carry
either trace form as provenance; the history cardinality/order rule still
applies whenever `kind` is `history`.

## Density

A declared envelope `density` is authoritative and is never compared with or
recomputed from fields. When it is absent, collect every item that has `fields`
and count that item's **declared** `priority.primary` keys before promotion.
The AnswerSet's derived count is the maximum of those item counts:

- maximum 0 or 1 -> density 1;
- maximum 2 or 3 -> density 2;
- maximum 4 or more -> density 3.

Using the maximum preserves item-local meaning and prevents item count from
inflating density. If no item has `fields`, density remains absent. Promotion,
secondary/supporting/audit fields, and disclosure depth never affect density.

## Structural and semantic validation ownership

Validation is a three-phase boundary: guarded JavaScript-to-JSON preflight,
canonical JSON Schema, then runtime semantics. A phase runs only if the prior
phase succeeded. Every phase is total, catches inspection/validator failures,
and does not mutate input.

### Guarded JSON preflight ownership

Preflight walks without invoking accessors: it inspects own property
descriptors, accepts arrays and plain objects whose prototype is
`Object.prototype` or `null`, and reads only descriptor `value` slots. Array
indices are visited ascending; plain-object string keys use JavaScript's
`Object.keys` order. Symbol keys are forbidden. A proxy trap or reflection
operation that throws is caught at the object currently being inspected.

Preflight emits these stable codes at the first offending location and stops:

| Code | Condition and location |
|---|---|
| `JSON_INSPECTION_FAILED` | reflection/proxy inspection threw; current object path |
| `JSON_ACCESSOR_FORBIDDEN` | own getter or setter; property path, without invocation |
| `JSON_SYMBOL_KEY_FORBIDDEN` | own symbol key; current object path |
| `JSON_NON_PLAIN_OBJECT` | class instance, Date, Map, Set, typed array, or other non-plain prototype; value path |
| `JSON_CYCLE` | object/array is already on the active ancestor stack; repeated value path |
| `JSON_ARRAY_HOLE` | missing array index below `length`; missing index path |
| `JSON_VALUE_UNSUPPORTED` | `undefined`, bigint, symbol, function, or other non-JSON primitive; value path |
| `JSON_NUMBER_NON_FINITE` | `NaN` or positive/negative infinity; value path |
| `JSON_DEPTH_EXCEEDED` | container nesting deeper than the supported bound; deepest inspected container path |

Shared acyclic references are valid because JSON serialization duplicates
them; only an active-ancestor repeat is a cycle. Paths use `$`, dot notation
for contract-safe property names, bracketed JSON string notation otherwise,
and numeric brackets for arrays.

### JSON Schema structural ownership

The schema owns all of the following, without semantic reinterpretation:

1. The preflighted root is an object rather than an array and every reachable
   contract/domain value conforms to its `JsonValue` schema definition.
2. Exact schema literal, required envelope members, non-empty question/items,
   closed enums, density literals, and closure of every contract object.
3. `answerType` selects the matching item branch and all items match it.
4. Required, optional, and forbidden role members, including the two verdict
   contracts and the retired `Transform`/`transform`/`transition` vocabulary.
5. Complete operation descriptors and operation records.
6. Singular answers forbid both `structure` and `sequenceKind`.
7. `sequenceKind` is required exactly when `structure` is `sequence` and is
   forbidden otherwise.
8. `actionable: true` requires at least one operation; `false` requires none.
9. FieldInfo, all four priority arrays, key syntax, within-array uniqueness,
   non-empty unique `promote`, and exactly one well-formed condition operator.
10. Direct/history trace discriminators, record shapes, non-empty entries and
    records, and non-negative integer history indices.

Schema-library diagnostics are not public diagnostics. Facia normalizes and
deduplicates them into the following exhaustive structural codes; no raw schema
keyword or library message escapes the boundary:

| Rank | Code | Structural condition and public location |
|---:|---|---|
| 1 | `INVALID_ANSWER_SET` | root is not a non-array object; `$` |
| 2 | `ANSWER_SET_SCHEMA_UNSUPPORTED` | missing/wrong schema literal; `$.schema` |
| 3 | `REQUIRED_MEMBER_MISSING` | required member absent; path where that member would occur |
| 4 | `RETIRED_MEMBER` | any `transform` or `transition` property, or `type: "Transform"`; exact property/type path |
| 5 | `FIELDS_SCOPE_INVALID` | `fields` appears on the AnswerSet envelope rather than an item; `$.fields` |
| 6 | `UNKNOWN_MEMBER` | any other property violates object closure; exact property path |
| 7 | `INVALID_ENUM_VALUE` | closed enum/const other than schema, role, or retired type; exact value path |
| 8 | `INVALID_STRING_VALUE` | required non-empty string is empty or non-string; exact value path |
| 9 | `INVALID_INTEGER_VALUE` | density/history integer rule fails; exact value path |
| 10 | `ANSWER_SET_EMPTY_ITEMS` | `items` is not an array or is empty; `$.items` |
| 11 | `ANSWER_KIND_MISMATCH` | invalid `answerType`, item type/contract, or role-selected item branch; offending `$.answerType` or `$.items[i]` |
| 12 | `INVALID_OPERATION_DESCRIPTOR` | `operations` is not an array or a descriptor/operation record is incomplete or malformed; narrowest offending path |
| 13 | `INVALID_FIELD_INFO` | fields, priority, key, or promotion container shape is malformed; narrowest offending path |
| 14 | `INVALID_PROMOTION_CONDITION` | condition has zero/multiple operators or an invalid operator value; `$.items[i].fields.promotion[r].when` or narrower |
| 15 | `INVALID_TRACE` | trace discriminator, entry, history record, or trace container shape is malformed; narrowest offending path |
| 16 | `SINGULAR_STRUCTURE_FORBIDDEN` | singular item carries structure or sequence kind; `$.structure` if present, otherwise `$.sequenceKind` |
| 17 | `SEQUENCE_KIND_REQUIRED` | sequence has no valid sequence kind; `$.sequenceKind` |
| 18 | `SEQUENCE_KIND_FORBIDDEN` | non-sequence carries sequence kind; `$.sequenceKind` |
| 19 | `ACTIONABILITY_MISMATCH` | actionable does not equal `operations.length > 0`; `$.actionable` |

If one low-level failure could map to several rows, the most specific named
condition wins (for example, retired and envelope-fields members do not become
`UNKNOWN_MEMBER`). Results are sorted by rank, then by document location:
contract members use the table order in this document, array indices compare
numerically, and unlisted JSON-object keys compare by Unicode code point.
Duplicate `{code, path}` pairs collapse to one error with fixed code-specific
meaning. The public machine contract is `{ code, path }`; implementations also
emit a human `message` paraphrasing the applicable condition above and may emit
a JSON-only `context` object, but message prose and optional context are
diagnostic rather than decision inputs and fixtures must not branch on them.
This policy is independent of the schema library's traversal order.

### Runtime semantic ownership and stable order

After schema success, runtime checks these invariants in this exact order:

1. `DUPLICATE_OPERATION_ID`: operation ids are unique; location is the later
   duplicate's `$.operations[n].id`.
2. `FIELD_PRIORITY_DUPLICATE`: a field appears in more than one declared
   priority bucket on an item; location is the later occurrence.
3. `PROMOTION_TARGET_UNDECLARED`: a promotion target occurs in no declared
   priority bucket; location is the target in `promote`.
4. Field references are classified by the algorithm below, producing one of
   `FIELD_REFERENCE_DOTTED`, `FIELD_REFERENCE_ENVELOPE`,
   `FIELD_REFERENCE_NESTED`, `FIELD_REFERENCE_WRONG_ITEM`, or
   `FIELD_REFERENCE_MISSING` at the exact priority/`when.field`/`promote`
   string location.
5. `TRACE_HISTORY_CARDINALITY`: a history record count differs from item count.
6. `TRACE_HISTORY_INDEX`: records are not in exact zero-based item order.
7. `CONVERGENCE_PROVENANCE_REQUIRED`: convergence has neither the qualifying
   singular direct form nor qualifying trace-sequence history form.

Field-reference classification is deterministic. A key containing `.` is
`DOTTED`. Otherwise an own top-level key of the owning payload is valid. If
absent there, a key matching an AnswerSet or current-item member outside
`payload` is `ENVELOPE`; a key found only below the owning payload's top level
is `NESTED`; a top-level key found only in another item's payload is
`WRONG_ITEM`; and all other keys are `MISSING`. That precedence applies even
when more than one invalid category could describe the same spelling.

Actionability/operation count, role alignment, singular structure, and exact
sequence coupling are schema-expressible and therefore structurally owned and
map to the codes above; runtime must not apply a contradictory second rule.
Operation id uniqueness, payload references,
cross-bucket uniqueness, history-to-item correspondence, and convergence
topology require instance-wide comparison and are semantic.

History validation applies to any history trace before convergence validation,
so an invalid convergence history reports its specific history error as well as
the final provenance error under the all-errors policy.

## Resolve context

`ResolveContext` is a closed consumer-owned object:

| Required members | Optional members | Forbidden members | Additional properties |
|---|---|---|---|
| `depth`: one of `glance`, `inspect`, `focus`, `audit` | `audience: non-empty string` | callbacks, renderer objects, style/CSS, all unlisted members | false |

When absent, `audience` resolves to the semantic identifier `"human"`. It does
not alter validation, field projection, density, shape, pattern, affordance, or
component selection in v2; recipes may carry the resolved identifier as data.
Making audience a decision discriminator is a future versioned contract change.

## Normative ten-shape resolution

The design's phrase “nine shapes” is a counting error. The four singular roles
plus six non-singular branches yield these ten and only these ten shapes:

1. `singular-value`
2. `singular-verdict`
3. `singular-operation`
4. `singular-convergence`
5. `collection`
6. `dimension`
7. `group`
8. `temporal-sequence`
9. `dependency-sequence`
10. `trace-sequence`

Branch precedence is normative: (1) one item resolves to its singular role,
(2) multiple items without structure resolve to collection, (3) a sequence
resolves by `sequenceKind`, and only then (4) dimension or group resolves by
`structure`. No ninth-shape compatibility interpretation is permitted.

## Downstream implementation constraints

- The TypeScript union, canonical schema, fixtures, and validator must encode
  these exact tables. No index signature may reopen a closed object.
- Structural fixtures must pass/fail identically through direct schema
  validation and the structural phase of `validateAnswerSet`.
- Resolver manifests must explicitly cover density 1/2/3/absent, all four
  depths, all ten shapes, all four roles, both actionability states, and any
  additional discriminator they use. Fallbacks are manifest rows, not code-only
  defaults.
- Promotion, disclosure, density, shapes, patterns, affordances, and recipes are
  pure, deterministic, non-mutating, renderer-neutral data transformations.
- Operation descriptors map one-to-one, in order, to action affordances. Facia
  never invents, drops, reinterprets, or executes them.
- Recipes contain only JSON values and semantic identifiers—never functions,
  framework components, CSS, Domain/kernel objects, or executable operations.
- The package has no runtime dependency on Libera, Domain, Strategy, kernel,
  renderers, or applications.

This gate contains no deferred contract decision. A future change to any table,
scope, invariant owner, density rule, trace form, or shape is a versioned
contract change and requires this artifact and the canonical schema to be
ratified together.
