/**
 * Unified validation system types
 * Consolidates validation patterns from form validation, attribute validation, and character validation
 */

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether the validation passed */
  valid: boolean;
  /** Array of error messages */
  errors: string[];
  /** Array of warning messages (non-blocking) */
  warnings?: string[];
  /** Additional metadata about the validation */
  metadata?: Record<string, unknown>;
}

/**
 * Result of validating a single field
 */
export interface FieldValidationResult {
  /** Field name that was validated */
  field: string;
  /** Error message if validation failed */
  error: string | null;
  /** Warning message if applicable */
  warning?: string | null;
  /** Additional field metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Validator function type
 */
export type Validator<T = unknown> = (value: T, context?: ValidationContext) => string | null;

/**
 * Async validator function type
 */
export type AsyncValidator<T = unknown> = (value: T, context?: ValidationContext) => Promise<string | null>;

/**
 * Context passed to validators for additional information
 */
export interface ValidationContext {
  /** Field name being validated */
  fieldName?: string;
  /** All form/object data for cross-field validation */
  allData?: Record<string, unknown>;
  /** Additional context data */
  metadata?: Record<string, unknown>;
  /** Whether this is an update operation (vs create) */
  isUpdate?: boolean;
  /** ID of the entity being updated (if applicable) */
  entityId?: string;
}

/**
 * Field validation configuration
 */
export interface FieldValidation<T = unknown> {
  /** Field name */
  name: string;
  /** Field value to validate */
  value: T;
  /** Array of validators to apply */
  validators: Array<Validator<T>>;
  /** Optional async validators */
  asyncValidators?: Array<AsyncValidator<T>>;
  /** Whether this field is required */
  required?: boolean;
  /** Custom field label for error messages */
  label?: string;
}

/**
 * Schema-based validation rule
 */
export interface ValidationRule<T = unknown> {
  /** Validator function */
  validator: Validator<T>;
  /** Custom error message */
  message?: string;
  /** Whether this rule is required or optional */
  required?: boolean;
}

/**
 * Schema for validating objects
 */
export interface ValidationSchema<T = Record<string, unknown>> {
  /** Field validation rules */
  fields: {
    [K in keyof T]?: ValidationRule<T[K]>[];
  };
  /** Cross-field validation rules */
  crossFieldValidators?: Array<(data: T, context?: ValidationContext) => string | null>;
  /** Whether to stop validation on first error */
  stopOnFirstError?: boolean;
}

/**
 * Sanitization function type
 */
export type Sanitizer<T = unknown> = (value: T) => T;

/**
 * Field sanitization configuration
 */
export interface FieldSanitization<T = unknown> {
  /** Field name */
  name: string;
  /** Sanitization function */
  sanitizer: Sanitizer<T>;
}

/**
 * Combined validation and sanitization result
 */
export interface ProcessedValidationResult<T = unknown> {
  /** Whether validation passed */
  valid: boolean;
  /** Validation errors */
  errors: string[];
  /** Validation warnings */
  warnings: string[];
  /** Sanitized data */
  sanitizedData: T;
  /** Field-specific errors */
  fieldErrors: Record<string, string>;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Built-in validator types for common patterns
 */
export type BuiltInValidatorType = 
  | 'required'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'unique'
  | 'range'
  | 'min'
  | 'max'
  | 'integer'
  | 'positive'
  | 'alphanumeric'
  | 'noSpecialChars';

/**
 * Configuration for built-in validators
 */
export interface BuiltInValidatorConfig {
  type: BuiltInValidatorType;
  options?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
    existingValues?: unknown[];
    fieldName?: string;
  };
}

/**
 * Validation error with context
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: string[],
    public readonly fieldErrors: Record<string, string> = {},
    public readonly context?: ValidationContext
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}