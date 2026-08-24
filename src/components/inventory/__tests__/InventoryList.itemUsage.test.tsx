// Test InventoryList component item usage functionality
// Verifies that users can interact with the "Use" button and see appropriate feedback

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryList } from '../InventoryList';
import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { processItemUsage } from '@/lib/inventory/itemUsageService';

// Mock the item usage service
jest.mock('@/lib/inventory/itemUsageService');

describe('InventoryList - Item Usage', () => {
  let worldId: string;
  let characterId: string;

  beforeEach(() => {
    // Reset stores
    useInventoryStore.getState().reset();
    useCharacterStore.getState().reset();
    useWorldStore.getState().reset();

    // Create test world and character
    worldId = useWorldStore.getState().create({
      name: 'Test World',
      description: 'A world for testing',
      genre: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 10,
        skillPointPool: 10,
      },
    });

    characterId = useCharacterStore.getState().create({
      name: 'Test Hero',
      worldId,
      description: 'A hero for testing purposes',
      level: 1,
      isPlayer: true,
      status: {
        conditions: [],
      },
      inventory: {
        characterId: characterId,
        items: [],
        itemOrder: [],
        capacity: 0,
        categories: [],
      },
      background: {
        history: 'A brave adventurer',
        personality: 'Courageous',
        goals: [],
        fears: [],
        relationships: [],
      },
      attributes: [],
      skills: [],
      derivedStats: [],
    });
  });

  describe('Use button rendering', () => {
    it('should display Use button for each item', () => {
      // Add test items
      useInventoryStore.getState().addItem(characterId, {
        name: 'Health Potion',
        stackable: true,
        quantity: 3,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'purchase',
          acquiredAt: new Date().toISOString(),
          quantity: 3,
        },
      });

      render(<InventoryList characterId={characterId} />);

      // Verify Use button appears
      const useButtons = screen.getAllByRole('button', { name: /use/i });
      expect(useButtons.length).toBeGreaterThan(0);
    });

    it('should disable Use button when item quantity is 0', () => {
      // Add item with 0 quantity (edge case)
      const itemId = useInventoryStore.getState().addItem(characterId, {
        name: 'Empty Bottle',
        stackable: true,
        quantity: 1,
        categorization: {
          categoryId: 'miscellaneous',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      // Set quantity to 0
      useInventoryStore.getState().updateItem(itemId, { quantity: 0 });

      render(<InventoryList characterId={characterId} />);

      const useButton = screen.getByRole('button', { name: /use/i });
      expect(useButton).toBeDisabled();
    });
  });

  describe('Item usage interaction', () => {
    beforeEach(() => {
      // Reset mock before each test
      jest.clearAllMocks();
    });

    it('should trigger useItem when Use button is clicked', async () => {
      const user = userEvent.setup();

      // Mock successful item usage
      const mockProcessItemUsage = processItemUsage as jest.MockedFunction<
        typeof processItemUsage
      >;
      mockProcessItemUsage.mockImplementation(async (charId, itemId) => {
        // Call the real store method to update inventory
        const result = useInventoryStore.getState().useItem(charId, itemId);
        return result;
      });

      // Add consumable item
      useInventoryStore.getState().addItem(characterId, {
        name: 'Antidote',
        stackable: true,
        quantity: 2,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 2,
        },
      });

      render(<InventoryList characterId={characterId} />);

      // Click Use button
      const useButton = screen.getByRole('button', { name: /use/i });
      await user.click(useButton);

      // Verify item quantity decreased
      await waitFor(() => {
        const items = useInventoryStore
          .getState()
          .getCharacterItems(characterId);
        const antidote = items.find((i) => i.name === 'Antidote');
        expect(antidote?.quantity).toBe(1);
      });
    });

    it('should show loading state while item is being used', async () => {
      const user = userEvent.setup();

      // Mock with longer delay to catch loading state
      const mockProcessItemUsage = processItemUsage as jest.MockedFunction<
        typeof processItemUsage
      >;
      mockProcessItemUsage.mockImplementation(async (charId, itemId) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return useInventoryStore.getState().useItem(charId, itemId);
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Scroll',
        stackable: false,
        categorization: {
          categoryId: 'documents',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'quest',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      render(<InventoryList characterId={characterId} />);

      const useButton = screen.getByRole('button', { name: /USE/i });

      // Click and check for loading state
      user.click(useButton);

      // Button should show loading state during usage
      await waitFor(() => {
        expect(useButton).toHaveTextContent('USING...');
      });
    });

    it('should remove item from list when last consumable is used', async () => {
      const user = userEvent.setup();

      // Mock to call the real store method
      const mockProcessItemUsage = processItemUsage as jest.MockedFunction<
        typeof processItemUsage
      >;
      mockProcessItemUsage.mockImplementation(async (charId, itemId) => {
        return useInventoryStore.getState().useItem(charId, itemId);
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Magic Berry',
        stackable: true,
        quantity: 1,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      render(<InventoryList characterId={characterId} />);

      // Verify item appears initially
      expect(screen.getByText('Magic Berry')).toBeInTheDocument();

      // Use the item
      const useButton = screen.getByRole('button', { name: /use/i });
      await user.click(useButton);

      // Verify item no longer appears
      await waitFor(() => {
        expect(screen.queryByText('Magic Berry')).not.toBeInTheDocument();
      });
    });
  });

  describe('Usage feedback', () => {
    beforeEach(() => {
      // Reset mock before each test
      jest.clearAllMocks();
    });

    it('should not display success feedback after item is used', async () => {
      const user = userEvent.setup();

      // Mock successful item usage with immediate response
      const mockProcessItemUsage = processItemUsage as jest.MockedFunction<
        typeof processItemUsage
      >;
      mockProcessItemUsage.mockResolvedValueOnce({
        success: true,
        narrative: 'The energy drink revitalizes you',
        itemName: 'Energy Drink',
        categoryId: 'consumables',
        wasConsumed: true,
        remainingQuantity: 0,
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Energy Drink',
        stackable: true,
        quantity: 1,
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'purchase',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      render(<InventoryList characterId={characterId} />);

      const useButton = screen.getByRole('button', { name: /use/i });
      await user.click(useButton);

      await waitFor(() => {
        expect(processItemUsage).toHaveBeenCalled();
      });

      // No inline success feedback should be rendered
      expect(screen.queryByText('The energy drink revitalizes you')).toBeNull();
      expect(screen.queryByRole('status')).toBeNull();
    });

    it('should display error feedback when usage fails', async () => {
      const user = userEvent.setup();

      // Mock failed item usage with immediate error response
      const mockProcessItemUsage = processItemUsage as jest.MockedFunction<
        typeof processItemUsage
      >;
      mockProcessItemUsage.mockResolvedValueOnce({
        success: false,
        error: {
          type: 'validation',
          title: 'Item Not Found',
          message: 'The specified item could not be found.',
        },
      });

      useInventoryStore.getState().addItem(characterId, {
        name: 'Cursed Amulet',
        stackable: false,
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: new Date().toISOString(),
        },
        acquisition: {
          method: 'loot',
          acquiredAt: new Date().toISOString(),
          quantity: 1,
        },
      });

      render(<InventoryList characterId={characterId} />);

      const useButton = screen.getByRole('button', { name: /use/i });
      await user.click(useButton);

      // Should show error message
      await waitFor(() => {
        expect(
          screen.getByText('The specified item could not be found.')
        ).toBeInTheDocument();
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });
});
