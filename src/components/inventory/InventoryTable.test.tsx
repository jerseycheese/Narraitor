/**
 * Tests for InventoryTable component
 * Focus: Integration with inventory store, category filtering, row actions
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { InventoryTable } from './InventoryTable';
import { useInventoryStore } from '@/state/inventoryStore';
import type { InventoryItem } from '@/types/inventory.types';
import type { EntityID } from '@/types/common.types';
import { mockZustandStore, createMockInventoryStore, createMockInventoryItem } from '@/lib/test-utils';

// Mock the inventory store
jest.mock('@/state/inventoryStore');

// Mock DropConfirmationDialog
interface MockDropDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  item: InventoryItem;
}

jest.mock('./DropConfirmationDialog', () => ({
  DropConfirmationDialog: ({ isOpen, onConfirm, onClose, item }: MockDropDialogProps) => (
    isOpen ? (
      <div role="dialog" aria-label="Drop Item">
        <p>Drop {item?.name}?</p>
        <button onClick={onConfirm}>Confirm Drop</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    ) : null
  )
}));

const mockInventoryItems: InventoryItem[] = [
  createMockInventoryItem({
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
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  }),
  createMockInventoryItem({
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
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-10T12:00:00Z',
  }),
  createMockInventoryItem({
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
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z',
  }),
];

describe('InventoryTable', () => {
  beforeEach(() => {
    const mockState = {
      items: mockInventoryItems.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<string, typeof mockInventoryItems[0]>),
      characterInventories: {
        'char-1': mockInventoryItems.map((item) => item.id),
      },
      getCharacterItems: jest.fn(() => mockInventoryItems),
      removeItem: jest.fn(),
    };

    mockZustandStore(useInventoryStore as jest.MockedFunction<typeof useInventoryStore>, createMockInventoryStore(mockState));
  });

  it('renders inventory items in format', () => {
    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.getByText('Iron Sword')).toBeInTheDocument();
    expect(screen.getByText('Ancient Map')).toBeInTheDocument();
  });

  it('displays all required columns', () => {
    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Source')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('displays quantity values correctly', () => {
    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByText('5')).toBeInTheDocument(); // Health Potion quantity
    expect(screen.getAllByText('1')).toHaveLength(2); // Iron Sword and Ancient Map
  });

  it('shows use and drop action buttons', () => {
    render(<InventoryTable characterId="char-1" />);

    const useButtons = screen.getAllByLabelText(/use/i);
    const dropButtons = screen.getAllByLabelText(/drop/i);

    expect(useButtons.length).toBeGreaterThan(0);
    expect(dropButtons.length).toBeGreaterThan(0);
  });

  it('displays category names in readable format', () => {
    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByText('Consumables')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('filters items by search term', async () => {
    const user = userEvent.setup();
    render(<InventoryTable characterId="char-1" />);

    const searchInput = screen.getByPlaceholderText('Search items...');
    await user.type(searchInput, 'Potion');

    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.queryByText('Iron Sword')).not.toBeInTheDocument();
  });

  it('sorts by name column', async () => {
    const user = userEvent.setup();
    render(<InventoryTable characterId="char-1" />);

    // Find and click the sortable name header button
    const nameHeader = screen.getByRole('button', { name: /name/i });
    await user.click(nameHeader);

    const rows = screen.getAllByRole('row');
    // Check that Ancient Map is now first (alphabetically)
    expect(rows[1]).toHaveTextContent('Ancient Map');
  });

  it('has sortable quantity column', async () => {
    const user = userEvent.setup();
    render(<InventoryTable characterId="char-1" />);

    // Verify quantity column header is clickable for sorting
    const quantityHeader = screen.getByRole('button', { name: /quantity/i });
    expect(quantityHeader).toBeInTheDocument();

    // Click should not throw error
    await user.click(quantityHeader);

    // Table should still display all items after click
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.getByText('Iron Sword')).toBeInTheDocument();
    expect(screen.getByText('Ancient Map')).toBeInTheDocument();
  });

  it('displays row actions for each item', () => {
    render(<InventoryTable characterId="char-1" />);

    const dropButtons = screen.getAllByLabelText(/drop/i);
    const useButtons = screen.getAllByLabelText(/use/i);

    expect(dropButtons).toHaveLength(3);
    expect(useButtons).toHaveLength(3);
  });

  it('opens confirmation dialog when drop button clicked', async () => {
    const user = userEvent.setup();
    const mockRemoveItem = jest.fn();
    const mockClearError = jest.fn();

    const mockState = {
      items: mockInventoryItems.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<string, typeof mockInventoryItems[0]>),
      characterInventories: {
        'char-1': mockInventoryItems.map((item) => item.id),
      },
      getCharacterItems: jest.fn(() => mockInventoryItems),
      removeItem: mockRemoveItem,
      clearError: mockClearError,
      error: null,
    };

    mockZustandStore(
      useInventoryStore as jest.MockedFunction<typeof useInventoryStore>,
      createMockInventoryStore(mockState)
    );

    render(<InventoryTable characterId="char-1" />);

    const dropButtons = screen.getAllByLabelText(/drop/i);
    await user.click(dropButtons[0]);

    // Expect dialog
    expect(screen.getByRole('dialog', { name: 'Drop Item' })).toBeInTheDocument();
    
    // Confirm
    await user.click(screen.getByText('Confirm Drop'));
    
    // Expect removeItem
    expect(mockRemoveItem).toHaveBeenCalledWith('char-1', 'item-1', 5); // Quantity 5 for item-1
  });

  it('displays empty state when no inventory items', () => {
    const mockState = {
      items: {},
      characterInventories: {
        'char-1': [],
      },
      getCharacterItems: jest.fn(() => []),
      removeItem: jest.fn(),
    };

    mockZustandStore(
      useInventoryStore as jest.MockedFunction<typeof useInventoryStore>,
      createMockInventoryStore(mockState)
    );

    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByText(/no items in inventory/i)).toBeInTheDocument();
  });

  it('displays acquisition method', () => {
    render(<InventoryTable characterId="char-1" />);

    // Check that acquisition methods are displayed
    expect(screen.getByText('unknown')).toBeInTheDocument();
    expect(screen.getByText('purchase')).toBeInTheDocument();
    expect(screen.getByText('reward')).toBeInTheDocument();
  });

  it('only displays items for the specified character', () => {
    const mockGetCharacterItems = jest.fn((characterId: string) => {
      // Return different items based on character
      if (characterId === 'char-1') {
        return [mockInventoryItems[0]]; // Only Health Potion
      }
      return [mockInventoryItems[1], mockInventoryItems[2]]; // Other items
    });

    const mockState = {
      items: mockInventoryItems.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<string, typeof mockInventoryItems[0]>),
      characterInventories: {
        'char-1': [mockInventoryItems[0].id], // Only first item for char-1
      },
      getCharacterItems: mockGetCharacterItems,
      removeItem: jest.fn(),
    };

    mockZustandStore(
      useInventoryStore as jest.MockedFunction<typeof useInventoryStore>,
      createMockInventoryStore(mockState)
    );

    render(<InventoryTable characterId="char-1" />);

    // Should only show char-1's items
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.queryByText('Iron Sword')).not.toBeInTheDocument();
    expect(screen.queryByText('Ancient Map')).not.toBeInTheDocument();
  });
});
