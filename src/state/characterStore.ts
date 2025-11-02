import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UseBoundStore, StoreApi } from 'zustand';
import { EntityID } from '../types/common.types';
import { InventoryItem, InventoryCategory } from '../types/inventory.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { safeTrim, normalizeText, NORM_NAME, NORM_DESC, getTimestamp } from '@/lib/utils';
import { UserFriendlyError, createStoreError } from '@/lib/utils/errorUtils';
import { CrudStore } from './createCrudStore';

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

interface CharacterBackground {
  history: string;
  personality: string;
  goals: string[];
  fears: string[];
  physicalDescription?: string;
  relationships: unknown[];
  isKnownFigure?: boolean;
  knownFigureType?: 'historical' | 'fictional' | 'celebrity' | 'mythological' | 'other';
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

/**
 * Character store interface with state and actions
 */
export interface CharacterStore extends CrudStore<Character> {
  // State
  characters: Record<EntityID, Character>;
  currentCharacterId: EntityID | null;
  error: UserFriendlyError | null;
  loading: boolean;
  syncDerivedState: () => void;

  // Actions
  createCharacter: (character: Omit<Character, 'id' | 'createdAt' | 'updatedAt'>) => EntityID;
  updateCharacter: (id: EntityID, updates: Partial<Character>) => void;
  deleteCharacter: (id: EntityID) => void;
  setCurrentCharacter: (id: EntityID) => void;

  // Attribute management
  addAttribute: (characterId: EntityID, attribute: Omit<CharacterAttribute, 'id' | 'characterId'>) => void;
  updateAttribute: (characterId: EntityID, attributeId: EntityID, updates: Partial<CharacterAttribute>) => void;
  removeAttribute: (characterId: EntityID, attributeId: EntityID) => void;

  // Skill management
  addSkill: (characterId: EntityID, skill: Omit<CharacterSkill, 'id' | 'characterId'>) => void;

  // Path Count Optimization
  cleanupCharacterHistory: (worldId?: EntityID, keepRecentCount?: number) => void;
  compactCharacterData: () => void;
  getCharactersCount: (worldId?: EntityID) => number;

  // Cascading delete helper
  deleteCharactersInWorld: (worldId: EntityID) => void;

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
    currentCharacterId: null,
    currentEntityId: null,
    error: null,
    loading: false,
});

