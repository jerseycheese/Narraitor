export interface ValidationResult {
  valid: boolean;
  errors: string[];
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
