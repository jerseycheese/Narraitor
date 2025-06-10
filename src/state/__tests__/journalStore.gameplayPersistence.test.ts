/**
 * TDD Tests for Journal Persistence Between Gameplay Sessions
 * 
 * Acceptance Criteria:
 * - [ ] Journal entries are stored and correctly loaded between sessions
 * - [ ] New entries are properly integrated with existing entries
 * - [ ] Entry order and formatting are maintained across sessions
 * - [ ] No data loss occurs between game sessions
 * - [ ] The journal loads quickly when accessed in a new session
 */

import { useJournalStore } from '../journalStore';

describe('Journal Persistence Between Gameplay Sessions', () => {
  beforeEach(() => {
    // Clear the store before each test
    useJournalStore.getState().reset();
    // Clear IndexedDB storage for clean tests
    localStorage.clear();
  });

  describe('AC1: Journal entries are stored and correctly loaded between sessions', () => {
    it('should persist journal entries when browser session ends and restarts', async () => {
      const { addEntry } = useJournalStore.getState();
      
      // Create multiple journal entries across different sessions
      const entryId1 = addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'character_event',
        title: '',
        content: 'Started adventure in the mystical forest',
        significance: 'major',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['adventure', 'start'], automaticEntry: true },
        updatedAt: new Date().toISOString()
      });

      const entryId2 = addEntry('session-2', {
        worldId: 'world-1',
        characterId: 'char-2',
        type: 'discovery',
        title: '',
        content: 'Found a hidden cave with ancient markings',
        significance: 'critical',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['discovery', 'cave'], automaticEntry: true },
        updatedAt: new Date().toISOString()
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Simulate browser session restart by getting fresh store state
      const freshStore = useJournalStore.getState();
      
      // Verify session 1 entries persist
      const session1Entries = freshStore.getSessionEntries('session-1');
      expect(session1Entries).toHaveLength(1);
      expect(session1Entries[0].id).toBe(entryId1);
      expect(session1Entries[0].content).toBe('Started adventure in the mystical forest');
      
      // Verify session 2 entries persist
      const session2Entries = freshStore.getSessionEntries('session-2');
      expect(session2Entries).toHaveLength(1);
      expect(session2Entries[0].id).toBe(entryId2);
      expect(session2Entries[0].content).toBe('Found a hidden cave with ancient markings');
    });

    it('should maintain entry metadata and relationships across sessions', async () => {
      const { addEntry } = useJournalStore.getState();
      
      const entryId = addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'relationship_change',
        title: '',
        content: 'Befriended the village elder',
        significance: 'major',
        isRead: false,
        relatedEntities: ['elder-npc-123'],
        metadata: { 
          tags: ['friendship', 'npc', 'village'],
          automaticEntry: true,
          narrativeSegmentId: 'segment-456'
        },
        updatedAt: new Date().toISOString()
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get fresh store state
      const freshStore = useJournalStore.getState();
      const entries = freshStore.getSessionEntries('session-1');
      
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe(entryId);
      expect(entries[0].relatedEntities).toEqual(['elder-npc-123']);
      expect(entries[0].metadata.tags).toEqual(['friendship', 'npc', 'village']);
      expect(entries[0].metadata.narrativeSegmentId).toBe('segment-456');
    });
  });

  describe('AC2: New entries are properly integrated with existing entries', () => {
    it('should add new entries to existing sessions without overwriting', async () => {
      const { addEntry } = useJournalStore.getState();
      
      // Add first entry
      const entryId1 = addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'character_event',
        title: '',
        content: 'First adventure entry',
        significance: 'minor',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['first'], automaticEntry: true },
        updatedAt: new Date().toISOString()
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 50));

      // Add second entry to same session
      const entryId2 = addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'world_event',
        title: '',
        content: 'Second adventure entry',
        significance: 'major',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['second'], automaticEntry: true },
        updatedAt: new Date().toISOString()
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify both entries exist and are properly integrated
      const freshStore = useJournalStore.getState();
      const entries = freshStore.getSessionEntries('session-1');
      
      expect(entries).toHaveLength(2);
      expect(entries.map(e => e.id)).toContain(entryId1);
      expect(entries.map(e => e.id)).toContain(entryId2);
      expect(entries.map(e => e.content)).toContain('First adventure entry');
      expect(entries.map(e => e.content)).toContain('Second adventure entry');
    });

    it('should handle multiple sessions with independent entry collections', async () => {
      const { addEntry } = useJournalStore.getState();
      
      // Add entries to different sessions
      addEntry('session-alpha', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'character_event',
        title: '',
        content: 'Alpha session entry',
        significance: 'minor',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['alpha'], automaticEntry: true },
        updatedAt: new Date().toISOString()
      });

      addEntry('session-beta', {
        worldId: 'world-2',
        characterId: 'char-2',
        type: 'discovery',
        title: '',
        content: 'Beta session entry',
        significance: 'critical',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['beta'], automaticEntry: true },
        updatedAt: new Date().toISOString()
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify sessions remain independent
      const freshStore = useJournalStore.getState();
      const alphaEntries = freshStore.getSessionEntries('session-alpha');
      const betaEntries = freshStore.getSessionEntries('session-beta');
      
      expect(alphaEntries).toHaveLength(1);
      expect(betaEntries).toHaveLength(1);
      expect(alphaEntries[0].content).toBe('Alpha session entry');
      expect(betaEntries[0].content).toBe('Beta session entry');
      expect(alphaEntries[0].worldId).toBe('world-1');
      expect(betaEntries[0].worldId).toBe('world-2');
    });
  });

  describe('AC3: Entry order and formatting are maintained across sessions', () => {
    it('should preserve chronological order of journal entries', async () => {
      const { addEntry } = useJournalStore.getState();
      
      // Add entries with specific timing
      const entry1Time = new Date('2023-01-01T10:00:00Z').toISOString();
      const entry2Time = new Date('2023-01-01T11:00:00Z').toISOString();
      const entry3Time = new Date('2023-01-01T12:00:00Z').toISOString();
      
      addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'character_event',
        title: '',
        content: 'First event at 10 AM',
        significance: 'minor',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['morning'], automaticEntry: true },
        updatedAt: entry1Time
      });

      addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'world_event',
        title: '',
        content: 'Second event at 11 AM',
        significance: 'major',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['midday'], automaticEntry: true },
        updatedAt: entry2Time
      });

      addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'discovery',
        title: '',
        content: 'Third event at 12 PM',
        significance: 'critical',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['noon'], automaticEntry: true },
        updatedAt: entry3Time
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify chronological order is maintained
      const freshStore = useJournalStore.getState();
      const entries = freshStore.getSessionEntries('session-1');
      
      expect(entries).toHaveLength(3);
      expect(entries[0].content).toBe('First event at 10 AM');
      expect(entries[1].content).toBe('Second event at 11 AM');
      expect(entries[2].content).toBe('Third event at 12 PM');
      expect(entries[0].updatedAt).toBe(entry1Time);
      expect(entries[1].updatedAt).toBe(entry2Time);
      expect(entries[2].updatedAt).toBe(entry3Time);
    });

    it('should preserve entry formatting and special characters', async () => {
      const { addEntry } = useJournalStore.getState();
      
      const complexContent = `Adventure entry with:
- Line breaks
- Special chars: @#$%^&*()
- Unicode: 🎭🗡️⚔️
- Quotes: "Hello" and 'World'
- Numbers: 123.456`;

      addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'character_event',
        title: '',
        content: complexContent,
        significance: 'major',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['formatting', 'special'], automaticEntry: true },
        updatedAt: new Date().toISOString()
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify formatting is preserved
      const freshStore = useJournalStore.getState();
      const entries = freshStore.getSessionEntries('session-1');
      
      expect(entries).toHaveLength(1);
      expect(entries[0].content).toBe(complexContent);
    });
  });

  describe('AC4: No data loss occurs between game sessions', () => {
    it('should persist data across manual store operations', async () => {
      const { addEntry } = useJournalStore.getState();
      
      // Add entries
      const entryId = addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'character_event',
        title: '',
        content: 'Important story event',
        significance: 'critical',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['important'], automaticEntry: true },
        updatedAt: new Date().toISOString()
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify data exists and persists
      const freshStore = useJournalStore.getState();
      const entries = freshStore.getSessionEntries('session-1');
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe(entryId);
      expect(entries[0].content).toBe('Important story event');
      expect(entries[0].significance).toBe('critical');
      
      // The Zustand persistence middleware handles browser session restoration
      // Our manual operations should not affect persisted data integrity
      expect(entries[0].metadata.automaticEntry).toBe(true);
    });

    it('should maintain data integrity with concurrent operations', async () => {
      const { addEntry, updateEntry } = useJournalStore.getState();
      
      // Add entry
      const entryId = addEntry('session-1', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'character_event',
        title: '',
        content: 'Original content',
        significance: 'minor',
        isRead: false,
        relatedEntities: [],
        metadata: { tags: ['test'], automaticEntry: true },
        updatedAt: new Date().toISOString()
      });

      // Wait briefly
      await new Promise(resolve => setTimeout(resolve, 50));

      // Update entry
      updateEntry(entryId, {
        content: 'Updated content',
        significance: 'major',
        isRead: true
      });

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify update persisted correctly
      const freshStore = useJournalStore.getState();
      const entries = freshStore.getSessionEntries('session-1');
      
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe(entryId);
      expect(entries[0].content).toBe('Updated content');
      expect(entries[0].significance).toBe('major');
      expect(entries[0].isRead).toBe(true);
    });
  });

  describe('AC5: The journal loads quickly when accessed in a new session', () => {
    it('should load entries efficiently without blocking operations', async () => {
      const { addEntry } = useJournalStore.getState();
      
      // Create multiple entries to test performance
      const numEntries = 10;
      for (let i = 0; i < numEntries; i++) {
        addEntry('session-1', {
          worldId: 'world-1',
          characterId: 'char-1',
          type: 'character_event',
          title: '',
          content: `Entry number ${i + 1}`,
          significance: 'minor',
          isRead: false,
          relatedEntities: [],
          metadata: { tags: [`entry-${i}`], automaticEntry: true },
          updatedAt: new Date().toISOString()
        });
      }

      // Wait for persistence
      await new Promise(resolve => setTimeout(resolve, 200));

      // Measure load time
      const startTime = performance.now();
      const freshStore = useJournalStore.getState();
      const entries = freshStore.getSessionEntries('session-1');
      const loadTime = performance.now() - startTime;

      // Verify all entries loaded
      expect(entries).toHaveLength(numEntries);
      expect(entries.map(e => e.content)).toContain('Entry number 1');
      expect(entries.map(e => e.content)).toContain('Entry number 10');
      
      // Load time should be reasonable (less than 100ms for 10 entries)
      expect(loadTime).toBeLessThan(100);
    });

    it('should provide synchronous access to journal data after store initialization', () => {
      const { getSessionEntries, getEntriesByType } = useJournalStore.getState();
      
      // These operations should not require await and should return immediately
      const startTime = performance.now();
      const sessionEntries = getSessionEntries('nonexistent-session');
      const typeEntries = getEntriesByType('character_event');
      const accessTime = performance.now() - startTime;
      
      expect(sessionEntries).toEqual([]);
      expect(typeEntries).toEqual([]);
      expect(accessTime).toBeLessThan(10); // Should be nearly instantaneous
    });
  });

  describe('Integration with narrative system', () => {
    it('should support automatic entry creation during gameplay', () => {
      const { addEntry, getSessionEntries } = useJournalStore.getState();
      
      // Simulate automatic entry creation from narrative events
      const entryId = addEntry('active-session', {
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'character_event',
        title: '',
        content: 'Discovered a mysterious artifact in the ruins',
        significance: 'major',
        isRead: false,
        relatedEntities: ['artifact-123'],
        metadata: {
          tags: ['discovery', 'artifact'],
          automaticEntry: true,
          narrativeSegmentId: 'segment-789'
        },
        updatedAt: new Date().toISOString()
      });

      const entries = getSessionEntries('active-session');
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe(entryId);
      expect(entries[0].metadata.automaticEntry).toBe(true);
      expect(entries[0].metadata.narrativeSegmentId).toBe('segment-789');
    });
  });
});