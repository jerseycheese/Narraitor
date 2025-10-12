// src/lib/inventory/__tests__/journalIntegration.test.ts

import { describe, it, expect, beforeEach } from '@jest/globals';
import { createAcquisitionJournalEntry } from '../journalIntegration';
import type { InventoryItem } from '@/types/inventory.types';
import type { EntityID } from '@/types/common.types';

describe('createAcquisitionJournalEntry', () => {
  const mockSessionId: EntityID = 'session-123';
  const mockWorldId: EntityID = 'world-456';
  const mockCharacterId: EntityID = 'char-789';

  let mockItem: InventoryItem;

  beforeEach(() => {
    mockItem = {
      id: 'item-123',
      name: 'Rusty Sword',
      description: 'An old sword',
      quantity: 1,
      stackable: false,
      categoryId: 'equipment',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      acquisitionHistory: [
        {
          acquiredAt: '2025-01-01T00:00:00.000Z',
          method: 'loot',
          quantity: 1,
          description: 'Found in the abandoned castle',
        },
      ],
      categorization: {
        categoryId: 'equipment',
        source: 'ai',
        classifiedAt: '2025-01-01T00:00:00.000Z',
      },
    };
  });

  it('creates journal entry with item name and category', () => {
    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.title).toContain('Rusty Sword');
    expect(entry.content).toContain('equipment');
  });

  it('includes acquisition context in entry content', () => {
    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.content).toContain('Found in the abandoned castle');
    expect(entry.content).toContain('loot');
  });

  it('links back to acquired item via relatedEntities', () => {
    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.relatedEntities).toHaveLength(1);
    expect(entry.relatedEntities[0]).toEqual({
      type: 'item',
      id: 'item-123',
      name: 'Rusty Sword',
    });
  });

  it('marks quest items as major significance', () => {
    mockItem.categoryId = 'quest-items';
    mockItem.categorization.categoryId = 'quest-items';

    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.significance).toBe('major');
  });

  it('marks reward and gift acquisitions as major significance', () => {
    mockItem.acquisitionHistory[0].method = 'reward';

    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.significance).toBe('major');
  });

  it('marks regular acquisitions as minor significance', () => {
    mockItem.acquisitionHistory[0].method = 'purchase';

    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.significance).toBe('minor');
  });

  it('sets entry type to item_acquisition', () => {
    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.type).toBe('item_acquisition');
  });

  it('marks entry as automatic', () => {
    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.metadata.automaticEntry).toBe(true);
  });

  it('handles items with no acquisition description', () => {
    mockItem.acquisitionHistory[0].description = undefined;

    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.content).toContain('Rusty Sword');
    expect(entry.content).toContain('loot');
  });

  it('includes quantity in entry for multiple items', () => {
    mockItem.quantity = 5;
    mockItem.acquisitionHistory[0].quantity = 5;
    mockItem.stackable = true;

    const entry = createAcquisitionJournalEntry(
      mockItem,
      mockSessionId,
      mockWorldId,
      mockCharacterId
    );

    expect(entry.content).toContain('5');
  });
});
