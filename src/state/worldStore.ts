import { create } from 'zustand';
import { World } from '../types/world.types';

/**
 * World store for managing world state in the Narraitor application.
 * Implements MVP functionality with basic state initialization only.
 */

// Define the initial state for the world store
const initialWorldState: World = {
  id: '',
  name: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  theme: '',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 0,
    maxSkills: 0,
    attributePointPool: 0,
    skillPointPool: 0,
  },
};

// Define the World Store
export const worldStore = create<World>()(() => ({
  ...initialWorldState,
}));
