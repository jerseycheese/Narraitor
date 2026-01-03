import type { JournalStore } from './types';

export function createMockJournalStore(
  overrides?: Partial<JournalStore>
): JournalStore {
  return {
    entries: {},
    sessionEntries: {},
    error: null,
    loading: false,
    addEntry: jest.fn(),
    updateEntry: jest.fn(),
    deleteEntry: jest.fn(),
    markAsRead: jest.fn(),
    getSessionEntries: jest.fn(() => []),
    getSessionEntriesWithCharacter: jest.fn(() => []),
    getEntriesByType: jest.fn(() => []),
    deleteSessionEntries: jest.fn(),
    reset: jest.fn(),
    setError: jest.fn(),
    clearError: jest.fn(),
    setLoading: jest.fn(),
    ...overrides,
  } as JournalStore;
}
