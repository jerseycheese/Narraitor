import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UseBoundStore, StoreApi } from 'zustand';
import { EntityID } from '../types/common.types';
import { InventoryItem, InventoryCategory } from '../types/inventory.types';
import { DerivedStat } from '../types/character.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import {
  safeTrim,
  normalizeText,
  NORM_NAME,
  NORM_DESC,
  getTimestamp,
} from '@/lib/utils';
import { UserFriendlyError, createStoreError } from '@/lib/utils/errorUtils';
import { CrudStore } from './createCrudStore';
import { calculateDerivedStat } from '@/lib/utils/derivedStatCalculator';

// Module caches for dynamic imports to break circular dependencies
let inventoryStoreModule: typeof import('./inventoryStore') | null = null;
let worldStoreModule: typeof import('./worldStore') | null = null;

// Simplified character types for MVP implementation
export interface CharacterAttribute {
  id: EntityID;
  characterId: EntityID;
  worldAttributeId?: EntityID; // Reference to world attribute for safer matching
  name: string;
  baseValue: number;
  modifiedValue: number;
  category?: string;
}

export interface CharacterSkill {
  id: EntityID;
  characterId: EntityID;
  worldSkillId?: EntityID; // Reference to world skill for safer matching
  name: string;
  level: number;
  category?: string;
}

// Note: DerivedStat is imported from character.types.ts

interface CharacterBackground {
  history: string;
  personality: string;
  goals: string[];
  fears: string[];
  physicalDescription?: string;
  relationships: unknown[];
  isKnownFigure?: boolean;
  knownFigureType?:
    | 'historical'
    | 'fictional'
    | 'celebrity'
    | 'mythological'
    | 'other';
}

interface CharacterStatus {
  health: number;
  maxHealth: number;
  conditions: string[];
  location?: string;
}

export interface Character {
  id: EntityID;
  name: string;
  description: string;
  worldId: EntityID;
  level: number;
  attributes: CharacterAttribute[];
  skills: CharacterSkill[];
  derivedStats: DerivedStat[];
  background: CharacterBackground;
  isPlayer: boolean;
  status: CharacterStatus;
  inventory: {
    characterId: EntityID;
    items: InventoryItem[];
    capacity: number;
    categories: InventoryCategory[];
    itemOrder: EntityID[];
  };
  portrait?: {
    type: 'ai-generated' | 'placeholder';
    url: string | null;
    generatedAt?: string;
    prompt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const addCharacterToRoster = (
  rosters: Record<EntityID, EntityID[]>,
  worldId: EntityID,
  characterId: EntityID
): Record<EntityID, EntityID[]> => {
  const existingRoster = rosters[worldId] ?? [];
  if (existingRoster.includes(characterId)) {
    return rosters;
  }

  return {
    ...rosters,
    [worldId]: [...existingRoster, characterId],
  };
};

const removeCharacterFromRoster = (
  rosters: Record<EntityID, EntityID[]>,
  worldId: EntityID,
  characterId: EntityID
): Record<EntityID, EntityID[]> => {
  const existingRoster = rosters[worldId];
  if (!existingRoster) {
    return rosters;
  }

  const filteredRoster = existingRoster.filter((id) => id !== characterId);
  if (filteredRoster.length === existingRoster.length) {
    return rosters;
  }

  if (filteredRoster.length === 0) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [worldId]: _removedRoster, ...remainingRosters } = rosters;
    return remainingRosters;
  }

  return {
    ...rosters,
    [worldId]: filteredRoster,
  };
};

const buildWorldCharacterIds = (
  characters: Record<EntityID, Character>
): Record<EntityID, EntityID[]> => {
  const rosters: Record<EntityID, EntityID[]> = {};

  Object.values(characters).forEach((character) => {
    if (!character || !character.worldId) {
      return;
    }

    if (!rosters[character.worldId]) {
      rosters[character.worldId] = [];
    }

    rosters[character.worldId].push(character.id);
  });

  return rosters;
};

/**
 * Character store interface with state and actions
 */
export interface CharacterStore extends CrudStore<Character> {
  // State
  characters: Record<EntityID, Character>;
  currentCharacterId: EntityID | null;
  error: UserFriendlyError | null;
  loading: boolean;
  worldCharacterIds: Record<EntityID, EntityID[]>;
  syncDerivedState: () => void;

  // Actions
  createCharacter: (
    character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>
  ) => EntityID;
  updateCharacter: (id: EntityID, updates: Partial<Character>) => void;
  deleteCharacter: (id: EntityID) => Promise<void>;
  setCurrentCharacter: (id: EntityID) => void;

