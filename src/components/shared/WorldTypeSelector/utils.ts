import { WorldTypeData, WorldGenerationParams } from './types';

/**
 * Validates world type data based on the selected world type
 */
export function validateWorldTypeData(data: WorldTypeData): string[] {
  const errors: string[] = [];

  // Always require world type selection
  if (!data.worldType) {
    errors.push('World type is required');
  }

  // Validate based on world type
  if (data.worldType === 'inspired_by' || data.worldType === 'set_within') {
    if (!data.worldReference?.trim()) {
      errors.push('Existing setting is required');
    }
    if (!data.additionalDetails?.trim()) {
      const label = data.worldType === 'inspired_by' ? 'Additional details' : 'Specific setting/time';
      errors.push(`${label} is required`);
    }
  } else if (data.worldType === 'original') {
    if (!data.additionalDetails?.trim()) {
      errors.push('World concept is required');
    }
  }

  return errors;
}

/**
 * Converts world type data to world generation parameters
 */
export function convertToGenerationParams(data: WorldTypeData): WorldGenerationParams {
  if (data.worldType === 'original') {
    return {
      reference: data.additionalDetails || 'A world of endless possibilities',
      relationship: undefined,
    };
  } else if (data.worldType === 'inspired_by') {
    const baseReference = data.worldReference || 'an existing fictional universe';
    const additionalDetails = data.additionalDetails?.trim();
    return {
      reference: additionalDetails 
        ? `${baseReference}. Additional context: ${additionalDetails}`
        : baseReference,
      relationship: 'based_on',
    };
  } else if (data.worldType === 'set_within') {
    const baseReference = data.worldReference || 'an existing fictional universe';
    const additionalDetails = data.additionalDetails?.trim();
    return {
      reference: additionalDetails 
        ? `${baseReference}. Specific setting/time: ${additionalDetails}`
        : baseReference,
      relationship: 'set_in',
    };
  }

  // Fallback
  return {
    reference: 'A world of endless possibilities',
    relationship: undefined,
  };
}

/**
 * Creates initial world type data
 */
export function createInitialWorldTypeData(worldType: WorldTypeData['worldType'] = 'original'): WorldTypeData {
  return {
    worldType,
    worldReference: '',
    additionalDetails: '',
  };
}

/**
 * Checks if world type data is valid
 */
export function isWorldTypeDataValid(data: WorldTypeData): boolean {
  return validateWorldTypeData(data).length === 0;
}