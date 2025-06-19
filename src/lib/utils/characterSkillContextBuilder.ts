/**
 * @fileoverview Character Skill Context Builder
 * 
 * Utility for building character skill context information for AI prompt generation.
 * This promotes reusability across different narrative generation components.
 */

import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

export interface SkillContextOptions {
  includeSkillLevels?: boolean;
  includeSkillDescriptions?: boolean;
  formatForPrompt?: boolean;
}

/**
 * Builds a formatted string containing character skill information for AI context
 * 
 * @param character - The character whose skills to include
 * @param world - The world containing skill definitions
 * @param options - Configuration options for context formatting
 * @returns Formatted skill context string or empty string if no skills
 */
export function buildCharacterSkillContext(
  character: Character | null, 
  world: World, 
  options: SkillContextOptions = {}
): string {
  const {
    includeSkillLevels = true,
    includeSkillDescriptions = false,
    formatForPrompt = true
  } = options;

  if (!character || !world.skills || world.skills.length === 0) {
    return '';
  }

  const activeSkills = character.skills.filter(skill => skill.isActive);
  if (activeSkills.length === 0) {
    return '';
  }

  const skillEntries = activeSkills.map(skill => {
    const worldSkill = world.skills?.find(ws => ws.id === skill.skillId);
    const skillName = worldSkill?.name || skill.skillId;
    
    let entry = skillName;
    
    if (includeSkillLevels) {
      entry += `: Level ${skill.level}`;
    }
    
    if (includeSkillDescriptions && worldSkill?.description) {
      entry += ` (${worldSkill.description})`;
    }
    
    return `- ${entry}`;
  });

  if (formatForPrompt) {
    return `\nCHARACTER ABILITIES:\n${skillEntries.join('\n')}`;
  }

  return skillEntries.join('\n');
}

/**
 * Gets a simple array of character skill information for programmatic use
 * 
 * @param character - The character whose skills to extract
 * @param world - The world containing skill definitions
 * @returns Array of skill objects with id, name, level, and description
 */
export function getCharacterSkillInfo(
  character: Character | null,
  world: World
): Array<{
  id: string;
  name: string;
  level: number;
  description?: string;
}> {
  if (!character || !world.skills) {
    return [];
  }

  const activeSkills = character.skills.filter(skill => skill.isActive);
  
  return activeSkills.map(skill => {
    const worldSkill = world.skills?.find(ws => ws.id === skill.skillId);
    return {
      id: skill.skillId,
      name: worldSkill?.name || skill.skillId,
      level: skill.level,
      description: worldSkill?.description
    };
  });
}

/**
 * Checks if a character has any active skills
 * 
 * @param character - The character to check
 * @returns True if character has active skills, false otherwise
 */
export function hasActiveSkills(character: Character | null): boolean {
  return character?.skills.some(skill => skill.isActive) ?? false;
}