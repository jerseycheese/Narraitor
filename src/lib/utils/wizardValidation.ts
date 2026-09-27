import { WizardValidation } from '@/hooks/useWizardState';

export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean;
  message: string;
  required?: boolean;
};

export type FieldValidationRules<T = unknown> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export type Validator<T> = (data: T) => WizardValidation;

const isEmpty = (value: unknown): boolean =>
  value === undefined || value === null || value === '';

function applyRules<V>(value: V, rules: ValidationRule<V>[]): string[] {
  const errors: string[] = [];
  for (const rule of rules) {
    if (rule.required && isEmpty(value)) {
      errors.push(rule.message);
      continue;
    }
    if (!rule.required && isEmpty(value)) continue;
    if (!rule.validate(value)) errors.push(rule.message);
  }
  return errors;
}

/**
 * Build a validator from per-field rule arrays.
 *
 * Alongside the flat `errors` list, the result carries `fieldErrors` (first
 * error message per invalid field name), so callers can show a field's error
 * only once that field has been touched rather than all at once.
 */
export function validateFields<T>(rules: FieldValidationRules<T>): Validator<T> {
  return (data: T): WizardValidation => {
    const errors: string[] = [];
    const fieldErrors: Record<string, string> = {};
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      if (!Array.isArray(fieldRules)) continue;
      const value = data[fieldName as keyof T];
      const fieldErrorList = applyRules(value, fieldRules as ValidationRule<unknown>[]);
      if (fieldErrorList.length > 0) {
        fieldErrors[fieldName] = fieldErrorList[0];
      }
      errors.push(...fieldErrorList);
    }
    return { valid: errors.length === 0, errors, touched: true, fieldErrors };
  };
}

/**
 * A validator that always passes — useful for steps with no validation.
 */
export const alwaysValid: Validator<unknown> = () => ({
  valid: true,
  errors: [],
  touched: true,
});

/**
 * Picks which of a step's validation errors should actually be shown.
 *
 * - No validation, or a valid step: nothing to show.
 * - The step was attempted (the player pressed Next/Create while invalid):
 *   show every error for the step.
 * - The validator didn't provide `fieldErrors` (older/holistic validators
 *   that don't validate a single named field): fall back to the previous
 *   behavior of showing all errors once `touched`.
 * - Otherwise: show only the errors for fields the player has touched.
 */
export function getVisibleFieldErrorMessages(
  validation: WizardValidation | undefined,
  touchedFields: Set<string> | undefined,
  stepAttempted: boolean
): string[] {
  if (!validation || validation.valid) return [];

  if (!validation.fieldErrors) {
    return validation.touched ? validation.errors : [];
  }

  if (stepAttempted) {
    return Object.values(validation.fieldErrors);
  }

  return Object.entries(validation.fieldErrors)
    .filter(([field]) => touchedFields?.has(field))
    .map(([, message]) => message);
}

/** Same as {@link getVisibleFieldErrorMessages}, joined into one banner string. */
export function getVisibleStepError(
  validation: WizardValidation | undefined,
  touchedFields: Set<string> | undefined,
  stepAttempted: boolean
): string | undefined {
  const visible = getVisibleFieldErrorMessages(validation, touchedFields, stepAttempted);
  return visible.length > 0 ? visible.join(', ') : undefined;
}

export const createValidationRules = {
  required: <T>(message: string = 'This field is required'): ValidationRule<T> => ({
    // Whitespace-only strings count as missing: persisted wizard state is
    // untrusted, and a blank-looking value must not advance a step.
    validate: (value: T) =>
      value !== undefined &&
      value !== null &&
      value !== '' &&
      !(typeof value === 'string' && value.trim() === ''),
    message,
    required: true,
  }),

  // Optional-tolerant value type so these drop into both `string` and
  // `string | undefined` rule arrays without a cast at the call site.
  minLength: (min: number, message?: string): ValidationRule<string | undefined> => ({
    validate: (value) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string | undefined> => ({
    validate: (value) => !value || value.length <= max,
    message: message || `Must be at most ${max} characters`,
  }),

  custom: <T>(
    validate: (value: T) => boolean,
    message: string
  ): ValidationRule<T> => ({
    validate,
    message,
  }),
};
