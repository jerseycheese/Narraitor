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
 */
export function validateFields<T>(rules: FieldValidationRules<T>): Validator<T> {
  return (data: T): WizardValidation => {
    const errors: string[] = [];
    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      if (!Array.isArray(fieldRules)) continue;
      const value = data[fieldName as keyof T];
      errors.push(...applyRules(value, fieldRules as ValidationRule<unknown>[]));
    }
    return { valid: errors.length === 0, errors, touched: true };
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

export const createValidationRules = {
  required: <T>(message: string = 'This field is required'): ValidationRule<T> => ({
    validate: (value: T) => value !== undefined && value !== null && value !== '',
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
