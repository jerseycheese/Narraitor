import { useJournalStore } from '../journalStore';
import { JournalEntryType } from '../../types/journal.types';

describe('journalStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useJournalStore.getState().reset();
  });

  it('initializes with default state', () => {
    const state = useJournalStore.getState();
    expect(state).toBeDefined();
    expect(state.entries).toEqual({});
    expect(state.sessionEntries).toEqual({});
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
  });

  describe('chronological sorting', () => {
    it('returns journal entries in reverse chronological order (newest first)', async () => {
      const { addEntry, getSessionEntries } = useJournalStore.getState();
      const sessionId = 'test-session';

      // Add entries with delays to ensure different timestamps
      const firstEntryId = addEntry(sessionId, {
        content: 'First entry',
        type: 'character_event',
        title: 'Entry 1'
      });

      // Wait 5ms to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 5));

      const secondEntryId = addEntry(sessionId, {
        content: 'Second entry',
        type: 'world_event',
        title: 'Entry 2'
      });

      await new Promise(resolve => setTimeout(resolve, 5));

      const thirdEntryId = addEntry(sessionId, {
        content: 'Third entry',
        type: 'discovery',
        title: 'Entry 3'
      });

      const entries = getSessionEntries(sessionId);

      // Should be sorted newest first
      expect(entries).toHaveLength(3);
      expect(entries[0].id).toBe(thirdEntryId);
      expect(entries[1].id).toBe(secondEntryId);
      expect(entries[2].id).toBe(firstEntryId);
    });

    it('handles entries with same timestamp gracefully', () => {
      const { addEntry, getSessionEntries } = useJournalStore.getState();
      const sessionId = 'test-session';

      // Mock Date.now to return same timestamp
      const fixedTime = new Date('2023-01-01T12:00:00Z').toISOString();
      const originalDate = Date;
      global.Date = class extends Date {
        constructor() {
          super();
          return new originalDate(fixedTime);
        }
        static now() {
          return new originalDate(fixedTime).getTime();
        }
        toISOString() {
          return fixedTime;
        }
      } as DateConstructor;

      const firstId = addEntry(sessionId, {
        content: 'Entry 1',
        type: 'achievement',
        title: 'Entry 1'
      });

      const secondId = addEntry(sessionId, {
        content: 'Entry 2',
        type: 'combat',
        title: 'Entry 2'
      });

      const entries = getSessionEntries(sessionId);

      // Should return entries even with same timestamp
      expect(entries).toHaveLength(2);
      // When timestamps are equal, stable sort maintains original array order
      // Since we add entries to the end of sessionEntries array, first added comes first
      expect(entries[0].id).toBe(firstId); // First added maintains position when timestamps equal
      expect(entries[1].id).toBe(secondId);

      // Restore original Date
      global.Date = originalDate;
    });

    it('sorts entries correctly across different sessions', async () => {
      const { addEntry, getSessionEntries } = useJournalStore.getState();
      const session1 = 'session-1';
      const session2 = 'session-2';

      // Add entries to different sessions
      const entry1 = addEntry(session1, {
        content: 'Session 1 first',
        type: 'dialogue',
        title: 'S1-1'
      });

      await new Promise(resolve => setTimeout(resolve, 5));

      const entry2 = addEntry(session2, {
        content: 'Session 2 first',
        type: 'relationship_change',
        title: 'S2-1'
      });

      await new Promise(resolve => setTimeout(resolve, 5));

      const entry3 = addEntry(session1, {
        content: 'Session 1 second',
        type: 'character_event',
        title: 'S1-2'
      });

      const session1Entries = getSessionEntries(session1);
      const session2Entries = getSessionEntries(session2);

      // Session 1 should have newest first
      expect(session1Entries).toHaveLength(2);
      expect(session1Entries[0].id).toBe(entry3); // Newest first
      expect(session1Entries[1].id).toBe(entry1);

      // Session 2 should only have its entry
      expect(session2Entries).toHaveLength(1);
      expect(session2Entries[0].id).toBe(entry2);
    });

    it('maintains chronological order after entry deletion', async () => {
      const { addEntry, getSessionEntries, deleteEntry } = useJournalStore.getState();
      const sessionId = 'test-session';

      const firstId = addEntry(sessionId, {
        content: 'First',
        type: 'world_event',
        title: 'First'
      });

      await new Promise(resolve => setTimeout(resolve, 5));

      const secondId = addEntry(sessionId, {
        content: 'Second',
        type: 'achievement',
        title: 'Second'
      });

      await new Promise(resolve => setTimeout(resolve, 5));

      const thirdId = addEntry(sessionId, {
        content: 'Third',
        type: 'discovery',
        title: 'Third'
      });

      // Delete middle entry
      deleteEntry(secondId);

      const entries = getSessionEntries(sessionId);

      // Should still be in chronological order
      expect(entries).toHaveLength(2);
      expect(entries[0].id).toBe(thirdId); // Newest first
      expect(entries[1].id).toBe(firstId);
    });
  });
});
