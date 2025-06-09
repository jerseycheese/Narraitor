import { WizardValidation } from '@/hooks/useWizardState';

export type ValidationRule<T = unknown> = {
  validate: (value: T) => boolean;
  message: string;
  required?: boolean;
};

export type FieldValidationRules<T = unknown> = {
  [K in keyof T]?: ValidationRule<T[K]>[];
};

export interface WizardStepValidatorConfig<T = unknown> {
  rules: FieldValidationRules<T>;
  customValidator?: (data: T) => WizardValidation;
}

export class WizardStepValidator<T = unknown> {
  private rules: FieldValidationRules<T>;
  private customValidator?: (data: T) => WizardValidation;

  constructor(config: WizardStepValidatorConfig<T>) {
    this.rules = config.rules;
    this.customValidator = config.customValidator;
  }

  validate(data: T): WizardValidation {
    const errors: string[] = [];

    // Run field-level validation rules
    for (const [fieldName, fieldRules] of Object.entries(this.rules)) {
      const fieldValue = data[fieldName as keyof T];
      
      if (fieldRules && Array.isArray(fieldRules)) {
        for (const rule of fieldRules) {
          // Check required fields
          if (rule.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
            errors.push(rule.message);
            continue;
          }

          // Skip validation if field is empty and not required
          if (!rule.required && (fieldValue === undefined || fieldValue === null || fieldValue === '')) {
            continue;
          }

          // Run validation
          if (!rule.validate(fieldValue)) {
            errors.push(rule.message);
          }
        }
      }
    }

    // Run custom validation if provided
    if (this.customValidator) {
      const customResult = this.customValidator(data);
      if (!customResult.valid) {
        errors.push(...customResult.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      touched: true,
    };
  }

  validateField<K extends keyof T>(fieldName: K, value: T[K]): WizardValidation {
    const fieldRules = this.rules[fieldName];
    const errors: string[] = [];

    if (fieldRules && Array.isArray(fieldRules)) {
      for (const rule of fieldRules) {
        // Check required fields
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors.push(rule.message);
          continue;
        }

        // Skip validation if field is empty and not required
        if (!rule.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Run validation
        if (!rule.validate(value)) {
          errors.push(rule.message);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      touched: true,
    };
  }
}

// Common validation rules factory
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

// Wizard step validator builder for common patterns
export class WizardStepValidatorBuilder<T = unknown> {
  private rules: FieldValidationRules<T> = {};
  private customValidator?: (data: T) => WizardValidation;

  field<K extends keyof T>(fieldName: K): FieldValidatorBuilder<T, K> {
    return new FieldValidatorBuilder<T, K>(this, fieldName);
  }

  customValidation(validator: (data: T) => WizardValidation): this {
    this.customValidator = validator;
    return this;
  }

  build(): WizardStepValidator<T> {
    return new WizardStepValidator<T>({
      rules: this.rules,
      customValidator: this.customValidator,
    });
  }

  internal_addRule<K extends keyof T>(fieldName: K, rule: ValidationRule<T[K]>): void {
    if (!this.rules[fieldName]) {
      this.rules[fieldName] = [];
    }
    this.rules[fieldName]!.push(rule);
  }
}

class FieldValidatorBuilder<T, K extends keyof T> {
  constructor(
    private parent: WizardStepValidatorBuilder<T>,
    private fieldName: K
  ) {}

  required(message?: string): this {
    this.parent.internal_addRule(this.fieldName, createValidationRules.required<T[K]>(message));
    return this;
  }

  minLength(min: number, message?: string): this {
    this.parent.internal_addRule(this.fieldName, createValidationRules.minLength(min, message) as ValidationRule<T[K]>);
    return this;
  }

  maxLength(max: number, message?: string): this {
    this.parent.internal_addRule(this.fieldName, createValidationRules.maxLength(max, message) as ValidationRule<T[K]>);
    return this;
  }

  minValue(min: number, message?: string): this {
    this.parent.internal_addRule(this.fieldName, createValidationRules.minValue(min, message) as ValidationRule<T[K]>);
    return this;
  }

  maxValue(max: number, message?: string): this {
    this.parent.internal_addRule(this.fieldName, createValidationRules.maxValue(max, message) as ValidationRule<T[K]>);
    return this;
  }

  pattern(regex: RegExp, message: string): this {
    this.parent.internal_addRule(this.fieldName, createValidationRules.pattern(regex, message) as ValidationRule<T[K]>);
    return this;
  }

  arrayMinLength(min: number, message?: string): this {
    this.parent.internal_addRule(this.fieldName, createValidationRules.arrayMinLength(min, message) as ValidationRule<T[K]>);
    return this;
  }

  arrayMaxLength(max: number, message?: string): this {
    this.parent.internal_addRule(this.fieldName, createValidationRules.arrayMaxLength(max, message) as ValidationRule<T[K]>);
    return this;
  }

  custom(validate: (value: T[K]) => boolean, message: string): this {
    this.parent.internal_addRule(this.fieldName, createValidationRules.custom(validate, message));
    return this;
  }

  field<K2 extends keyof T>(fieldName: K2): FieldValidatorBuilder<T, K2> {
    return this.parent.field(fieldName);
  }

  customValidation(validator: (data: T) => WizardValidation): WizardStepValidatorBuilder<T> {
    return this.parent.customValidation(validator);
  }

  build(): WizardStepValidator<T> {
    return this.parent.build();
  }
}

// Factory function for creating validator builders
export function createWizardValidator<T = unknown>(): WizardStepValidatorBuilder<T> {
  return new WizardStepValidatorBuilder<T>();
}