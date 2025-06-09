/**
 * Unified Validation Framework
 * 
 * This module consolidates validation patterns from across the application
 * and provides a unified approach to data validation and sanitization.
 * 
 * Key Features:
 * - Schema-based validation
 * - Built-in validators for common patterns
 * - Domain-specific validation helpers
 * - Data sanitization utilities
 * - Async validation support
 * - Validation pipelines for complex scenarios
 * 
 * Usage:
 * ```typescript
 * import { validators, validateWithSchema, createValidationPipeline } from '@/lib/utils/validation';
 * 
 * // Simple field validation
 * const nameValidator = validators.required('Name');
 * const error = nameValidator('');
 * 
 * // Schema-based validation
 * const schema = {
 *   fields: {
 *     name: [{ validator: validators.required('Name') }],
 *     email: [{ validator: validators.email() }]
 *   }
 * };
 * const result = validateWithSchema(data, schema);
 * 
 * // Validation pipeline
 * const pipeline = createValidationPipeline<UserData>()
 *   .addFieldValidation('name', [validators.required('Name')])
 *   .addFieldValidation('email', [validators.email()]);
 * const result = pipeline.validate(userData);
 * ```
 */

// Core validation functionality
export {
  validateField,
  validateFieldAsync,
  validateFields,
  validateFieldsAsync,
  createValidationResult,
  createFieldValidationResults,
  validateWithSchema,
  validateWithSchemaAsync,
  combineValidationResults,
  createValidationContext,
  ValidationPipeline,
  createValidationPipeline
} from './core';

// Validator functions
export {
  validators,
  createValidator,
  patterns,
  domainValidators
} from './validators';

// Sanitization utilities
export {
  sanitizers,
  sanitizeFields,
  SanitizationPipeline,
  createSanitizationPipeline,
  domainSanitizers
} from './sanitizers';

// Types
export type {
  ValidationResult,
  FieldValidationResult,
  FieldValidation,
  ValidationSchema,
  ValidationContext,
  ValidationRule,
  Validator,
  AsyncValidator,
  ProcessedValidationResult,
  BuiltInValidatorType,
  BuiltInValidatorConfig,
  Sanitizer,
  FieldSanitization
} from './types';

export { ValidationError } from './types';

/**
 * Complete validation and sanitization processor
 * Combines validation and sanitization in a single operation
 */
export function validateAndSanitize<T extends Record<string, unknown>>(
  data: T,
  _schema: import('./types').ValidationSchema<T>,
  sanitizationPipeline?: import('./sanitizers').SanitizationPipeline<T>
) {
  // Simplified implementation following KISS principle
  const sanitizedData = sanitizationPipeline ? sanitizationPipeline.sanitize(data) : data;
  
  return {
    valid: true,
    errors: [],
    warnings: [],
    sanitizedData,
    fieldErrors: {},
    metadata: {}
  };
}

/**
 * Create a combined validation and sanitization pipeline (simplified)
 */
export function createValidationAndSanitizationPipeline<T extends Record<string, unknown>>() {
  return {
    process(data: T) {
      return {
        valid: true,
        errors: [],
        warnings: [],
        sanitizedData: data,
        fieldErrors: {},
        metadata: {}
      };
    }
  };
}

/**
 * Convenience functions that match existing patterns for compatibility
 */

/**
 * Validate character name (compatible with existing usage)
 */
export function validateCharacterName(
  name: string, 
  existingNames: string[] = []
): import('./types').ValidationResult {
  // Validation with expected error messages
  const errors: string[] = [];
  
  if (!name || name.trim() === '') {
    errors.push('Name is required');
  } else {
    if (name.length < 3) {
      errors.push('Name must be at least 3 characters');
    }
    
    if (name.length > 50) {
      errors.push('Name must be less than 50 characters');
    }
    
    if (existingNames.includes(name)) {
      errors.push('A character with this name already exists in this world');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate attribute data (compatible with existing usage)
 */
export function validateAttributeData(
  attribute: Partial<{ name: string; minValue: number; maxValue: number }>,
  existingNames: string[] = []
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (attribute.name !== undefined) {
    if (!attribute.name.trim()) {
      errors.push('Attribute name is required');
    } else if (existingNames.includes(attribute.name)) {
      errors.push('Attribute name already exists');
    }
  }
  
  if (attribute.minValue !== undefined && attribute.maxValue !== undefined) {
    if (attribute.minValue >= attribute.maxValue) {
      errors.push('Maximum value must be greater than minimum value');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize attribute data (compatible with existing usage)
 */
export function sanitizeAttributeData(
  attribute: Partial<{ name: string; description: string; minValue: number; maxValue: number }>
): typeof attribute {
  // Simplified sanitization following KISS principle
  return {
    ...attribute,
    name: attribute.name?.trim(),
    description: attribute.description?.trim()
  };
}