// src/state/__tests__/inventoryStore.equip.test.ts

import { useInventoryStore } from '../inventoryStore';
import type { InventoryItemAddPayload } from '../inventoryStore';
import type {
  InventoryItemCategorization,
  InventoryAcquisitionRecord,
  StandardInventoryCategory,
} from '@/types/inventory.types';
import { setupTestTimers, cleanupTestTimers } from '@/lib/test-utils/testTimers';

const buildCategorization = (
  categoryId: StandardInventoryCategory
): InventoryItemCategorization => ({
  categoryId,
  source: 'manual',
  classifiedAt: '2025-01-15T12:00:00Z',
});

const buildAcquisition = (quantity = 1): InventoryAcquisitionRecord => ({
  acquiredAt: '2025-01-15T12:00:00Z',
  method: 'manual',
  quantity,
});

const equipmentPayload = (
  overrides: Partial<InventoryItemAddPayload> = {}
): InventoryItemAddPayload => ({
  name: 'Steel Sword',
  description: 'A reliable blade',
  stackable: false,
  quantity: 1,
  categorization: buildCategorization('equipment'),
  acquisition: buildAcquisition(1),
  ...overrides,
});

describe('useInventoryStore toggleEquipItem', () => {
  const characterId = 'char-equip';

  beforeEach(() => {
    setupTestTimers();
    useInventoryStore.getState().reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    cleanupTestTimers();
  });

  test('equips an equippable item and sets the equipped flag', () => {
    const store = useInventoryStore.getState();
    const itemId = store.addItem(characterId, equipmentPayload());

    const result = store.toggleEquipItem(characterId, itemId);

    expect(result.success).toBe(true);
    expect(result.equipped).toBe(true);
    expect(useInventoryStore.getState().items[itemId].equipped).toBe(true);
  });

  test('unequips an equipped item when toggled again', () => {
    const store = useInventoryStore.getState();
    const itemId = store.addItem(characterId, equipmentPayload());

    store.toggleEquipItem(characterId, itemId);
    const result = useInventoryStore
      .getState()
      .toggleEquipItem(characterId, itemId);

    expect(result.success).toBe(true);
    expect(result.equipped).toBe(false);
    expect(useInventoryStore.getState().items[itemId].equipped).toBe(false);
  });

  test('blocks equipping an incompatible item with a clear message', () => {
    const store = useInventoryStore.getState();
    const itemId = store.addItem(
      characterId,
      equipmentPayload({
        name: 'Health Potion',
        stackable: true,
        maxStack: 10,
        quantity: 3,
        categorization: buildCategorization('consumables'),
        acquisition: buildAcquisition(3),
      })
    );

    const result = store.toggleEquipItem(characterId, itemId);

    expect(result.success).toBe(false);
    expect(result.error?.title).toBe('Cannot Equip Item');
    expect(result.error?.message).toMatch(/can't be equipped/i);
    expect(useInventoryStore.getState().items[itemId].equipped).toBeFalsy();
  });

  test('returns an error when the item is not in the character inventory', () => {
    const store = useInventoryStore.getState();
    const itemId = store.addItem(characterId, equipmentPayload());

    const result = store.toggleEquipItem('someone-else', itemId);

    expect(result.success).toBe(false);
    expect(result.error?.title).toBe('Item Not In Inventory');
  });
});
