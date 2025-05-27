/**
 * Journal System - POST-MVP
 * Status: Implementation complete but not included in MVP
 * Reason: Deprioritized to focus on core narrative experience
 * Date: May 2025
 * 
 * Note: This store is fully functional and tested but will not be 
 * exposed in the UI until post-MVP. Automatic journal entry creation
 * is suspended until post-MVP implementation.
 */

import { create } from 'zustand';
import { JournalEntry, JournalEntryType } from '../types/journal.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';

/**
 * Journal store interface with state and actions
 */
interface JournalStore {
  // State
  entries: Record<EntityID, JournalEntry>;
  sessionEntries: Record<EntityID, EntityID[]>;
  error: string | null;
  loading: boolean;

  // Actions
  addEntry: (sessionId: EntityID, entry: Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'>) => EntityID;
  updateEntry: (entryId: EntityID, updates: Partial<JournalEntry>) => void;
  deleteEntry: (entryId: EntityID) => void;
  markAsRead: (entryId: EntityID) => void;
  
  // Query actions
  getSessionEntries: (sessionId: EntityID) => JournalEntry[];
  getEntriesByType: (type: JournalEntryType) => JournalEntry[];
  
  // State management
  reset: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Initial state
const initialState = {
  entries: {},
  sessionEntries: {},
  error: null,
  loading: false,
};

// Journal Store implementation
export const journalStore = create<JournalStore>()((set, get) => ({
  ...initialState,

  // Add entry
  addEntry: (sessionId, entryData) => {
    if (!entryData.title || entryData.title.trim() === '') {
      throw new Error('Entry title is required');
    }

    const entryId = generateUniqueId('entry');
    const now = new Date().toISOString();
    
    const newEntry: JournalEntry = {
      ...entryData,
      id: entryId,
      sessionId,
      createdAt: now,
      isRead: false, // New entries are unread by default
    };

    set((state) => {
      // Initialize session entries if not exists
      const sessionEntries = state.sessionEntries[sessionId] || [];
      
      return {
        entries: {
          ...state.entries,
          [entryId]: newEntry,
        },
        sessionEntries: {
          ...state.sessionEntries,
          [sessionId]: [...sessionEntries, entryId],
        },
      };
    });

    return entryId;
  },

  // Update entry
  updateEntry: (entryId, updates) => set((state) => {
    if (!state.entries[entryId]) {
      return { error: 'Entry not found' };
    }

    const updatedEntry: JournalEntry = {
      ...state.entries[entryId],
      ...updates,
    };

    return {
      entries: {
        ...state.entries,
        [entryId]: updatedEntry,
      },
      error: null,
    };
  }),

  // Delete entry
  deleteEntry: (entryId) => set((state) => {
    const entry = state.entries[entryId];
    if (!entry) {
      return state;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { [entryId]: _deletedEntry, ...remainingEntries } = state.entries;
    
    // Remove from session entries
    const sessionId = entry.sessionId;
    const updatedSessionEntries = state.sessionEntries[sessionId]?.filter(
      (id) => id !== entryId
    ) || [];

    return {
      entries: remainingEntries,
      sessionEntries: {
        ...state.sessionEntries,
        [sessionId]: updatedSessionEntries,
      },
    };
  }),

  // Mark as read
  markAsRead: (entryId) => set((state) => {
    if (!state.entries[entryId]) {
      return { error: 'Entry not found' };
    }

    const updatedEntry: JournalEntry = {
      ...state.entries[entryId],
      isRead: true,
    };

    return {
      entries: {
        ...state.entries,
        [entryId]: updatedEntry,
      },
      error: null,
    };
  }),

  // Get session entries
  getSessionEntries: (sessionId) => {
    const state = get();
    const entryIds = state.sessionEntries[sessionId] || [];
    return entryIds.map((id) => state.entries[id]).filter(Boolean);
  },

  // Get entries by type
  getEntriesByType: (type) => {
    const state = get();
    return Object.values(state.entries).filter((entry) => entry.type === type);
  },

  // State management actions
  reset: () => set(() => initialState),
  setError: (error) => set(() => ({ error })),
  clearError: () => set(() => ({ error: null })),
  setLoading: (loading) => set(() => ({ loading })),
}));
