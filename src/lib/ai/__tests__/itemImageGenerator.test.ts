import { buildItemPrompt } from '../itemImageGenerator';
import type { InventoryItem } from '@/types/inventory.types';

describe('buildItemPrompt', () => {
  const baseItem: Partial<InventoryItem> = {
    id: 'item-1',
    name: 'Health Potion',
    description: 'A red liquid',
    categoryId: 'consumables',
  };

  test('builds basic prompt with item name', () => {
    const prompt = buildItemPrompt(baseItem as InventoryItem);
    expect(prompt).toContain('Health Potion');
  });

  test('includes short descriptions', () => {
    const prompt = buildItemPrompt(baseItem as InventoryItem);
    expect(prompt).toContain('A red liquid');
  });

  test('excludes long descriptions to keep prompts simple', () => {
    const itemWithLongDesc: Partial<InventoryItem> = {
      ...baseItem,
      description: 'This is a very long description that goes on and on about the item',
    };

    const prompt = buildItemPrompt(itemWithLongDesc as InventoryItem);

    expect(prompt).toContain('Health Potion');
    expect(prompt).not.toContain('very long description');
  });

  test('handles items without description gracefully', () => {
    const itemWithoutDesc: Partial<InventoryItem> = {
      ...baseItem,
      description: '',
    };

    const prompt = buildItemPrompt(itemWithoutDesc as InventoryItem);

    expect(prompt).toContain('Health Potion');
    expect(prompt).toBeTruthy();
  });

  test('generates simple prompt for equipment items', () => {
    const sword: Partial<InventoryItem> = {
      id: 'item-2',
      name: 'Iron Sword',
      description: 'A sturdy blade',
      categoryId: 'equipment',
    };

    const prompt = buildItemPrompt(sword as InventoryItem);

    expect(prompt).toContain('Iron Sword');
    expect(prompt).toContain('A sturdy blade');
  });

  test('generates simple prompt for valuables', () => {
    const gem: Partial<InventoryItem> = {
      id: 'item-3',
      name: 'Ruby',
      description: 'A precious gemstone',
      categoryId: 'valuables',
    };

    const prompt = buildItemPrompt(gem as InventoryItem);

    expect(prompt).toContain('Ruby');
    expect(prompt).toContain('A precious gemstone');
  });

  test('includes realistic style directive', () => {
    const prompt = buildItemPrompt(baseItem as InventoryItem);
    expect(prompt).toContain('realistic style');
  });

  test('includes white background directive', () => {
    const prompt = buildItemPrompt(baseItem as InventoryItem);
    expect(prompt).toContain('white background');
  });

  test('includes professional photography directives', () => {
    const prompt = buildItemPrompt(baseItem as InventoryItem);
    expect(prompt).toContain('centered');
    expect(prompt).toContain('professional lighting');
  });

  test('normalizes item name and description', () => {
    const messyItem: Partial<InventoryItem> = {
      id: 'item-5',
      name: '  Ancient   Scroll  ',
      description: '  Old   parchment  ',
      categoryId: 'documents',
    };

    const prompt = buildItemPrompt(messyItem as InventoryItem);

    expect(prompt).not.toMatch(/\s{2,}/);
    expect(prompt).toContain('Ancient Scroll');
  });
});
