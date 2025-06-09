/**
 * Core validation engine
 * 
 * This module provides the central validation processing system that handles
 * field validation, schema-based validation, and validation pipelines.
 * 
 * @module ValidationCore
 * @version 1.0.0
 * @since MVP
 */

import {
  ValidationResult,
  FieldValidationResult,
  FieldValidation,
  ValidationSchema,
  ValidationContext,
  Validator,
  AsyncValidator,
  ValidationError
} from './types';

/**
 * Validate a single field with multiple validators
 * 
 * Runs multiple validators against a single field value and returns
 * the first error encountered, or null if all validators pass.
 * 
 * @param value - The value to validate
 * @param validators - Array of validator functions to run
 * @param context - Optional validation context for additional data
 * @returns The first validation error message, or null if valid
 * 
 * @example
 * ```typescript
 * const error = validateField('test@', [validators.required(), validators.email()]);
 * // Returns: 'Please enter a valid email address'
 * ```
 */
export function validateField<T>(
  value: T,
  validators: Array<Validator<T>>,
  context?: ValidationContext
): string | null {
  for (const validator of validators) {
    const error = validator(value, context);
    if (error) return error;
  }
  return null;
}

/**
 * Validate a single field with async validators
 * 
 * Extends field validation to support asynchronous validators like
 * uniqueness checks or external API validation.
 * 
 * @param value - The value to validate
 * @param validators - Array of synchronous validator functions
 * @param asyncValidators - Array of asynchronous validator functions
 * @param context - Optional validation context for additional data
 * @returns Promise resolving to the first validation error, or null if valid
 * 
 * @example
 * ```typescript
 * const error = await validateFieldAsync(
 *   'username',
 *   [validators.required()],
 *   [validators.unique('users', 'username')]
 * );
 * ```
 */
export async function validateFieldAsync<T>(
  value: T,
  validators: Array<Validator<T>>,
  asyncValidators: Array<AsyncValidator<T>> = [],
  context?: ValidationContext
): Promise<string | null> {
  // Run sync validators first
  const syncError = validateField(value, validators, context);
  if (syncError) return syncError;

  // Run async validators
  for (const validator of asyncValidators) {
    const error = await validator(value, context);
    if (error) return error;
  }

  return null;
}

/**
 * Validate multiple fields
 * 
 * Validates an array of field definitions and returns a map of
 * field names to their error messages.
 * 
 * @param fields - Array of field validation configurations
 * @param context - Optional validation context for additional data
 * @returns Record mapping field names to error messages
 * 
 * @example
 * ```typescript
 * const errors = validateFields([
 *   { name: 'email', value: user.email, validators: [validators.email()] },
 *   { name: 'age', value: user.age, validators: [validators.min(18)] }
 * ]);
 * ```
 */
export function validateFields<T = unknown>(
  fields: Array<FieldValidation<T>>,
  context?: ValidationContext
): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const fieldContext: ValidationContext = {
      ...context,
      fieldName: field.label || field.name
    };

    const error = validateField(field.value, field.validators, fieldContext);
    if (error) {
      errors[field.name] = error;
    }
  }

  return errors;
}

/**
 * Validate multiple fields with async support
 */
export async function validateFieldsAsync<T = unknown>(
  fields: Array<FieldValidation<T>>,
  context?: ValidationContext
): Promise<Record<string, string>> {
  const errors: Record<string, string> = {};

  for (const field of fields) {
    const fieldContext: ValidationContext = {
      ...context,
      fieldName: field.label || field.name
    };

    const error = await validateFieldAsync(
      field.value, 
      field.validators, 
      field.asyncValidators || [], 
      fieldContext
    );
    
    if (error) {
      errors[field.name] = error;
    }
  }

  return errors;
}

/**
 * Create a validation result from field errors
 * 
 * Transforms a map of field errors into a standardized ValidationResult object.
 * 
 * @param fieldErrors - Record mapping field names to error messages
 * @param warnings - Optional array of warning messages
 * @returns Standardized ValidationResult object
 * 
 * @example
 * ```typescript
 * const result = createValidationResult(
 *   { email: 'Invalid email', age: 'Must be 18 or older' },
 *   ['Password strength could be improved']
 * );
 * ```
 */
export function createValidationResult(
  fieldErrors: Record<string, string>,
  warnings: string[] = []
): ValidationResult {
  const errors = Object.values(fieldErrors);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create detailed field validation results
 */
export function createFieldValidationResults(
  fieldErrors: Record<string, string>
): FieldValidationResult[] {
  return Object.entries(fieldErrors).map(([field, error]) => ({
    field,
    error
  }));
}

/**
 * Schema-based validation
 * 
 * Validates an entire object against a defined schema with field-level
 * and cross-field validation rules.
 * 
 * @param data - The object to validate
 * @param schema - Validation schema defining rules for each field
 * @param context - Optional validation context for additional data
 * @returns Complete validation result with field-specific errors
 * 
 * @example
 * ```typescript
 * const schema = {
 *   fields: {
 *     email: [{ validator: validators.email() }],
 *     age: [{ validator: validators.min(18) }]
 *   }
 * };
 * const result = validateWithSchema(userData, schema);
 * ```
 */
export function validateWithSchema<T extends Record<string, unknown>>(
  data: T,
  schema: ValidationSchema<T>,
  context?: ValidationContext
): ValidationResult {
  const fieldErrors: Record<string, string> = {};
  const warnings: string[] = [];

  // Validate individual fields
  for (const [fieldName, rules] of Object.entries(schema.fields)) {
    if (!rules || rules.length === 0) continue;

    const fieldValue = data[fieldName as keyof T];
    const fieldContext: ValidationContext = {
      ...context,
      fieldName: fieldName,
      allData: data
    };

    for (const rule of rules) {
      const error = rule.validator(fieldValue, fieldContext);
      if (error) {
        fieldErrors[fieldName] = rule.message || error;
        if (schema.stopOnFirstError) {
          break;
        }
      }
    }
  }

  // Run cross-field validators
  if (schema.crossFieldValidators) {
    for (const validator of schema.crossFieldValidators) {
      const error = validator(data, context);
      if (error) {
        fieldErrors['_global'] = error;
        if (schema.stopOnFirstError) {
          break;
        }
      }
    }
  }

  const errors = Object.values(fieldErrors);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metadata: {
      fieldErrors
    }
  };
}

