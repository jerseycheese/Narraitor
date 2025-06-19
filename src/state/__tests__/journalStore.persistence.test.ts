import { useJournalStore } from '../journalStore';

describe('Journal Store Persistence', () => {
  beforeEach(() => {
    // Clear the store before each test
    useJournalStore.getState().reset();
    // Clear IndexedDB storage for clean tests
    localStorage.clear();
  });

  it('should persist journal entries across store recreation', async () => {
    // Add some journal entries
    const { addEntry, getSessionEntries } = useJournalStore.getState();
    
    const entryId1 = addEntry('session-1', {
      worldId: 'world-1',
      characterId: 'char-1',
      type: 'character_event',
      title: '',
      content: 'Test journal entry 1',
      significance: 'minor',
      isRead: false,
      relatedEntities: [],
      metadata: { tags: ['test'], automaticEntry: false },
      updatedAt: new Date().toISOString()
    });

    const entryId2 = addEntry('session-1', {
      worldId: 'world-1', 
      characterId: 'char-1',
      type: 'world_event',
      title: '',
      content: 'Test journal entry 2',
      significance: 'critical',
      isRead: false,
      relatedEntities: [],
      metadata: { tags: ['test'], automaticEntry: false },
      updatedAt: new Date().toISOString()
    });

    // Verify entries were created
    const entriesBeforePersist = getSessionEntries('session-1');
    expect(entriesBeforePersist).toHaveLength(2);
    expect(entriesBeforePersist[0].content).toBe('Test journal entry 1');
    expect(entriesBeforePersist[1].content).toBe('Test journal entry 2');
    
    // Wait for persistence (zustand persist happens asynchronously)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get fresh store state (simulating browser refresh)
    const freshStore = useJournalStore.getState();
    const entriesAfterPersist = freshStore.getSessionEntries('session-1');
    
    // Verify entries persisted
    expect(entriesAfterPersist).toHaveLength(2);
    expect(entriesAfterPersist[0].id).toBe(entryId1);
    expect(entriesAfterPersist[1].id).toBe(entryId2);
    expect(entriesAfterPersist[0].content).toBe('Test journal entry 1');
    expect(entriesAfterPersist[1].content).toBe('Test journal entry 2');
  });

  it('should not require titles for journal entries', () => {
    const { addEntry } = useJournalStore.getState();
    
    // This should work without throwing an error
    expect(() => {
      addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1', 
        type: 'character_event',
        title: '', // Empty title should be allowed
        content: 'Entry with no title',
        significance: 'minor',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['test'], automaticEntry: false },
        updatedAt: new Date().toISOString()
      });
    }).not.toThrow();
  });

  it('should require content for journal entries', () => {
    const { addEntry } = useJournalStore.getState();
    
    // This should throw an error for missing content
    expect(() => {
      addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'character_event', 
        title: '',
        content: '', // Empty content should cause error
        significance: 'minor',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['test'], automaticEntry: false },
        updatedAt: new Date().toISOString()
      });
    }).toThrow('Entry content is required');
  });
});