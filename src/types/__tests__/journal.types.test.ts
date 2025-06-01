// src/types/__tests__/journal.types.test.ts
import { 
  JournalEntry, 
  JournalEntryType
} from '../journal.types';

describe('Journal Types', () => {
  describe('JournalEntry interface', () => {
    test('should create journal entries with different types', () => {
      const combatEntry: JournalEntry = {
        id: 'journal-1',
        sessionId: 'session-1',
        worldId: 'world-1',
        characterId: 'char-1',
        type: 'combat',
        title: 'Showdown at Noon',
        content: 'Faced the bandit leader...',
        significance: 'major',
        isRead: false,
        relatedEntities: [
          {
            type: 'character',
            id: 'char-bandit',
            name: 'Bandit Leader'
          }
        ],
        metadata: {
          tags: ['combat', 'victory'],
          automaticEntry: true,
          narrativeSegmentId: 'seg-15'
        },
        createdAt: '2025-01-13T10:00:00Z',
        updatedAt: '2025-01-13T10:00:00Z'
      };

      expect(combatEntry.type).toBe('combat');
      expect(combatEntry.significance).toBe('major');
      expect(combatEntry.metadata.automaticEntry).toBe(true);
    });

    test('should support all journal entry types', () => {
      const types: JournalEntryType[] = [
        'character_event',
        'world_event',
        'relationship_change',
        'achievement',
        'discovery',
        'combat',
        'dialogue'
      ];

      types.forEach(type => {
        const entry: JournalEntry = {
          id: `journal-${type}`,
          sessionId: 'session-1',
          worldId: 'world-1',
          characterId: 'char-1',
          type,
          title: `${type} entry`,
          content: 'Test content',
          significance: 'minor',
          isRead: false,
          relatedEntities: [],
          metadata: {
            tags: [],
            automaticEntry: false
          },
          createdAt: '2025-01-13T10:00:00Z',
          updatedAt: '2025-01-13T10:00:00Z'
        };

        expect(entry.type).toBe(type);
      });
    });
  });
});
