import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UseBoundStore, StoreApi } from 'zustand';
import { EntityID } from '../types/common.types';
import { DerivedStat } from '../types/character.types';
import { DerivedStatFormula } from '../types/world.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { useWorldStore } from './worldStore';
import {
  safeTrim,
  normalizeText,
  NORM_NAME,
  NORM_DESC,
  getTimestamp,
} from '@/lib/utils';
import { UserFriendlyError, createStoreError } from '@/lib/utils/errorUtils';
import { CrudStore } from './crudStore.types';
import { calculateDerivedStat } from '@/lib/utils/derivedStatCalculator';
import { storeEvents, StoreEventTypes, type CharacterDeletedEvent, type WorldDeletedEvent } from '@/lib/state/storePubSub';

import Logger from '@/lib/utils/logger';
const logger = new Logger('CharacterStore');

// StoreCharacter shapes live in characterStore.types.ts so lib code can import
// them without pulling in the store module. Re-exported here to keep the
// existing import surface working.
import type { StoreCharacter, CharacterAttribute, CharacterSkill } from './characterStore.types';
import { shouldExposeStoreOnWindow } from '@/lib/utils/shouldExposeStoreOnWindow';
export type { StoreCharacter, CharacterAttribute, CharacterSkill } from './characterStore.types';

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
    const { [worldId]: _removedRoster, ...remainingRosters } = rosters;
    return remainingRosters;
  }

  return {
    ...rosters,
    [worldId]: filteredRoster,
  };
};

const buildWorldCharacterIds = (
  characters: Record<EntityID, StoreCharacter>
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
export interface CharacterStore extends CrudStore<StoreCharacter> {
  // State
  characters: Record<EntityID, StoreCharacter>;
  currentCharacterId: EntityID | null;
  error: UserFriendlyError | null;
  loading: boolean;
  worldCharacterIds: Record<EntityID, EntityID[]>;
  syncDerivedState: () => void;

  // Actions
  createCharacter: (
    character: Omit<StoreCharacter, 'id' | 'createdAt' | 'updatedAt'>
  ) => EntityID;
  updateCharacter: (id: EntityID, updates: Partial<StoreCharacter>) => void;
  /** Shift the lawful/chaotic alignment axis by delta, clamped to -100..100. */
  applyAlignmentShift: (characterId: EntityID, delta: number) => void;
  /** A condition the world imposed; no-op if the character already carries it. */
  addCondition: (characterId: EntityID, condition: string) => void;
  /** Clears a condition by text, case-insensitively. */
  removeCondition: (characterId: EntityID, condition: string) => void;
  deleteCharacter: (id: EntityID) => Promise<void>;
  setCurrentCharacter: (id: EntityID) => void;

  // Queries
  getCharactersByWorld: (worldId: EntityID) => StoreCharacter[];
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
const sameCondition = (a: string, b: string): boolean =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

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

            const newCharacter: StoreCharacter = {
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

            const normalizedUpdates: Partial<StoreCharacter> = { ...updates };

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

            const updatedCharacter: StoreCharacter = {
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

            // Emit event for other stores to handle cleanup
            storeEvents.emit<CharacterDeletedEvent>(StoreEventTypes.CHARACTER_DELETED, {
              characterId: id,
            });

            set((state) => {
              const { [id]: _removedCharacter, ...remainingCharacters } =
                state.characters;
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
              .filter((char): char is StoreCharacter => Boolean(char));
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
                      characters as Record<EntityID, StoreCharacter>
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

          applyAlignmentShift: (characterId, delta) => {
            const character = get().characters[characterId];
            if (!character) {
              logger.warn('applyAlignmentShift: unknown character', characterId);
              return;
            }
            if (!Number.isFinite(delta) || delta === 0) {
              return;
            }

            const current = character.alignment ?? 0;
            const next = Math.max(-100, Math.min(100, current + delta));
            get().update(characterId, { alignment: next });
          },

          addCondition: (characterId, condition) => {
            const character = get().characters[characterId];
            const trimmed = condition.trim();
            if (!character || !trimmed) {
              return;
            }
            const conditions = character.status.conditions;
            if (conditions.some((existing) => sameCondition(existing, trimmed))) {
              return;
            }
            get().update(characterId, {
              status: { ...character.status, conditions: [...conditions, trimmed] },
            });
          },

          removeCondition: (characterId, condition) => {
            const character = get().characters[characterId];
            if (!character) {
              return;
            }
            const remaining = character.status.conditions.filter(
              (existing) => !sameCondition(existing, condition)
            );
            if (remaining.length === character.status.conditions.length) {
              return;
            }
            get().update(characterId, {
              status: { ...character.status, conditions: remaining },
            });
          },

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

            const world = useWorldStore.getState().worlds[character.worldId];
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
              (formula: DerivedStatFormula) => {
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

          deleteCharactersInWorld: async (worldId) => {
            const state = get();
            const charactersInWorld = Object.entries(state.characters)
              .filter(([, char]) => char.worldId === worldId)
              .map(([id]) => id);

            // Emit events for other stores to handle cleanup
            charactersInWorld.forEach((characterId) => {
              storeEvents.emit<CharacterDeletedEvent>(StoreEventTypes.CHARACTER_DELETED, {
                characterId,
              });
            });

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
                  charactersToKeep as Record<EntityID, StoreCharacter>
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
            logger.error('[CharacterStore] Failed to rehydrate state', error);
            return;
          }
          state?.syncDerivedState?.();
        },
        migrate: (persistedState) => persistedState || getInitialState(), // Preserve data, only clear if null
      }
    )
  );

// Expose store globally in development for testing and debugging
if (typeof window !== 'undefined' && shouldExposeStoreOnWindow()) {
  window.useCharacterStore = useCharacterStore;
}

// Subscribe to store events
storeEvents.subscribe<WorldDeletedEvent>(
  StoreEventTypes.WORLD_DELETED,
  ({ worldId }) => {
    useCharacterStore.getState().deleteCharactersInWorld(worldId);
  }
);
