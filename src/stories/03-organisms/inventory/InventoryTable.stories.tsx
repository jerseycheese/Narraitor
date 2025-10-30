/**
 * InventoryTable Storybook Stories
 * Demonstrates the inventory table view with sorting, filtering, and actions
 */

import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { useInventoryStore } from '@/state/inventoryStore';
import type { EntityID } from '@/types/common.types';
import type { InventoryItem, StandardInventoryCategory } from '@/types/inventory.types';

// Mock inventory data
const mockCharacterId = 'char-123' as EntityID;

const mockInventoryItems: InventoryItem[] = [
  {
    id: 'item-1' as EntityID,
    name: 'Health Potion',
    description: 'Restores 50 HP',
    categoryId: 'consumables',
    quantity: 5,
    stackable: true,
    maxStack: 99,
    acquisitionHistory: [
      {
        acquiredAt: '2024-01-15T10:00:00Z',
        method: 'loot',
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
    description: 'A sturdy blade',
    categoryId: 'equipment',
    quantity: 1,
    stackable: false,
    acquisitionHistory: [
      {
        acquiredAt: '2024-01-10T12:00:00Z',
        method: 'purchase',
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
    description: 'Shows hidden locations',
    categoryId: 'documents',
    quantity: 1,
    stackable: false,
    acquisitionHistory: [
      {
        acquiredAt: '2024-01-20T14:00:00Z',
        method: 'quest',
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
  {
    id: 'item-4' as EntityID,
    name: 'Gold Coins',
    description: 'Standard currency',
    categoryId: 'valuables',
    quantity: 150,
    stackable: true,
    maxStack: 999,
    acquisitionHistory: [
      {
        acquiredAt: '2024-01-18T09:00:00Z',
        method: 'loot',
        quantity: 150,
      },
    ],
    categorization: {
      categoryId: 'valuables',
      source: 'manual',
      classifiedAt: '2024-01-18T09:00:00Z',
    },
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-18T09:00:00Z',
  },
  {
    id: 'item-5' as EntityID,
    name: 'Leather Jacket',
    description: 'Worn but comfortable',
    categoryId: 'personal',
    quantity: 1,
    stackable: false,
    acquisitionHistory: [
      {
        acquiredAt: '2024-01-05T08:00:00Z',
        method: 'manual',
        quantity: 1,
      },
    ],
    categorization: {
      categoryId: 'personal',
      source: 'manual',
      classifiedAt: '2024-01-05T08:00:00Z',
    },
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-05T08:00:00Z',
  },
];

// Decorator to populate the store with mock data
const withInventoryData = (Story: React.ComponentType, items: InventoryItem[]) => {
  const StoryWithData = () => {
    const initRef = React.useRef(false);

    // Initialize store once on mount
    if (!initRef.current) {
      const itemsRecord = items.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<EntityID, InventoryItem>);

      useInventoryStore.setState({
        items: itemsRecord,
        entities: itemsRecord,
      });
      initRef.current = true;
    }

    return <Story />;
  };

  return <StoryWithData />;
};

const meta: Meta<typeof InventoryTable> = {
  title: '03-Organisms/inventory/InventoryTable',
  component: InventoryTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InventoryTable>;

/**
 * Default inventory table with all categories
 */
export const Default: Story = {
  decorators: [(Story) => withInventoryData(Story, mockInventoryItems)],
  args: {
    characterId: mockCharacterId,
  },
};

/**
 * Large inventory demonstrating pagination
 */
export const LargeInventory: Story = {
  decorators: [
    (Story) => {
      const categories: StandardInventoryCategory[] = ['consumables', 'equipment', 'documents', 'valuables', 'personal'];
      const methods = ['loot', 'purchase', 'quest', 'craft', 'reward'] as const;

      const largeItemSet = Array.from({ length: 25 }, (_, i) => ({
        id: `item-${i + 1}` as EntityID,
        name: `Item ${i + 1}`,
        description: `Description for item ${i + 1}`,
        categoryId: categories[i % 5],
        quantity: Math.floor(Math.random() * 50) + 1,
        stackable: i % 2 === 0,
        maxStack: i % 2 === 0 ? 99 : undefined,
        acquisitionHistory: [
          {
            acquiredAt: new Date(2024, 0, (i % 28) + 1).toISOString(),
            method: methods[i % 5],
            quantity: 1,
          },
        ],
        categorization: {
          categoryId: categories[i % 5],
          source: 'manual' as const,
          classifiedAt: new Date().toISOString(),
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return withInventoryData(Story, largeItemSet);
    },
  ],
  args: {
    characterId: mockCharacterId,
  },
};
