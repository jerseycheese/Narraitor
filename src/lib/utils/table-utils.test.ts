/**
 * Tests for table utility functions
 * Focus: Sorting, filtering, and pagination logic
 */

import { describe, it, expect } from '@jest/globals';
import {
  sortByString,
  sortByNumber,
  sortByDate,
  paginateData,
  filterBySearch,
} from './table-utils';

describe('table-utils', () => {
  describe('sortByString', () => {
    it('sorts strings in ascending order', () => {
      const data = [
        { name: 'Zebra' },
        { name: 'Apple' },
        { name: 'Mango' },
      ];

      const sorted = data.sort((a, b) => sortByString(a.name, b.name, 'asc'));

      expect(sorted[0].name).toBe('Apple');
      expect(sorted[2].name).toBe('Zebra');
    });

    it('sorts strings in descending order', () => {
      const data = [
        { name: 'Apple' },
        { name: 'Zebra' },
        { name: 'Mango' },
      ];

      const sorted = data.sort((a, b) => sortByString(a.name, b.name, 'desc'));

      expect(sorted[0].name).toBe('Zebra');
      expect(sorted[2].name).toBe('Apple');
    });

    it('handles case-insensitive sorting', () => {
      const data = [
        { name: 'zebra' },
        { name: 'Apple' },
      ];

      const sorted = data.sort((a, b) => sortByString(a.name, b.name, 'asc'));

      expect(sorted[0].name).toBe('Apple');
    });
  });

  describe('sortByNumber', () => {
    it('sorts numbers in ascending order', () => {
      const data = [
        { quantity: 10 },
        { quantity: 1 },
        { quantity: 5 },
      ];

      const sorted = data.sort((a, b) => sortByNumber(a.quantity, b.quantity, 'asc'));

      expect(sorted[0].quantity).toBe(1);
      expect(sorted[2].quantity).toBe(10);
    });

    it('sorts numbers in descending order', () => {
      const data = [
        { quantity: 1 },
        { quantity: 10 },
        { quantity: 5 },
      ];

      const sorted = data.sort((a, b) => sortByNumber(a.quantity, b.quantity, 'desc'));

      expect(sorted[0].quantity).toBe(10);
      expect(sorted[2].quantity).toBe(1);
    });
  });

  describe('sortByDate', () => {
    it('sorts dates in ascending order', () => {
      const data = [
        { date: '2024-03-15' },
        { date: '2024-01-10' },
        { date: '2024-02-20' },
      ];

      const sorted = data.sort((a, b) => sortByDate(a.date, b.date, 'asc'));

      expect(sorted[0].date).toBe('2024-01-10');
      expect(sorted[2].date).toBe('2024-03-15');
    });

    it('sorts dates in descending order', () => {
      const data = [
        { date: '2024-01-10' },
        { date: '2024-03-15' },
      ];

      const sorted = data.sort((a, b) => sortByDate(a.date, b.date, 'desc'));

      expect(sorted[0].date).toBe('2024-03-15');
    });
  });

  describe('paginateData', () => {
    const testData = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));

    it('returns correct page of data', () => {
      const page1 = paginateData(testData, 1, 10);

      expect(page1).toHaveLength(10);
      expect(page1[0].id).toBe(1);
      expect(page1[9].id).toBe(10);
    });

    it('returns correct second page', () => {
      const page2 = paginateData(testData, 2, 10);

      expect(page2).toHaveLength(10);
      expect(page2[0].id).toBe(11);
      expect(page2[9].id).toBe(20);
    });

    it('handles last page with fewer items', () => {
      const lastPage = paginateData(testData, 5, 10);

      expect(lastPage).toHaveLength(10);
      expect(lastPage[9].id).toBe(50);
    });

    it('returns empty array for out of range page', () => {
      const outOfRange = paginateData(testData, 10, 10);

      expect(outOfRange).toHaveLength(0);
    });
  });

  describe('filterBySearch', () => {
    const testData = [
      { name: 'Health Potion', category: 'consumables' },
      { name: 'Iron Sword', category: 'equipment' },
      { name: 'Ancient Map', category: 'documents' },
    ];

    it('filters items by search term in name', () => {
      const filtered = filterBySearch(testData, 'potion', ['name']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Health Potion');
    });

    it('performs case-insensitive search', () => {
      const filtered = filterBySearch(testData, 'SWORD', ['name']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Iron Sword');
    });

    it('searches across multiple fields', () => {
      const filtered = filterBySearch(testData, 'equipment', ['name', 'category']);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('equipment');
    });

    it('returns all items when search is empty', () => {
      const filtered = filterBySearch(testData, '', ['name']);

      expect(filtered).toHaveLength(3);
    });

    it('returns empty array when no matches', () => {
      const filtered = filterBySearch(testData, 'nonexistent', ['name']);

      expect(filtered).toHaveLength(0);
    });
  });
});
