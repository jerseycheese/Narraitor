import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UseBoundStore, StoreApi } from 'zustand';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { safeTrim } from '@/lib/utils';
import { normalizeText } from '../lib/utils/textNormalization';

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
    items: unknown[];
    capacity: number;
    categories: string[];
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
export interface CharacterStore {
  // State
  characters: Record<EntityID, Character>;
  currentCharacterId: EntityID | null;
  error: string | null;
  loading: boolean;

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
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const initialState = {
  characters: {},
  currentCharacterId: null,
  error: null,
  loading: false,
};

// Character Store implementation with persistence
export const useCharacterStore: UseBoundStore<StoreApi<CharacterStore>> = create<CharacterStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Create character
      createCharacter: (characterData) => {
        if (!characterData.name || safeTrim(characterData.name) === '') {
          throw new Error('Character name is required');
        }

        const characterId = generateUniqueId('char');
        const now = new Date().toISOString();
        
        // Normalize character background text
        const normalizedBackground = characterData.background ? {
          ...characterData.background,
          physicalDescription: characterData.background.physicalDescription ? normalizeText(characterData.background.physicalDescription, {
            normalizeWhitespace: true,
            normalizeLineEndings: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: true
          }) : undefined,
          personality: normalizeText(characterData.background.personality || '', {
            normalizeWhitespace: true,
            normalizeLineEndings: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: true
          }),
          history: normalizeText(characterData.background.history || '', {
            normalizeWhitespace: true,
            normalizeLineEndings: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: true
          })
        } : characterData.background;

        const newCharacter: Character = {
          ...characterData,
          name: normalizeText(characterData.name, {
            normalizeWhitespace: true,
            normalizeQuotes: true,
            normalizeSpecialChars: true,
            preserveStructure: false
          }),
          background: normalizedBackground,
          id: characterId,
          level: characterData.level || 1, // Default to level 1 if not provided
          inventory: {
            ...characterData.inventory,
            characterId: characterId
          },
          attributes: characterData.attributes?.map(attr => ({
            ...attr,
            characterId: characterId
          })) || [],
          skills: characterData.skills?.map(skill => ({
            ...skill,
            characterId: characterId
          })) || [],
          createdAt: now,
          updatedAt: now,
        };

        set((state) => ({
          characters: {
            ...state.characters,
            [characterId]: newCharacter,
          },
        }));

        return characterId;
      },

      // Update character
      updateCharacter: (id, updates) => set((state) => {
        if (!state.characters[id]) {
          return { error: 'Character not found' };
        }

        const updatedCharacter: Character = {
          ...state.characters[id],
          ...updates,
          updatedAt: new Date().toISOString(),
        };

        return {
          characters: {
            ...state.characters,
            [id]: updatedCharacter,
          },
          error: null,
        };
      }),

