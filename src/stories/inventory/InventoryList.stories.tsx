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
          description: 'Forged blade with a leather-wrapped hilt, showing signs of recent use and careful maintenance',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
        });

        addItem(characterId, {
          name: 'Leather Armor',
          description: 'Worn vest of hardened leather with reinforced shoulder guards, offering protection without restricting movement',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
        });

        // Consumables
        addItem(characterId, {
          name: 'Health Potion',
          description: 'Small glass vial containing a thick crimson liquid that glows faintly in the dark',
          categoryId: 'consumables',
          quantity: 5,
          stackable: true,
          maxStack: 99,
        });

        addItem(characterId, {
          name: 'Mana Potion',
          description: 'Blue crystalline liquid that swirls on its own, humming with arcane power',
          categoryId: 'consumables',
          quantity: 3,
          stackable: true,
          maxStack: 99,
        });

        // Valuables
        addItem(characterId, {
          name: 'Gold Coins',
          description: 'Standard currency stamped with the kingdom\'s seal - a dragon wreathed in flames',
          categoryId: 'valuables',
          quantity: 150,
          stackable: true,
          maxStack: 999,
        });

        addItem(characterId, {
          name: 'Ancient Ruby',
          description: 'Deep red gemstone the size of a walnut, with an inner fire that seems to pulse in rhythm with your heartbeat',
          categoryId: 'valuables',
          quantity: 1,
          stackable: false,
        });

        // Documents
        addItem(characterId, {
          name: 'Map Fragment',
          description: 'Torn parchment showing coastal landmarks and an X marked in faded ink, with notes in a language you don\'t recognize',
          categoryId: 'documents',
          quantity: 1,
          stackable: false,
        });

        // Quest Items
        addItem(characterId, {
          name: 'Resonance Crystal',
          description: 'Translucent shard that vibrates softly and glows brighter when pointed toward the northern mountains',
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
          name: 'Longsword',
          description: 'Standard issue military blade with a crossguard bearing the royal insignia',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
        });

        addItem(characterId, {
          name: 'Oak Shield',
          description: 'Round wooden shield reinforced with iron bands, slightly scorched on one side from recent battle',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
        });

        addItem(characterId, {
          name: 'Iron Helmet',
          description: 'Simple but effective helmet with a nasal guard, dented but serviceable',
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
          name: 'Sigil of the Lost Order',
          description: 'Medallion bearing an unfamiliar symbol that grows warm when danger approaches, apparently unique in all the realms',
          categoryId: 'quest-items',
          quantity: 1,
          stackable: false,
        });

        // Stackable with low quantity
        addItem(characterId, {
          name: 'Broadhead Arrows',
          description: 'Fletched arrows with steel tips designed for hunting large game',
          categoryId: 'equipment',
          quantity: 15,
          stackable: true,
          maxStack: 50,
        });

        // Stackable with high quantity
        addItem(characterId, {
          name: 'Trail Rations',
          description: 'Dried meat, hardtack, and preserved fruit wrapped in waxed cloth, enough to last several weeks',
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

        addItem(characterId, {
          name: 'Elven Bow',
          description: 'Gracefully curved bow of ash wood, impossibly light yet powerful',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false
        });
        addItem(characterId, {
          name: 'Silver Pieces',
          description: 'Coins of varying ages and kingdoms, accepted throughout the land',
          categoryId: 'valuables',
          quantity: 100,
          stackable: true,
          maxStack: 999
        });
        addItem(characterId, {
          name: 'Antidote Vials',
          description: 'Clear liquid that neutralizes most common poisons when consumed quickly',
          categoryId: 'consumables',
          quantity: 5,
          stackable: true
        });
        addItem(characterId, {
          name: 'Sealed Letter',
          description: 'Unopened correspondence bearing a wax seal you don\'t recognize',
          categoryId: 'documents',
          quantity: 1,
          stackable: false
        });
        addItem(characterId, {
          name: 'Weathered Cloak',
          description: 'Travel-stained cloak that\'s kept you warm through countless nights under the stars',
          categoryId: 'personal',
          quantity: 1,
          stackable: false
        });
        addItem(characterId, {
          name: 'Ornate Key',
          description: 'Heavy brass key with intricate teeth, clearly meant for something important',
          categoryId: 'quest-items',
          quantity: 1,
          stackable: false
        });
        addItem(characterId, {
          name: 'Smooth Stone',
          description: 'Ordinary river stone worn smooth by water, you\'ve carried it since childhood for luck',
          categoryId: 'miscellaneous',
          quantity: 1,
          stackable: false
        });
      }, []);

      return <Story />;
    },
  ],
};
