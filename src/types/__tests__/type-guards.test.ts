// src/types/__tests__/type-guards.test.ts
import { 
  isWorld, 
  isCharacter, 
  isInventoryItem,
  isNarrativeSegment,
  isJournalEntry 
} from '../type-guards';

describe('Type Guards', () => {
  test('all type guards should return false for falsy values', () => {
    const falsyValues = [null, undefined, false, 0, '', NaN];
    
    falsyValues.forEach(value => {
      expect(isWorld(value)).toBe(false);
      expect(isCharacter(value)).toBe(false);
      expect(isInventoryItem(value)).toBe(false);
      expect(isNarrativeSegment(value)).toBe(false);
      expect(isJournalEntry(value)).toBe(false);
    });
  });
  test('isWorld should correctly identify World objects', () => {
    const validWorld = {
      id: 'world-1',
      name: 'Test World',
      theme: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20
      },
      createdAt: '2025-01-13T10:00:00Z',
      updatedAt: '2025-01-13T10:00:00Z'
    };

    const invalidWorld = {
      id: 'world-1',
      name: 'Test World'
      // Missing required fields
    };

    expect(isWorld(validWorld)).toBe(true);
    expect(isWorld(invalidWorld)).toBe(false);
  });

  test('isCharacter should correctly identify Character objects', () => {
    const validCharacter = {
      id: 'char-1',
      worldId: 'world-1',
      name: 'Test Character',
      attributes: [],
      skills: [],
      background: {
        history: 'Test',
        personality: 'Test',
        goals: [],
        fears: [],
        relationships: []
      },
      inventory: {
        characterId: 'char-1',
        items: [],
        capacity: 10,
        categories: []
      },
      status: {
        health: 100,
        maxHealth: 100,
        conditions: []
      },
      createdAt: '2025-01-13T10:00:00Z',
      updatedAt: '2025-01-13T10:00:00Z'
    };

    const invalidCharacter = {
      id: 'char-1',
      name: 'Test Character'
      // Missing required fields
    };

    expect(isCharacter(validCharacter)).toBe(true);
    expect(isCharacter(invalidCharacter)).toBe(false);
  });

  test('isInventoryItem should correctly identify InventoryItem objects', () => {
    const validItem = {
      id: 'item-1',
      name: 'Test Item',
      categoryId: 'cat-1',
      quantity: 1
    };

    const invalidItem = {
      id: 'item-1',
      // Missing required fields
    };

    expect(isInventoryItem(validItem)).toBe(true);
    expect(isInventoryItem(invalidItem)).toBe(false);
  });

  test('isNarrativeSegment should check required fields', () => {
    const validSegment = {
      id: 'seg-1',
      worldId: 'world-1',
      sessionId: 'session-1',
      content: 'Test content',
      type: 'scene',
      characterIds: [],
      metadata: {
        tags: []
      },
      createdAt: '2025-01-13T10:00:00Z',
      updatedAt: '2025-01-13T10:00:00Z'
    };

    expect(isNarrativeSegment(validSegment)).toBe(true);
    expect(isNarrativeSegment({})).toBe(false);
  });

  test('isJournalEntry should validate entry type field', () => {
    const validEntry = {
      id: 'journal-1',
      sessionId: 'session-1',
      worldId: 'world-1',
      characterId: 'char-1',
      type: 'combat',
      title: 'Test Entry',
      content: 'Test content',
      significance: 'major',
      isRead: false,
      relatedEntities: [],
      metadata: {
        tags: [],
        automaticEntry: false
      },
      createdAt: '2025-01-13T10:00:00Z',
      updatedAt: '2025-01-13T10:00:00Z'
    };

    const invalidEntry = {
      ...validEntry,
      type: 'invalid_type' // Not a valid JournalEntryType
    };

    expect(isJournalEntry(validEntry)).toBe(true);
    expect(isJournalEntry(invalidEntry)).toBe(false);
  });
});
