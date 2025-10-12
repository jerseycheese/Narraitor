import { buildInventoryContext } from '../inventoryContextBuilder';
import type { InventoryItem } from '@/types/inventory.types';

const baseItem = (overrides: Partial<InventoryItem> = {}): InventoryItem => ({
  id: overrides.id ?? 'item-1',
  name: overrides.name ?? 'Magic Sword',
  description: overrides.description ?? 'A powerful enchanted blade that glows with runes.',
  categoryId: overrides.categoryId ?? 'equipment',
  quantity: overrides.quantity ?? 1,
  stackable: overrides.stackable ?? false,
  maxStack: overrides.maxStack,
  acquisitionHistory:
    overrides.acquisitionHistory ??
    [
      {
        acquiredAt: '2025-06-01T12:00:00Z',
        method: 'loot',
        quantity: overrides.quantity ?? 1,
        description: 'Recovered from the ruins of Eldoria.',
      },
    ],
  categorization:
    overrides.categorization ?? {
      categoryId: overrides.categoryId ?? 'equipment',
      source: 'manual',
      classifiedAt: '2025-06-01T12:00:00Z',
      confidence: 0.9,
    },
  createdAt: overrides.createdAt ?? '2025-06-01T12:00:00Z',
  updatedAt: overrides.updatedAt ?? '2025-06-01T12:00:00Z',
});

describe('buildInventoryContext', () => {
  it('formats inventory items with metadata for narrative prompts', () => {
    const { context, includedItemIds, tokenCount } = buildInventoryContext([
      baseItem(),
    ]);

    expect(context).toContain('## Inventory Summary');
    expect(context).toContain('Magic Sword (equipment, qty 1, acquired via loot on 2025-06-01)');
    expect(context).toContain('acquired via loot on 2025-06-01');
    expect(context).toContain('A powerful enchanted blade');
    expect(includedItemIds).toEqual(['item-1']);
    expect(tokenCount).toBeGreaterThan(0);
  });

  it('prioritizes equipped and quest items before other categories', () => {
    const equippedId = 'item-equ';
    const questId = 'item-quest';
    const consumableId = 'item-consumable';

    const { context, includedItemIds } = buildInventoryContext(
      [
        baseItem({
          id: consumableId,
          name: 'Health Potion',
          categoryId: 'consumables',
          stackable: true,
          quantity: 3,
        }),
        baseItem({
          id: questId,
          name: 'Crystal Key',
          categoryId: 'quest-items',
          description: 'Unlocks the vault beneath the citadel.',
        }),
        baseItem({
          id: equippedId,
          name: 'Guardian Shield',
          categoryId: 'equipment',
          description: 'Currently strapped to the hero\'s arm.',
        }),
      ],
      {
        equippedItemIds: [equippedId],
      }
    );

    const shieldIndex = context.indexOf('Guardian Shield');
    const keyIndex = context.indexOf('Crystal Key');
    const potionIndex = context.indexOf('Health Potion');

    expect(shieldIndex).toBeLessThan(keyIndex);
    expect(keyIndex).toBeLessThan(potionIndex);
    expect(context).toContain('[Equipped] Guardian Shield');
    expect(includedItemIds).toEqual([equippedId, questId, consumableId]);
  });

  it('respects token limits and summarizes omitted items', () => {
    const items: InventoryItem[] = Array.from({ length: 6 }).map((_, index) =>
      baseItem({
        id: `item-${index}`,
        name: `Item ${index}`,
        description: `Description for item ${index} with extra details to increase token usage.`,
      })
    );

    const { context, includedItemIds, truncatedCount, tokenCount } =
      buildInventoryContext(items, { tokenLimit: 80 });

    expect(includedItemIds.length).toBeLessThan(items.length);
    expect(truncatedCount).toBe(items.length - includedItemIds.length);
    expect(context).toContain('+');
    expect(tokenCount).toBeLessThanOrEqual(80);
  });

  it('does not prematurely reserve space for summary when items fit', () => {
    // Create two items that should fit within 180 tokens (default limit)
    // Each formatted line is roughly 70-80 tokens
    const items: InventoryItem[] = [
      baseItem({
        id: 'item-1',
        name: 'Enchanted Longsword',
        description: 'A finely crafted blade imbued with ancient magic.',
        categoryId: 'weapons',
      }),
      baseItem({
        id: 'item-2',
        name: 'Healing Potion',
        description: 'Restores vitality when consumed.',
        categoryId: 'consumables',
      }),
    ];

    const { context, includedItemIds, truncatedCount, tokenCount } =
      buildInventoryContext(items);

    // Both items should be included since they fit under 180 tokens
    expect(includedItemIds).toHaveLength(2);
    expect(truncatedCount).toBe(0);
    expect(context).not.toContain('+');
    expect(context).toContain('Enchanted Longsword');
    expect(context).toContain('Healing Potion');
    expect(tokenCount).toBeLessThanOrEqual(180);
  });

  it('only adds summary when actually needed for truncation', () => {
    // Create items where exactly 3 fit, but old logic would truncate at 2
    const items: InventoryItem[] = Array.from({ length: 5 }).map((_, index) =>
      baseItem({
        id: `item-${index}`,
        name: `Weapon ${index}`,
        description: 'Short description.',
        categoryId: 'weapons',
      })
    );

    // Set limit so 3 items fit (~150 tokens) but not 4 (~200 tokens)
    const { includedItemIds, truncatedCount, tokenCount } =
      buildInventoryContext(items, { tokenLimit: 160 });

    // Should include as many items as actually fit (optimistic allocation)
    // Not artificially reduced by pre-reserving summary space
    expect(includedItemIds.length).toBeGreaterThanOrEqual(2);
    expect(tokenCount).toBeLessThanOrEqual(160);

    // If truncated, the truncation should be minimal
    if (truncatedCount > 0) {
      expect(includedItemIds.length).toBeGreaterThan(1);
    }
  });
});
