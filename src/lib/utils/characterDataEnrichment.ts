// Use the store's Character type since it's more complete
import { useCharacterStore, type CharacterAttribute, type CharacterSkill } from '@/state/characterStore';
import { World } from '@/types/world.types';

type StoreCharacter = ReturnType<typeof useCharacterStore.getState>['characters'][string];

export function enrichCharacterAttributes(character: StoreCharacter, world: World) {
  return character.attributes.map((charAttr: CharacterAttribute) => {
    // Find matching world attribute by ID first (safer), then fallback to name
    const worldAttr = charAttr.worldAttributeId
      ? world.attributes.find(wa => wa.id === charAttr.worldAttributeId)
      : world.attributes.find(wa => wa.name === charAttr.name);

    return {
      id: charAttr.id,
      characterId: character.id,
      name: charAttr.name,
      baseValue: charAttr.baseValue,
      modifiedValue: charAttr.modifiedValue,
      category: charAttr.category || worldAttr?.category || 'General',
      description: worldAttr?.description
    };
  });
}

export function enrichCharacterSkills(character: StoreCharacter, world: World) {
  return character.skills.map((charSkill: CharacterSkill) => {
    // Find matching world skill by ID first (safer), then fallback to name
    const worldSkill = charSkill.worldSkillId
      ? world.skills.find(ws => ws.id === charSkill.worldSkillId)
      : world.skills.find(ws => ws.name === charSkill.name);

    return {
      id: charSkill.id,
      characterId: character.id,
      name: charSkill.name,
      level: charSkill.level,
      category: charSkill.category || worldSkill?.category || 'General',
      difficulty: worldSkill?.difficulty || 'medium' as const,
      description: worldSkill?.description
    };
  });
}