  // Queries
  getCharactersByWorld: (worldId: EntityID) => Character[];
  getWorldRoster: (worldId: EntityID) => EntityID[];

  // Attribute management
  addAttribute: (
    characterId: EntityID,
    attribute: Omit<CharacterAttribute, 'id' | 'characterId'>
  ) => Promise<void>;
  updateAttribute: (
    characterId: EntityID,
    attributeId: EntityID,
    updates: Partial<CharacterAttribute>
  ) => Promise<void>;
  removeAttribute: (characterId: EntityID, attributeId: EntityID) => Promise<void>;

  // Skill management
  addSkill: (
    characterId: EntityID,
    skill: Omit<CharacterSkill, 'id' | 'characterId'>
  ) => void;

  // Derived stats management
  recalculateDerivedStats: (characterId: EntityID) => Promise<void>;

  // Path Count Optimization
  cleanupCharacterHistory: (
    worldId?: EntityID,
    keepRecentCount?: number
  ) => void;
  compactCharacterData: () => void;
  getCharactersCount: (worldId?: EntityID) => number;

  // Cascading delete helper
  deleteCharactersInWorld: (worldId: EntityID) => Promise<void>;

  // State management
  reset: () => void;
  setError: (error: UserFriendlyError | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const getInitialState = () => ({
  characters: {},
  entities: {},
  worldCharacterIds: {},
  currentCharacterId: null,
  currentEntityId: null,
  error: null,
  loading: false,
});

// Character Store implementation with persistence
export const useCharacterStore: UseBoundStore<StoreApi<CharacterStore>> =
  create<CharacterStore>()(
    persist(
      (set, get) => {
        return {
          characters: {},
          entities: {},
          worldCharacterIds: {},
          currentCharacterId: null,
          currentEntityId: null,
          error: null,
          loading: false,

          create: (characterData) => {
            if (!characterData.name || safeTrim(characterData.name) === '') {
              throw new Error('Character name is required');
            }

            const characterId = generateUniqueId('char');
            const now = getTimestamp();

            const normalizedBackground = characterData.background
              ? {
                  ...characterData.background,
                  physicalDescription: characterData.background
                    .physicalDescription
                    ? normalizeText(
                        characterData.background.physicalDescription,
                        NORM_DESC
                      )
                    : undefined,
                  personality: normalizeText(
                    characterData.background.personality || '',
                    NORM_DESC
                  ),
                  history: normalizeText(
                    characterData.background.history || '',
                    NORM_DESC
                  ),
                }
              : characterData.background;

            const normalizedName = normalizeText(characterData.name, NORM_NAME);

            const attributes =
              characterData.attributes?.map((attr) => ({
                ...attr,
                characterId,
              })) || [];

            const skills =
              characterData.skills?.map((skill) => ({
                ...skill,
                characterId,
              })) || [];

            const derivedStats = characterData.derivedStats || [];

            const inventory = {
              ...characterData.inventory,
              characterId,
            };

            const newCharacter: Character = {
              ...characterData,
              id: characterId,
              name: normalizedName,
              background: normalizedBackground,
              inventory,
              attributes,
              skills,
              derivedStats,
              level: characterData.level || 1,
              createdAt: now,
              updatedAt: now,
            };

            set((state) => ({
              characters: {
                ...state.characters,
                [characterId]: newCharacter,
              },
              entities: {
                ...state.entities,
                [characterId]: newCharacter,
              },
              worldCharacterIds: addCharacterToRoster(
                state.worldCharacterIds ?? {},
                newCharacter.worldId,
                characterId
              ),
              error: null,
            }));

            return characterId;
          },

          update: (id, updates) => {
            const character = get().characters[id];
            if (!character) {
              set({
                error: createStoreError(
                  'Character Not Found',
                  'The specified character could not be found'
                ),
              });
              return;
            }

            const previousWorldId = character.worldId;

            const normalizedUpdates: Partial<Character> = { ...updates };

            if (updates?.name) {
              normalizedUpdates.name = normalizeText(updates.name, NORM_NAME);
            }

            if (updates?.background) {
              const mergedBackground = {
                ...character.background,
                ...updates.background,
              };

              normalizedUpdates.background = {
                ...mergedBackground,
                physicalDescription: mergedBackground.physicalDescription
                  ? normalizeText(
                      mergedBackground.physicalDescription,
                      NORM_DESC
                    )
                  : undefined,
                personality: normalizeText(
                  mergedBackground.personality || '',
                  NORM_DESC
                ),
                history: normalizeText(
                  mergedBackground.history || '',
                  NORM_DESC
                ),
              };
            }

            if (updates?.inventory) {
              normalizedUpdates.inventory = {
                ...character.inventory,
                ...updates.inventory,
                characterId: id,
              };
            }

            const updatedCharacter: Character = {
              ...character,
              ...normalizedUpdates,
              inventory: normalizedUpdates.inventory ?? character.inventory,
              background: normalizedUpdates.background ?? character.background,
              updatedAt: getTimestamp(),
            };

            set((state) => {
              const nextCharacters = {
                ...state.characters,
                [id]: updatedCharacter,
              };

              let nextWorldCharacterIds = state.worldCharacterIds ?? {};
              if (previousWorldId !== updatedCharacter.worldId) {
                const withoutPrevious = removeCharacterFromRoster(
                  nextWorldCharacterIds,
                  previousWorldId,
                  id
                );
                nextWorldCharacterIds = addCharacterToRoster(
                  withoutPrevious,
                  updatedCharacter.worldId,
                  id
                );
              }

              return {
                characters: nextCharacters,
                entities: {
                  ...state.entities,
                  [id]: updatedCharacter,
                },
                worldCharacterIds: nextWorldCharacterIds,
                error: null,
              };
            });
          },

          delete: async (id) => {
            const character = get().characters[id];
            if (!character) {
              return;
            }

            // Clean up related data before deleting character
            try {
              if (!inventoryStoreModule) {
                inventoryStoreModule = await import('./inventoryStore');
              }
              const { useInventoryStore } = inventoryStoreModule;
              const inventoryStore = useInventoryStore.getState();
              inventoryStore.clearCharacterInventory(id);
            } catch (error) {
              console.warn(
                'Failed to clean up inventory for deleted character',
                error
              );
            }

            set((state) => {
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { [id]: _removedCharacter, ...remainingCharacters } =
                state.characters;
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              const { [id]: _removedEntity, ...remainingEntities } =
                state.entities;
              const isCurrent =
                state.currentCharacterId === id || state.currentEntityId === id;

              return {
                characters: remainingCharacters,
                entities: remainingEntities,
                worldCharacterIds: removeCharacterFromRoster(
                  state.worldCharacterIds ?? {},
                  character.worldId,
                  id
                ),
                currentCharacterId: isCurrent ? null : state.currentCharacterId,
                currentEntityId: isCurrent ? null : state.currentEntityId,
                error: null,
              };
            });
          },

          setCurrent: (id) => {
            if (id && !get().characters[id]) {
              set({
                error: createStoreError(
                  'Character Not Found',
                  'The specified character could not be found'
                ),
                currentCharacterId: null,
                currentEntityId: null,
              });
              return;
            }

            set({
              currentCharacterId: id,
              currentEntityId: id,
              error: null,
            });
          },

          getById: (id) => get().characters[id],
          getAll: () => Object.values(get().characters),
          getCharactersByWorld: (worldId) => {
            const { characters, worldCharacterIds } = get();
            const roster = worldCharacterIds[worldId] ?? [];
            return roster
              .map((characterId) => characters[characterId])
              .filter((char): char is Character => Boolean(char));
          },
          getWorldRoster: (worldId) => {
            const { worldCharacterIds } = get();
            return [...(worldCharacterIds[worldId] ?? [])];
          },

          reset: () => set(getInitialState()),

          setError: (error) => set({ error }),

          clearError: () => set({ error: null }),
          setLoading: (loading) => set({ loading }),
          syncDerivedState: () => {
            set((state) => {
              const characters =
                state.characters && typeof state.characters === 'object'
                  ? state.characters
                  : {};

              const hasCharacters = Object.keys(characters).length > 0;

              const isValidCharacterId = (id: EntityID | null | undefined) =>
                Boolean(id && characters[id]);

              const validCurrentCharacterId = isValidCharacterId(
                state.currentCharacterId
              )
                ? state.currentCharacterId
                : null;

              const validCurrentEntityId = isValidCharacterId(
                state.currentEntityId
              )
                ? state.currentEntityId
                : null;

              const fallbackId =
                validCurrentCharacterId ?? validCurrentEntityId ?? null;

              const nextCurrentCharacterId =
                validCurrentCharacterId ?? fallbackId;
              const nextCurrentEntityId = validCurrentEntityId ?? fallbackId;

              return {
                characters: hasCharacters ? characters : {},
                entities: { ...characters },
                worldCharacterIds: hasCharacters
                  ? buildWorldCharacterIds(
                      characters as Record<EntityID, Character>
                    )
                  : {},
                currentCharacterId: hasCharacters
                  ? nextCurrentCharacterId
                  : null,
                currentEntityId: hasCharacters ? nextCurrentEntityId : null,
                error: state.error ?? null,
                loading: state.loading ?? false,
              };
            });
          },

          // Domain-specific aliases
          createCharacter: (characterData) => get().create(characterData),
          updateCharacter: (id, updates) => get().update(id, updates),
          deleteCharacter: async (id) => await get().delete(id),
          setCurrentCharacter: (id) => get().setCurrent(id),

          // Attribute management
          addAttribute: async (characterId, attributeData) => {
            const character = get().characters[characterId];
            if (!character) {
              set({
                error: createStoreError(
                  'Character Not Found',
                  'The specified character could not be found'
                ),
              });
              return;
            }

            const attributeId = generateUniqueId('attr');
            const newAttribute: CharacterAttribute = {
              ...attributeData,
              id: attributeId,
              characterId,
            };

            get().update(characterId, {
              attributes: [...character.attributes, newAttribute],
            });

            // Recalculate derived stats after attribute change
            await get().recalculateDerivedStats(characterId);
          },

          updateAttribute: async (characterId, attributeId, updates) => {
            const character = get().characters[characterId];
            if (!character) {
              set({
                error: createStoreError(
                  'Character Not Found',
                  'The specified character could not be found'
                ),
              });
              return;
            }

            const updatedAttributes =
              character.attributes?.map((attr) =>
                attr.id === attributeId ? { ...attr, ...updates } : attr
              ) || [];

            get().update(characterId, {
              attributes: updatedAttributes,
            });

            // Recalculate derived stats after attribute change
            await get().recalculateDerivedStats(characterId);
          },

          removeAttribute: async (characterId, attributeId) => {
            const character = get().characters[characterId];
            if (!character) {
              set({
                error: createStoreError(
                  'Character Not Found',
                  'The specified character could not be found'
                ),
              });
              return;
            }

            const filteredAttributes =
              character.attributes?.filter((attr) => attr.id !== attributeId) ||
              [];

            get().update(characterId, {
              attributes: filteredAttributes,
            });

            // Recalculate derived stats after attribute change
            await get().recalculateDerivedStats(characterId);
          },

          // Skill management
          addSkill: (characterId, skillData) => {
            const character = get().characters[characterId];
            if (!character) {
              set({
                error: createStoreError(
                  'Character Not Found',
                  'The specified character could not be found'
                ),
              });
              return;
            }

            if ((character.skills?.length || 0) >= 2) {
              set({
                error: createStoreError(
                  'Maximum Skills Reached',
                  'This character has reached its maximum number of skills'
                ),
              });
              return;
            }

            const skillId = generateUniqueId('skill');
            const newSkill: CharacterSkill = {
              ...skillData,
              id: skillId,
              characterId,
            };

            get().update(characterId, {
              skills: [...character.skills, newSkill],
            });
          },

          // Derived stats management
          recalculateDerivedStats: async (characterId) => {
            const character = get().characters[characterId];
            if (!character) {
              set({
                error: createStoreError(
                  'Character Not Found',
                  'The specified character could not be found'
                ),
              });
              return;
            }

            let world;
            try {
              if (!worldStoreModule) {
                worldStoreModule = await import('./worldStore');
              }
              const { useWorldStore } = worldStoreModule;
              world = useWorldStore.getState().worlds[character.worldId];
            } catch (error) {
              console.warn('Failed to load worldStore for derived stats', error);
              get().update(characterId, { derivedStats: [] });
              return;
            }
            if (
              !world?.settings?.derivedStatFormulas ||
              world.settings.derivedStatFormulas.length === 0
            ) {
              get().update(characterId, { derivedStats: [] });
              return;
            }

            const formulas = world.settings.derivedStatFormulas;
            const currentDerivedStats = character.derivedStats || [];

            const updatedDerivedStats: DerivedStat[] = formulas.map(
              (formula) => {
                const existingStat = currentDerivedStats.find(
                  (s) => s.derivedStatId === formula.id
                );
                const newMaxValue = calculateDerivedStat(
                  formula,
                  character.attributes
                );

                let newCurrentValue: number;
                if (existingStat && existingStat.maxValue > 0) {
                  // Preserve ratio when recalculating
                  const ratio =
                    existingStat.currentValue / existingStat.maxValue;
                  newCurrentValue = Math.round(newMaxValue * ratio);
                } else {
                  // Initialize to max for new stats
                  newCurrentValue = newMaxValue;
                }

                return {
                  id: existingStat?.id || generateUniqueId('dstat'),
                  characterId,
                  derivedStatId: formula.id,
                  name: formula.name,
                  currentValue: newCurrentValue,
                  maxValue: newMaxValue,
                  lastCalculated: getTimestamp(),
                };
              }
            );

            get().update(characterId, { derivedStats: updatedDerivedStats });
          },

          cleanupCharacterHistory: (worldId, keepRecentCount = 10) => {
            set((state) => {
              let charactersToProcess = Object.values(state.characters);

              if (worldId) {
                charactersToProcess = charactersToProcess.filter(
                  (char) => char.worldId === worldId
                );
              }

              if (charactersToProcess.length <= keepRecentCount) {
                return state;
              }

              const sortedCharacters = charactersToProcess.sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              );

              const removedCharacters = sortedCharacters.slice(keepRecentCount);
              const idsToRemove = new Set(
                removedCharacters.map((char) => char.id)
              );

              const newCharacters = Object.fromEntries(
                Object.entries(state.characters).filter(
                  ([id]) => !idsToRemove.has(id)
                )
              );

              return {
                characters: newCharacters,
                entities: newCharacters,
                worldCharacterIds: buildWorldCharacterIds(
                  newCharacters as Record<EntityID, Character>
                ),
                currentCharacterId:
                  state.currentCharacterId &&
                  idsToRemove.has(state.currentCharacterId)
                    ? null
                    : state.currentCharacterId,
                currentEntityId:
                  state.currentEntityId &&
                  idsToRemove.has(state.currentEntityId)
                    ? null
                    : state.currentEntityId,
              };
            });
          },

          compactCharacterData: () => {
            set((state) => {
              const compactedCharacters: Record<EntityID, Character> = {};

              Object.entries(state.characters).forEach(([id, character]) => {
                compactedCharacters[id] = {
                  ...character,
                  attributes: character.attributes?.slice(0, 6) || [],
                  skills: character.skills?.slice(0, 5) || [],
                  background: {
                    ...character.background,
                    goals: character.background.goals?.slice(0, 3) || [],
                    fears: character.background.fears?.slice(0, 3) || [],
                    relationships: [],
                  },
                };
              });

              return {
                characters: compactedCharacters,
                entities: compactedCharacters,
                worldCharacterIds: buildWorldCharacterIds(
                  compactedCharacters as Record<EntityID, Character>
                ),
              };
            });
          },

          getCharactersCount: (worldId) => {
            const { characters } = useCharacterStore.getState();
            if (worldId) {
              return Object.values(characters).filter(
                (char) => char.worldId === worldId
              ).length;
            }
            return Object.keys(characters).length;
          },

          deleteCharactersInWorld: async (worldId) => {
            const state = get();
            const charactersInWorld = Object.entries(state.characters)
              .filter(([, char]) => char.worldId === worldId)
              .map(([id]) => id);

            // Clean up inventory for all characters in the world
            try {
              if (!inventoryStoreModule) {
                inventoryStoreModule = await import('./inventoryStore');
              }
              const { useInventoryStore } = inventoryStoreModule;
              const inventoryStore = useInventoryStore.getState();
              charactersInWorld.forEach((characterId) => {
                inventoryStore.clearCharacterInventory(characterId);
              });
            } catch (error) {
              console.warn(
                'Failed to clean up inventory for deleted world characters',
                error
              );
            }

            set((state) => {
              const charactersToKeep = Object.fromEntries(
                Object.entries(state.characters).filter(
                  ([, char]) => char.worldId !== worldId
                )
              );

              const shouldResetCurrent =
                state.currentCharacterId &&
                state.characters[state.currentCharacterId]?.worldId === worldId;

              return {
                characters: charactersToKeep,
                entities: charactersToKeep,
                worldCharacterIds: buildWorldCharacterIds(
                  charactersToKeep as Record<EntityID, Character>
                ),
                currentCharacterId: shouldResetCurrent
                  ? null
                  : state.currentCharacterId,
                currentEntityId: shouldResetCurrent
                  ? null
                  : state.currentEntityId,
              };
            });
          },
        };
      },
      {
        name: 'narraitor-character-store',
        storage: createIndexedDBStorage(),
        version: 3, // Incremented to clear old migrated data
        onRehydrateStorage: () => (state, error) => {
          if (error) {
            console.error('[CharacterStore] Failed to rehydrate state', error);
            return;
          }
          state?.syncDerivedState?.();
        },
        migrate: (persistedState) => persistedState || getInitialState(), // Preserve data, only clear if null
      }
    )
  );

// Expose store globally in development for testing and debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).useCharacterStore = useCharacterStore;
}
