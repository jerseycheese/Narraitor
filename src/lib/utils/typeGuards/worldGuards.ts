// src/lib/utils/typeGuards/worldGuards.ts

import type { ValidationResult } from '@/lib/utils';

/**
 * World validation with detailed error messages.
 * 
 * Validates that an unknown object conforms to the World interface structure.
 * Returns a ValidationResult object containing validation status and detailed error descriptions.
 * Supports both full validation and partial validation for form inputs.
 * 
 * @param obj - The object to validate
 * @param partial - If true, only validates properties that are present (default: false)
 * @returns ValidationResult with `valid` boolean and `errors` array
 */
export function validateWorld(obj: unknown, partial: boolean = false): ValidationResult {
  const errors: string[] = [];

  if (obj === null || obj === undefined) {
    errors.push('World object cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const world = obj as Record<string, unknown>;

  // Required property validation
  if (!partial) {
    if (typeof world.id !== 'string') {
      errors.push('Property "id" must be a string');
    }
    if (typeof world.name !== 'string') {
      errors.push('Property "name" must be a string');
    }
    if (typeof world.description !== 'string') {
      errors.push('Property "description" must be a string');
    }
    if (typeof world.genre !== 'string') {
      errors.push('Property "genre" must be a string');
    }
  } else {
    // Partial validation - only check present properties
    if ('id' in world && typeof world.id !== 'string') {
      errors.push('Property "id" must be a string when present');
    }
    if ('name' in world && typeof world.name !== 'string') {
      errors.push('Property "name" must be a string when present');
    }
    if ('description' in world && typeof world.description !== 'string') {
      errors.push('Property "description" must be a string when present');
    }
    if ('genre' in world && typeof world.genre !== 'string') {
      errors.push('Property "genre" must be a string when present');
    }
  }

  // For partial validation, only check present properties
  if (!partial) {
    if (!Array.isArray(world.attributes)) {
      errors.push('Property "attributes" must be an array');
    } else {
      world.attributes.forEach((attr: unknown, index: number) => {
        const attrValidation = validateWorldAttribute(attr);
        if (!attrValidation.valid) {
          errors.push(`Invalid WorldAttribute at index ${index}: ${attrValidation.errors.join(', ')}`);
        }
      });
    }

    if (!Array.isArray(world.skills)) {
      errors.push('Property "skills" must be an array');
    } else {
      world.skills.forEach((skill: unknown, index: number) => {
        const skillValidation = validateWorldSkill(skill);
        if (!skillValidation.valid) {
          errors.push(`Invalid WorldSkill at index ${index}: ${skillValidation.errors.join(', ')}`);
        }
      });
    }

    const settingsValidation = validateWorldSettings(world.settings);
    if (!settingsValidation.valid) {
      errors.push(...settingsValidation.errors.map(e => `WorldSettings: ${e}`));
    }

    if (typeof world.createdAt !== 'string') {
      errors.push('Property "createdAt" must be a string');
    }
    if (typeof world.updatedAt !== 'string') {
      errors.push('Property "updatedAt" must be a string');
    }
  } else {
    // Partial validation - only check present properties
    if ('attributes' in world && !Array.isArray(world.attributes)) {
      errors.push('Property "attributes" must be an array when present');
    }
    if ('skills' in world && !Array.isArray(world.skills)) {
      errors.push('Property "skills" must be an array when present');
    }
    if ('settings' in world) {
      const settingsValidation = validateWorldSettings(world.settings, true);
      if (!settingsValidation.valid) {
        errors.push(...settingsValidation.errors.map(e => `WorldSettings: ${e}`));
      }
    }
  }

  // Optional property validation
  if (world.image !== undefined && world.image !== null) {
    const imageValidation = validateGeneratedImage(world.image);
    if (!imageValidation.valid) {
      errors.push(...imageValidation.errors.map(e => `GeneratedImage: ${e}`));
    }
  }

  if (world.reference !== undefined && typeof world.reference !== 'string') {
    errors.push('Property "reference" must be a string when present');
  }

  if (
    world.relationship !== undefined &&
    !(typeof world.relationship === 'string' &&
      ['set_within', 'inspired_by'].includes(world.relationship))
  ) {
    errors.push('Property "relationship" must be "set_within" or "inspired_by" when present');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Character validation with detailed error messages.
 * 
 * Validates that an unknown object conforms to the Character interface structure.
 * Returns a ValidationResult object containing validation status and detailed error descriptions.
 * Supports both full validation and partial validation for form inputs.
 */
// Domain-specific validation functions

export function validateWorldAttribute(obj: unknown): ValidationResult {
  const errors: string[] = [];

  if (obj === null || obj === undefined) {
    errors.push('WorldAttribute cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const attr = obj as Record<string, unknown>;

  // Property validation
  if (typeof attr.id !== 'string') errors.push('Property "id" must be a string');
  if (typeof attr.name !== 'string') errors.push('Property "name" must be a string');
  if (typeof attr.worldId !== 'string') errors.push('Property "worldId" must be a string');
  if (typeof attr.description !== 'string') errors.push('Property "description" must be a string');
  if (typeof attr.baseValue !== 'number') errors.push('Property "baseValue" must be a number');
  if (typeof attr.minValue !== 'number') errors.push('Property "minValue" must be a number');
  if (typeof attr.maxValue !== 'number') errors.push('Property "maxValue" must be a number');
  
  if (typeof attr.minValue === 'number' && typeof attr.maxValue === 'number' && attr.minValue > attr.maxValue) {
    errors.push('Property "minValue" must be less than or equal to "maxValue"');
  }
  
  if (typeof attr.baseValue === 'number' && typeof attr.minValue === 'number' && attr.baseValue < attr.minValue) {
    errors.push('Property "baseValue" must be greater than or equal to "minValue"');
  }
  
  if (typeof attr.baseValue === 'number' && typeof attr.maxValue === 'number' && attr.baseValue > attr.maxValue) {
    errors.push('Property "baseValue" must be less than or equal to "maxValue"');
  }

  return { valid: errors.length === 0, errors };
}

export function validateWorldSkill(obj: unknown): ValidationResult {
  const errors: string[] = [];
  const validDifficulties = ['easy', 'medium', 'hard'];

  if (obj === null || obj === undefined) {
    errors.push('WorldSkill cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const skill = obj as Record<string, unknown>;

  if (typeof skill.id !== 'string') errors.push('Property "id" must be a string');
  if (typeof skill.name !== 'string') errors.push('Property "name" must be a string');
  if (typeof skill.worldId !== 'string') errors.push('Property "worldId" must be a string');
  if (typeof skill.description !== 'string') errors.push('Property "description" must be a string');
  if (typeof skill.difficulty !== 'string' || !validDifficulties.includes(skill.difficulty)) {
    errors.push(`Property "difficulty" must be one of: ${validDifficulties.join(', ')}`);
  }
  if (typeof skill.baseValue !== 'number') errors.push('Property "baseValue" must be a number');
  if (typeof skill.minValue !== 'number') errors.push('Property "minValue" must be a number');
  if (typeof skill.maxValue !== 'number') errors.push('Property "maxValue" must be a number');
  
  if (typeof skill.minValue === 'number' && typeof skill.maxValue === 'number' && skill.minValue > skill.maxValue) {
    errors.push('Property "minValue" must be less than or equal to "maxValue"');
  }
  
  if (skill.attributeIds !== undefined && !Array.isArray(skill.attributeIds)) {
    errors.push('Property "attributeIds" must be an array when present');
  }

  return { valid: errors.length === 0, errors };
}

export function validateWorldSettings(obj: unknown, partial: boolean = false): ValidationResult {
  const errors: string[] = [];

  if (obj === null || obj === undefined) {
    errors.push('WorldSettings cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const settings = obj as Record<string, unknown>;

  if (!partial) {
    if (typeof settings.maxAttributes !== 'number') {
      errors.push('Property "maxAttributes" must be a number');
    } else if (settings.maxAttributes <= 0) {
      errors.push('Property "maxAttributes" must be greater than 0');
    }

    if (typeof settings.maxSkills !== 'number') {
      errors.push('Property "maxSkills" must be a number');
    } else if (settings.maxSkills <= 0) {
      errors.push('Property "maxSkills" must be greater than 0');
    }

    if (typeof settings.attributePointPool !== 'number') {
      errors.push('Property "attributePointPool" must be a number');
    } else if (settings.attributePointPool <= 0) {
      errors.push('Property "attributePointPool" must be greater than 0');
    }

    if (typeof settings.skillPointPool !== 'number') {
      errors.push('Property "skillPointPool" must be a number');
    } else if (settings.skillPointPool <= 0) {
      errors.push('Property "skillPointPool" must be greater than 0');
    }
  } else {
    // Partial validation - only check present properties
    if ('maxAttributes' in settings) {
      if (typeof settings.maxAttributes !== 'number') {
        errors.push('Property "maxAttributes" must be a number when present');
      } else if (settings.maxAttributes <= 0) {
        errors.push('Property "maxAttributes" must be greater than 0');
      }
    }
    
    if ('maxSkills' in settings) {
      if (typeof settings.maxSkills !== 'number') {
        errors.push('Property "maxSkills" must be a number when present');
      } else if (settings.maxSkills <= 0) {
        errors.push('Property "maxSkills" must be greater than 0');
      }
    }
    
    if ('attributePointPool' in settings) {
      if (typeof settings.attributePointPool !== 'number') {
        errors.push('Property "attributePointPool" must be a number when present');
      } else if (settings.attributePointPool <= 0) {
        errors.push('Property "attributePointPool" must be greater than 0');
      }
    }
    
    if ('skillPointPool' in settings) {
      if (typeof settings.skillPointPool !== 'number') {
        errors.push('Property "skillPointPool" must be a number when present');
      } else if (settings.skillPointPool <= 0) {
        errors.push('Property "skillPointPool" must be greater than 0');
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateGeneratedImage(obj: unknown): ValidationResult {
  const errors: string[] = [];
  const validTypes = ['ai-generated', 'placeholder'];

  if (obj === null || obj === undefined) {
    errors.push('GeneratedImage cannot be null or undefined');
    return { valid: false, errors };
  }

  if (typeof obj !== 'object') {
    errors.push(`Expected object, got ${typeof obj}`);
    return { valid: false, errors };
  }

  const image = obj as Record<string, unknown>;

  if (typeof image.type !== 'string' || !validTypes.includes(image.type)) {
    errors.push(`Property "type" must be one of: ${validTypes.join(', ')}`);
  }

  if (image.url !== null && typeof image.url !== 'string') {
    errors.push('Property "url" must be null or a string');
  }

  if (image.generatedAt !== undefined && typeof image.generatedAt !== 'string') {
    errors.push('Property "generatedAt" must be a string when present');
  }

  if (image.prompt !== undefined && typeof image.prompt !== 'string') {
    errors.push('Property "prompt" must be a string when present');
  }

  return { valid: errors.length === 0, errors };
}