/**
 * Schema-based validation with async support
 */
export async function validateWithSchemaAsync<T extends Record<string, unknown>>(
  data: T,
  schema: ValidationSchema<T>,
  context?: ValidationContext
): Promise<ValidationResult> {
  // For now, just delegate to sync validation
  // Can be extended later to support async field validators
  return validateWithSchema(data, schema, context);
}

/**
 * Combine multiple validation results
 * 
 * Merges multiple ValidationResult objects into a single result,
 * aggregating errors and warnings from all sources.
 * 
 * @param results - Array of ValidationResult objects to combine
 * @returns Combined ValidationResult with all errors and warnings
 * 
 * @example
 * ```typescript
 * const fieldResult = validateFields(fields);
 * const businessResult = validateBusinessRules(data);
 * const combined = combineValidationResults([fieldResult, businessResult]);
 * ```
 */
export function combineValidationResults(
  results: ValidationResult[]
): ValidationResult {
  const allErrors: string[] = [];
  const allWarnings: string[] = [];
  let allValid = true;

  for (const result of results) {
    if (!result.valid) {
      allValid = false;
    }
    allErrors.push(...result.errors);
    if (result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }

  return {
    valid: allValid,
    errors: allErrors,
    warnings: allWarnings
  };
}

/**
 * Create a validation context with common data
 */
export function createValidationContext(
  overrides: Partial<ValidationContext> = {}
): ValidationContext {
  return {
    fieldName: 'Field',
    isUpdate: false,
    ...overrides
  };
}

/**
 * Validation pipeline - chain multiple validation steps
 * 
 * Provides a fluent interface for building complex validation workflows
 * that can be reused across different parts of the application.
 * 
 * @template T - The type of data being validated
 * 
 * @example
 * ```typescript
 * const pipeline = createValidationPipeline<UserData>()
 *   .addFieldValidation('email', [validators.required(), validators.email()])
 *   .addFieldValidation('age', [validators.required(), validators.min(18)])
 *   .addStep((data) => validateBusinessRules(data));
 * 
 * const result = pipeline.validate(userData);
 * ```
 */
export class ValidationPipeline<T = unknown> {
  private steps: Array<(data: T, context?: ValidationContext) => ValidationResult> = [];

  /**
   * Add a validation step to the pipeline
   * 
   * @param validator - Function that validates data and returns a ValidationResult
   * @returns This pipeline instance for method chaining
   */
  addStep(validator: (data: T, context?: ValidationContext) => ValidationResult): this {
    this.steps.push(validator);
    return this;
  }

  /**
   * Add a field validation step
   * 
   * Convenience method for adding validation for a specific field.
   * 
   * @param fieldName - The name of the field to validate
   * @param validators - Array of validators to apply to the field
   * @param label - Optional human-readable label for error messages
   * @returns This pipeline instance for method chaining
   */
  addFieldValidation<K extends keyof T>(
    fieldName: K,
    validators: Array<Validator<T[K]>>,
    label?: string
  ): this {
    this.addStep((data, context) => {
      const fieldContext = {
        ...context,
        fieldName: label || String(fieldName),
        allData: data as Record<string, unknown>
      };

      const error = validateField(data[fieldName], validators, fieldContext);
      
      return {
        valid: !error,
        errors: error ? [error] : [],
        warnings: []
      };
    });

    return this;
  }

  /**
   * Execute the validation pipeline
   * 
   * Runs all validation steps in order and combines their results.
   * 
   * @param data - The data to validate
   * @param context - Optional validation context
   * @returns Combined validation result from all steps
   */
  validate(data: T, context?: ValidationContext): ValidationResult {
    const results = this.steps.map(step => step(data, context));
    return combineValidationResults(results);
  }

  /**
   * Execute pipeline and throw on validation failure
   */
  validateOrThrow(data: T, context?: ValidationContext): void {
    const result = this.validate(data, context);
    
    if (!result.valid) {
      throw new ValidationError(
        'Validation failed',
        result.errors,
        result.metadata?.fieldErrors as Record<string, string> || {},
        context
      );
    }
  }
}

/**
 * Create a simple validation pipeline
 * 
 * Factory function for creating new validation pipelines with a fluent interface.
 * 
 * @template T - The type of data the pipeline will validate
 * @returns A new ValidationPipeline instance
 * 
 * @example
 * ```typescript
 * const userPipeline = createValidationPipeline<User>()
 *   .addFieldValidation('email', [validators.email()])
 *   .addFieldValidation('name', [validators.required()]);
 * ```
 */
export function createValidationPipeline<T = unknown>(): ValidationPipeline<T> {
  return new ValidationPipeline<T>();
}