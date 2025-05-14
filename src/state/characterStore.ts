import { create } from 'zustand';
import { Character } from '../types/character.types';

/**
 * Character store for managing character state in the Narraitor application.
 * Implements MVP functionality with basic state initialization only.
 */

// Define the initial state for the character store
const initialCharacterState: Character = {
  id: '',
  name: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  worldId: '',
  attributes: [],
  skills: [],
  background: {
    history: '',
    personality: '',
    goals: [],
    fears: [],
    relationships: [],
  },
  inventory: {
    characterId: '',
    items: [],
    capacity: 0,
    categories: [],
  },
  status: {
    health: 0,
    maxHealth: 0,
    conditions: [],
    location: '',
  },
};

// Define the Character Store
export const characterStore = create<Character>()(() => ({
  ...initialCharacterState,
}));
