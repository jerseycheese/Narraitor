import { WorldTemplate, templates } from './worldTemplates';
import { useWorldStore } from '../../state/worldStore';
import { generateUniqueId } from '../utils/generateId';
import { WorldAttribute, WorldSkill } from '../../types/world.types';

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
  
  // Generate a worldId
  const worldId = generateUniqueId('world');
  
  // Create world attributes from template
  const attributes: WorldAttribute[] = template.attributes.map(attr => ({
    id: generateUniqueId('attribute'),
    name: attr.name,
    description: attr.description,
    worldId,
    baseValue: attr.defaultValue,
    minValue: attr.minValue,
    maxValue: attr.maxValue
  }));
  
  // Create world skills from template
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
  
  // Update the world store with the new world
  useWorldStore.setState(state => {
    // Create a copy of the existing state
    const newState = { ...state };
    
    // If worlds object doesn't exist, create it
    if (!newState.worlds) {
      newState.worlds = {};
    }
    
    // Add the new world to the state
    const now = new Date().toISOString();
    newState.worlds[worldId] = {
      id: worldId,
      name: worldName || template.name,
      description: template.description,
      theme: template.theme.name,
      attributes,
      skills,
      settings: {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 30,
        skillPointPool: 36
      },
      createdAt: now,
      updatedAt: now
    };
    
    return newState;
  });

  // Add debug outputs for testing
  console.log(`Applied template ${template.id} to create world ${worldId}`);
  
  return worldId;
};