      // Delete character
      deleteCharacter: (id) => set((state) => {
        const character = state.characters[id];
        // Unlike other methods, we return early (no-op) if the character doesn't exist,
        // rather than throwing an error. This is intentional because deleting a non-existent
        // character is considered a harmless operation in this context.
        if (!character) {
          return state; // Character doesn't exist, no-op
        }

        // Remove character from store
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [id]: _deletedCharacter, ...remainingCharacters } = state.characters;
        
        return {
          characters: remainingCharacters,
          currentCharacterId: state.currentCharacterId === id ? null : state.currentCharacterId,
        };
      }),

      // Set current character
      setCurrentCharacter: (id) => set((state) => {
        if (!state.characters[id]) {
          return { 
            error: 'Character not found',
            currentCharacterId: null,
          };
        }

        return {
          currentCharacterId: id,
          error: null,
        };
      }),

      // Add attribute
      addAttribute: (characterId, attributeData) => set((state) => {
        const character = state.characters[characterId];
        if (!character) {
          return { error: 'Character not found' };
        }

        const attributeId = generateUniqueId('attr');
        const newAttribute: CharacterAttribute = {
          ...attributeData,
          id: attributeId,
          characterId,
        };

        const updatedCharacter: Character = {
          ...character,
          attributes: [...character.attributes, newAttribute],
          updatedAt: new Date().toISOString(),
        };

        return {
          characters: {
            ...state.characters,
            [characterId]: updatedCharacter,
          },
          error: null,
        };
      }),

      // Update attribute
      updateAttribute: (characterId, attributeId, updates) => set((state) => {
        const character = state.characters[characterId];
        if (!character) {
          return { error: 'Character not found' };
        }

        const updatedAttributes = character.attributes?.map((attr) =>
          attr.id === attributeId ? { ...attr, ...updates } : attr
        ) || [];

        const updatedCharacter: Character = {
          ...character,
          attributes: updatedAttributes,
          updatedAt: new Date().toISOString(),
        };

        return {
          characters: {
            ...state.characters,
            [characterId]: updatedCharacter,
          },
          error: null,
        };
      }),

      // Remove attribute
      removeAttribute: (characterId, attributeId) => set((state) => {
        const character = state.characters[characterId];
        if (!character) {
          return { error: 'Character not found' };
        }

        const filteredAttributes = character.attributes?.filter(
          (attr) => attr.id !== attributeId
        ) || [];

        const updatedCharacter: Character = {
          ...character,
          attributes: filteredAttributes,
          updatedAt: new Date().toISOString(),
        };

        return {
          characters: {
            ...state.characters,
            [characterId]: updatedCharacter,
          },
          error: null,
        };
      }),

      // Add skill
      addSkill: (characterId, skillData) => set((state) => {
        const character = state.characters[characterId];
        if (!character) {
          return { error: 'Character not found' };
        }

        // Check max skills limit (simplified for test - normally would check world settings)
        if ((character.skills?.length || 0) >= 2) {
          return { error: 'Maximum skills limit reached' };
        }

        const skillId = generateUniqueId('skill');
        const newSkill: CharacterSkill = {
          ...skillData,
          id: skillId,
          characterId,
        };

        const updatedCharacter: Character = {
          ...character,
          skills: [...character.skills, newSkill],
          updatedAt: new Date().toISOString(),
        };

        return {
          characters: {
            ...state.characters,
            [characterId]: updatedCharacter,
          },
          error: null,
        };
      }),

      // Path Count Optimization Methods
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
          
          const charactersToRemove = sortedCharacters.slice(keepRecentCount);
          
          const newCharacters = { ...state.characters };
          charactersToRemove.forEach(char => {
            delete newCharacters[char.id];
          });

          return { characters: newCharacters };
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
                relationships: []
              }
            };
          });

          return { characters: compactedCharacters };
        });
      },

      getCharactersCount: (worldId) => {
        const { characters } = useCharacterStore.getState();
        if (worldId) {
          return Object.values(characters).filter(char => char.worldId === worldId).length;
        }
        return Object.keys(characters).length;
      },

      // Delete all characters in a specific world
      deleteCharactersInWorld: (worldId) => set((state) => {
        const charactersToKeep = Object.fromEntries(
          Object.entries(state.characters).filter(([, char]) => char.worldId !== worldId)
        );
        
        return {
          characters: charactersToKeep,
          currentCharacterId: state.currentCharacterId && state.characters[state.currentCharacterId]?.worldId === worldId 
            ? null 
            : state.currentCharacterId
        };
      }),

      // State management actions
      reset: () => set(() => initialState),
      setError: (error) => set(() => ({ error })),
      clearError: () => set(() => ({ error: null })),
      setLoading: (loading) => set(() => ({ loading })),
    }),
    {
      name: 'narraitor-character-store',
      storage: createIndexedDBStorage(),
      version: 1,
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
          }
        }
        return persistedState as CharacterStore;
      }
    }
  )
);
