// src/lib/ai/__tests__/itemImageGenerator.test.ts

import { ItemImageGenerator } from '../itemImageGenerator';
import type { InventoryItem } from '@/types/inventory.types';

describe('ItemImageGenerator', () => {
  let generator: ItemImageGenerator;

  beforeEach(() => {
    generator = new ItemImageGenerator();
  });

  describe('buildItemPrompt', () => {
    const baseItem: Partial<InventoryItem> = {
      id: 'item-1',
      name: 'Health Potion',
      description: 'A red liquid that restores health',
      categoryId: 'consumables',
    };

    test('builds basic prompt with item name and description', async () => {
      const prompt = await generator.buildItemPrompt(baseItem as InventoryItem);

      expect(prompt).toContain('Health Potion');
      expect(prompt).toContain('A red liquid that restores health');
    });

    test('includes genre context when provided', async () => {
      const prompt = await generator.buildItemPrompt(
        baseItem as InventoryItem,
        'fantasy'
      );

      expect(prompt).toContain('fantasy');
    });

    test('includes category context for visual consistency', async () => {
      const prompt = await generator.buildItemPrompt(baseItem as InventoryItem);

      // Should reference that it's a consumable in some way
      expect(prompt.toLowerCase()).toMatch(/consumable|potion|drink|liquid/);
    });

    test('handles items without description gracefully', async () => {
      const itemWithoutDesc: Partial<InventoryItem> = {
        ...baseItem,
        description: '',
      };

      const prompt = await generator.buildItemPrompt(itemWithoutDesc as InventoryItem);

      expect(prompt).toContain('Health Potion');
      expect(prompt).toBeTruthy();
    });

    test('generates appropriate prompt for equipment items', async () => {
      const sword: Partial<InventoryItem> = {
        id: 'item-2',
        name: 'Iron Sword',
        description: 'A sturdy blade forged from iron',
        categoryId: 'equipment',
      };

      const prompt = await generator.buildItemPrompt(sword as InventoryItem, 'fantasy');

      expect(prompt).toContain('Iron Sword');
      expect(prompt).toContain('A sturdy blade forged from iron');
      expect(prompt).toContain('fantasy');
    });

    test('generates appropriate prompt for valuables', async () => {
      const gem: Partial<InventoryItem> = {
        id: 'item-3',
        name: 'Ruby',
        description: 'A precious red gemstone',
        categoryId: 'valuables',
      };

      const prompt = await generator.buildItemPrompt(gem as InventoryItem);

      expect(prompt).toContain('Ruby');
      expect(prompt).toContain('A precious red gemstone');
    });

    test('uses sci-fi styling for sci-fi genre', async () => {
      const energyCell: Partial<InventoryItem> = {
        id: 'item-4',
        name: 'Energy Cell',
        description: 'Powers laser weapons',
        categoryId: 'consumables',
      };

      const prompt = await generator.buildItemPrompt(
        energyCell as InventoryItem,
        'sci-fi'
      );

      expect(prompt).toContain('Energy Cell');
      expect(prompt).toContain('sci-fi');
    });

    test('defaults to generic style when no genre provided', async () => {
      const prompt = await generator.buildItemPrompt(baseItem as InventoryItem);

      expect(prompt).toBeTruthy();
      expect(prompt).toContain('Health Potion');
    });

    test('normalizes item name and description', async () => {
      const messyItem: Partial<InventoryItem> = {
        id: 'item-5',
        name: '  Ancient   Scroll  ',
        description: '  Contains   powerful   magic  ',
        categoryId: 'documents',
      };

      const prompt = await generator.buildItemPrompt(messyItem as InventoryItem);

      // Should clean up extra spaces
      expect(prompt).not.toMatch(/\s{2,}/);
      expect(prompt).toContain('Ancient Scroll');
    });
  });

  describe('getCategoryStyle', () => {
    test('returns appropriate style for consumables', () => {
      const style = generator.getCategoryStyle('consumables');
      expect(style).toBeTruthy();
      expect(style.toLowerCase()).toMatch(/potion|bottle|vial|container/);
    });

    test('returns appropriate style for equipment', () => {
      const style = generator.getCategoryStyle('equipment');
      expect(style).toBeTruthy();
      expect(style.toLowerCase()).toMatch(/tool|weapon|gear|equipment/);
    });

    test('returns appropriate style for valuables', () => {
      const style = generator.getCategoryStyle('valuables');
      expect(style).toBeTruthy();
      expect(style.toLowerCase()).toMatch(/treasure|valuable|precious|gem|coin/);
    });

    test('returns appropriate style for documents', () => {
      const style = generator.getCategoryStyle('documents');
      expect(style).toBeTruthy();
      expect(style.toLowerCase()).toMatch(/document|paper|scroll|book|text/);
    });

    test('returns appropriate style for personal items', () => {
      const style = generator.getCategoryStyle('personal');
      expect(style).toBeTruthy();
      expect(style.toLowerCase()).toMatch(/clothing|personal|accessory|garment/);
    });

    test('returns appropriate style for quest items', () => {
      const style = generator.getCategoryStyle('quest-items');
      expect(style).toBeTruthy();
      expect(style.toLowerCase()).toMatch(/special|unique|important|quest/);
    });

    test('returns generic style for miscellaneous', () => {
      const style = generator.getCategoryStyle('miscellaneous');
      expect(style).toBeTruthy();
    });
  });
});
