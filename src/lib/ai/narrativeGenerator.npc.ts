import { useNPCStore } from '@/state/npcStore';
import type { NPC } from '@/types/npc.types';
import type { GeneratedCharacterMetadata } from '@/types/narrative.types';
import { safeTrim } from '@/lib/utils';

export const buildNpcRoster = (worldId: string): Array<{
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
}> => {
  try {
    const npcState = useNPCStore.getState();
    if (!npcState || typeof npcState.getNPCsByWorld !== 'function') {
      return [];
    }

    const npcs = npcState.getNPCsByWorld(worldId) || [];
    return npcs.map((npc) => ({
      id: npc.id,
      name: npc.name,
      description: npc.description || undefined,
      avatarUrl: npc.avatarUrl || undefined,
    }));
  } catch {
    return [];
  }
};

export const syncNpcMetadata = (
  worldId: string,
  characters?: GeneratedCharacterMetadata[]
) => {
  if (!worldId || !characters || characters.length === 0) {
    return;
  }

  try {
    const npcStore = useNPCStore.getState();
    const { getById, createNPC, updateNPC } = npcStore as unknown as {
      getById?: (id: string) => NPC | undefined;
      createNPC?: (
        npc: Omit<NPC, 'createdAt' | 'updatedAt'> & { id?: string }
      ) => string;
      updateNPC?: (id: string, updates: Partial<NPC>) => void;
    };

    if (
      typeof getById !== 'function' ||
      typeof createNPC !== 'function' ||
      typeof updateNPC !== 'function'
    ) {
      return;
    }

    characters.forEach((character) => {
      if (!character?.id || !character.name) {
        return;
      }

      const id = safeTrim(character.id);
      if (!id) return;

      const existing = getById(id);
      const description =
        character.description ||
        character.role ||
        'Supporting character encountered during the narrative.';

      const avatarUrl = getCharacterAvatarUrl(character);

      if (existing) {
        const updates: Partial<NPC> = {};
        if (character.name && character.name !== existing.name) {
          updates.name = character.name;
        }
        if (description && description !== existing.description) {
          updates.description = description;
        }
        if (avatarUrl && avatarUrl !== existing.avatarUrl) {
          updates.avatarUrl = avatarUrl;
        }
        if (existing.worldId !== worldId) {
          updates.worldId = worldId;
        }

        if (Object.keys(updates).length > 0) {
          updateNPC(id, updates);
        }
      } else {
        createNPC({
          id,
          name: character.name,
          description,
          worldId,
          avatarUrl,
        });
      }
    });
  } catch {
    // NPC synchronization failures should never break narrative generation
  }
};

const getCharacterAvatarUrl = (
  character: GeneratedCharacterMetadata
): string | undefined => {
  if (character.avatarUrl && safeTrim(character.avatarUrl)) {
    return safeTrim(character.avatarUrl);
  }

  return undefined;
};
