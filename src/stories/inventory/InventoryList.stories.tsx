import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { InventoryList } from '@/components/inventory/InventoryList';
import { useInventoryStore } from '@/state/inventoryStore';

const meta = {
  title: 'Inventory/InventoryList',
  component: InventoryList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    characterId: {
      control: 'text',
      description: 'ID of the character whose inventory to display',
    },
  },
} satisfies Meta<typeof InventoryList>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default state showing a well-stocked inventory with items across multiple categories.
 * Demonstrates category grouping, quantity display, and responsive grid layout.
 */
export const Default: Story = {
  args: {
    characterId: 'char-story-1',
  },
  decorators: [
    (Story) => {
      const { addItem } = useInventoryStore();

      // Populate inventory with sample items
      React.useEffect(() => {
        const characterId = 'char-story-1';

        // Equipment
        addItem(characterId, {
          name: 'Steel Sword',
          description: 'A well-balanced blade',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
        });

        addItem(characterId, {
          name: 'Leather Armor',
          description: 'Light but protective',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
        });

        // Consumables
        addItem(characterId, {
          name: 'Health Potion',
          description: 'Restores 50 HP',
          categoryId: 'consumables',
          quantity: 5,
          stackable: true,
          maxStack: 99,
        });

        addItem(characterId, {
          name: 'Mana Potion',
          description: 'Restores 30 MP',
          categoryId: 'consumables',
          quantity: 3,
          stackable: true,
          maxStack: 99,
        });

        // Valuables
        addItem(characterId, {
          name: 'Gold Coins',
          description: 'Common currency',
          categoryId: 'valuables',
          quantity: 150,
          stackable: true,
          maxStack: 999,
        });

        addItem(characterId, {
          name: 'Gemstone',
          description: 'A precious ruby',
          categoryId: 'valuables',
          quantity: 1,
          stackable: false,
        });

        // Documents
        addItem(characterId, {
          name: 'Map Fragment',
          description: 'Part of an ancient map',
          categoryId: 'documents',
          quantity: 1,
          stackable: false,
        });

        // Quest Items
        addItem(characterId, {
          name: 'Crystal Shard',
          description: 'Glowing with magical energy',
          categoryId: 'quest-items',
          quantity: 1,
          stackable: false,
        });
      }, []);

      return <Story />;
    },
  ],
};

/**
 * Empty state when character has no items in inventory.
 * Shows appropriate empty state message.
 */
export const Empty: Story = {
  args: {
    characterId: 'char-story-empty',
  },
};

/**
 * Single category with multiple items.
 * Demonstrates how items are organized within one category.
 */
export const SingleCategory: Story = {
  args: {
    characterId: 'char-story-single',
  },
  decorators: [
    (Story) => {
      const { addItem } = useInventoryStore();

      React.useEffect(() => {
        const characterId = 'char-story-single';

        addItem(characterId, {
          name: 'Sword',
          description: 'A basic sword',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
        });

        addItem(characterId, {
          name: 'Shield',
          description: 'A basic shield',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
        });

        addItem(characterId, {
          name: 'Helmet',
          description: 'Iron helmet',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
        });
      }, []);

      return <Story />;
    },
  ],
};

/**
 * Mix of stackable and non-stackable items.
 * Shows quantity badges on stackable items and their max stack limits.
 */
export const MixedStackable: Story = {
  args: {
    characterId: 'char-story-mixed',
  },
  decorators: [
    (Story) => {
      const { addItem } = useInventoryStore();

      React.useEffect(() => {
        const characterId = 'char-story-mixed';

        // Non-stackable
        addItem(characterId, {
          name: 'Unique Artifact',
          description: 'One of a kind',
          categoryId: 'quest-items',
          quantity: 1,
          stackable: false,
        });

        // Stackable with low quantity
        addItem(characterId, {
          name: 'Arrows',
          description: 'Wooden arrows',
          categoryId: 'equipment',
          quantity: 15,
          stackable: true,
          maxStack: 50,
        });

        // Stackable with high quantity
        addItem(characterId, {
          name: 'Rations',
          description: 'Travel food',
          categoryId: 'consumables',
          quantity: 47,
          stackable: true,
          maxStack: 99,
        });
      }, []);

      return <Story />;
    },
  ],
};

/**
 * All seven standard categories populated.
 * Comprehensive view showing every category type.
 */
export const AllCategories: Story = {
  args: {
    characterId: 'char-story-all',
  },
  decorators: [
    (Story) => {
      const { addItem } = useInventoryStore();

      React.useEffect(() => {
        const characterId = 'char-story-all';

        addItem(characterId, { name: 'Sword', description: 'Equipment item', categoryId: 'equipment', quantity: 1, stackable: false });
        addItem(characterId, { name: 'Gold', description: 'Valuable item', categoryId: 'valuables', quantity: 100, stackable: true, maxStack: 999 });
        addItem(characterId, { name: 'Potion', description: 'Consumable item', categoryId: 'consumables', quantity: 5, stackable: true });
        addItem(characterId, { name: 'Letter', description: 'Document item', categoryId: 'documents', quantity: 1, stackable: false });
        addItem(characterId, { name: 'Cloak', description: 'Personal item', categoryId: 'personal', quantity: 1, stackable: false });
        addItem(characterId, { name: 'Key', description: 'Quest item', categoryId: 'quest-items', quantity: 1, stackable: false });
        addItem(characterId, { name: 'Rock', description: 'Misc item', categoryId: 'miscellaneous', quantity: 1, stackable: false });
      }, []);

      return <Story />;
    },
  ],
};
