import { create } from 'zustand';
import { JournalEntry } from '../types/journal.types';

/**
 * Journal store for managing journal state in the Narraitor application.
 * Implements MVP functionality with basic state initialization only.
 */

// Define the initial state for the journal store
const initialJournalState: { entries: JournalEntry[] } = {
  entries: [],
};

// Define the Journal Store
export const journalStore = create<{ entries: JournalEntry[] }>()(() => ({
  ...initialJournalState,
}));
