import { validators } from '@/components/shared/wizard/utils/validation';
import { GENRES } from '@/lib/constants/genres';

/**
 * Validates world name with uniqueness check
 */
function validateWorldName(value: string, existingNames: string[] = []): string | null {
  // First check if it's a non-empty string
  const requiredError = validators.required(value, 'World name');
  if (requiredError) return requiredError;

  // Check for minimum length
  if (value.trim().length < 2) {
    return 'World name must be at least 2 characters';
  }

  // Check for maximum length
  if (value.trim().length > 50) {
    return 'World name must be 50 characters or less';
  }

  // Check uniqueness
  const trimmedValue = value.trim();
  if (existingNames.some(name => name.toLowerCase() === trimmedValue.toLowerCase())) {
    return 'A world with this name already exists';
  }

  return null;
}

/**
 * Validates genre selection
 */
function validateGenre(value: string): string | null {
  const requiredError = validators.required(value, 'Genre');
  if (requiredError) return requiredError;

  // Check if it's a valid genre
  const isValidGenre = GENRES.some(genre => genre.value === value);
  if (!isValidGenre) {
    return 'Please select a valid genre';
  }

  return null;
}

/**
 * Validates description/concept field
 */
function validateDescription(value: string, fieldName: string = 'Description'): string | null {
  const requiredError = validators.required(value, fieldName);
  if (requiredError) return requiredError;

  if (value.trim().length < 10) {
    return `${fieldName} must be at least 10 characters`;
  }

  if (value.trim().length > 1000) {
    return `${fieldName} must be 1000 characters or less`;
  }

  return null;
}

/**
 * Validates world reference when relationship is specified
 */
function validateWorldReference(
  relationship?: string, 
  reference?: string
): string | null {
  if (!relationship) {
    return null; // No relationship means no reference required
  }

  if (!reference?.trim()) {
    return 'Existing setting is required when using "Inspired By" or "Set Within"';
  }

  if (reference.trim().length < 2) {
    return 'Existing setting must be at least 2 characters';
  }

  if (reference.trim().length > 100) {
    return 'Existing setting must be 100 characters or less';
  }

  return null;
}

/**
 * Complete world creation data validation
 */
export interface WorldCreationData {
  name?: string;
  genre?: string;
  description?: string;
  worldReference?: string;
  worldRelationship?: string;
}

export function validateWorldCreationData(
  data: WorldCreationData,
  existingNames: string[] = []
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  // Validate name if provided
  if (data.name !== undefined) {
    const nameError = data.name.trim() 
      ? validateWorldName(data.name, existingNames)
      : null;
    if (nameError) errors.name = nameError;
  }

  // Validate genre if provided
  if (data.genre !== undefined) {
    const genreError = validateGenre(data.genre);
    if (genreError) errors.genre = genreError;
  }

  // Validate description if provided
  if (data.description !== undefined) {
    const descriptionError = validateDescription(data.description, 'World concept');
    if (descriptionError) errors.description = descriptionError;
  }

  // Validate world reference/relationship combination
  const referenceError = validateWorldReference(data.worldRelationship, data.worldReference);
  if (referenceError) errors.worldReference = referenceError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
