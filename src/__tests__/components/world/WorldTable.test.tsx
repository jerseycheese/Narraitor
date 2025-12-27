/**
 * Unit tests for WorldTable component
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WorldTable } from '@/components/world/WorldTable';
import { useCharacterStore } from '@/state/characterStore';
import type { World } from '@/types/world.types';
import type { EntityID } from '@/types/common.types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock character store
jest.mock('@/state/characterStore', () => ({
  useCharacterStore: jest.fn(),
}));

const mockWorlds: World[] = [
  {
    id: 'world-1' as EntityID,
    name: 'Fantasy Realm',
    description: 'A magical world',
    genre: 'fantasy',
    attributes: [{ id: 'attr-1', name: 'Strength', type: 'number' }],
    skills: [{ id: 'skill-1', name: 'Combat', type: 'skill' }],
    settings: {},
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'world-2' as EntityID,
    name: 'Sci-Fi Universe',
    description: 'A futuristic world',
    genre: 'sci-fi',
    attributes: [{ id: 'attr-2', name: 'Intelligence', type: 'number' }],
    skills: [],
    settings: {},
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

describe('WorldTable', () => {
  const mockOnToggleSelect = jest.fn();
  const mockOnDeleteWorld = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useCharacterStore as unknown as jest.Mock).mockReturnValue({
      'world-1': ['char-1', 'char-2'],
      'world-2': [],
    });
  });

  it('renders table with all columns', () => {
    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    // Check column headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Genre')).toBeInTheDocument();
    expect(screen.getByText('Attributes')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders world data correctly', () => {
    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
    expect(screen.getByText('Sci-Fi Universe')).toBeInTheDocument();

    // Check attribute and skill counts exist (multiple "1"s and "0"s in the table)
    expect(screen.getAllByText('1').length).toBeGreaterThan(0); // Attribute counts
    expect(screen.getAllByText('0').length).toBeGreaterThan(0); // Skill counts
  });

  it('displays character counts from store', () => {
    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    const characterCells = screen.getAllByText('2');
    expect(characterCells.length).toBeGreaterThan(0); // world-1 has 2 characters
  });

  it('renders selection checkboxes', () => {
    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    // Header checkbox
    expect(screen.getByLabelText(/Select up to/)).toBeInTheDocument();

    // Row checkboxes
    expect(screen.getByLabelText('Select Fantasy Realm for comparison')).toBeInTheDocument();
    expect(screen.getByLabelText('Select Sci-Fi Universe for comparison')).toBeInTheDocument();
  });

  it('calls onToggleSelect when checkbox is clicked', () => {
    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    const checkbox = screen.getByLabelText('Select Fantasy Realm for comparison');
    fireEvent.click(checkbox);

    expect(mockOnToggleSelect).toHaveBeenCalledWith('world-1');
  });

  it('disables checkboxes when 5 worlds are selected', () => {
    const selectedIds = ['world-3', 'world-4', 'world-5', 'world-6', 'world-7'] as EntityID[];

    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={selectedIds}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    const checkbox = screen.getByLabelText('Select Fantasy Realm for comparison');
    expect(checkbox).toBeDisabled();
  });

  it('does not disable already selected checkboxes when limit reached', () => {
    const selectedIds = ['world-1', 'world-3', 'world-4', 'world-5', 'world-6'] as EntityID[];

    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={selectedIds}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    const checkbox = screen.getByLabelText('Select Fantasy Realm for comparison');
    expect(checkbox).not.toBeDisabled();
  });

  it('renders action buttons for each world', () => {
    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    expect(screen.getByLabelText('View Fantasy Realm')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Fantasy Realm')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Fantasy Realm')).toBeInTheDocument();
  });

  it('calls onDeleteWorld when delete button clicked', () => {
    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    const deleteBtn = screen.getByLabelText('Delete Fantasy Realm');
    fireEvent.click(deleteBtn);

    expect(mockOnDeleteWorld).toHaveBeenCalledWith('world-1', expect.any(Object));
  });

  it('shows empty state when no worlds', () => {
    render(
      <WorldTable
        worlds={[]}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    expect(screen.getByText('No worlds found. Create your first world to get started!')).toBeInTheDocument();
  });

  it('includes search functionality', () => {
    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search worlds...');
    expect(searchInput).toBeInTheDocument();

    // Type in search
    fireEvent.change(searchInput, { target: { value: 'Fantasy' } });

    // Fantasy Realm should still be visible
    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
  });

  it('includes pagination controls', () => {
    // Create more than 10 worlds to trigger pagination
    const manyWorlds = Array.from({ length: 15 }, (_, i) => ({
      ...mockWorlds[0],
      id: `world-${i}` as EntityID,
      name: `World ${i}`,
    }));

    render(
      <WorldTable
        worlds={manyWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    // Pagination should show page info
    expect(screen.getByText(/Page \d+ of \d+/)).toBeInTheDocument();
  });

  it('Select All respects 5-world limit', () => {
    const manyWorlds = Array.from({ length: 10 }, (_, i) => ({
      ...mockWorlds[0],
      id: `world-${i}` as EntityID,
      name: `World ${i}`,
    }));

    render(
      <WorldTable
        worlds={manyWorlds}
        selectedWorldIds={[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    const selectAllCheckbox = screen.getByLabelText(/Select up to 5 worlds/);
    fireEvent.click(selectAllCheckbox);

    // Should only select first 5 worlds
    expect(mockOnToggleSelect).toHaveBeenCalledTimes(5);
  });

  it('Select All clears selections when some are selected', () => {
    render(
      <WorldTable
        worlds={mockWorlds}
        selectedWorldIds={['world-1'] as EntityID[]}
        onToggleSelect={mockOnToggleSelect}
        onDeleteWorld={mockOnDeleteWorld}
      />
    );

    const selectAllCheckbox = screen.getByLabelText(/Select up to/);
    fireEvent.click(selectAllCheckbox);

    // Should toggle off the selected world
    expect(mockOnToggleSelect).toHaveBeenCalledWith('world-1');
  });
});
