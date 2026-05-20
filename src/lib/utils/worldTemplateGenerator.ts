// src/lib/utils/worldTemplateGenerator.ts

import { World, CharacterTemplate } from '@/types/world.types';
import { generateCharacterArchetypes } from './characterArchetypes';
import { generateUniqueId } from './generateId';

import Logger from '@/lib/utils/logger';
const logger = new Logger('WorldTemplateGenerator');

/**
 * Generate character templates for a world using existing archetype logic
 *
 * @param world - World configuration containing genre, attributes, and skills
 * @returns Promise resolving to array of 3 character templates for the world
 * @throws Error if world data is invalid or missing required fields
 *
 * @example
 * ```typescript
 * const templates = await generateWorldCharacterTemplates(world);
 * // Returns 3 genre-appropriate character templates
 * ```
 */
export async function generateWorldCharacterTemplates(
  world: World
): Promise<CharacterTemplate[]> {
  // Validation
  if (!world) {
    throw new Error('World data is required');
  }

  if (!world.genre) {
    throw new Error('World genre is required');
  }

  if (!Array.isArray(world.attributes) || world.attributes.length === 0) {
    throw new Error('World must have attributes defined');
  }

  if (!Array.isArray(world.skills) || world.skills.length === 0) {
    throw new Error('World must have skills defined');
  }

  // Leverage existing generateCharacterArchetypes function
  // This ensures templates match world configuration and genre
  const archetypes = await generateCharacterArchetypes(world, []);

  // Convert archetypes to templates (same structure, different semantic purpose)
  // Use 'template' prefix instead of 'archetype' for IDs
  const templates: CharacterTemplate[] = archetypes.map(archetype => ({
    ...archetype,
    id: generateUniqueId('template')
  }));

  // Verify templates respect world point pools (safety check)
  const attributePointPool = world.settings?.attributePointPool || 0;

  templates.forEach(template => {
    const totalAttributePoints = template.attributes.reduce(
      (sum, attr) => sum + attr.value,
      0
    );

    if (totalAttributePoints > attributePointPool) {
      logger.warn(
        `Template "${template.name}" exceeds attribute point pool: ${totalAttributePoints} > ${attributePointPool}`
      );
    }

    // Note: Skill point calculation is complex due to skill costs varying by level
    // The archetype generator already handles this correctly
  });

  return templates;
}
