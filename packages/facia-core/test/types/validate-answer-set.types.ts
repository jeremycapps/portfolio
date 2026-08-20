import { validateAnswerSet } from "../../src/index.js";
import type {
  AnswerSetV2,
  ValidationError,
  ValidationResult,
} from "../../src/index.js";

declare const input: unknown;

const result: ValidationResult = validateAnswerSet(input);

if (result.valid) {
  const validated: AnswerSetV2 = result.value;
  const exactSchema: "facia.answer-set/2" = validated.schema;
  void exactSchema;

  // @ts-expect-error successful validation does not expose failure errors
  result.errors;
} else {
  const firstError: ValidationError = result.errors[0];
  const stableCode = firstError.code;
  const jsonLocation: string = firstError.path;
  void stableCode;
  void jsonLocation;

  // @ts-expect-error failed validation does not expose unvalidated data
  result.value;
}
