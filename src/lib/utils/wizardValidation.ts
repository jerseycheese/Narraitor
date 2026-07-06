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
 * Run multiple validators against the same data; concatenate their errors.
 */
export function combineValidators<T>(...validators: Validator<T>[]): Validator<T> {
  return (data: T): WizardValidation => {
    const errors: string[] = [];
    for (const v of validators) {
      const result = v(data);
      if (!result.valid) errors.push(...result.errors);
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

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || value.length >= min,
    message: message || `Must be at least ${min} characters`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value: string) => !value || value.length <= max,
    message: message || `Must be at most ${max} characters`,
  }),

  minValue: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value >= min,
    message: message || `Must be at least ${min}`,
  }),

  maxValue: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value: number) => value <= max,
    message: message || `Must be at most ${max}`,
  }),

  pattern: (regex: RegExp, message: string): ValidationRule<string> => ({
    validate: (value: string) => !value || regex.test(value),
    message,
  }),

  arrayMinLength: <T>(min: number, message?: string): ValidationRule<T[]> => ({
    validate: (value: T[]) => !value || value.length >= min,
    message: message || `Must have at least ${min} items`,
  }),

  arrayMaxLength: <T>(max: number, message?: string): ValidationRule<T[]> => ({
    validate: (value: T[]) => !value || value.length <= max,
    message: message || `Must have at most ${max} items`,
  }),

  custom: <T>(
    validate: (value: T) => boolean,
    message: string
  ): ValidationRule<T> => ({
    validate,
    message,
  }),
};
