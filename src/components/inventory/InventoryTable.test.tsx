/**
 * Tests for InventoryTable component
 * Focus: Integration with inventory store, category filtering, row actions
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { InventoryTable } from './InventoryTable';
import { useInventoryStore } from '@/state/inventoryStore';
import type { InventoryItem } from '@/types/inventory.types';
import type { EntityID } from '@/types/common.types';

// Mock the inventory store
jest.mock('@/state/inventoryStore');

const mockInventoryItems: InventoryItem[] = [
  {
    id: 'item-1' as EntityID,
    name: 'Health Potion',
    categoryId: 'consumables',
    quantity: 5,
    stackable: true,
    maxStack: 99,
    acquisitionHistory: [
      {
        method: 'found',
        timestamp: '2024-01-15T10:00:00Z',
        quantity: 5,
      },
    ],
    categorization: {
      tags: ['healing'],
      primaryCategoryId: 'consumables',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'item-2' as EntityID,
    name: 'Iron Sword',
    categoryId: 'equipment',
    quantity: 1,
    stackable: false,
    acquisitionHistory: [
      {
        method: 'purchased',
        timestamp: '2024-01-10T12:00:00Z',
        quantity: 1,
      },
    ],
    categorization: {
      tags: ['weapon'],
      primaryCategoryId: 'equipment',
    },
    createdAt: '2024-01-10T12:00:00Z',
    updatedAt: '2024-01-10T12:00:00Z',
  },
  {
    id: 'item-3' as EntityID,
    name: 'Ancient Map',
    categoryId: 'documents',
    quantity: 1,
    stackable: false,
    acquisitionHistory: [
      {
        method: 'quest-reward',
        timestamp: '2024-01-20T14:00:00Z',
        quantity: 1,
      },
    ],
    categorization: {
      tags: ['quest'],
      primaryCategoryId: 'documents',
    },
    createdAt: '2024-01-20T14:00:00Z',
    updatedAt: '2024-01-20T14:00:00Z',
  },
];

describe('InventoryTable', () => {
  beforeEach(() => {
    (useInventoryStore as unknown as jest.Mock).mockReturnValue({
      items: mockInventoryItems,
      removeItem: jest.fn(),
    });
  });

  it('renders inventory items in table format', () => {
    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.getByText('Iron Sword')).toBeInTheDocument();
    expect(screen.getByText('Ancient Map')).toBeInTheDocument();
  });

  it('displays all required columns', () => {
    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Quantity')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Max Stack')).toBeInTheDocument();
    expect(screen.getByText('Acquired')).toBeInTheDocument();
  });

  it('displays quantity values correctly', () => {
    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByText('5')).toBeInTheDocument(); // Health Potion quantity
    expect(screen.getAllByText('1')).toHaveLength(2); // Iron Sword and Ancient Map
  });

  it('shows max stack for stackable items', () => {
    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByText('99')).toBeInTheDocument(); // Health Potion max stack
  });

  it('displays category names in readable format', () => {
    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByText('Consumables')).toBeInTheDocument();
    expect(screen.getByText('Equipment')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
  });

  it('filters items by category', async () => {
    const user = userEvent.setup();
    render(<InventoryTable characterId="char-1" />);

    const categoryFilter = screen.getByRole('combobox', { name: /filter by category/i });
    await user.selectOptions(categoryFilter, 'consumables');

    expect(screen.getByText('Health Potion')).toBeInTheDocument();
    expect(screen.queryByText('Iron Sword')).not.toBeInTheDocument();
  });

  it('sorts by name column', async () => {
    const user = userEvent.setup();
    render(<InventoryTable characterId="char-1" />);

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    const rows = screen.getAllByRole('row');
    // Check that Ancient Map is now first (alphabetically)
    expect(rows[1]).toHaveTextContent('Ancient Map');
  });

  it('sorts by quantity column', async () => {
    const user = userEvent.setup();
    render(<InventoryTable characterId="char-1" />);

    const quantityHeader = screen.getByText('Quantity');
    await user.click(quantityHeader);

    const rows = screen.getAllByRole('row');
    // Check that Health Potion (quantity 5) is last after ascending sort
    expect(rows[3]).toHaveTextContent('Health Potion');
  });

  it('displays row actions for each item', () => {
    render(<InventoryTable characterId="char-1" />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons).toHaveLength(3);
  });

  it('calls delete handler when delete button clicked', async () => {
    const user = userEvent.setup();
    const mockRemoveItem = jest.fn();

    (useInventoryStore as unknown as jest.Mock).mockReturnValue({
      items: mockInventoryItems,
      removeItem: mockRemoveItem,
    });

    render(<InventoryTable characterId="char-1" />);

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]);

    expect(mockRemoveItem).toHaveBeenCalledWith('char-1', 'item-1');
  });

  it('displays empty state when no inventory items', () => {
    (useInventoryStore as unknown as jest.Mock).mockReturnValue({
      items: [],
      removeItem: jest.fn(),
    });

    render(<InventoryTable characterId="char-1" />);

    expect(screen.getByText(/no items in inventory/i)).toBeInTheDocument();
  });

  it('displays acquisition date in readable format', () => {
    render(<InventoryTable characterId="char-1" />);

    // Check that dates are formatted (not raw ISO strings)
    expect(screen.queryByText('2024-01-15T10:00:00Z')).not.toBeInTheDocument();
    expect(screen.getByText(/jan/i)).toBeInTheDocument();
  });

  it('has proper ARIA labels for accessibility', () => {
    render(<InventoryTable characterId="char-1" />);

    const table = screen.getByRole('table');
    expect(table).toHaveAttribute('aria-label', expect.stringContaining('inventory'));
  });
});
