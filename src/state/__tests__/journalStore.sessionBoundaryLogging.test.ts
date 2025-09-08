import { useJournalStore } from '../journalStore';
import { useSessionStore } from '../sessionStore';

describe('Journal Store - Session Boundary Logging', () => {
  beforeEach(() => {
    // Reset stores before each test
    useJournalStore.getState().reset();
    useSessionStore.getState().endSession(); // Reset session store
  });

  describe('Session Start Logging', () => {
    it('creates session_start journal entry when session begins', () => {
      const { addEntry, getSessionEntries } = useJournalStore.getState();
      const sessionId = 'test-session-001';
      const worldId = 'test-world';
      const characterId = 'test-character';

      // Add session start entry (this should happen automatically in production)
      const entryId = addEntry(sessionId, {
        worldId,
        characterId,
        type: 'session_start',
        title: 'Session Started',
        content: 'New gameplay session began',
        significance: 'minor',
        isRead: false,
        relatedEntities: [],
        metadata: {
          tags: ['system', 'session'],
          automaticEntry: true,
          sessionStartTime: new Date().toISOString()
        },
        updatedAt: new Date().toISOString()
      });

      const entries = getSessionEntries(sessionId);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe(entryId);
      expect(entries[0].type).toBe('session_start');
      expect(entries[0].metadata.automaticEntry).toBe(true);
      expect(entries[0].metadata.tags).toContain('system');
      expect(entries[0].significance).toBe('minor');
    });

    it('includes session context metadata in session start entry', () => {
      const { addEntry, getSessionEntries } = useJournalStore.getState();
      const sessionId = 'test-session-002';
      const sessionStartTime = new Date('2024-01-15T10:30:00Z');
      
      // Simulate session start with metadata
      addEntry(sessionId, {
        worldId: 'fantasy-world',
        characterId: 'hero-character',
        type: 'session_start',
        title: 'Adventure Begins',
        content: 'Started new session in the Kingdom of Eldara',
        significance: 'minor',
        relatedEntities: [],
        isRead: false,
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['system', 'session', 'new-adventure'],
          automaticEntry: true,
          sessionStartTime: sessionStartTime.toISOString(),
          sessionContext: {
            worldName: 'Kingdom of Eldara',
            characterName: 'Adventurous Hero',
            sessionNumber: 1
          }
        }
      });

      const entries = getSessionEntries(sessionId);
      const startEntry = entries[0];
      
      expect(startEntry.metadata.sessionStartTime).toBe(sessionStartTime.toISOString());
      expect(startEntry.metadata.sessionContext).toBeDefined();
      expect(startEntry.content).toContain('Kingdom of Eldara');
    });
  });

  describe('Session End Logging', () => {
    it('creates session_end journal entry with duration metadata when session ends', async () => {
      const { addEntry, getSessionEntries } = useJournalStore.getState();
      const sessionId = 'test-session-003';
      const sessionStartTime = new Date('2024-01-15T10:30:00Z');
      const sessionEndTime = new Date('2024-01-15T11:15:00Z');
      const expectedDuration = 45 * 60 * 1000; // 45 minutes in milliseconds

      // Add session start entry first
      addEntry(sessionId, {
        worldId: 'test-world',
        characterId: 'test-character',
        type: 'session_start',
        title: 'Session Started',
        content: 'New gameplay session began',
        significance: 'minor',
        relatedEntities: [],
        isRead: false,
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['system', 'session'],
          automaticEntry: true,
          sessionStartTime: sessionStartTime.toISOString()
        }
      });

      // Add session end entry (this should happen automatically in production)
      addEntry(sessionId, {
        worldId: 'test-world',
        characterId: 'test-character',
        type: 'session_end',
        title: 'Session Ended',
        content: 'Gameplay session completed after 45 minutes',
        significance: 'minor',
        relatedEntities: [],
        isRead: false,
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['system', 'session'],
          automaticEntry: true,
          sessionStartTime: sessionStartTime.toISOString(),
          sessionEndTime: sessionEndTime.toISOString(),
          sessionDuration: expectedDuration,
          sessionStats: {
            decisionsCount: 8,
            narrativeSegments: 12
          }
        }
      });

      const entries = getSessionEntries(sessionId);
      
      expect(entries).toHaveLength(2);
      
      // Find the session end entry (should be first due to reverse chronological order)
      const endEntry = entries.find(entry => entry.type === 'session_end');
      expect(endEntry).toBeDefined();
      expect(endEntry!.metadata.sessionDuration).toBe(expectedDuration);
      expect(endEntry!.metadata.sessionEndTime).toBe(sessionEndTime.toISOString());
      expect(endEntry!.metadata.sessionStats).toBeDefined();
      expect(endEntry!.content).toContain('45 minutes');
    });

    it('handles session end without corresponding session start gracefully', () => {
      const { addEntry, getSessionEntries } = useJournalStore.getState();
      const sessionId = 'orphaned-session';
      
      // Add session end entry without a corresponding start entry
      const entryId = addEntry(sessionId, {
        worldId: 'test-world',
        characterId: 'test-character',
        type: 'session_end',
        title: 'Session Ended',
        content: 'Session ended (duration unknown)',
        significance: 'minor',
        relatedEntities: [],
        isRead: false,
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['system', 'session'],
          automaticEntry: true,
          sessionEndTime: new Date().toISOString()
          // Note: no duration or start time available
        }
      });

      const entries = getSessionEntries(sessionId);
      
      expect(entries).toHaveLength(1);
      expect(entries[0].id).toBe(entryId);
      expect(entries[0].type).toBe('session_end');
      expect(entries[0].metadata.sessionDuration).toBeUndefined();
      expect(entries[0].content).toContain('duration unknown');
    });
  });

  describe('Session Boundary vs Narrative Events', () => {
    it('distinguishes system session events from user narrative events', () => {
      const { addEntry, getSessionEntries, getEntriesByType } = useJournalStore.getState();
      const sessionId = 'mixed-entry-session';

      // Add system session boundary events
      addEntry(sessionId, {
        worldId: 'test-world',
        characterId: 'test-character',
        type: 'session_start',
        title: 'Session Started',
        content: 'System: New session began',
        significance: 'minor',
        relatedEntities: [],
        isRead: false,
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['system', 'session'],
          automaticEntry: true
        }
      });

      // Add user narrative event
      addEntry(sessionId, {
        worldId: 'test-world',
        characterId: 'test-character',
        type: 'character_event',
        title: 'Character Discovery',
        content: 'You discovered an ancient artifact',
        significance: 'major',
        relatedEntities: [],
        isRead: false,
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['discovery', 'artifact'],
          automaticEntry: false
        }
      });

      const allEntries = getSessionEntries(sessionId);
      const systemEvents = getEntriesByType('session_start');
      const narrativeEvents = getEntriesByType('character_event');

      expect(allEntries).toHaveLength(2);
      expect(systemEvents).toHaveLength(1);
      expect(narrativeEvents).toHaveLength(1);

      // System events should be marked as automatic
      expect(systemEvents[0].metadata.automaticEntry).toBe(true);
      expect(systemEvents[0].metadata.tags).toContain('system');

      // Narrative events should be marked as non-automatic
      expect(narrativeEvents[0].metadata.automaticEntry).toBe(false);
      expect(narrativeEvents[0].metadata.tags).not.toContain('system');
    });
  });

  describe('Session Boundary Entry Content Requirements', () => {
    it('ensures session boundary entries have required metadata fields', () => {
      const { addEntry, getSessionEntries } = useJournalStore.getState();
      const sessionId = 'metadata-validation-session';

      // Test that we can successfully create session boundary entries with all required fields
      const startEntryId = addEntry(sessionId, {
        worldId: 'test-world',
        characterId: 'test-character',
        type: 'session_start',
        title: 'Adventure Begins',
        content: 'A new story unfolds',
        significance: 'minor',
        relatedEntities: [],
        isRead: false,
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['system', 'session'],
          automaticEntry: true,
          sessionStartTime: new Date().toISOString()
        }
      });

      const endEntryId = addEntry(sessionId, {
        worldId: 'test-world',
        characterId: 'test-character', 
        type: 'session_end',
        title: 'Chapter Closes',
        content: 'The adventure concludes for now',
        significance: 'minor',
        relatedEntities: [],
        isRead: false,
        updatedAt: new Date().toISOString(),
        metadata: {
          tags: ['system', 'session'],
          automaticEntry: true,
          sessionEndTime: new Date().toISOString(),
          sessionDuration: 1800000 // 30 minutes
        }
      });

      const entries = getSessionEntries(sessionId);
      
      expect(entries).toHaveLength(2);
      expect(startEntryId).toBeDefined();
      expect(endEntryId).toBeDefined();

      // Verify required fields are present
      const startEntry = entries.find(e => e.type === 'session_start');
      const endEntry = entries.find(e => e.type === 'session_end');

      expect(startEntry!.metadata.sessionStartTime).toBeDefined();
      expect(endEntry!.metadata.sessionEndTime).toBeDefined();
      expect(endEntry!.metadata.sessionDuration).toBeDefined();
    });

    it('rejects session boundary entries with missing required content', () => {
      const { addEntry } = useJournalStore.getState();
      const sessionId = 'validation-test-session';

      // Test that addEntry throws when content is missing
      expect(() => {
        addEntry(sessionId, {
          worldId: 'test-world',
          characterId: 'test-character',
          type: 'session_start',
          title: 'Invalid Entry',
          content: '', // Empty content should be rejected
          significance: 'minor',
          relatedEntities: [],
          isRead: false,
          metadata: {
            tags: ['system'],
            automaticEntry: true
          },
          updatedAt: new Date().toISOString()
        });
      }).toThrow('Entry content is required');
    });
  });
});