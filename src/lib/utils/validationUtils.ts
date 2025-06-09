/**
 * Minimal validation utilities
 * Simple, focused functions for common validation scenarios
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that a name meets basic requirements
 */
export function validateName(name: string, options?: {
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}): ValidationResult {
  const {
    minLength = 3,
    maxLength = 50,
    required = true
  } = options || {};

  const errors: string[] = [];
  const trimmedName = name?.trim() || '';

  if (required && !trimmedName) {
    errors.push('Name is required');
  } else if (trimmedName) {
    if (trimmedName.length < minLength) {
      errors.push(`Name must be at least ${minLength} characters`);
    }
    if (trimmedName.length > maxLength) {
      errors.push(`Name must be less than ${maxLength} characters`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
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
 * Validates that points are distributed correctly
 */
export function validatePointDistribution(
  values: number[],
  totalPoints: number
): ValidationResult {
  const errors: string[] = [];
  const pointsSpent = values.reduce((sum, value) => sum + value, 0);

  if (pointsSpent !== totalPoints) {
    errors.push(`Must spend exactly ${totalPoints} points (${pointsSpent} spent)`);
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
  if (selectedCount > maxSelections) {
    errors.push(`Maximum ${maxSelections} ${fieldName} allowed`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}