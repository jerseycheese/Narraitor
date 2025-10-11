import React from 'react';
import { render, screen } from '@testing-library/react';
import { InventoryList } from '../InventoryList';
import { useInventoryStore } from '@/state/inventoryStore';
import type { InventoryStore } from '@/state/inventoryStore';
import type { InventoryItem } from '@/types/inventory.types';

jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: jest.fn(),
}));

const mockUseInventoryStore = useInventoryStore as jest.MockedFunction<typeof useInventoryStore>;
type MockInventoryStore = Pick<InventoryStore, 'getCharacterItems'>;

const baseTimestamp = '2025-01-15T12:00:00Z';

const createItem = (overrides: Partial<InventoryItem>): InventoryItem => {
  const quantity = overrides.quantity ?? 1;
  const categoryId = overrides.categoryId ?? 'equipment';

  return {
    id: overrides.id ?? 'item-1',
    name: overrides.name ?? 'Item',
    description: overrides.description ?? 'Description',
    categoryId,
    quantity,
    stackable: overrides.stackable ?? true,
    maxStack: overrides.maxStack,
    acquisitionHistory:
      overrides.acquisitionHistory ??
      [
        {
          acquiredAt: baseTimestamp,
          method: 'manual',
          quantity,
        },
      ],
    categorization:
      overrides.categorization ??
      {
        categoryId,
        source: 'manual',
        classifiedAt: baseTimestamp,
        confidence: 0.9,
      },
    createdAt: overrides.createdAt ?? baseTimestamp,
    updatedAt: overrides.updatedAt ?? baseTimestamp,
  };
};

describe('InventoryList', () => {
  const characterId = 'char-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('groups items by category and renders headings', () => {
    const mockItems = [
      createItem({
        id: 'item-1',
        name: 'Steel Sword',
        description: 'Reliable blade',
        categoryId: 'equipment',
        stackable: false,
      }),
      createItem({
        id: 'item-2',
        name: 'Health Potion',
        description: 'Restores vitality',
        categoryId: 'consumables',
        quantity: 3,
      }),
    ];

    mockUseInventoryStore.mockReturnValue({
      getCharacterItems: jest.fn().mockReturnValue(mockItems),
    } as MockInventoryStore);

    render(<InventoryList characterId={characterId} />);

    expect(screen.getByRole('heading', { name: 'Equipment' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Consumables' })).toBeInTheDocument();
    expect(screen.getByText('Steel Sword')).toBeInTheDocument();
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
  });

  test('shows stackable quantity badge', () => {
    const mockItems = [
      createItem({
        id: 'item-3',
        name: 'Arrow Bundle',
        description: 'Bundle of arrows',
        categoryId: 'equipment',
        quantity: 12,
        stackable: true,
        maxStack: 50,
      }),
    ];

    mockUseInventoryStore.mockReturnValue({
      getCharacterItems: jest.fn().mockReturnValue(mockItems),
    } as MockInventoryStore);

    render(<InventoryList characterId={characterId} />);

    expect(screen.getByText(/×12/)).toBeInTheDocument();
  });

  test('renders empty state when inventory is empty', () => {
    mockUseInventoryStore.mockReturnValue({
      getCharacterItems: jest.fn().mockReturnValue([]),
    } as MockInventoryStore);

    render(<InventoryList characterId={characterId} />);

    expect(screen.getByText(/no items in inventory/i)).toBeInTheDocument();
  });

  test('updates when inventory items change', () => {
    const getCharacterItems = jest.fn()
      .mockReturnValueOnce([])
      .mockReturnValueOnce([
        createItem({
          id: 'item-4',
          name: 'Arcane Tome',
          description: 'Contains forbidden spells',
          categoryId: 'documents',
          stackable: false,
        }),
      ]);

    mockUseInventoryStore.mockReturnValue({
      getCharacterItems,
    } as MockInventoryStore);

    const { rerender } = render(<InventoryList characterId={characterId} />);
    expect(screen.getByText(/no items in inventory/i)).toBeInTheDocument();

    rerender(<InventoryList characterId={characterId} />);

    expect(screen.getByText('Arcane Tome')).toBeInTheDocument();
  });
});
