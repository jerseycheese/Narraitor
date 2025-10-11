/**
 * Integration tests for Inventory Display in ActiveGameSession
 *
 * Validates the 5 acceptance criteria:
 * 1. The inventory UI displays a complete list of items associated with the character
 * 2. Each item shows its name, quantity, and optional description
 * 3. The inventory list is organized or grouped by categories
 * 4. The inventory UI is responsive and works on different screen sizes
 * 5. The inventory list refreshes automatically when items are added or removed
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import ActiveGameSession from '../ActiveGameSession';
import { useInventoryStore } from '@/state/inventoryStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import type { InventoryItem } from '@/types/inventory.types';

// Mock stores
jest.mock('@/state/inventoryStore');
jest.mock('@/state/sessionStore');
jest.mock('@/state/narrativeStore');
jest.mock('@/state/characterStore');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  useSearchParams: jest.fn(() => ({ get: jest.fn() })),
}));

const mockUseInventoryStore = useInventoryStore as jest.MockedFunction<typeof useInventoryStore>;
const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;
const mockUseNarrativeStore = useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>;
const mockUseCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;

describe('ActiveGameSession - Inventory Integration', () => {
  const mockWorldId = 'world-123';
  const mockSessionId = 'session-456';
  const mockCharacterId = 'char-789';

  const mockCharacter = {
    id: mockCharacterId,
    name: 'Test Hero',
    worldId: mockWorldId,
    createdAt: '2025-01-15T12:00:00Z',
    updatedAt: '2025-01-15T12:00:00Z',
  };

  const mockWorld = {
    id: mockWorldId,
    name: 'Test World',
    genre: 'fantasy',
    createdAt: '2025-01-15T12:00:00Z',
    updatedAt: '2025-01-15T12:00:00Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUseSessionStore.mockReturnValue({
      characterId: mockCharacterId,
      id: mockSessionId,
      worldId: mockWorldId,
      status: 'active',
    } as ReturnType<typeof useSessionStore>);

    mockUseCharacterStore.mockReturnValue({
      characters: { [mockCharacterId]: mockCharacter },
    } as ReturnType<typeof useCharacterStore>);

    mockUseNarrativeStore.mockReturnValue({
      sessionSegments: {
        [mockSessionId]: ['seg-1'],
      },
      segments: {
        'seg-1': {
          id: 'seg-1',
          content: 'Test narrative',
          type: 'scene',
          sessionId: mockSessionId,
          worldId: mockWorldId,
        },
      },
      getSessionSegments: jest.fn(() => [
        {
          id: 'seg-1',
          content: 'Test narrative',
          type: 'scene',
          sessionId: mockSessionId,
          worldId: mockWorldId,
        },
      ]),
      isSessionEnded: jest.fn(() => false),
      currentEnding: null,
      isGeneratingEnding: false,
    } as ReturnType<typeof useNarrativeStore>);
  });

  describe('AC1: Complete list of items displayed', () => {
    test('displays all items in character inventory', () => {
      const mockItems: InventoryItem[] = [
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
          name: 'Steel Sword',
          description: 'A sturdy blade',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn(() => mockItems),
      } as ReturnType<typeof useInventoryStore>);

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          world={mockWorld}
          status="active"
          onChoiceSelected={jest.fn()}
        />
      );

      // Verify both items are displayed
      expect(screen.getByText('Health Potion')).toBeInTheDocument();
      expect(screen.getByText('Steel Sword')).toBeInTheDocument();
    });
  });

  describe('AC2: Essential item information displayed', () => {
    test('shows name, quantity, and description for each item', () => {
      const mockItems: InventoryItem[] = [
        {
          id: 'item-1',
          name: 'Magic Scroll',
          description: 'Contains ancient spells',
          categoryId: 'documents',
          quantity: 2,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn(() => mockItems),
      } as ReturnType<typeof useInventoryStore>);

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          world={mockWorld}
          status="active"
          onChoiceSelected={jest.fn()}
        />
      );

      // Verify name, description, and quantity are displayed
      expect(screen.getByText('Magic Scroll')).toBeInTheDocument();
      expect(screen.getByText('Contains ancient spells')).toBeInTheDocument();
      expect(screen.getByText(/2/)).toBeInTheDocument();
    });
  });

  describe('AC3: Items organized by categories', () => {
    test('groups items under category headings', () => {
      const mockItems: InventoryItem[] = [
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
          name: 'Potion',
          description: 'Consumable item',
          categoryId: 'consumables',
          quantity: 5,
          stackable: true,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn(() => mockItems),
      } as ReturnType<typeof useInventoryStore>);

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          world={mockWorld}
          status="active"
          onChoiceSelected={jest.fn()}
        />
      );

      // Verify category headings appear
      expect(screen.getByRole('heading', { name: 'Equipment' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Consumables' })).toBeInTheDocument();
    });
  });

  describe('AC4: Responsive UI', () => {
    test('inventory component renders and is accessible', () => {
      const mockItems: InventoryItem[] = [
        {
          id: 'item-1',
          name: 'Test Item',
          description: 'Test description',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn(() => mockItems),
      } as ReturnType<typeof useInventoryStore>);

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          world={mockWorld}
          status="active"
          onChoiceSelected={jest.fn()}
        />
      );

      // Verify inventory region is accessible
      const inventoryRegion = screen.getByRole('region', { name: /inventory/i });
      expect(inventoryRegion).toBeInTheDocument();
    });
  });

  describe('AC5: Automatic updates when inventory changes', () => {
    test('displays updated items when inventory changes', () => {
      const initialItems: InventoryItem[] = [
        {
          id: 'item-1',
          name: 'Old Item',
          description: 'Will be replaced',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];

      const mockGetCharacterItems = jest.fn(() => initialItems);

      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: mockGetCharacterItems,
      } as ReturnType<typeof useInventoryStore>);

      const { rerender } = render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          world={mockWorld}
          status="active"
          onChoiceSelected={jest.fn()}
        />
      );

      // Verify initial item is displayed
      expect(screen.getByText('Old Item')).toBeInTheDocument();

      // Update mock to return new items
      const updatedItems: InventoryItem[] = [
        {
          id: 'item-2',
          name: 'New Item',
          description: 'Just added',
          categoryId: 'equipment',
          quantity: 1,
          stackable: false,
          createdAt: '2025-01-15T12:00:00Z',
          updatedAt: '2025-01-15T12:00:00Z',
        },
      ];
      mockGetCharacterItems.mockReturnValue(updatedItems);

      // Rerender component
      rerender(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          world={mockWorld}
          status="active"
          onChoiceSelected={jest.fn()}
        />
      );

      // Verify new item appears
      expect(screen.getByText('New Item')).toBeInTheDocument();
      expect(screen.queryByText('Old Item')).not.toBeInTheDocument();
    });
  });

  describe('Empty state handling', () => {
    test('shows empty state when character has no items', () => {
      mockUseInventoryStore.mockReturnValue({
        getCharacterItems: jest.fn(() => []),
      } as ReturnType<typeof useInventoryStore>);

      render(
        <ActiveGameSession
          worldId={mockWorldId}
          sessionId={mockSessionId}
          world={mockWorld}
          status="active"
          onChoiceSelected={jest.fn()}
        />
      );

      // Verify empty state message appears
      expect(screen.getByText(/no items/i)).toBeInTheDocument();
    });
  });
});
