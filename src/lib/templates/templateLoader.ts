import { WorldTemplate, templates } from './worldTemplates';
import { useWorldStore } from '@/state/worldStore';
import { generateUniqueId } from '../utils/generateId';
import { WorldAttribute, WorldSkill } from '../../types/world.types';
import { ensureWorldNpcRoster } from '@/lib/services/worldCreationService';
import { toGenreValue } from '@/lib/constants/genres';

/**
 * Applies a template to create a new world with pre-defined attributes, skills, and relationships
 * @param templateOrId The world template or template ID to apply
 * @param worldName Optional name for the world (defaults to template name if not provided)
 * @returns The ID of the newly created world
 */
export const applyWorldTemplate = (templateOrId: WorldTemplate | string, worldName?: string): string => {
  // Determine if we were passed a template ID or template object
  let template: WorldTemplate;

  if (typeof templateOrId === 'string') {
    // Find the template by ID
    const foundTemplate = templates.find(t => t.id === templateOrId);
    if (!foundTemplate) {
      throw new Error(`Template with ID "${templateOrId}" not found`);
    }
    template = foundTemplate;
  } else {
    template = templateOrId;
  }

  // Step 1: Create world shell with base data, get worldId from store
  const { createWorld, updateWorld } = useWorldStore.getState();
  const worldId = createWorld({
    name: worldName || template.name,
    description: template.description,
    genre: toGenreValue(template.genre),
    attributes: [], // Will be populated in step 2
    skills: [],     // Will be populated in step 2
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 30,
      skillPointPool: 36
    }
  });

  // Step 2: Build attributes and skills with the store-generated worldId
  const attributes: WorldAttribute[] = template.attributes.map(attr => ({
    id: generateUniqueId('attribute'),
    name: attr.name,
    description: attr.description,
    worldId,
    baseValue: attr.defaultValue,
    minValue: attr.minValue,
    maxValue: attr.maxValue
  }));

  const skills: WorldSkill[] = template.skills.map(skill => ({
    id: generateUniqueId('skill'),
    name: skill.name,
    description: skill.description,
    worldId,
    // Convert linkedAttributes array to attributeIds array
    // For now, just use the first attribute in the list if available
    attributeIds: skill.linkedAttributes?.length > 0
      ? [attributes.find(a => a.name === skill.linkedAttributes[0])?.id].filter(Boolean) as string[]
      : undefined,
    difficulty: 'medium', // Default difficulty level
    baseValue: 5, // Default middle value
    minValue: 1, // Fixed min value for MVP
    maxValue: 10, // Fixed max value for MVP
    category: skill.category || 'General' // Use provided category or default to 'General'
  }));

  // Step 3: Update the world with populated attributes and skills
  updateWorld(worldId, { attributes, skills });

  // Ensure starter NPCs exist for this world
  void ensureWorldNpcRoster(worldId);

  return worldId;
};
