// src/state/__tests__/inventoryStore.journalIntegration.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useInventoryStore } from '../inventoryStore';
import { useJournalStore } from '../journalStore';
import type { EntityID } from '@/types/common.types';

describe('inventoryStore journal integration', () => {
  const characterId: EntityID = 'char-123';
  const sessionId: EntityID = 'session-456';

  beforeEach(() => {
    const { result: inventoryResult } = renderHook(() => useInventoryStore());
    const { result: journalResult } = renderHook(() => useJournalStore());
    act(() => {
      inventoryResult.current.reset();
      journalResult.current.reset();
    });
  });

  it('creates journal entry when item is added', () => {
    const { result: inventoryResult } = renderHook(() => useInventoryStore());
    const { result: journalResult } = renderHook(() => useJournalStore());

    act(() => {
      inventoryResult.current.addItem(characterId, {
        name: 'Health Potion',
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2025-01-01T00:00:00.000Z',
        },
        acquisition: {
          acquiredAt: '2025-01-01T00:00:00.000Z',
          method: 'purchase',
          quantity: 1,
          sessionId,
        },
      });
    });

    const entries = journalResult.current.getSessionEntries(sessionId);
    expect(entries).toHaveLength(1);
    expect(entries[0].type).toBe('item_acquisition');
    expect(entries[0].title).toContain('Health Potion');
  });

  it('links journal entry to acquired item', () => {
    const { result: inventoryResult } = renderHook(() => useInventoryStore());
    const { result: journalResult } = renderHook(() => useJournalStore());

    let itemId: EntityID = '';
    act(() => {
      itemId = inventoryResult.current.addItem(characterId, {
        name: 'Magic Ring',
        stackable: false,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: '2025-01-01T00:00:00.000Z',
        },
        acquisition: {
          acquiredAt: '2025-01-01T00:00:00.000Z',
          method: 'loot',
          quantity: 1,
          description: 'Found in treasure chest',
          sessionId,
        },
      });
    });

    const entries = journalResult.current.getSessionEntries(sessionId);
    expect(entries[0].relatedEntities).toContainEqual({
      type: 'item',
      id: itemId,
      name: 'Magic Ring',
    });
  });

  it('includes acquisition context in journal entry', () => {
    const { result: inventoryResult } = renderHook(() => useInventoryStore());
    const { result: journalResult } = renderHook(() => useJournalStore());

    act(() => {
      inventoryResult.current.addItem(characterId, {
        name: 'Ancient Scroll',
        stackable: false,
        categorization: {
          categoryId: 'documents',
          source: 'manual',
          classifiedAt: '2025-01-01T00:00:00.000Z',
        },
        acquisition: {
          acquiredAt: '2025-01-01T00:00:00.000Z',
          method: 'quest',
          quantity: 1,
          description: 'Received from the village elder',
          sessionId,
        },
      });
    });

    const entries = journalResult.current.getSessionEntries(sessionId);
    expect(entries[0].content).toContain('Received from the village elder');
    expect(entries[0].content).toContain('quest');
  });

  it('marks quest items as major significance', () => {
    const { result: inventoryResult } = renderHook(() => useInventoryStore());
    const { result: journalResult } = renderHook(() => useJournalStore());

    act(() => {
      inventoryResult.current.addItem(characterId, {
        name: 'Crystal Key',
        stackable: false,
        categorization: {
          categoryId: 'quest-items',
          source: 'manual',
          classifiedAt: '2025-01-01T00:00:00.000Z',
        },
        acquisition: {
          acquiredAt: '2025-01-01T00:00:00.000Z',
          method: 'quest',
          quantity: 1,
          sessionId,
        },
      });
    });

    const entries = journalResult.current.getSessionEntries(sessionId);
    expect(entries[0].significance).toBe('major');
  });

  it('does not create journal entry when sessionId is missing', () => {
    const { result: inventoryResult } = renderHook(() => useInventoryStore());
    const { result: journalResult } = renderHook(() => useJournalStore());

    act(() => {
      inventoryResult.current.addItem(characterId, {
        name: 'Bread',
        stackable: true,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2025-01-01T00:00:00.000Z',
        },
        acquisition: {
          acquiredAt: '2025-01-01T00:00:00.000Z',
          method: 'purchase',
          quantity: 1,
        },
      });
    });

    const allEntries = Object.values(journalResult.current.entries);
    expect(allEntries).toHaveLength(0);
  });

  it('creates journal entry with correct worldId and characterId', () => {
    const { result: inventoryResult } = renderHook(() => useInventoryStore());
    const { result: journalResult } = renderHook(() => useJournalStore());

    act(() => {
      inventoryResult.current.addItem(characterId, {
        name: 'Gold Coins',
        stackable: true,
        categorization: {
          categoryId: 'valuables',
          source: 'manual',
          classifiedAt: '2025-01-01T00:00:00.000Z',
        },
        acquisition: {
          acquiredAt: '2025-01-01T00:00:00.000Z',
          method: 'loot',
          quantity: 50,
          sessionId,
          recordedBy: characterId,
        },
      });
    });

    const entries = journalResult.current.getSessionEntries(sessionId);
    expect(entries[0].characterId).toBe(characterId);
    expect(entries[0].sessionId).toBe(sessionId);
  });
});
