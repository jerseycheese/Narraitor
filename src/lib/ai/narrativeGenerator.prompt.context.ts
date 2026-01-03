import { useCharacterStore } from '@/state/characterStore';
import type { NarrativeGenerationRequest } from '@/types/narrative.types';
import { DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import type { World } from '@/types/world.types';
import { buildNpcRoster } from './narrativeGenerator.npc';

export const buildNarrativeContext = (
  world: World,
  request: NarrativeGenerationRequest
) => {
  const { characters } = useCharacterStore.getState();
  const playerCharacterId = request.characterIds?.[0];
  const playerCharacter = playerCharacterId ? characters[playerCharacterId] : null;

  const toneSettings = world.toneSettings || DEFAULT_TONE_SETTINGS;
  const npcRoster = buildNpcRoster(world.id);

  const existingImportant = request.narrativeContext?.importantEntities || [];
  const rosterEntities = npcRoster.map((npc) => ({
    id: npc.id,
    type: 'npc' as const,
    name: npc.name,
    description: npc.description,
    avatarUrl: npc.avatarUrl,
  }));

  const combinedImportant = [
    ...existingImportant,
    ...rosterEntities.filter(
      (entity) =>
        !existingImportant.some(
          (existing) =>
            existing.id === entity.id && existing.type === entity.type
        )
    ),
  ];

  const narrativeContextWithRoster = request.narrativeContext
    ? {
        ...request.narrativeContext,
        importantEntities: combinedImportant,
      }
    : undefined;

  const characterSkillContext = '';
  return {
    worldName: world.name,
    worldDescription: world.description,
    genre: world.genre,
    tone: toneSettings.narrativeStyle,
    attributes: world.attributes,
    characterIds: request.characterIds,
    playerCharacterName: playerCharacter?.name,
    playerCharacterBackground: playerCharacter?.background,
    sessionId: request.sessionId,
    narrativeContext: narrativeContextWithRoster,
    generationParameters: request.generationParameters,
    toneSettings,
    npcRoster,
    characterSkillContext,
    worldSkills:
      world.skills?.map((skill) => ({
        id: skill.id,
        name: skill.name,
        description: skill.description,
      })) || [],
  };
};
