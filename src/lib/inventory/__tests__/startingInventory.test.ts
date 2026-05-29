// src/lib/inventory/__tests__/startingInventory.test.ts

import { useInventoryStore } from '@/state/inventoryStore';
import { applyStartingInventory } from '../startingInventory';
import { ARCHETYPE_TEMPLATES } from '@/lib/constants/characterArchetypeTemplates';
import { setupTestTimers, cleanupTestTimers } from '@/lib/test-utils/testTimers';

const warriorInventory = () =>
  ARCHETYPE_TEMPLATES.fantasy.find((template) => template.name === 'Warrior')
    ?.startingInventory;

describe('applyStartingInventory', () => {
  const characterId = 'char-start';

  beforeEach(() => {
    setupTestTimers();
    useInventoryStore.getState().reset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    cleanupTestTimers();
  });

  test('does nothing when there is no starting inventory', () => {
    applyStartingInventory(characterId, undefined);
    applyStartingInventory(characterId, []);

    expect(
      useInventoryStore.getState().getCharacterItems(characterId)
    ).toHaveLength(0);
  });

  test("seeds the character with the archetype's items tagged as starting equipment", () => {
    applyStartingInventory(characterId, warriorInventory());

    const items = useInventoryStore.getState().getCharacterItems(characterId);
    const names = items.map((item) => item.name);

    expect(names).toContain('Steel Sword');
    expect(names).toContain('Health Potion');
    items.forEach((item) => {
      expect(item.acquisitionHistory[0].method).toBe('starting-equipment');
    });
  });

  test('equips items flagged as equipped in the starting inventory', () => {
    applyStartingInventory(characterId, warriorInventory());

    const items = useInventoryStore.getState().getCharacterItems(characterId);
    const sword = items.find((item) => item.name === 'Steel Sword');
    const potion = items.find((item) => item.name === 'Health Potion');

    expect(sword?.equipped).toBe(true);
    expect(potion?.equipped).toBeFalsy();
  });
});
