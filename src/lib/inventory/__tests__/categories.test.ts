// src/lib/inventory/__tests__/categories.test.ts

import {
  STANDARD_CATEGORIES,
  isValidCategory,
  getCategoryMetadata,
  getAllCategories,
} from '../categories';
import type { StandardInventoryCategory } from '@/types/inventory.types';

describe('Standard Inventory Categories', () => {
  describe('STANDARD_CATEGORIES constant', () => {
    test('should contain all standard category types', () => {
      const expectedCategories: StandardInventoryCategory[] = [
        'equipment',
        'valuables',
        'consumables',
        'documents',
        'personal',
        'quest-items',
        'miscellaneous',
      ];

      expect(STANDARD_CATEGORIES).toEqual(expectedCategories);
    });

    test('should have exactly 7 categories', () => {
      expect(STANDARD_CATEGORIES).toHaveLength(7);
    });
  });

  describe('isValidCategory', () => {
    test('should return true for valid category', () => {
      expect(isValidCategory('equipment')).toBe(true);
      expect(isValidCategory('valuables')).toBe(true);
      expect(isValidCategory('consumables')).toBe(true);
    });

    test('should return false for invalid category', () => {
      expect(isValidCategory('invalid-category')).toBe(false);
      expect(isValidCategory('')).toBe(false);
      expect(isValidCategory('EQUIPMENT')).toBe(false); // case-sensitive
    });

    test('should return false for null or undefined', () => {
      expect(isValidCategory(null as unknown as string)).toBe(false);
      expect(isValidCategory(undefined as unknown as string)).toBe(false);
    });
  });

  describe('getCategoryMetadata', () => {
    test('should return metadata for equipment category', () => {
      const metadata = getCategoryMetadata('equipment');

      expect(metadata).toMatchObject({
        name: 'Equipment',
        description: expect.any(String),
      });
      expect(metadata.description.length).toBeGreaterThan(0);
    });

    test('should return metadata for all categories', () => {
      STANDARD_CATEGORIES.forEach((category) => {
        const metadata = getCategoryMetadata(category);

        expect(metadata).toMatchObject({
          name: expect.any(String),
          description: expect.any(String),
        });
        expect(metadata.name.length).toBeGreaterThan(0);
        expect(metadata.description.length).toBeGreaterThan(0);
      });
    });

    test('should return undefined for invalid category', () => {
      const metadata = getCategoryMetadata('invalid' as StandardInventoryCategory);
      expect(metadata).toBeUndefined();
    });
  });

  describe('getAllCategories', () => {
    test('should return all category metadata', () => {
      const allCategories = getAllCategories();

      expect(allCategories).toHaveLength(7);
      expect(allCategories[0]).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
      });
    });

    test('should include all standard categories', () => {
      const allCategories = getAllCategories();
      const categoryIds = allCategories.map((cat) => cat.id);

      STANDARD_CATEGORIES.forEach((category) => {
        expect(categoryIds).toContain(category);
      });
    });
  });
});
