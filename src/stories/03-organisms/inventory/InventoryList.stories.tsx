import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { InventoryList } from '@/components/inventory/InventoryList';
import { useInventoryStore } from '@/state/inventoryStore';
import type { StandardInventoryCategory } from '@/types/inventory.types';
import { getTimestamp } from '@/lib/utils';

const meta = {
  title: '03-Organisms/inventory/InventoryList',
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

const createCategorization = (categoryId: StandardInventoryCategory, timestamp: string) => ({
  categoryId,
  source: 'system' as const,
  classifiedAt: timestamp,
  confidence: 0.92,
});

const createAcquisition = (quantity: number, timestamp: string) => ({
  acquiredAt: timestamp,
  method: 'manual' as const,
  quantity,
});

export const Default: Story = {
  args: {
    characterId: 'char-story-default',
    worldId: 'world-story-default',
    sessionId: 'session-story-default',
  },
  decorators: [
    (StoryComponent) => {
      const { addItem, clearCharacterInventory } = useInventoryStore();

      React.useEffect(() => {
        const characterId = 'char-story-default';
        const timestamp = getTimestamp();

        clearCharacterInventory(characterId);

        const seed = (
          categoryId: StandardInventoryCategory,
          item: Omit<Parameters<typeof addItem>[1], 'categorization' | 'acquisition'>,
          quantity = item.quantity ?? 1
        ) =>
          addItem(characterId, {
            ...item,
            categorization: createCategorization(categoryId, timestamp),
            acquisition: createAcquisition(quantity, timestamp),
          });

        seed('equipment', {
          name: 'Steel Sword',
          description: 'Forged blade with a balanced edge and leather-wrapped hilt',
          stackable: false,
          quantity: 1,
        });

        seed('equipment', {
          name: 'Leather Armor',
          description: 'Reinforced cuirass with articulated pauldrons',
          stackable: false,
          quantity: 1,
        });

        seed('consumables', {
          name: 'Health Potion',
          description: 'Ruby liquid that radiates a faint warmth',
          stackable: true,
          quantity: 4,
          maxStack: 25,
        }, 4);

        seed('consumables', {
          name: 'Mana Draught',
          description: 'Cool blue elixir infused with arcane sigils',
          stackable: true,
          quantity: 2,
          maxStack: 25,
        }, 2);

        seed('valuables', {
          name: 'Gold Coins',
          description: 'Stamped currency bearing the royal griffin',
          stackable: true,
          quantity: 150,
          maxStack: 999,
        }, 150);

        seed('documents', {
          name: 'Guild Charter',
          description: 'Sealed parchment outlining membership rights',
          stackable: false,
          quantity: 1,
        });

        seed('quest-items', {
          name: 'Resonance Crystal',
          description: 'Hums softly when aligned with northern ley lines',
          stackable: false,
          quantity: 1,
        });
      }, [addItem, clearCharacterInventory]);

      return <StoryComponent />;
    },
  ],
};

export const WithImages: Story = {
  args: {
    characterId: 'char-story-images',
    worldId: 'world-story-images',
    sessionId: 'session-story-images',
  },
  decorators: [
    (StoryComponent) => {
      const { addItem, clearCharacterInventory } = useInventoryStore();

      React.useEffect(() => {
        const characterId = 'char-story-images';
        const timestamp = getTimestamp();

        clearCharacterInventory(characterId);

        // Inline SVG data URIs so the story renders the restored image slot
        // without any network dependency.
        const swatch = (fill: string) =>
          `data:image/svg+xml;utf8,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="${fill}"/></svg>`
          )}`;

        addItem(characterId, {
          name: 'Steel Sword',
          description: 'Forged blade with a balanced edge',
          stackable: false,
          quantity: 1,
          categorization: createCategorization('equipment', timestamp),
          acquisition: createAcquisition(1, timestamp),
          image: {
            type: 'ai-generated',
            url: swatch('#8a6d3b'),
            generatedAt: timestamp,
          },
        });

        addItem(characterId, {
          name: 'Health Potion',
          description: 'Ruby liquid that radiates a faint warmth',
          stackable: true,
          quantity: 4,
          maxStack: 25,
          categorization: createCategorization('consumables', timestamp),
          acquisition: createAcquisition(4, timestamp),
          image: {
            type: 'ai-generated',
            url: swatch('#a94442'),
            generatedAt: timestamp,
          },
        });

        // No image field: demonstrates that manually-added items render no slot.
        addItem(characterId, {
          name: 'Guild Charter',
          description: 'Sealed parchment outlining membership rights',
          stackable: false,
          quantity: 1,
          categorization: createCategorization('documents', timestamp),
          acquisition: createAcquisition(1, timestamp),
        });
      }, [addItem, clearCharacterInventory]);

      return <StoryComponent />;
    },
  ],
};

export const SingleCategory: Story = {
  args: {
    characterId: 'char-story-single',
    worldId: 'world-story-single',
    sessionId: 'session-story-single',
  },
  decorators: [
    (StoryComponent) => {
      const { addItem, clearCharacterInventory } = useInventoryStore();

      React.useEffect(() => {
        const characterId = 'char-story-single';
        const timestamp = getTimestamp();

        clearCharacterInventory(characterId);

        const seed = (
          item: Omit<Parameters<typeof addItem>[1], 'categorization' | 'acquisition'>,
          quantity = item.quantity ?? 1
        ) =>
          addItem(characterId, {
            ...item,
            categorization: createCategorization('equipment', timestamp),
            acquisition: createAcquisition(quantity, timestamp),
          });

        seed({
          name: 'Longsword',
          description: 'Military blade with ceremonial engravings',
          stackable: false,
          quantity: 1,
        });

        seed({
          name: 'Oak Shield',
          description: 'Iron-rimmed shield hardened by many battles',
          stackable: false,
          quantity: 1,
        });

        seed({
          name: 'Throwing Knives',
          description: 'Set of balanced blades stored in a leather bandolier',
          stackable: true,
          quantity: 12,
          maxStack: 24,
        }, 12);
      }, [addItem, clearCharacterInventory]);

      return <StoryComponent />;
    },
  ],
};
