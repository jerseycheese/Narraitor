// Test InventoryList component item usage functionality
// Verifies that users can interact with the "Use" button and see appropriate feedback

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryList } from '../InventoryList';
import { useInventoryStore } from '@/state/inventoryStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';

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
    });

    characterId = useCharacterStore.getState().create({
      name: 'Test Hero',
      worldId,
      background: { summary: 'A brave adventurer' },
      attributes: [],
      skills: [],
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
    it('should trigger useItem when Use button is clicked', async () => {
      const user = userEvent.setup();

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
        const items = useInventoryStore.getState().getCharacterItems(characterId);
        const antidote = items.find(i => i.name === 'Antidote');
        expect(antidote?.quantity).toBe(1);
      });
    });

    it('should show loading state while item is being used', async () => {
      const user = userEvent.setup();

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

      const useButton = screen.getByRole('button', { name: /use/i });

      // Click and immediately check for loading state
      await user.click(useButton);

      // Button should show loading or be disabled during usage
      expect(useButton).toBeDisabled();
    });

    it('should remove item from list when last consumable is used', async () => {
      const user = userEvent.setup();

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
    it('should display success feedback after item is used', async () => {
      const user = userEvent.setup();

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

      // Should show success message or visual indicator
      // Using flexible matcher since exact message format may vary
      await waitFor(() => {
        expect(
          screen.queryByText(/used|success|effect/i) ||
          document.querySelector('[role="status"]')
        ).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should display error feedback when usage fails', async () => {
      const user = userEvent.setup();

      // Create item but then manually delete it to simulate error condition
      const itemId = useInventoryStore.getState().addItem(characterId, {
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

      // Delete item to cause error
      useInventoryStore.getState().deleteItem(itemId);

      const useButton = screen.getByRole('button', { name: /use/i });
      await user.click(useButton);

      // Should show error message
      await waitFor(() => {
        expect(
          screen.queryByText(/error|failed|cannot/i) ||
          document.querySelector('[role="alert"]')
        ).toBeTruthy();
      });
    });
  });
});
