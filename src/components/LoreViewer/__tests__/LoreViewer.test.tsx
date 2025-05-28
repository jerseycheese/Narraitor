/**
 * Tests for LoreViewer component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoreViewer } from '../LoreViewer';
import type { LoreFact } from '../../../types';

// Mock the lore store
const mockUseLoreStore = {
  facts: {} as Record<string, LoreFact>,
  loading: false,
  error: null,
  getFactsByWorld: jest.fn(),
  searchFacts: jest.fn(),
  createFact: jest.fn(),
  updateFact: jest.fn(),
  deleteFact: jest.fn(),
  setLoading: jest.fn()
};

jest.mock('../../../state/loreStore', () => ({
  useLoreStore: () => mockUseLoreStore
}));

// Mock data
const mockFacts: LoreFact[] = [
  {
    id: 'fact-1',
    category: 'characters',
    title: 'Hero Backstory',
    content: 'The hero was raised by dragons in the northern mountains',
    source: 'narrative',
    tags: ['hero', 'dragons', 'backstory'],
    isCanonical: true,
    relatedFacts: [],
    worldId: 'world-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'fact-2',
    category: 'locations',
    title: 'Dragon Peak',
    content: 'A mystical mountain where ancient dragons live',
    source: 'manual',
    tags: ['dragons', 'mountain', 'mystical'],
    isCanonical: true,
    relatedFacts: ['fact-1'],
    worldId: 'world-1',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z'
  }
];

describe('LoreViewer Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLoreStore.getFactsByWorld.mockReturnValue(mockFacts);
    mockUseLoreStore.searchFacts.mockReturnValue(mockFacts);
  });

  describe('Basic Rendering', () => {
    test('displays lore facts for a world', () => {
      render(<LoreViewer worldId="world-1" />);

      expect(screen.getByText('Hero Backstory')).toBeInTheDocument();
      expect(screen.getByText('Dragon Peak')).toBeInTheDocument();
      expect(screen.getByText('The hero was raised by dragons in the northern mountains')).toBeInTheDocument();
      expect(screen.getByText('A mystical mountain where ancient dragons live')).toBeInTheDocument();
    });

    test('shows appropriate category badges', () => {
      render(<LoreViewer worldId="world-1" />);

      expect(screen.getByText('characters')).toBeInTheDocument();
      expect(screen.getByText('locations')).toBeInTheDocument();
    });

    test('displays source information', () => {
      render(<LoreViewer worldId="world-1" />);

      expect(screen.getByText('narrative')).toBeInTheDocument();
      expect(screen.getByText('manual')).toBeInTheDocument();
    });

    test('shows tags for each fact', () => {
      render(<LoreViewer worldId="world-1" />);

      expect(screen.getByText('hero')).toBeInTheDocument();
      expect(screen.getByText('dragons')).toBeInTheDocument();
      expect(screen.getByText('mountain')).toBeInTheDocument();
    });
  });

  describe('Search and Filtering', () => {
    test('filters facts by category when category is selected', async () => {
      const user = userEvent.setup();
      render(<LoreViewer worldId="world-1" />);

      const categoryFilter = screen.getByRole('combobox', { name: /category/i });
      await user.selectOptions(categoryFilter, 'characters');

      await waitFor(() => {
        expect(mockUseLoreStore.searchFacts).toHaveBeenCalledWith({
          category: 'characters',
          worldId: 'world-1'
        });
      });
    });

    test('searches facts by text when search term is entered', async () => {
      const user = userEvent.setup();
      render(<LoreViewer worldId="world-1" />);

      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.type(searchInput, 'dragon');

      await waitFor(() => {
        expect(mockUseLoreStore.searchFacts).toHaveBeenCalledWith({
          searchTerm: 'dragon',
          worldId: 'world-1'
        });
      });
    });

    test('filters by canonical status', async () => {
      const user = userEvent.setup();
      render(<LoreViewer worldId="world-1" />);

      const canonicalFilter = screen.getByRole('checkbox', { name: /canonical only/i });
      await user.click(canonicalFilter);

      await waitFor(() => {
        expect(mockUseLoreStore.searchFacts).toHaveBeenCalledWith({
          isCanonical: true,
          worldId: 'world-1'
        });
      });
    });
  });

  describe('Fact Management', () => {
    test('opens create fact dialog when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoreViewer worldId="world-1" />);

      const addButton = screen.getByRole('button', { name: /add fact/i });
      await user.click(addButton);

      expect(screen.getByText('Create New Fact')).toBeInTheDocument();
    });

    test('creates new fact when form is submitted', async () => {
      const user = userEvent.setup();
      render(<LoreViewer worldId="world-1" />);

      const addButton = screen.getByRole('button', { name: /add fact/i });
      await user.click(addButton);

      // Fill out the form
      await user.type(screen.getByRole('textbox', { name: /title/i }), 'New Fact');
      await user.type(screen.getByRole('textbox', { name: /content/i }), 'Fact content');
      await user.selectOptions(screen.getByRole('combobox', { name: /category/i }), 'events');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      expect(mockUseLoreStore.createFact).toHaveBeenCalledWith({
        title: 'New Fact',
        content: 'Fact content',
        category: 'events',
        source: 'manual',
        tags: [],
        isCanonical: true,
        relatedFacts: [],
        worldId: 'world-1'
      });
    });

    test('opens edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoreViewer worldId="world-1" />);

      const editButtons = screen.getAllByRole('button', { name: /edit/i });
      await user.click(editButtons[0]);

      expect(screen.getByDisplayValue('Hero Backstory')).toBeInTheDocument();
    });

    test('deletes fact when delete button is clicked', async () => {
      const user = userEvent.setup();
      render(<LoreViewer worldId="world-1" />);

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // Confirm deletion
      const confirmButton = screen.getByRole('button', { name: /confirm/i });
      await user.click(confirmButton);

      expect(mockUseLoreStore.deleteFact).toHaveBeenCalledWith('fact-1');
    });
  });

  describe('Loading and Error States', () => {
    test('shows loading state when loading is true', () => {
      mockUseLoreStore.loading = true;
      render(<LoreViewer worldId="world-1" />);

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('shows error message when error exists', () => {
      mockUseLoreStore.error = 'Failed to load facts';
      render(<LoreViewer worldId="world-1" />);

      expect(screen.getByText('Failed to load facts')).toBeInTheDocument();
    });

    test('shows empty state when no facts exist', () => {
      mockUseLoreStore.getFactsByWorld.mockReturnValue([]);
      mockUseLoreStore.searchFacts.mockReturnValue([]);
      
      render(<LoreViewer worldId="world-1" />);

      expect(screen.getByText(/no lore facts/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('provides proper ARIA labels for interactive elements', () => {
      render(<LoreViewer worldId="world-1" />);

      expect(screen.getByRole('combobox', { name: /category/i })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /search/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add fact/i })).toBeInTheDocument();
    });

    test('supports keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<LoreViewer worldId="world-1" />);

      const searchInput = screen.getByRole('textbox', { name: /search/i });
      await user.tab();
      
      expect(searchInput).toHaveFocus();
    });
  });

  describe('Responsive Behavior', () => {
    test('displays facts in grid layout on larger screens', () => {
      render(<LoreViewer worldId="world-1" />);

      const factsList = screen.getByTestId('facts-list');
      expect(factsList).toHaveClass('grid');
    });

    test('adapts layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<LoreViewer worldId="world-1" />);

      const factsList = screen.getByTestId('facts-list');
      expect(factsList).toHaveClass('grid-cols-1');
    });
  });
});