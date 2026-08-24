import { EntityID } from '@/types/common.types';
import { World } from '@/types/world.types';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { generateUniqueId } from '@/lib/utils/generateId';
import { CharacterCreationData } from '@/hooks/useCharacterCreationWizard';

/**
 * Finalizes character creation by transforming wizard data into a complete character
 * and adding it to the character store
 */
export function finalizeCharacterCreation(
  data: CharacterCreationData,
  world: World
): EntityID {
  const { createCharacter } = useCharacterStore.getState();

  const characterId = createCharacter({
    name: data.name,
    description: data.background.history,
    worldId: data.worldId,
    level: 1,
    attributes: data.attributes.map((attr) => {
      const worldAttr = world?.attributes.find(
        (wa) => wa.id === attr.attributeId
      );
      return {
        id: generateUniqueId('attr'),
        characterId: '', // Will be set by store
        worldAttributeId: attr.attributeId, // Store reference to world attribute ID
        name: worldAttr?.name || 'Unknown',
        baseValue: attr.value,
        modifiedValue: attr.value,
        category: worldAttr?.category,
      };
    }),
    skills: data.skills
      .filter((skill) => skill.isSelected)
      .map((skill) => {
        const worldSkill = world?.skills.find((ws) => ws.id === skill.skillId);
        return {
          id: generateUniqueId('skill'),
          characterId: '', // Will be set by store
          worldSkillId: skill.skillId, // Store reference to world skill ID
          name: worldSkill?.name || 'Unknown',
          level: skill.level,
          category: worldSkill?.category,
        };
      }),
    derivedStats: [], // Will be calculated below
    background: {
      history: data.background.history,
      personality: data.background.personality,
      goals: data.background.motivation ? [data.background.motivation] : [],
      fears: [],
      physicalDescription: data.background.physicalDescription || '',
      relationships: [],
    },
    portrait: data.portrait || {
      type: 'placeholder',
      url: null,
    },
    isPlayer: true,
    status: {
      conditions: [],
    },
    inventory: {
      characterId: '', // Will be set by the store
      items: [],
      capacity: 20,
      categories: [],
      itemOrder: [],
    },
  });

  // Calculate derived stats from world formulas
  useCharacterStore.getState().recalculateDerivedStats(characterId);

  // Set as current character
  useCharacterStore.getState().setCurrentCharacter(characterId);

  // Mark character creation tutorial as completed
  useSessionStore.getState().updateTutorialProgress('characterCreation', {
    completed: true,
    skipped: false,
  });

  // Verify the character was set as current
  const currentCharacterId = useCharacterStore.getState().currentCharacterId;

  if (currentCharacterId !== characterId) {
    throw new Error('Failed to set current character after creation');
  }

  return characterId;
}
