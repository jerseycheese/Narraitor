import { create } from 'zustand';
import { NarrativeSegment } from '../types/narrative.types';

/**
 * Narrative store for managing narrative state in the Narraitor application.
 * Implements MVP functionality with basic state initialization only.
 */

// Define the initial state for the narrative store
const initialNarrativeState: { segments: NarrativeSegment[] } = {
  segments: [],
};

// Define the Narrative Store
export const narrativeStore = create<{ segments: NarrativeSegment[] }>()(() => ({
  ...initialNarrativeState,
}));
