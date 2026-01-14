import type { Meta, StoryObj } from '@storybook/react';
import { DropConfirmationDialog } from '@/components/inventory/DropConfirmationDialog';
import { InventoryItem } from '@/types/inventory.types';

const meta: Meta<typeof DropConfirmationDialog> = {
  title: '03-Organisms/Inventory/DropConfirmationDialog',
  component: DropConfirmationDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    onClose: { action: 'closed' },
    onConfirm: { action: 'confirmed' },
    onQuantityChange: { action: 'quantity changed' },
  },
};

export default meta;
type Story = StoryObj<typeof DropConfirmationDialog>;

const mockItem: InventoryItem = {
  id: 'item-1',
  name: 'Health Potion',
  description: 'Heals 50 HP',
  quantity: 5,
  stackable: true,
  categoryId: 'consumables',
  acquisitionHistory: [],
  categorization: {
      categoryId: 'consumables',
      classifiedAt: '2024-01-01T00:00:00Z',
      source: 'manual',
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

export const Default: Story = {
  args: {
    isOpen: true,
    item: mockItem,
    quantity: 1,
    quantityError: null,
    storeError: null,
  },
};

export const NonStackable: Story = {
  args: {
    isOpen: true,
    item: {
      ...mockItem,
      name: 'Iron Sword',
      stackable: false,
      quantity: 1,
      categoryId: 'equipment',
    },
    quantity: 1,
    quantityError: null,
    storeError: null,
  },
};

export const WithQuantityError: Story = {
  args: {
    isOpen: true,
    item: mockItem,
    quantity: 10,
    quantityError: 'Cannot drop more than 5 items',
    storeError: null,
  },
};

export const WithStoreError: Story = {
  args: {
    isOpen: true,
    item: mockItem,
    quantity: 1,
    quantityError: null,
    storeError: {
      title: 'Drop Failed',
      message: 'This item cannot be dropped right now.',
    },
  },
};
