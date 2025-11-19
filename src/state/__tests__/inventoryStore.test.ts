// src/state/__tests__/inventoryStore.test.ts

import {
  useInventoryStore,
  type InventoryItemCreatePayload,
  type InventoryItemAddPayload,
} from '../inventoryStore';
import { ErrorType } from '@/lib/utils/errorUtils';
import type {
  InventoryItemCategorization,
  InventoryAcquisitionRecord,
  StandardInventoryCategory,
} from '@/types/inventory.types';
import { setupTestTimers, cleanupTestTimers } from '@/lib/test-utils/testTimers';

const buildCategorization = (
  categoryId: StandardInventoryCategory,
  overrides: Partial<InventoryItemCategorization> = {}
): InventoryItemCategorization => ({
  categoryId,
  source: 'manual',
  classifiedAt: '2025-01-15T12:00:00Z',
  confidence: 0.95,
  ...overrides,
});

const buildAcquisition = (
  quantity = 1,
  overrides: Partial<InventoryAcquisitionRecord> = {}
): InventoryAcquisitionRecord => ({
  acquiredAt: '2025-01-15T12:00:00Z',
  method: 'manual',
  quantity,
  ...overrides,
});

const buildCreatePayload = (
  overrides: Partial<InventoryItemCreatePayload> = {}
): InventoryItemCreatePayload => ({
  name: 'Health Potion',
  description: 'Restores 50 HP',
  stackable: true,
  maxStack: 10,
  quantity: 1,
  categorization: buildCategorization('consumables'),
  acquisition: buildAcquisition(1),
  ...overrides,
});

const buildAddPayload = (
  overrides: Partial<InventoryItemAddPayload> = {}
): InventoryItemAddPayload => ({
  name: 'Iron Dagger',
  description: 'Quick blade',
  stackable: true,
  maxStack: 5,
  quantity: 1,
  categorization: buildCategorization('equipment'),
  acquisition: buildAcquisition(1),
  ...overrides,
});

describe('useInventoryStore', () => {
  beforeEach(() => {
    setupTestTimers();
    useInventoryStore.getState().reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    cleanupTestTimers();
  });

  describe('createItem', () => {
    test('creates a new item with acquisition history and categorization', () => {
      const payload = buildCreatePayload();
      const itemId = useInventoryStore.getState().createItem(payload);

      expect(itemId).toBeTruthy();

      const createdItem = useInventoryStore.getState().items[itemId];
      expect(createdItem).toBeDefined();
      expect(createdItem?.categoryId).toBe('consumables');
      expect(createdItem?.acquisitionHistory).toHaveLength(1);
      expect(createdItem?.acquisitionHistory[0].method).toBe('manual');
      expect(createdItem?.categorization.source).toBe('manual');
    });
  });

  describe('addItem', () => {
    test('stacks items and appends acquisition history', () => {
      const store = useInventoryStore.getState();

      const firstId = store.addItem('char-1', buildAddPayload({
        name: 'Arrow Bundle',
        description: 'Bundle of arrows',
        maxStack: 20,
        quantity: 10,
        categorization: buildCategorization('equipment'),
        acquisition: buildAcquisition(10, { method: 'loot' }),
      }));

      const secondId = store.addItem('char-1', buildAddPayload({
        name: 'Arrow Bundle',
        quantity: 5,
        maxStack: 20,
        categorization: buildCategorization('equipment'),
        acquisition: buildAcquisition(5, { method: 'quest' }),
      }));

      expect(firstId).toBe(secondId);

      const item = useInventoryStore.getState().items[firstId];
      expect(item.quantity).toBe(15);
      expect(item.acquisitionHistory).toHaveLength(2);
      expect(item.acquisitionHistory[1].method).toBe('quest');
    });
  });

  describe('categorization updates', () => {
    test('updateItem applies new categorization metadata', () => {
      const payload = buildCreatePayload({
        name: 'Old Tome',
        categorization: buildCategorization('documents'),
        acquisition: buildAcquisition(1, { method: 'loot' }),
      });

      const itemId = useInventoryStore.getState().createItem(payload);

      useInventoryStore.getState().updateItem(itemId, {
        categorization: buildCategorization('quest-items', {
          source: 'ai',
          confidence: 0.88,
        }),
      });

      const updated = useInventoryStore.getState().items[itemId];
      expect(updated.categoryId).toBe('quest-items');
      expect(updated.categorization.source).toBe('ai');
      expect(updated.categorization.confidence).toBe(0.88);
    });
  });

  describe('quantity management', () => {
    test('removeItem deletes item when quantity depleted', () => {
      const store = useInventoryStore.getState();
      const itemId = store.addItem('char-1', buildAddPayload({
        name: 'Ration Pack',
        stackable: true,
        quantity: 2,
        categorization: buildCategorization('consumables'),
        acquisition: buildAcquisition(2, { method: 'quest' }),
      }));

      store.removeItem('char-1', itemId, 2);
      const state = useInventoryStore.getState();

      expect(state.items[itemId]).toBeUndefined();
      expect(state.characterInventories['char-1']).toBeUndefined();
    });

    test('updateItemQuantity enforces max stack', () => {
      const store = useInventoryStore.getState();
      const itemId = store.addItem('char-1', buildAddPayload({
        name: 'Focus Crystal',
        stackable: true,
        quantity: 1,
        maxStack: 2,
        categorization: buildCategorization('quest-items'),
        acquisition: buildAcquisition(1, { method: 'reward' }),
      }));

      useInventoryStore.getState().updateItemQuantity(itemId, 3);
      const state = useInventoryStore.getState();

      expect(state.error).toMatchObject({
        title: 'Stack Limit Exceeded',
        message: 'Quantity cannot exceed maximum stack size of 2.',
        type: ErrorType.VALIDATION,
      });
      expect(state.items[itemId].quantity).toBe(1);
    });
  });
});
