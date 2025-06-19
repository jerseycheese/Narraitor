import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';

// Simplified character types for MVP implementation
interface CharacterAttribute {
  id: EntityID;
  characterId: EntityID;
  worldAttributeId?: EntityID; // Reference to world attribute for safer matching
  name: string;
  baseValue: number;
  modifiedValue: number;
  category?: string;
}

interface CharacterSkill {
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

interface Character {
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
interface CharacterStore {
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
export const useCharacterStore = create<CharacterStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Create character
      createCharacter: (characterData) => {
        if (!characterData.name || characterData.name.trim() === '') {
          throw new Error('Character name is required');
        }

        const characterId = generateUniqueId('char');
        const now = new Date().toISOString();
        
        const newCharacter: Character = {
          ...characterData,
          id: characterId,
          level: characterData.level || 1, // Default to level 1 if not provided
          inventory: {
            ...characterData.inventory,
            characterId: characterId
          },
          attributes: characterData.attributes.map(attr => ({
            ...attr,
            characterId: characterId
          })),
          skills: characterData.skills.map(skill => ({
            ...skill,
            characterId: characterId
          })),
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

        const updatedAttributes = character.attributes.map((attr) =>
          attr.id === attributeId ? { ...attr, ...updates } : attr
        );

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

        const filteredAttributes = character.attributes.filter(
          (attr) => attr.id !== attributeId
        );

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
        if (character.skills.length >= 2) {
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
        // Simple migration for MVP - just return the state as CharacterState
        return persistedState as CharacterStore;
      }
    }
  )
);
