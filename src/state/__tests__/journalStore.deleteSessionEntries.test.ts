import { useJournalStore } from '../journalStore';
import { JournalEntry } from '../../types/journal.types';

describe('journalStore - deleteSessionEntries', () => {
  beforeEach(() => {
    useJournalStore.getState().reset();
  });

  const mockEntry1: Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'> = {
    worldId: 'world-1',
    characterId: 'char-1',
    type: 'character_event',
    title: 'Test Entry 1',
    content: 'Test entry 1',
    significance: 'minor',
    isRead: false,
    relatedEntities: [],
    metadata: { tags: [], automaticEntry: false },
    updatedAt: new Date().toISOString()
  };

  const mockEntry2: Omit<JournalEntry, 'id' | 'sessionId' | 'createdAt'> = {
    worldId: 'world-1',
    characterId: 'char-2',
    type: 'world_event',
    title: 'Test Entry 2',
    content: 'Test entry 2', 
    significance: 'major',
    isRead: true,
    relatedEntities: [],
    metadata: { tags: [], automaticEntry: true },
    updatedAt: new Date().toISOString()
  };

  it('should delete all entries for a specific session', () => {
    const { addEntry, deleteSessionEntries, getSessionEntries } = useJournalStore.getState();
    
    // Add entries for session-1
    const entryId1 = addEntry('session-1', mockEntry1);
    const entryId2 = addEntry('session-1', mockEntry2);
    
    // Add entry for session-2 (should not be deleted)
    addEntry('session-2', { ...mockEntry1, content: 'Different session entry' });
    
    // Verify entries exist
    expect(getSessionEntries('session-1')).toHaveLength(2);
    expect(getSessionEntries('session-2')).toHaveLength(1);
    
    // Delete all entries for session-1
    deleteSessionEntries('session-1');
    
    // Verify session-1 entries are deleted
    expect(getSessionEntries('session-1')).toHaveLength(0);
    
    // Verify session-2 entries are unaffected
    expect(getSessionEntries('session-2')).toHaveLength(1);
    
    // Verify entries are removed from the entries map
    const state = useJournalStore.getState();
    expect(state.entries[entryId1]).toBeUndefined();
    expect(state.entries[entryId2]).toBeUndefined();
  });

  it('should remove session entries mapping', () => {
    const { addEntry, deleteSessionEntries } = useJournalStore.getState();
    
    // Add entries
    addEntry('session-1', mockEntry1);
    addEntry('session-1', mockEntry2);
    
    // Verify session entries mapping exists
    let state = useJournalStore.getState();
    expect(state.sessionEntries['session-1']).toBeDefined();
    expect(state.sessionEntries['session-1']).toHaveLength(2);
    
    // Delete session entries
    deleteSessionEntries('session-1');
    
    // Verify session entries mapping is removed
    state = useJournalStore.getState();
    expect(state.sessionEntries['session-1']).toBeUndefined();
  });

  it('should handle deletion of non-existent session gracefully', () => {
    const { addEntry, deleteSessionEntries, getSessionEntries } = useJournalStore.getState();
    
    // Add some entries for a different session
    addEntry('session-1', mockEntry1);
    
    // Try to delete non-existent session
    expect(() => deleteSessionEntries('non-existent-session')).not.toThrow();
    
    // Verify existing entries are unaffected
    expect(getSessionEntries('session-1')).toHaveLength(1);
  });

  it('should handle empty session gracefully', () => {
    const { deleteSessionEntries } = useJournalStore.getState();
    
    // Try to delete empty session
    expect(() => deleteSessionEntries('empty-session')).not.toThrow();
    
    // Verify state is unchanged
    const state = useJournalStore.getState();
    expect(Object.keys(state.entries)).toHaveLength(0);
    expect(Object.keys(state.sessionEntries)).toHaveLength(0);
  });

  it('should properly clean up when session has mixed entry types', () => {
    const { addEntry, deleteSessionEntries, getSessionEntries } = useJournalStore.getState();
    
    // Add different types of entries
    addEntry('session-1', { ...mockEntry1, type: 'character_event' });
    addEntry('session-1', { ...mockEntry2, type: 'world_event' });
    addEntry('session-1', { ...mockEntry1, type: 'discovery' });
    
    // Verify all entries exist
    expect(getSessionEntries('session-1')).toHaveLength(3);
    
    // Delete all entries
    deleteSessionEntries('session-1');
    
    // Verify all entries are removed regardless of type
    expect(getSessionEntries('session-1')).toHaveLength(0);
  });
});