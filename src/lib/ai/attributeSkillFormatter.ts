/**
 * Attribute and Skill Formatter for Narrative Personalization
 *
 * Converts numeric attribute/skill values to descriptive narrative-friendly labels.
 * Maintains narrative immersion while providing AI context for personalization.
 *
 * FILTERING PHILOSOPHY:
 * - Attributes: Filter to notable only (Exceptional/High/Low/Very Low) to reduce token usage
 * - Skills: Include ALL skills regardless of level - they're player-chosen investments showing intent
 */

import { SKILL_LEVEL_DESCRIPTIONS } from '@/lib/constants/skillLevelDescriptions';

/**
 * Normalized attribute format for internal processing
 */
interface NormalizedAttribute {
  attributeId: string;
  value: number;
}

/**
 * Normalized skill format for internal processing
 *
 * `skillId` is the label that ends up in the prompt, so it holds the skill's
 * display name whenever one is available rather than its world id.
 */
interface NormalizedSkill {
  skillId: string;
  level: number;
}

/**
 * Input attribute type (supports both Record and Array formats from PersonalizationCharacter)
 */
type AttributeInput =
  | Record<string, number>
  | Array<{ attributeId: string; value: number }>;

/**
 * Input skill type (supports both name and skillId formats from PersonalizationCharacter)
 */
type SkillInput =
  | Array<{ name: string; level: number; worldSkillId?: string }>
  | Array<{ skillId: string; level: number }>;

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
    value,
  }));
}

/**
 * Normalize PersonalizationCharacter skills to consistent format
 * Handles varying skill formats from convertToPersonalizationCharacter
 */
export function normalizeSkillArray(skills: SkillInput): NormalizedSkill[] {
  if (!Array.isArray(skills) || skills.length === 0) {
    return [];
  }

  // Check if skills have 'name' property (from Character.skills)
  // Prefer the name over worldSkillId: these strings are read by the model, and
  // a world skill's id is a generated `skill_<uuid>` that says nothing about
  // what the character can do.
  const firstSkill = skills[0];
  if (firstSkill && 'name' in firstSkill) {
    return (
      skills as Array<{ name: string; level: number; worldSkillId?: string }>
    ).map((skill) => ({
      skillId: skill.name || skill.worldSkillId || '',
      level: skill.level,
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
 * Uses the canonical 1-5 skill scale from SKILL_LEVEL_DESCRIPTIONS:
 * - 5: Master - Complete mastery at professional level
 * - 4: Expert - Advanced mastery with consistent results
 * - 3: Competent - Solid performance in most situations
 * - 2: Apprentice - Basic proficiency with room for improvement
 * - 1: Novice - Beginner understanding with limited skill
 */
export function getSkillDescriptor(level: number): string {
  // Clamp to valid range (1-5)
  const clampedLevel = Math.max(1, Math.min(5, Math.round(level)));

  // Find matching description
  const description = SKILL_LEVEL_DESCRIPTIONS.find(
    (desc) => desc.value === clampedLevel
  );

  return description?.label || 'Novice';
}

/**
 * Format attributes for narrative enhancement string
 *
 * Filters out "Moderate" attributes to reduce token usage and focus on notable traits.
 * Returns comma-separated list: "intelligence (Exceptional), strength (Low)"
 */
export function formatAttributesForNarrative(
  attributes: AttributeInput
): string {
  const normalized = normalizeAttributeArray(attributes);

  const notableAttributes = normalized
    .map((attr) => ({
      id: attr.attributeId,
      descriptor: getAttributeDescriptor(attr.value),
    }))
    .filter((attr) => attr.descriptor !== 'Moderate') // Filter out moderate attributes
    .map((attr) => `${attr.id} (${attr.descriptor})`)
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
    .map((skill) => `${skill.skillId} (${getSkillDescriptor(skill.level)})`)
    .join(', ');

  return skillsList;
}