// Character Store implementation with persistence
export const useCharacterStore: UseBoundStore<StoreApi<CharacterStore>> = create<CharacterStore>()(
  persist(
    (set, get) => {
      return {
        characters: {},
        entities: {},
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

          const normalizedBackground = characterData.background ? {
            ...characterData.background,
            physicalDescription: characterData.background.physicalDescription ? normalizeText(characterData.background.physicalDescription, NORM_DESC) : undefined,
            personality: normalizeText(characterData.background.personality || '', NORM_DESC),
            history: normalizeText(characterData.background.history || '', NORM_DESC)
          } : characterData.background;

          const normalizedName = normalizeText(characterData.name, NORM_NAME);

          const attributes = characterData.attributes?.map(attr => ({
            ...attr,
            characterId,
          })) || [];

          const skills = characterData.skills?.map(skill => ({
            ...skill,
            characterId,
          })) || [];

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
            error: null,
          }));

          return characterId;
        },

        update: (id, updates) => {
          const character = get().characters[id];
          if (!character) {
            set({ error: createStoreError('Character Not Found', 'The specified character could not be found') });
            return;
          }

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
              physicalDescription: mergedBackground.physicalDescription ? normalizeText(mergedBackground.physicalDescription, NORM_DESC) : undefined,
              personality: normalizeText(mergedBackground.personality || '', NORM_DESC),
              history: normalizeText(mergedBackground.history || '', NORM_DESC),
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

          set((state) => ({
            characters: {
              ...state.characters,
              [id]: updatedCharacter,
            },
            entities: {
              ...state.entities,
              [id]: updatedCharacter,
            },
            error: null,
          }));
        },

        delete: (id) => {
          const character = get().characters[id];
          if (!character) {
            return;
          }

          set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removedCharacter, ...remainingCharacters } = state.characters;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [id]: _removedEntity, ...remainingEntities } = state.entities;
            const isCurrent = state.currentCharacterId === id || state.currentEntityId === id;

            return {
              characters: remainingCharacters,
              entities: remainingEntities,
              currentCharacterId: isCurrent ? null : state.currentCharacterId,
              currentEntityId: isCurrent ? null : state.currentEntityId,
              error: null,
            };
          });
        },

        setCurrent: (id) => {
          if (id && !get().characters[id]) {
            set({
              error: createStoreError('Character Not Found', 'The specified character could not be found'),
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

        reset: () => set(getInitialState()),

        setError: (error) => set({ error }),

        clearError: () => set({ error: null }),
        setLoading: (loading) => set({ loading }),
        syncDerivedState: () => {
          set((state) => {
            const characters =
              state.characters && typeof state.characters === 'object' ? state.characters : {};

            const hasCharacters = Object.keys(characters).length > 0;

            const isValidCharacterId = (id: EntityID | null | undefined) =>
              Boolean(id && characters[id]);

            const validCurrentCharacterId = isValidCharacterId(state.currentCharacterId)
              ? state.currentCharacterId
              : null;

            const validCurrentEntityId = isValidCharacterId(state.currentEntityId)
              ? state.currentEntityId
              : null;

            const fallbackId = validCurrentCharacterId ?? validCurrentEntityId ?? null;

            const nextCurrentCharacterId = validCurrentCharacterId ?? fallbackId;
            const nextCurrentEntityId = validCurrentEntityId ?? fallbackId;

            return {
              characters: hasCharacters ? characters : {},
              entities: { ...characters },
              currentCharacterId: hasCharacters ? nextCurrentCharacterId : null,
              currentEntityId: hasCharacters ? nextCurrentEntityId : null,
              error: state.error ?? null,
              loading: state.loading ?? false,
            };
          });
        },

        // Domain-specific aliases
        createCharacter: (characterData) => get().create(characterData),
        updateCharacter: (id, updates) => get().update(id, updates),
        deleteCharacter: (id) => get().delete(id),
        setCurrentCharacter: (id) => get().setCurrent(id),

        // Attribute management
        addAttribute: (characterId, attributeData) => {
          const character = get().characters[characterId];
          if (!character) {
            set({ error: createStoreError('Character Not Found', 'The specified character could not be found') });
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
        },

        updateAttribute: (characterId, attributeId, updates) => {
          const character = get().characters[characterId];
          if (!character) {
            set({ error: createStoreError('Character Not Found', 'The specified character could not be found') });
            return;
          }

          const updatedAttributes = character.attributes?.map((attr) =>
            attr.id === attributeId ? { ...attr, ...updates } : attr
          ) || [];

          get().update(characterId, {
            attributes: updatedAttributes,
          });
        },

        removeAttribute: (characterId, attributeId) => {
          const character = get().characters[characterId];
          if (!character) {
            set({ error: createStoreError('Character Not Found', 'The specified character could not be found') });
            return;
          }

          const filteredAttributes = character.attributes?.filter(
            (attr) => attr.id !== attributeId
          ) || [];

          get().update(characterId, {
            attributes: filteredAttributes,
          });
        },

        // Skill management
        addSkill: (characterId, skillData) => {
          const character = get().characters[characterId];
          if (!character) {
            set({ error: createStoreError('Character Not Found', 'The specified character could not be found') });
            return;
          }

          if ((character.skills?.length || 0) >= 2) {
            set({ error: createStoreError('Maximum Skills Reached', 'This character has reached its maximum number of skills') });
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

        cleanupCharacterHistory: (worldId, keepRecentCount = 10) => {
          set((state) => {
            let charactersToProcess = Object.values(state.characters);

            if (worldId) {
              charactersToProcess = charactersToProcess.filter(char => char.worldId === worldId);
            }

            if (charactersToProcess.length <= keepRecentCount) {
              return state;
            }

            const sortedCharacters = charactersToProcess
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            const removedCharacters = sortedCharacters.slice(keepRecentCount);
            const idsToRemove = new Set(removedCharacters.map(char => char.id));

            const newCharacters = Object.fromEntries(
              Object.entries(state.characters).filter(([id]) => !idsToRemove.has(id))
            );

            return {
              characters: newCharacters,
              entities: newCharacters,
              currentCharacterId: state.currentCharacterId && idsToRemove.has(state.currentCharacterId) ? null : state.currentCharacterId,
              currentEntityId: state.currentEntityId && idsToRemove.has(state.currentEntityId) ? null : state.currentEntityId,
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
            };
          });
        },

        getCharactersCount: (worldId) => {
          const { characters } = useCharacterStore.getState();
          if (worldId) {
            return Object.values(characters).filter(char => char.worldId === worldId).length;
          }
          return Object.keys(characters).length;
        },

        deleteCharactersInWorld: (worldId) => set((state) => {
          const charactersToKeep = Object.fromEntries(
            Object.entries(state.characters).filter(([, char]) => char.worldId !== worldId)
          );

          const shouldResetCurrent = state.currentCharacterId && state.characters[state.currentCharacterId]?.worldId === worldId;

          return {
            characters: charactersToKeep,
            entities: charactersToKeep,
            currentCharacterId: shouldResetCurrent ? null : state.currentCharacterId,
            currentEntityId: shouldResetCurrent ? null : state.currentEntityId,
          };
        }),
      };
    },
    {
      name: 'narraitor-character-store',
      storage: createIndexedDBStorage(),
      version: 1,
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[CharacterStore] Failed to rehydrate state', error);
          return;
        }
        state?.syncDerivedState?.();
      },
      // Migration strategy for future schema updates
      // Current implementation is minimal for MVP but will need expansion
      // for handling complex migrations in future versions:
      // - Add field transformations for new/changed fields
      // - Add state structure upgrades between versions
      // - Add validation of migrated data
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      migrate: (persistedState: unknown, version: number) => {
        // Validate persisted characters before restoring
        if (persistedState && typeof persistedState === 'object' && 'characters' in persistedState) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const state = persistedState as any;
          if (state.characters && typeof state.characters === 'object') {
            // Validate each character in storage has required properties
            for (const [characterId, character] of Object.entries(state.characters)) {
              if (!character || typeof character !== 'object') {
                console.warn(`Invalid character data in storage for ${characterId}: not an object`);
                delete state.characters[characterId];
                continue;
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const char = character as any;
              if (!char.id || !char.name || !char.worldId || !char.createdAt) {
                console.warn(`Invalid character data in storage for ${characterId}: missing required fields`);
                delete state.characters[characterId];
              }
            }

            state.entities = { ...state.characters };

            if (typeof state.currentCharacterId === 'string' && !state.currentEntityId) {
              state.currentEntityId = state.currentCharacterId;
            }

            if (typeof state.currentEntityId === 'string' && !state.currentCharacterId) {
              state.currentCharacterId = state.currentEntityId;
            }
          }
        }
        return persistedState as CharacterStore;
      }
    }
  )
);

// Expose store globally in development for testing and debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).useCharacterStore = useCharacterStore;
}
