import { characterStore } from '@/state/characterStore';
import { EntityID } from '@/types/common.types';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const validateCharacterName = (name: string, worldId: EntityID): ValidationResult => {
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
    
    // Check uniqueness within world
    const { characters } = characterStore.getState();
    const existingCharacters = Object.values(characters).filter(c => c.worldId === worldId);
    if (existingCharacters.some(c => c.name === name)) {
      errors.push('A character with this name already exists in this world');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateAttributes = (
  attributes: Array<{ value: number }>,
  totalPoints: number
): ValidationResult => {
  const errors: string[] = [];
  
  const pointsSpent = attributes.reduce((sum, attr) => sum + attr.value, 0);
  if (pointsSpent !== totalPoints) {
    errors.push(`Must spend exactly ${totalPoints} points (${pointsSpent} spent)`);
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateSkills = (
  skills: Array<{ isSelected: boolean }>
): ValidationResult => {
  const errors: string[] = [];
  
  const selectedSkills = skills.filter(s => s.isSelected);
  if (selectedSkills.length === 0) {
    errors.push('Select at least one skill');
  } else if (selectedSkills.length > 8) {
    errors.push('Maximum 8 skills allowed');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

export const validateBackground = (background: {
  history: string;
  personality: string;
  goals: string[];
  motivation: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  if (!background.history || background.history.length < 50) {
    errors.push('Character history must be at least 50 characters');
  }
  
  if (!background.personality || background.personality.length < 20) {
    errors.push('Personality description must be at least 20 characters');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};