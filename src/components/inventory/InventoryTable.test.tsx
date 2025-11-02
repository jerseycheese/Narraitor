import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { describe, beforeEach, jest } from '@jest/globals';
import { InventoryTable } from './InventoryTable';
import { InventoryStore, InventoryItemCreatePayload, InventoryItemAddPayload } from '@/state/inventoryStore';
import type { InventoryItem, ItemUsageResult } from '@/types/inventory.types';

import type { EntityID } from '@/types/common.types';

// Mock the inventory store
let mockInventoryStoreState: InventoryStore;

jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: jest.fn((selector) => (typeof selector === 'function' ? selector(mockInventoryStoreState) : mockInventoryStoreState)),
}));

// After the mock is defined, we can access its properties and set getState
const { useInventoryStore } = require('@/state/inventoryStore');
(useInventoryStore as any).getState = jest.fn(() => mockInventoryStoreState);

const mockInventoryItems: InventoryItem[] = [
  {
    id: 'item-1' as EntityID,
    name: 'Health Potion',
    description: 'A simple potion that restores a small amount of health.',
    categoryId: 'consumables',
    quantity: 5,
    stackable: true,
    maxStack: 99,
    acquisitionHistory: [
      {
        method: 'unknown',
        acquiredAt: '2024-01-15T10:00:00Z',
        quantity: 5,
      },
    ],
    categorization: {
      categoryId: 'consumables',
      source: 'manual',
      classifiedAt: '2024-01-15T10:00:00Z',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'item-2' as EntityID,
    name: 'Iron Sword',
    description: 'A basic but reliable sword.',
    categoryId: 'equipment',
    quantity: 1,
    stackable: false,
    acquisitionHistory: [
      {
        method: 'purchase',
        acquiredAt: '2024-01-10T12:00:00Z',
        quantity: 1,
      },
    ],
    categorization: {
      categoryId: 'equipment',
      source: 'manual',
      classifiedAt: '2024-01-10T12:00:00Z',
    },
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-10T12:00:00Z',
  },
  {
    id: 'item-3' as EntityID,
    name: 'Ancient Map',
    description: 'A mysterious map with faded markings.',
    categoryId: 'documents',
    quantity: 1,
    stackable: false,
    acquisitionHistory: [
      {
        method: 'reward',
        acquiredAt: '2024-01-20T14:00:00Z',
        quantity: 1,
      },
    ],
    categorization: {
      categoryId: 'documents',
      source: 'manual',
      classifiedAt: '2024-01-20T14:00:00Z',
    },
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z',
  },
];

describe('InventoryTable', () => {
  beforeEach(() => {
    const itemsAsRecord = mockInventoryItems.reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {} as Record<EntityID, InventoryItem>);

    mockInventoryStoreState = {
      items: itemsAsRecord,
      entities: itemsAsRecord, // Added missing entities property
      characterInventories: {
        'char-1': mockInventoryItems.map((item) => item.id),
      },
      error: null,
      loading: false,
      createItem: jest.fn() as (itemData: InventoryItemCreatePayload) => EntityID,
      updateItem: jest.fn(),
      deleteItem: jest.fn(),
      addItem: jest.fn() as (characterId: EntityID, itemData: InventoryItemAddPayload) => EntityID,
      removeItem: jest.fn(),
      updateItemQuantity: jest.fn(),
      getCharacterItems: jest.fn().mockReturnValue(mockInventoryItems) as (characterId: string) => InventoryItem[],
      clearCharacterInventory: jest.fn(),
      useItem: jest.fn() as (characterId: EntityID, itemId: EntityID) => ItemUsageResult,
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
      getById: jest.fn((id: EntityID) => itemsAsRecord[id]),
      getAll: jest.fn(() => mockInventoryItems),
      create: jest.fn() as (data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => EntityID,
      update: jest.fn(),
      delete: jest.fn(),
      setCurrent: jest.fn(),
      currentEntityId: null,
    };
  });
});
