/**
 * NarrativeContextGateway
 *
 * Isolates all Zustand store reads into a single module.
 * Returns plain data objects instead of reaching into stores,
 * making the narrative generator easier to test and maintain.
 */

import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import { World } from '@/types/world.types';
import { Character } from '@/types/character.types';
import { NPC } from '@/types/npc.types';
import { InventoryItem } from '@/types/inventory.types';
import { EntityID } from '@/types/common.types';
import { ToneSettings, DEFAULT_TONE_SETTINGS } from '@/types/tone-settings.types';
import { safeTrim } from '@/lib/utils';

export interface WorldData {
  id: string;
  name: string;
  description: string;
  genre: string;
  attributes: World['attributes'];
  skills?: World['skills'];
  settings?: World['settings'];
  toneSettings: ToneSettings;
}

export interface CharacterData {
  id: string;
  name: string;
  background: string | { summary?: string };
  attributes: Record<string, number> | Array<{ attributeId: string; value: number }>;
  skills: Array<{ name: string; level: number; worldSkillId?: string }> | Array<{ skillId: string; level: number }>;
  inventory?: {
    items: Array<{ id: string; equipped?: boolean }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface NPCData {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
}

export interface AIContextData {
  goalContext?: string;
  activeGoals: Array<Record<string, unknown>>;
}

export interface WorldStateData {
  playerCharacterThreads?: Record<string, {
    characterId: string;
    lastUpdated: string;
    crossCharacterReferences?: Array<{
      characterId: string;
      summary: string;
    }>;
  }>;
  characterRelationships?: Record<string, Record<string, unknown>>;
}

export interface EquippedItemData {
  characterId: string;
  equippedItemIds: string[];
}

/**
 * Gateway for accessing narrative context data from stores
 */
export class NarrativeContextGateway {
  /**
   * Get world by ID
   */
  getWorld(worldId: EntityID): WorldData | null {
    try {
      const { worlds } = useWorldStore.getState();
      const world = worlds[worldId];

      if (!world) {
        return null;
      }

      return {
        id: world.id,
        name: world.name,
        description: world.description,
        genre: world.genre,
        attributes: world.attributes,
        skills: world.skills,
        settings: world.settings,
        toneSettings: world.toneSettings || DEFAULT_TONE_SETTINGS,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get current world ID
   */
  getCurrentWorldId(): EntityID | null {
    try {
      return useWorldStore.getState().currentWorldId;
    } catch {
      return null;
    }
  }

  /**
   * Get world state by ID
   */
  getWorldState(worldId: EntityID): WorldStateData | null {
    try {
      const { worldStates } = useWorldStore.getState();
      const worldState = worldStates[worldId];

      if (!worldState) {
        return null;
      }

      return {
        playerCharacterThreads: worldState.playerCharacterThreads,
        characterRelationships: worldState.characterRelationships,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get character by ID
   */
  getCharacter(characterId: EntityID): CharacterData | null {
    try {
      const { characters } = useCharacterStore.getState();
      const character = characters[characterId];

      if (!character) {
        return null;
      }

      return {
        id: character.id,
        name: character.name,
        background: character.background,
        attributes: character.attributes,
        skills: character.skills,
        inventory: character.inventory,
        createdAt: character.createdAt,
        updatedAt: character.updatedAt,
      };
    } catch {
      return null;
    }
  }

  /**
   * Get all characters
   */
  getAllCharacters(): Record<EntityID, CharacterData> {
    try {
      const { characters } = useCharacterStore.getState();
      const result: Record<EntityID, CharacterData> = {};

      for (const [id, character] of Object.entries(characters)) {
        result[id] = {
          id: character.id,
          name: character.name,
          background: character.background,
          attributes: character.attributes,
          skills: character.skills,
          inventory: character.inventory,
          createdAt: character.createdAt,
          updatedAt: character.updatedAt,
        };
      }

      return result;
    } catch {
      return {};
    }
  }

  /**
   * Get AI context for session
   */
  getAIContextForSession(sessionId: EntityID): AIContextData {
    try {
      const aiContext = useAiContextStore.getState().buildContextForSession(sessionId);

      return {
        goalContext: aiContext.goalContext,
        activeGoals: aiContext.activeGoals || [],
      };
    } catch {
      return {
        activeGoals: [],
      };
    }
  }

  /**
   * Get character items from inventory
   */
  getCharacterItems(characterId: EntityID): InventoryItem[] {
    try {
      const { getCharacterItems } = useInventoryStore.getState();
      return getCharacterItems(characterId) || [];
    } catch {
      return [];
    }
  }

  /**
   * Get equipped item IDs for a character
   */
  getEquippedItemIds(characterId: EntityID): string[] {
    try {
      const character = this.getCharacter(characterId);
      if (!character || !character.inventory) {
        return [];
      }

      const inventoryItems = character.inventory.items as Array<{ id: string; equipped?: boolean }>;
      return inventoryItems
        .filter((item) => item?.equipped)
        .map((item) => item.id);
    } catch {
      return [];
    }
  }

  /**
   * Get NPCs by world
   */
  getNPCsByWorld(worldId: EntityID): NPCData[] {
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
  }

  /**
   * Get NPC by ID
   */
  getNPCById(npcId: EntityID): NPC | undefined {
    try {
      const npcStore = useNPCStore.getState();
      if (typeof npcStore.getById !== 'function') {
        return undefined;
      }

      return npcStore.getById(npcId);
    } catch {
      return undefined;
    }
  }

  /**
   * Build NPC roster for a world
   */
  buildNpcRoster(worldId: string): Array<{
    id: string;
    name: string;
    description?: string;
    avatarUrl?: string;
  }> {
    return this.getNPCsByWorld(worldId);
  }

  /**
   * Get other character context for multi-character worlds
   */
  getOtherCharacterContext(
    worldId: EntityID,
    activeCharacterId: EntityID,
    maxThreads: number = 3,
    maxReferences: number = 2,
    threadSummaryLength: number = 160
  ): {
    threads: Array<{
      characterId: string;
      name: string;
      highlight: string;
      relationship?: string;
      recentReferences: Array<{ summary: string }>;
    }>;
  } | null {
    try {
      const worldState = this.getWorldState(worldId);
      if (!worldState?.playerCharacterThreads) {
        return null;
      }

      const threads = Object.values(worldState.playerCharacterThreads)
        .filter((thread) => thread.characterId !== activeCharacterId)
        .sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated))
        .slice(0, maxThreads);

      if (threads.length === 0) {
        return null;
      }

      const characters = this.getAllCharacters();
      const relationshipMap = worldState.characterRelationships?.[activeCharacterId] ?? {};

      const threadData = threads.map((thread) => {
        const name = characters[thread.characterId]?.name ?? `Character ${thread.characterId}`;

        // Note: summarizeThreadHighlight would need to be extracted or injected
        const highlight = 'Thread summary placeholder';

        const relationship = relationshipMap[thread.characterId];
        const relationshipDescriptor = relationship ? String(relationship) : undefined;

        const referencesToActive = thread.crossCharacterReferences?.filter(
          (reference) => reference.characterId === activeCharacterId
        ) ?? [];
        const recentReferences = referencesToActive.slice(-maxReferences).map((ref) => {
          const summary = ref.summary.trim();
          return {
            summary: summary.length > threadSummaryLength
              ? `${summary.slice(0, threadSummaryLength - 3)}...`
              : summary,
          };
        });

        return {
          characterId: thread.characterId,
          name,
          highlight,
          relationship: relationshipDescriptor,
          recentReferences,
        };
      });

      return { threads: threadData };
    } catch {
      return null;
    }
  }

  /**
   * Create or update NPC
   */
  syncNPC(
    npcId: string,
    data: {
      name: string;
      description: string;
      worldId: string;
      avatarUrl?: string;
    }
  ): void {
    try {
      const npcStore = useNPCStore.getState();
      const { getById, createNPC, updateNPC } = npcStore as unknown as {
        getById?: (id: string) => NPC | undefined;
        createNPC?: (npc: Omit<NPC, 'createdAt' | 'updatedAt'> & { id?: string }) => string;
        updateNPC?: (id: string, updates: Partial<NPC>) => void;
      };

      if (
        typeof getById !== 'function' ||
        typeof createNPC !== 'function' ||
        typeof updateNPC !== 'function'
      ) {
        return;
      }

      const id = safeTrim(npcId);
      if (!id) return;

      const existing = getById(id);

      if (existing) {
        const updates: Partial<NPC> = {};
        if (data.name && data.name !== existing.name) {
          updates.name = data.name;
        }
        if (data.description && data.description !== existing.description) {
          updates.description = data.description;
        }
        if (data.avatarUrl && data.avatarUrl !== existing.avatarUrl) {
          updates.avatarUrl = data.avatarUrl;
        }
        if (existing.worldId !== data.worldId) {
          updates.worldId = data.worldId;
        }

        if (Object.keys(updates).length > 0) {
          updateNPC(id, updates);
        }
      } else {
        createNPC({
          id,
          name: data.name,
          description: data.description,
          worldId: data.worldId,
          avatarUrl: data.avatarUrl,
        });
      }
    } catch {
      // NPC synchronization failures should never break narrative generation
    }
  }
}
