/**
 * Attribute and Skill Formatter for Narrative Personalization
 *
 * Converts numeric attribute/skill values to descriptive narrative-friendly labels.
 * Maintains narrative immersion while providing AI context for personalization.
 */

/**
 * Normalized attribute format for internal processing
 */
interface NormalizedAttribute {
  attributeId: string;
  value: number;
}

/**
 * Normalized skill format for internal processing
 */
interface NormalizedSkill {
  skillId: string;
  level: number;
}

/**
 * Input attribute type (supports both Record and Array formats from PersonalizationCharacter)
 */
type AttributeInput = Record<string, number> | Array<{ attributeId: string; value: number }>;

/**
 * Input skill type (supports both name and skillId formats from PersonalizationCharacter)
 */
type SkillInput = Array<{ name: string; level: number; worldSkillId?: string }> | Array<{ skillId: string; level: number }>;

/**
 * Normalize PersonalizationCharacter attributes to consistent array format
 * Handles both Record<string, number> and Array<{ attributeId: string; value: number }>
 */
export function normalizeAttributeArray(
  attributes: AttributeInput
): NormalizedAttribute[] {
  if (Array.isArray(attributes)) {
    return attributes;
  }

  // Convert Record to Array
  return Object.entries(attributes).map(([attributeId, value]) => ({
    attributeId,
    value
  }));
}

/**
 * Normalize PersonalizationCharacter skills to consistent format
 * Handles varying skill formats from convertToPersonalizationCharacter
 */
export function normalizeSkillArray(
  skills: SkillInput
): NormalizedSkill[] {
  if (!Array.isArray(skills) || skills.length === 0) {
    return [];
  }

  // Check if skills have 'name' property (from Character.skills)
  const firstSkill = skills[0] as any;
  if ('name' in firstSkill) {
    return (skills as Array<{ name: string; level: number; worldSkillId?: string }>).map(skill => ({
      skillId: skill.worldSkillId || skill.name,
      level: skill.level
    }));
  }

  // Already in skillId format
  return skills as NormalizedSkill[];
}

/**
 * Convert attribute numeric value to descriptive label
 *
 * Scale:
 * - 9-10: Exceptional
 * - 7-8: High
 * - 4-6: Moderate (filtered out in narrative)
 * - 2-3: Low
 * - 1: Very Low
 */
export function getAttributeDescriptor(value: number): string {
  // Handle invalid/out of range values
  if (value < 1 || value > 10) return 'Moderate';

  if (value >= 9) return 'Exceptional';
  if (value >= 7) return 'High';
  if (value >= 4) return 'Moderate';
  if (value >= 2) return 'Low';
  return 'Very Low';
}

/**
 * Convert skill level to descriptive label
 *
 * Scale:
 * - 9-10: Master
 * - 7-8: Expert
 * - 5-6: Proficient
 * - 3-4: Trained
 * - 1-2: Novice
 */
export function getSkillDescriptor(level: number): string {
  // Handle invalid/out of range values
  if (level < 1 || level > 10) return 'Novice';

  if (level >= 9) return 'Master';
  if (level >= 7) return 'Expert';
  if (level >= 5) return 'Proficient';
  if (level >= 3) return 'Trained';
  return 'Novice';
}

/**
 * Format attributes for narrative enhancement string
 *
 * Filters out "Moderate" attributes to reduce token usage and focus on notable traits.
 * Returns comma-separated list: "intelligence (Exceptional), strength (Low)"
 */
export function formatAttributesForNarrative(attributes: AttributeInput): string {
  const normalized = normalizeAttributeArray(attributes);

  const notableAttributes = normalized
    .map(attr => ({
      id: attr.attributeId,
      descriptor: getAttributeDescriptor(attr.value)
    }))
    .filter(attr => attr.descriptor !== 'Moderate') // Filter out moderate attributes
    .map(attr => `${attr.id} (${attr.descriptor})`)
    .join(', ');

  return notableAttributes;
}

/**
 * Format skills for narrative enhancement string
 *
 * Includes all skills (player-chosen, intentional builds).
 * Returns comma-separated list: "lockpicking (Expert), stealth (Proficient)"
 */
export function formatSkillsForNarrative(skills: SkillInput): string {
  const normalized = normalizeSkillArray(skills);

  const skillsList = normalized
    .map(skill => `${skill.skillId} (${getSkillDescriptor(skill.level)})`)
    .join(', ');

  return skillsList;
}
