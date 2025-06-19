import { useCharacterStore } from '@/state/characterStore';
import { EntityID } from '@/types/common.types';
import { 
  validateName, 
  validateText, 
  validatePointDistribution, 
  validateSelectionCount,
  ValidationResult 
} from '@/lib/utils/validationUtils';

export const validateCharacterName = (name: string, worldId: EntityID): ValidationResult => {
  // Use shared validation for basic name rules
  const basicValidation = validateName(name);
  if (!basicValidation.valid) {
    return basicValidation;
  }
  
  // Check uniqueness within world
  const state = useCharacterStore.getState();
  const characters = state.characters || {};
  const existingCharacters = Object.values(characters).filter(c => c.worldId === worldId);
  if (existingCharacters.some(c => c.name === name)) {
    return {
      valid: false,
      errors: ['A character with this name already exists in this world']
    };
  }
  
  return { valid: true, errors: [] };
};

export const validateAttributes = (
  attributes: Array<{ value: number }>,
  totalPoints: number
): ValidationResult => {
  const values = attributes.map(attr => attr.value);
  return validatePointDistribution(values, totalPoints);
};

export const validateSkills = (
  skills: Array<{ isSelected: boolean }>
): ValidationResult => {
  const selections = skills.map(skill => skill.isSelected);
  const result = validateSelectionCount(selections, {
    minSelections: 1,
    maxSelections: 8,
    fieldName: 'skills'
  });
  
  // Update error messages to match existing test expectations
  const updatedErrors = result.errors.map(error => {
    if (error === 'Select at least 1 skills') {
      return 'Select at least one skill';
    }
    if (error === 'Maximum 8 skills allowed') {
      return 'Maximum 8 skills allowed';
    }
    return error;
  });
  
  return {
    valid: result.valid,
    errors: updatedErrors
  };
};

export const validateBackground = (background: {
  history: string;
  personality: string;
  goals: string[];
  motivation: string;
}): ValidationResult => {
  const historyValidation = validateText(background.history, {
    minLength: 50,
    fieldName: 'Character history'
  });
  
  const personalityValidation = validateText(background.personality, {
    minLength: 20,
    fieldName: 'Personality description'
  });
  
  const allErrors = [...historyValidation.errors, ...personalityValidation.errors];
  
  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
};
