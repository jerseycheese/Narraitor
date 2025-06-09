/**
 * Built-in validator functions for common validation patterns
 * Consolidates validation logic from across the application
 */

import { Validator, ValidationContext, BuiltInValidatorConfig } from './types';

/**
 * Core validator functions
 */
export const validators = {
  /**
   * Validates that a value is not null, undefined, or empty
   */
  required: (fieldName: string = 'Field'): Validator => (value) => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName} is required`;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return `${fieldName} is required`;
    }
    if (Array.isArray(value) && value.length === 0) {
      return `${fieldName} is required`;
    }
    return null;
  },

  /**
   * Validates minimum string length
   */
  minLength: (min: number, fieldName: string = 'Field'): Validator<string> => (value) => {
    if (typeof value !== 'string') return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  /**
   * Validates maximum string length
   */
  maxLength: (max: number, fieldName: string = 'Field'): Validator<string> => (value) => {
    if (typeof value !== 'string') return null;
    if (value.length > max) {
      return `${fieldName} must be no more than ${max} characters`;
    }
    return null;
  },

  /**
   * Validates string against a regular expression pattern
   */
  pattern: (pattern: RegExp, message: string): Validator<string> => (value) => {
    if (typeof value !== 'string') return null;
    if (!pattern.test(value)) {
      return message;
    }
    return null;
  },

  /**
   * Validates email format
   */
  email: (fieldName: string = 'Email'): Validator<string> => (value) => {
    if (typeof value !== 'string') return null;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(value)) {
      return `${fieldName} must be a valid email address`;
    }
    return null;
  },

  /**
   * Validates that a value is unique in a list
   */
  unique: <T>(existingValues: T[], fieldName: string = 'Value', currentValue?: T): Validator<T> => (value) => {
    // If this is an update and the value hasn't changed, it's valid
    if (currentValue !== undefined && value === currentValue) {
      return null;
    }
    
    if (existingValues.includes(value)) {
      return `${fieldName} already exists`;
    }
    return null;
  },

  /**
   * Validates numeric range
   */
  range: (min: number, max: number, fieldName: string = 'Value'): Validator<number> => (value) => {
    if (typeof value !== 'number') return null;
    if (value < min || value > max) {
      return `${fieldName} must be between ${min} and ${max}`;
    }
    return null;
  },

  /**
   * Validates minimum numeric value
   */
  min: (min: number, fieldName: string = 'Value'): Validator<number> => (value) => {
    if (typeof value !== 'number') return null;
    if (value < min) {
      return `${fieldName} must be at least ${min}`;
    }
    return null;
  },

  /**
   * Validates maximum numeric value
   */
  max: (max: number, fieldName: string = 'Value'): Validator<number> => (value) => {
    if (typeof value !== 'number') return null;
    if (value > max) {
      return `${fieldName} must be at most ${max}`;
    }
    return null;
  },

  /**
   * Validates that a number is an integer
   */
  integer: (fieldName: string = 'Value'): Validator<number> => (value) => {
    if (typeof value !== 'number') return null;
    if (!Number.isInteger(value)) {
      return `${fieldName} must be a whole number`;
    }
    return null;
  },

  /**
   * Validates that a number is positive
   */
  positive: (fieldName: string = 'Value'): Validator<number> => (value) => {
    if (typeof value !== 'number') return null;
    if (value <= 0) {
      return `${fieldName} must be positive`;
    }
    return null;
  },

  /**
   * Validates alphanumeric characters only
   */
  alphanumeric: (fieldName: string = 'Field'): Validator<string> => (value) => {
    if (typeof value !== 'string') return null;
    const pattern = /^[a-zA-Z0-9]+$/;
    if (!pattern.test(value)) {
      return `${fieldName} must contain only letters and numbers`;
    }
    return null;
  },

  /**
   * Validates alphanumeric characters with spaces
   */
  alphanumericWithSpaces: (fieldName: string = 'Field'): Validator<string> => (value) => {
    if (typeof value !== 'string') return null;
    const pattern = /^[a-zA-Z0-9\s]+$/;
    if (!pattern.test(value)) {
      return `${fieldName} must contain only letters, numbers, and spaces`;
    }
    return null;
  },

  /**
   * Validates no special characters (allows letters, numbers, spaces, hyphens, underscores)
   */
  noSpecialChars: (fieldName: string = 'Field'): Validator<string> => (value) => {
    if (typeof value !== 'string') return null;
    const pattern = /^[a-zA-Z0-9\s\-_]+$/;
    if (!pattern.test(value)) {
      return `${fieldName} must not contain special characters`;
    }
    return null;
  },

  /**
   * Custom validator function
   */
  custom: <T>(validatorFn: (value: T) => boolean, message: string): Validator<T> => (value) => {
    if (!validatorFn(value)) {
      return message;
    }
    return null;
  },

  /**
   * Conditional validator - only applies if condition is met
   */
  conditional: <T>(
    condition: (value: T, context?: ValidationContext) => boolean,
    validator: Validator<T>
  ): Validator<T> => (value, context) => {
    if (condition(value, context)) {
      return validator(value, context);
    }
    return null;
  },

  /**
   * Array validation - validates each item in an array
   */
  arrayItems: <T>(itemValidator: Validator<T>, fieldName: string = 'Items'): Validator<T[]> => (value) => {
    if (!Array.isArray(value)) return null;
    
    for (let i = 0; i < value.length; i++) {
      const error = itemValidator(value[i]);
      if (error) {
        return `${fieldName}[${i}]: ${error}`;
      }
    }
    return null;
  },

  /**
   * Array length validation
   */
  arrayLength: (min?: number, max?: number, fieldName: string = 'Items'): Validator<unknown[]> => (value) => {
    if (!Array.isArray(value)) return null;
    
    if (min !== undefined && value.length < min) {
      return `${fieldName} must have at least ${min} items`;
    }
    
    if (max !== undefined && value.length > max) {
      return `${fieldName} must have at most ${max} items`;
    }
    
    return null;
  }
};

/**
 * Create a validator from built-in configuration
 */
export function createValidator(config: BuiltInValidatorConfig): Validator {
  const { type, options = {} } = config;
  const fieldName = options.fieldName || 'Field';

  switch (type) {
    case 'required':
      return validators.required(fieldName);
    
    case 'minLength':
      return validators.minLength(options.min || 0, fieldName) as Validator;
    
    case 'maxLength':
      return validators.maxLength(options.max || 100, fieldName) as Validator;
    
    case 'pattern':
      return validators.pattern(options.pattern || /./, options.message || 'Invalid format') as Validator;
    
    case 'email':
      return validators.email(fieldName) as Validator;
    
    case 'unique':
      return validators.unique(options.existingValues || [], fieldName) as Validator;
    
    case 'range':
      return validators.range(options.min || 0, options.max || 100, fieldName) as Validator;
    
    case 'min':
      return validators.min(options.min || 0, fieldName) as Validator;
    
    case 'max':
      return validators.max(options.max || 100, fieldName) as Validator;
    
    case 'integer':
      return validators.integer(fieldName) as Validator;
    
    case 'positive':
      return validators.positive(fieldName) as Validator;
    
    case 'alphanumeric':
      return validators.alphanumeric(fieldName) as Validator;
    
    case 'noSpecialChars':
      return validators.noSpecialChars(fieldName) as Validator;
    
    default:
      throw new Error(`Unknown validator type: ${type}`);
  }
}

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  noSpecialChars: /^[a-zA-Z0-9\s\-_]+$/,
  url: /^https?:\/\/.+/,
  phone: /^\+?[\d\s\-\(\)]+$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  hexColor: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
};

/**
 * Validation helpers for specific domains
 */
export const domainValidators = {
  /**
   * Character name validation
   */
  characterName: (existingNames: string[] = []): Validator<string> => {
    return (value) => {
      // Chain multiple validators
      const requiredError = validators.required('Character name')(value);
      if (requiredError) return requiredError;

      const minLengthError = validators.minLength(3, 'Character name')(value);
      if (minLengthError) return minLengthError;

      const maxLengthError = validators.maxLength(50, 'Character name')(value);
      if (maxLengthError) return maxLengthError;

      const uniqueError = validators.unique(existingNames, 'Character name')(value);
      if (uniqueError) return uniqueError;

      return null;
    };
  },

  /**
   * Attribute name validation
   */
  attributeName: (existingNames: string[] = []): Validator<string> => {
    return (value) => {
      const requiredError = validators.required('Attribute name')(value);
      if (requiredError) return requiredError;

      const uniqueError = validators.unique(existingNames, 'Attribute name')(value);
      if (uniqueError) return uniqueError;

      return null;
    };
  },

  /**
   * Attribute range validation
   */
  attributeRange: (min: number, max: number): Validator<{ minValue: number; maxValue: number }> => {
    return (value) => {
      if (value.minValue >= value.maxValue) {
        return 'Maximum value must be greater than minimum value';
      }

      if (value.minValue < min) {
        return `Minimum value cannot be less than ${min}`;
      }

      if (value.maxValue > max) {
        return `Maximum value cannot be greater than ${max}`;
      }

      return null;
    };
  },

  /**
   * Point pool validation
   */
  pointPool: (totalPoints: number, fieldName: string = 'Points'): Validator<Array<{ value: number }>> => {
    return (value) => {
      if (!Array.isArray(value)) return null;

      const pointsSpent = value.reduce((sum, item) => sum + (item.value || 0), 0);
      if (pointsSpent !== totalPoints) {
        return `Must spend exactly ${totalPoints} ${fieldName.toLowerCase()} (${pointsSpent} spent)`;
      }

      return null;
    };
  }
};