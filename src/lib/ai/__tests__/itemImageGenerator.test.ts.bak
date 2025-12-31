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
      description: 'A red liquid',
      categoryId: 'consumables',
    };

    test('builds basic prompt with item name', async () => {
      const prompt = await generator.buildItemPrompt(baseItem as InventoryItem);

      expect(prompt).toContain('Health Potion');
    });

    test('includes short descriptions', async () => {
      const prompt = await generator.buildItemPrompt(baseItem as InventoryItem);

      expect(prompt).toContain('A red liquid');
    });

    test('excludes long descriptions to keep prompts simple', async () => {
      const itemWithLongDesc: Partial<InventoryItem> = {
        ...baseItem,
        description: 'This is a very long description that goes on and on about the item',
      };

      const prompt = await generator.buildItemPrompt(itemWithLongDesc as InventoryItem);

      expect(prompt).toContain('Health Potion');
      expect(prompt).not.toContain('very long description');
    });

    test('does not include genre styling even when provided', async () => {
      const prompt = await generator.buildItemPrompt(
        baseItem as InventoryItem,
        'fantasy'
      );

      expect(prompt).not.toContain('fantasy');
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

    test('generates simple prompt for equipment items', async () => {
      const sword: Partial<InventoryItem> = {
        id: 'item-2',
        name: 'Iron Sword',
        description: 'A sturdy blade',
        categoryId: 'equipment',
      };

      const prompt = await generator.buildItemPrompt(sword as InventoryItem, 'fantasy');

      expect(prompt).toContain('Iron Sword');
      expect(prompt).toContain('A sturdy blade');
      expect(prompt).not.toContain('fantasy');
    });

    test('generates simple prompt for valuables', async () => {
      const gem: Partial<InventoryItem> = {
        id: 'item-3',
        name: 'Ruby',
        description: 'A precious gemstone',
        categoryId: 'valuables',
      };

      const prompt = await generator.buildItemPrompt(gem as InventoryItem);

      expect(prompt).toContain('Ruby');
      expect(prompt).toContain('A precious gemstone');
    });

    test('does not use genre styling even for sci-fi genre', async () => {
      const energyCell: Partial<InventoryItem> = {
        id: 'item-4',
        name: 'Energy Cell',
        description: 'Battery pack',
        categoryId: 'consumables',
      };

      const prompt = await generator.buildItemPrompt(
        energyCell as InventoryItem,
        'sci-fi'
      );

      expect(prompt).toContain('Energy Cell');
      expect(prompt).not.toContain('sci-fi');
    });

    test('includes realistic style directive', async () => {
      const prompt = await generator.buildItemPrompt(baseItem as InventoryItem);

      expect(prompt).toContain('realistic style');
    });

    test('includes white background directive', async () => {
      const prompt = await generator.buildItemPrompt(baseItem as InventoryItem);

      expect(prompt).toContain('white background');
    });

    test('includes professional photography directives', async () => {
      const prompt = await generator.buildItemPrompt(baseItem as InventoryItem);

      expect(prompt).toContain('centered');
      expect(prompt).toContain('professional lighting');
    });

    test('normalizes item name and description', async () => {
      const messyItem: Partial<InventoryItem> = {
        id: 'item-5',
        name: '  Ancient   Scroll  ',
        description: '  Old   parchment  ',
        categoryId: 'documents',
      };

      const prompt = await generator.buildItemPrompt(messyItem as InventoryItem);

      // Should clean up extra spaces
      expect(prompt).not.toMatch(/\s{2,}/);
      expect(prompt).toContain('Ancient Scroll');
    });
  });
});
