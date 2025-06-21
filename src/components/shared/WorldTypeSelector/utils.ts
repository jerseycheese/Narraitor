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
    
    // Only require additional details for "Inspired By" - "Set Within" can infer setting/time from reference
    if (data.worldType === 'inspired_by' && !data.additionalDetails?.trim()) {
      errors.push('Additional details are required');
    }
  }
  // Note: 'original' world type requires no additional input - it's completely self-contained

  return errors;
}

/**
 * Converts world type data to world generation parameters
 */
export interface ExtendedWorldGenerationParams extends WorldGenerationParams {
  additionalContext?: string;
}

export function convertToGenerationParams(data: WorldTypeData): ExtendedWorldGenerationParams {
  if (data.worldType === 'original') {
    return {
      reference: undefined, // For original worlds, use additionalContext instead
      relationship: undefined,
      additionalContext: data.additionalDetails || undefined,
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
    reference: undefined,
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