/**
 * Journal System
 * 
 * Provides persistent storage of journal entries across gameplay sessions.
 * Supports automatic journal entry creation from narrative events and
 * manual entry management through the journal interface.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { JournalEntry, JournalEntryType } from '../types/journal.types';
import { EntityID } from '../types/common.types';
import { generateUniqueId } from '../lib/utils/generateId';
import { createIndexedDBStorage } from './persistence';
import { safeTrim, getTimestamp } from '@/lib/utils';
import { UserFriendlyError, createStoreError } from '@/lib/utils/errorUtils';
import { shouldExposeStoreOnWindow } from '@/lib/utils/shouldExposeStoreOnWindow';


/**
 * Journal store interface with state and actions
 */
interface JournalStore {
  // State
  entries: Record<EntityID, JournalEntry>;
  sessionEntries: Record<EntityID, EntityID[]>;
  error: UserFriendlyError | null;
  loading: boolean;

  // Actions
  addEntry: (sessionId: EntityID, entry: Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'>) => EntityID;
  updateEntry: (entryId: EntityID, updates: Partial<JournalEntry>) => void;
  deleteEntry: (entryId: EntityID) => void;
  markAsRead: (entryId: EntityID) => void;
  
  // Query actions
  getSessionEntries: (sessionId: EntityID) => JournalEntry[];
  getSessionEntriesWithCharacter: (sessionId: EntityID, characterId?: EntityID | null) => JournalEntry[];
  getEntriesByType: (type: JournalEntryType) => JournalEntry[];
  
  // Cleanup actions
  deleteSessionEntries: (sessionId: EntityID) => void;
  
  // State management
  reset: () => void;
  setError: (error: UserFriendlyError | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

const initialState = {
  entries: {},
  sessionEntries: {},
  error: null,
  loading: false,
};

// Journal Store implementation
export const useJournalStore = create<JournalStore>()(
  persist(
    (set, get) => ({
  ...initialState,

  addEntry: (sessionId, entryData) => {
    if (!entryData.content || safeTrim(entryData.content) === '') {
      throw new Error('Entry content is required');
    }

    const entryId = generateUniqueId('entry');
    const now = getTimestamp();
    
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

  updateEntry: (entryId, updates) => set((state) => {
    if (!state.entries[entryId]) {
      return { error: createStoreError('Entry Not Found', 'The specified journal entry could not be found') };
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

  deleteEntry: (entryId) => set((state) => {
    const entry = state.entries[entryId];
    if (!entry) {
      return state;
    }

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

  markAsRead: (entryId) => set((state) => {
    if (!state.entries[entryId]) {
      return { error: createStoreError('Entry Not Found', 'The specified journal entry could not be found') };
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

  // Get session entries in reverse chronological order (newest first)
  getSessionEntries: (sessionId) => get().getSessionEntriesWithCharacter(sessionId),

  getSessionEntriesWithCharacter: (sessionId, characterId) => {
    const state = get();
    const entryIds = state.sessionEntries[sessionId] || [];
    const filtered = entryIds
      .map((id) => state.entries[id])
      .filter((entry): entry is JournalEntry => {
        if (!entry) return false;
        if (!characterId) return true;
        return entry.characterId === characterId;
      });

    const sorted = filtered.sort((a, b) => {
      const dateDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (dateDiff !== 0) {
        return dateDiff;
      }
      return a.id.localeCompare(b.id);
    });

    const latestSessionStart = sorted.find((entry) => entry.type === 'session_start');
    if (!latestSessionStart) {
      return sorted;
    }

    const startTimestamp = new Date(latestSessionStart.createdAt).getTime();
    if (Number.isNaN(startTimestamp)) {
      return sorted;
    }

    return sorted.filter((entry) => new Date(entry.createdAt).getTime() >= startTimestamp);
  },

  getEntriesByType: (type) => {
    const state = get();
    return Object.values(state.entries).filter((entry) => entry.type === type);
  },

  /**
   * Delete all journal entries for a specific session
   * 
   * Removes all journal entries associated with a session and cleans up the
   * session entries mapping. This is typically used during campaign deletion
   * to ensure complete data cleanup.
   * 
   * @param sessionId - The ID of the session whose entries should be deleted
   * 
   * @example
   * ```typescript
   * // Delete all journal entries for a session
   * const { deleteSessionEntries } = useJournalStore.getState();
   * deleteSessionEntries('session-123');
   * 
   * // Use in cleanup workflow
   * const cleanupSession = async (sessionId: string) => {
   *   const journalStore = useJournalStore.getState();
   *   journalStore.deleteSessionEntries(sessionId);
   * };
   * ```
   */
  deleteSessionEntries: (sessionId) => set((state) => {
    const entryIds = state.sessionEntries[sessionId] || [];
    
    // Remove all entries for this session
    const remainingEntries = { ...state.entries };
    entryIds.forEach(entryId => {
      delete remainingEntries[entryId];
    });
    
    // Remove session entries mapping
    const { [sessionId]: _sessionEntries, ...remainingSessionEntries } = state.sessionEntries;
    
    return {
      entries: remainingEntries,
      sessionEntries: remainingSessionEntries,
    };
  }),

  // State management actions
  reset: () => set(() => initialState),
  setError: (error) => set(() => ({ error })),
  clearError: () => set(() => ({ error: null })),
  setLoading: (loading) => set(() => ({ loading })),
}),
{
  name: 'narraitor-journal-store',
  storage: createIndexedDBStorage(),
  version: 1,
  // Persist journal entries and session mappings
  partialize: (state) => ({
    entries: state.entries,
    sessionEntries: state.sessionEntries,
  }),
}
));

// Expose store globally in development for easier debugging & manual seeding
if (typeof window !== 'undefined' && shouldExposeStoreOnWindow()) {
  window.useJournalStore = useJournalStore;
}
