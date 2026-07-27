/**
 * Minimal validation utilities
 * Simple, focused functions for common validation scenarios
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that a text field meets minimum requirements
 */
export function validateText(text: string, options?: {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  fieldName?: string;
}): ValidationResult {
  const {
    minLength = 0,
    maxLength = 1000,
    required = true,
    fieldName = 'Field'
  } = options || {};

  const errors: string[] = [];
  const trimmedText = text?.trim() || '';

  if (required && !trimmedText) {
    errors.push(`${fieldName} is required`);
  } else if (trimmedText) {
    if (minLength > 0 && trimmedText.length < minLength) {
      errors.push(`${fieldName} must be at least ${minLength} characters`);
    }
    if (trimmedText.length > maxLength) {
      errors.push(`${fieldName} must be less than ${maxLength} characters`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates that a selection count is within acceptable range
 */
export function validateSelectionCount(
  selections: boolean[],
  options?: {
    minSelections?: number;
    maxSelections?: number;
    fieldName?: string;
  }
): ValidationResult {
  const {
    minSelections = 1,
    maxSelections = Infinity,
    fieldName = 'items'
  } = options || {};

  const errors: string[] = [];
  const selectedCount = selections.filter(Boolean).length;

  if (selectedCount < minSelections) {
    errors.push(`Select at least ${minSelections} ${fieldName}`);
  }
  if (maxSelections !== Infinity && selectedCount > maxSelections) {
    errors.push(`Maximum ${maxSelections} ${fieldName} allowed`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
