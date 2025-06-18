import { DecisionRequirement } from '@/types/narrative.types';

export interface SkillActionMapping {
  skillId: string;
  action: string;
  defaultDifficulty: number;
}

export type DetectedSkillAction = SkillActionMapping;

// Action-to-skill mapping dictionary
const ACTION_SKILL_MAPPINGS: SkillActionMapping[] = [
  // Combat & Intimidation
  { skillId: 'intimidation', action: 'intimidate', defaultDifficulty: 3 },
  { skillId: 'intimidation', action: 'threaten', defaultDifficulty: 3 },
  { skillId: 'intimidation', action: 'menace', defaultDifficulty: 4 },
  
  // Stealth & Movement
  { skillId: 'stealth', action: 'sneak', defaultDifficulty: 3 },
  { skillId: 'stealth', action: 'hide', defaultDifficulty: 2 },
  { skillId: 'stealth', action: 'lurk', defaultDifficulty: 3 },
  { skillId: 'stealth', action: 'slink', defaultDifficulty: 3 },
  
  // Social Skills
  { skillId: 'charisma', action: 'persuade', defaultDifficulty: 3 },
  { skillId: 'charisma', action: 'convince', defaultDifficulty: 3 },
  { skillId: 'charisma', action: 'charm', defaultDifficulty: 4 },
  { skillId: 'charisma', action: 'seduce', defaultDifficulty: 4 },
  { skillId: 'charisma', action: 'negotiate', defaultDifficulty: 3 },
  
  // Athletics & Physical
  { skillId: 'athletics', action: 'climb', defaultDifficulty: 3 },
  { skillId: 'athletics', action: 'jump', defaultDifficulty: 2 },
  { skillId: 'athletics', action: 'leap', defaultDifficulty: 3 },
  { skillId: 'athletics', action: 'sprint', defaultDifficulty: 2 },
  { skillId: 'athletics', action: 'swim', defaultDifficulty: 3 },
  
  // Technology
  { skillId: 'computer-use', action: 'hack', defaultDifficulty: 4 },
  { skillId: 'computer-use', action: 'code', defaultDifficulty: 3 },
  { skillId: 'computer-use', action: 'program', defaultDifficulty: 3 },
  
  // Investigation & Perception
  { skillId: 'investigation', action: 'search', defaultDifficulty: 2 },
  { skillId: 'investigation', action: 'examine', defaultDifficulty: 2 },
  { skillId: 'investigation', action: 'investigate', defaultDifficulty: 3 },
  { skillId: 'investigation', action: 'analyze', defaultDifficulty: 3 },
  
  // Deception
  { skillId: 'deception', action: 'lie', defaultDifficulty: 3 },
  { skillId: 'deception', action: 'deceive', defaultDifficulty: 3 },
  { skillId: 'deception', action: 'bluff', defaultDifficulty: 3 },
  { skillId: 'deception', action: 'mislead', defaultDifficulty: 3 }
];

/**
 * Detects skill-based actions in custom input text
 * Returns array of detected skill actions with their mapping data
 */
export const detectSkillActions = (inputText: string): DetectedSkillAction[] => {
  const lowerText = inputText.toLowerCase();
  const detectedActions: DetectedSkillAction[] = [];
  
  // Check each mapping for presence in the text
  for (const mapping of ACTION_SKILL_MAPPINGS) {
    const actionPattern = new RegExp(`\\b${mapping.action}\\b`, 'i');
    if (actionPattern.test(lowerText)) {
      detectedActions.push(mapping);
    }
  }
  
  return detectedActions;
};

/**
 * Creates a DecisionRequirement from a skill action mapping
 */
export const createSkillRequirement = (
  mapping: SkillActionMapping, 
  customDifficulty?: number
): DecisionRequirement => {
  return {
    type: 'skill',
    targetId: mapping.skillId,
    operator: 'gte',
    value: customDifficulty ?? mapping.defaultDifficulty
  };
};