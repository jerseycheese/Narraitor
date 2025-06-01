export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FieldValidation {
  field: string;
  error: string | null;
}

// Type for unknown values that need validation
type UnknownValue = unknown;

// Common validation functions
export const validators = {
  required: (value: UnknownValue, fieldName: string = 'Field'): string | null => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return `${fieldName} is required`;
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string = 'Field'): string | null => {
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string = 'Field'): string | null => {
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return null;
  },

  pattern: (value: string, pattern: RegExp, message: string): string | null => {
    if (!pattern.test(value)) {
      return message;
    }
    return null;
  },

  unique: <T>(value: T, existingValues: T[], fieldName: string = 'Value'): string | null => {
    if (existingValues.includes(value)) {
      return `${fieldName} already exists`;
    }
    return null;
  },

  range: (value: number, min: number, max: number, fieldName: string = 'Value'): string | null => {
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  },

  custom: <T>(value: T, validator: (value: T) => boolean, message: string): string | null => {
    if (!validator(value)) {
      return message;
    }
    return null;
  },
};

// Combine multiple validations
export function validateField<T>(
  value: T,
  validations: Array<(value: T) => string | null>
): string | null {
  for (const validation of validations) {
    const error = validation(value);
    if (error) return error;
  }
  return null;
}

// Validate multiple fields
export function validateFields<T = UnknownValue>(
  fields: Array<{
    name: string;
    value: T;
    validations: Array<(value: T) => string | null>;
  }>
): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const field of fields) {
    const error = validateField(field.value, field.validations);
    if (error) {
      errors[field.name] = error;
    }
  }
  
  return errors;
}

// Convert field errors to validation result
export function createValidationResult(errors: Record<string, string>): ValidationResult {
  const errorMessages = Object.values(errors);
  return {
    valid: errorMessages.length === 0,
    errors: errorMessages,
  };
}

// Common validation patterns
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  noSpecialChars: /^[a-zA-Z0-9\s\-_]+$/,
};