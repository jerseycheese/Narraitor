jest.mock('@/lib/inventory/inventoryTelemetry', () => ({
  logInventoryGuardSanitized: jest.fn(),
  logInventoryStateReset: jest.fn(),
}));

import type { InventoryItem } from '@/types/inventory.types';
import {
  INVENTORY_STORE_VERSION,
  createInventoryInitialState,
  migrateInventoryState,
} from '../inventoryStore';
import {
  logInventoryGuardSanitized,
  logInventoryStateReset,
} from '@/lib/inventory/inventoryTelemetry';

describe('inventoryStore persistence', () => {
  const baseItem: InventoryItem = {
    id: 'item-1',
    name: 'Stamina Draught',
    description: 'Restores energy.',
    categoryId: 'consumables',
    quantity: 1,
    stackable: true,
    acquisitionHistory: [
      {
        acquiredAt: '2025-02-01T10:00:00Z',
        method: 'manual',
        quantity: 1,
      },
    ],
    categorization: {
      categoryId: 'consumables',
      source: 'manual',
      classifiedAt: '2025-02-01T10:00:00Z',
      confidence: 0.9,
    },
    createdAt: '2025-02-01T10:00:00Z',
    updatedAt: '2025-02-01T10:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resets persisted state when schema version is outdated', () => {
    const legacyState = {
      items: { [baseItem.id]: baseItem },
      characterInventories: {
        'char-1': baseItem.id,
      },
    };

    const migrated = migrateInventoryState(
      legacyState,
      INVENTORY_STORE_VERSION - 1
    );

    expect(migrated).toEqual(createInventoryInitialState());
    expect(logInventoryStateReset).toHaveBeenCalledWith({
      reason: 'schema-reset',
      characterCount: 1,
    });
  });

  it('sanitizes invalid character inventory entries on migrate', () => {
    const persistedState = {
      items: { [baseItem.id]: baseItem },
      characterInventories: {
        'char-1': [baseItem.id, 123, ''],
      },
      currentEntityId: baseItem.id,
      error: null,
      loading: true,
    };

    const migrated = migrateInventoryState(
      persistedState,
      INVENTORY_STORE_VERSION
    );

    expect(migrated.items[baseItem.id]).toEqual(baseItem);
    expect(migrated.characterInventories['char-1']).toEqual([baseItem.id]);
    expect(migrated.currentEntityId).toBe(baseItem.id);
    expect(migrated.loading).toBe(true);

    expect(logInventoryGuardSanitized).toHaveBeenCalledWith({
      characterId: 'char-1',
      reason: 'invalid-entries',
      removedCount: 2,
    });
    expect(logInventoryStateReset).not.toHaveBeenCalled();
  });

  it('falls back to initial state when persisted state is nullish', () => {
    const migrated = migrateInventoryState(null, INVENTORY_STORE_VERSION);

    expect(migrated).toEqual(createInventoryInitialState());
    expect(logInventoryStateReset).not.toHaveBeenCalled();
    expect(logInventoryGuardSanitized).not.toHaveBeenCalled();
  });

  it('drops non-object items payloads during migration', () => {
    const migrated = migrateInventoryState(
      {
        items: 'invalid',
        characterInventories: {
          'char-1': ['item-1'],
        },
      },
      INVENTORY_STORE_VERSION
    );

    expect(migrated.items).toEqual({});
    expect(migrated.entities).toEqual({});
    expect(migrated.characterInventories['char-1']).toEqual(['item-1']);
    expect(logInventoryGuardSanitized).not.toHaveBeenCalled();
  });

  it('sanitizes mixed inventory payloads across characters', () => {
    const migrated = migrateInventoryState(
      {
        items: {
          [baseItem.id]: baseItem,
          'item-2': { ...baseItem, id: 'item-2' },
        },
        characterInventories: {
          'char-1': [baseItem.id],
          'char-2': ['item-2', 42, ''],
          'char-3': { items: ['item-3'] },
        },
      },
      INVENTORY_STORE_VERSION
    );

    expect(migrated.characterInventories).toEqual({
      'char-1': [baseItem.id],
      'char-2': ['item-2'],
    });

    expect(logInventoryGuardSanitized).toHaveBeenCalledTimes(2);
    expect(logInventoryGuardSanitized).toHaveBeenNthCalledWith(1, {
      characterId: 'char-2',
      reason: 'invalid-entries',
      removedCount: 2,
    });
    expect(logInventoryGuardSanitized).toHaveBeenNthCalledWith(2, {
      characterId: 'char-3',
      reason: 'non-array',
      removedCount: 0,
    });
  });

  it('forces loading to false when persisted value is not boolean', () => {
    const migrated = migrateInventoryState(
      {
        items: { [baseItem.id]: baseItem },
        characterInventories: {
          'char-1': [baseItem.id],
        },
        loading: 'yes',
      },
      INVENTORY_STORE_VERSION
    );

    expect(migrated.loading).toBe(false);
  });
});
