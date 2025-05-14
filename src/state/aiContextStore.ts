import { create } from 'zustand';
import { AIContext } from '../types/ai-context.types';

/**
 * AI Context store for managing AI-related state in the Narraitor application.
 * Implements MVP functionality with basic state initialization only.
 */

// Define the initial state for the AI context store
const initialAIContextState: AIContext = {
  world: {
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
  },
  character: {
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
  },
  recentNarrative: [],
  relevantNPCs: [],
  currentObjectives: [],
  sessionHistory: undefined,
};

// Define the AI Context Store
export const aiContextStore = create<AIContext>()(() => ({
  ...initialAIContextState,
}));
