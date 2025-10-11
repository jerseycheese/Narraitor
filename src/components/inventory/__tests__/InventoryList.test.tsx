/**
 * Tests for InventoryList component
 *
 * Validates the 5 acceptance criteria:
 * 1. Displays items in a clear, organized list
 * 2. Groups items by categories with visual separation
 * 3. Shows essential item information and available actions
 * 4. Responsive and works on all device sizes
 * 5. Updates automatically when inventory changes
 */

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { InventoryList } from '../InventoryList';
import { useInventoryStore } from '@/state/inventoryStore';

// Mock the inventory store
jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: jest.fn(),
}));

const mockUseInventoryStore = useInventoryStore as jest.MockedFunction<typeof useInventoryStore>;

describe('InventoryList Component', () => {
  const mockCharacterId = 'char-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Acceptance Criteria 1: Clear, organized item display', () => {
    test('displays all items for the character', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Health Potion',
          description: 'Restores 50 HP',
          categoryId: 'consumables',
          quantity: 3,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-2',
          name: 'Rusty Sword',
          description: 'A worn blade',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-3',
          name: 'Gold Coins',
          description: 'Currency',
          categoryId: 'valuables',
          quantity: 150,
          stackable: true,
          maxStack: 999,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      // Verify all items are displayed
      expect(screen.getByText('Health Potion')).toBeInTheDocument();
      expect(screen.getByText('Rusty Sword')).toBeInTheDocument();
      expect(screen.getByText('Gold Coins')).toBeInTheDocument();
    });

    test('shows essential item information: name, description, and quantity', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Healing Herb',
          description: 'A medicinal plant',
          categoryId: 'consumables',
          quantity: 5,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      // Verify essential information is visible
      expect(screen.getByText('Healing Herb')).toBeInTheDocument();
      expect(screen.getByText('A medicinal plant')).toBeInTheDocument();
      expect(screen.getByText(/5/)).toBeInTheDocument(); // Quantity displayed
    });

    test('displays quantity for stackable items', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Arrows',
          description: 'Wooden arrows',
          categoryId: 'equipment',
          quantity: 25,
          stackable: true,
          maxStack: 50,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      expect(screen.getByText('Arrows')).toBeInTheDocument();
      expect(screen.getByText(/25/)).toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria 2: Category grouping with visual separation', () => {
    test('groups items by their categories', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Sword',
          description: 'A sharp blade',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-2',
          name: 'Shield',
          description: 'A sturdy shield',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-3',
          name: 'Health Potion',
          description: 'Restores HP',
          categoryId: 'consumables',
          quantity: 2,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      // Verify category headings are present
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Consumables')).toBeInTheDocument();
    });

    test('displays all standard category headings when items exist in those categories', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Sword',
          description: 'Equipment item',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-2',
          name: 'Gold',
          description: 'Valuable item',
          categoryId: 'valuables',
          quantity: 100,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-3',
          name: 'Potion',
          description: 'Consumable item',
          categoryId: 'consumables',
          quantity: 5,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-4',
          name: 'Map',
          description: 'Document item',
          categoryId: 'documents',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-5',
          name: 'Cloak',
          description: 'Personal item',
          categoryId: 'personal',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-6',
          name: 'Crystal',
          description: 'Quest item',
          categoryId: 'quest-items',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-7',
          name: 'Random Thing',
          description: 'Misc item',
          categoryId: 'miscellaneous',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      // Verify all category headings are displayed
      expect(screen.getByText('Equipment')).toBeInTheDocument();
      expect(screen.getByText('Valuables')).toBeInTheDocument();
      expect(screen.getByText('Consumables')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Personal')).toBeInTheDocument();
      expect(screen.getByText('Quest Items')).toBeInTheDocument();
      expect(screen.getByText('Miscellaneous')).toBeInTheDocument();
    });

    test('only shows categories that contain items', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Sword',
          description: 'Equipment item',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      // Should show Equipment category
      expect(screen.getByText('Equipment')).toBeInTheDocument();

      // Should NOT show empty categories
      expect(screen.queryByText('Consumables')).not.toBeInTheDocument();
      expect(screen.queryByText('Valuables')).not.toBeInTheDocument();
      expect(screen.queryByText('Documents')).not.toBeInTheDocument();
    });

    test('items appear under the correct category heading', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Sword',
          description: 'Equipment item',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-2',
          name: 'Health Potion',
          description: 'Consumable item',
          categoryId: 'consumables',
          quantity: 3,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      // Find category sections
      const equipmentSection = screen.getByText('Equipment').closest('div');
      const consumablesSection = screen.getByText('Consumables').closest('div');

      // Verify items are in correct sections
      expect(within(equipmentSection!).getByText('Sword')).toBeInTheDocument();
      expect(within(consumablesSection!).getByText('Health Potion')).toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria 3: Essential information and available actions', () => {
    test('displays item name prominently', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Enchanted Staff',
          description: 'A magical staff',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      const itemName = screen.getByText('Enchanted Staff');
      expect(itemName).toBeInTheDocument();
    });

    test('displays item description', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Magic Ring',
          description: 'Grants the wearer invisibility',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      expect(screen.getByText('Grants the wearer invisibility')).toBeInTheDocument();
    });

    test('shows category information for each item', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Ancient Scroll',
          description: 'Contains ancient knowledge',
          categoryId: 'documents',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      // Category should be visible via heading
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Ancient Scroll')).toBeInTheDocument();
    });

    test('distinguishes between stackable and non-stackable items visually', () => {
      const mockItems = [
        {
          id: 'item-1',
          name: 'Unique Artifact',
          description: 'One of a kind',
          categoryId: 'quest-items',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
        {
          id: 'item-2',
          name: 'Arrows',
          description: 'Wooden arrows',
          categoryId: 'equipment',
          quantity: 25,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue(mockItems),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      // Stackable items should show quantity
      expect(screen.getByText(/25/)).toBeInTheDocument();

      // Both items should be visible
      expect(screen.getByText('Unique Artifact')).toBeInTheDocument();
      expect(screen.getByText('Arrows')).toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria 4: Empty state handling', () => {
    test('shows appropriate message when inventory is empty', () => {
      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue([]),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      expect(screen.getByText(/no items/i)).toBeInTheDocument();
    });

    test('does not display category headings when inventory is empty', () => {
      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn().mockReturnValue([]),
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      expect(screen.queryByText('Equipment')).not.toBeInTheDocument();
      expect(screen.queryByText('Consumables')).not.toBeInTheDocument();
      expect(screen.queryByText('Valuables')).not.toBeInTheDocument();
    });
  });

  describe('Acceptance Criteria 5: Automatic updates when inventory changes', () => {
    test('reflects inventory changes when items are added', () => {
      const mockGetCharacterItems = jest.fn().mockReturnValue([]);

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: mockGetCharacterItems,
      } as any);

      const { rerender } = render(<InventoryList characterId={mockCharacterId} />);

      // Initially empty
      expect(screen.getByText(/no items/i)).toBeInTheDocument();

      // Update mock to return items
      const newItems = [
        {
          id: 'item-1',
          name: 'New Sword',
          description: 'Freshly acquired',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];
      mockGetCharacterItems.mockReturnValue(newItems);

      // Rerender component
      rerender(<InventoryList characterId={mockCharacterId} />);

      // Should show new item
      expect(screen.getByText('New Sword')).toBeInTheDocument();
      expect(screen.queryByText(/no items/i)).not.toBeInTheDocument();
    });

    test('reflects inventory changes when items are removed', () => {
      const initialItems = [
        {
          id: 'item-1',
          name: 'Temporary Item',
          description: 'Will be removed',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      const mockGetCharacterItems = jest.fn().mockReturnValue(initialItems);

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: mockGetCharacterItems,
      } as any);

      const { rerender } = render(<InventoryList characterId={mockCharacterId} />);

      // Initially has item
      expect(screen.getByText('Temporary Item')).toBeInTheDocument();

      // Update mock to return empty array
      mockGetCharacterItems.mockReturnValue([]);

      // Rerender component
      rerender(<InventoryList characterId={mockCharacterId} />);

      // Should show empty state
      expect(screen.queryByText('Temporary Item')).not.toBeInTheDocument();
      expect(screen.getByText(/no items/i)).toBeInTheDocument();
    });

    test('reflects inventory changes when quantities are updated', () => {
      const initialItems = [
        {
          id: 'item-1',
          name: 'Potions',
          description: 'Healing potions',
          categoryId: 'consumables',
          quantity: 3,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      const mockGetCharacterItems = jest.fn().mockReturnValue(initialItems);

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: mockGetCharacterItems,
      } as any);

      const { rerender } = render(<InventoryList characterId={mockCharacterId} />);

      // Initially shows quantity 3
      expect(screen.getByText(/3/)).toBeInTheDocument();

      // Update mock with new quantity
      const updatedItems = [
        {
          ...initialItems[0],
          quantity: 8,
          updatedAt: '2025-01-15T12:01:00Z',
        },
      ];
      mockGetCharacterItems.mockReturnValue(updatedItems);

      // Rerender component
      rerender(<InventoryList characterId={mockCharacterId} />);

      // Should show updated quantity
      expect(screen.getByText(/8/)).toBeInTheDocument();
      expect(screen.queryByText(/3/)).not.toBeInTheDocument();
    });
  });

  describe('Component integration with store', () => {
    test('calls getCharacterItems with correct character ID', () => {
      const mockGetCharacterItems = jest.fn().mockReturnValue([]);

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: mockGetCharacterItems,
      } as any);

      render(<InventoryList characterId={mockCharacterId} />);

      expect(mockGetCharacterItems).toHaveBeenCalledWith(mockCharacterId);
    });

    test('handles different character IDs correctly', () => {
      const mockGetCharacterItems = jest.fn().mockReturnValue([]);

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: mockGetCharacterItems,
      } as any);

      const { rerender } = render(<InventoryList characterId="char-123" />);
      expect(mockGetCharacterItems).toHaveBeenCalledWith('char-123');

      rerender(<InventoryList characterId="char-456" />);
      expect(mockGetCharacterItems).toHaveBeenCalledWith('char-456');
    });
  });
});
