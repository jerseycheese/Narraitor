/**
 * Unit tests for CharacterTable component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterTable } from '@/components/character/CharacterTable';
import type { StoreCharacter } from '@/state/characterStore';
import type { EntityID } from '@/types/common.types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

const mockCharacters: StoreCharacter[] = [
  {
    id: 'char-1' as EntityID,
    name: 'Aragorn',
    description: 'A ranger from the North',
    worldId: 'world-1' as EntityID,
    level: 10,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'A ranger from the North',
      personality: 'Brave and noble',
      goals: [],
      fears: [],
      physicalDescription: 'Tall and weathered',
      relationships: [],
      isKnownFigure: true,
      knownFigureType: 'fictional',
    },
    isPlayer: true,
    status: {
      conditions: [],
    },
    inventory: {
      characterId: 'char-1' as EntityID,
      items: [],
      capacity: 20,
      categories: [],
      itemOrder: [],
    },
    portrait: {
      type: 'ai-generated',
      url: 'https://example.com/aragorn.jpg',
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'char-2' as EntityID,
    name: 'Legolas',
    description: 'An elven archer',
    worldId: 'world-1' as EntityID,
    level: 8,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'An elven prince',
      personality: 'Swift and keen-eyed',
      goals: [],
      fears: [],
      physicalDescription: 'Fair and graceful',
      relationships: [],
      isKnownFigure: false,
    },
    isPlayer: false,
    status: {
      conditions: [],
    },
    inventory: {
      characterId: 'char-2' as EntityID,
      items: [],
      capacity: 15,
      categories: [],
      itemOrder: [],
    },
    portrait: {
      type: 'placeholder',
      url: null,
    },
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
  {
    id: 'char-3' as EntityID,
    name: 'Gimli',
    description: 'A dwarf warrior',
    worldId: 'world-1' as EntityID,
    level: 12,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'A stout warrior from the mountains',
      personality: 'Gruff but loyal',
      goals: [],
      fears: [],
      physicalDescription: 'Short and sturdy',
      relationships: [],
      isKnownFigure: false,
    },
    isPlayer: false,
    status: {
      conditions: [],
    },
    inventory: {
      characterId: 'char-3' as EntityID,
      items: [],
      capacity: 25,
      categories: [],
      itemOrder: [],
    },
    createdAt: '2024-01-03T00:00:00.000Z',
    updatedAt: '2024-01-03T00:00:00.000Z',
  },
];

describe('CharacterTable', () => {
  const mockOnMakeActive = jest.fn();
  const mockOnView = jest.fn();
  const mockOnPlay = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const defaultProps = {
    characters: mockCharacters,
    currentCharacterId: 'char-1' as EntityID,
    onMakeActive: mockOnMakeActive,
    onView: mockOnView,
    onPlay: mockOnPlay,
    onEdit: mockOnEdit,
    onDelete: mockOnDelete,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with all columns', () => {
    render(<CharacterTable {...defaultProps} />);

    expect(
      screen.getByRole('table', { name: 'Characters table' })
    ).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('renders character data correctly', () => {
    render(<CharacterTable {...defaultProps} />);

    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(screen.getByText('Legolas')).toBeInTheDocument();
    expect(screen.getByText('Gimli')).toBeInTheDocument();
  });

  it('displays level correctly', () => {
    render(<CharacterTable {...defaultProps} />);

    expect(screen.getByText('Level 10')).toBeInTheDocument();
    expect(screen.getByText('Level 8')).toBeInTheDocument();
    expect(screen.getByText('Level 12')).toBeInTheDocument();
  });

  it('shows correct badge types for Known Figure and Original', () => {
    render(<CharacterTable {...defaultProps} />);

    const badges = screen.getAllByText(/Known Figure|Original/);
    expect(badges).toHaveLength(3);
    expect(screen.getByText('Known Figure')).toBeInTheDocument();
    expect(screen.getAllByText('Original')).toHaveLength(2);
  });

  it('calls onView when View button clicked', () => {
    render(<CharacterTable {...defaultProps} />);

    const viewButtons = screen.getAllByLabelText(/View/);
    fireEvent.click(viewButtons[0]);

    expect(mockOnView).toHaveBeenCalledTimes(1);
    expect(mockOnView).toHaveBeenCalledWith('char-1');
  });

  it('calls onPlay when Play button clicked', () => {
    render(<CharacterTable {...defaultProps} />);

    const playButtons = screen.getAllByLabelText(/Play as/);
    fireEvent.click(playButtons[0]);

    expect(mockOnPlay).toHaveBeenCalledTimes(1);
    expect(mockOnPlay).toHaveBeenCalledWith('char-1');
  });

  it('calls onEdit when Edit button clicked', () => {
    render(<CharacterTable {...defaultProps} />);

    const editButtons = screen.getAllByLabelText(/Edit/);
    fireEvent.click(editButtons[0]);

    expect(mockOnEdit).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).toHaveBeenCalledWith('char-1');
  });

  it('calls onDelete when Delete button clicked', () => {
    render(<CharacterTable {...defaultProps} />);

    const deleteButtons = screen.getAllByLabelText(/Delete/);
    fireEvent.click(deleteButtons[0]);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnDelete).toHaveBeenCalledWith('char-1');
  });

  it('calls onMakeActive when Make Active button clicked', () => {
    render(<CharacterTable {...defaultProps} />);

    // Only non-active characters should have Make Active button
    const makeActiveButton = screen.getByLabelText('Make Legolas active');
    fireEvent.click(makeActiveButton);

    expect(mockOnMakeActive).toHaveBeenCalledTimes(1);
    expect(mockOnMakeActive).toHaveBeenCalledWith('char-2');
  });

  it('does not show Make Active button for current character', () => {
    render(<CharacterTable {...defaultProps} />);

    // Aragorn is the current character, should not have Make Active button
    expect(
      screen.queryByLabelText('Make Aragorn active')
    ).not.toBeInTheDocument();

    // But other characters should have it
    expect(screen.getByLabelText('Make Legolas active')).toBeInTheDocument();
    expect(screen.getByLabelText('Make Gimli active')).toBeInTheDocument();
  });

  it('filters characters by name search', () => {
    render(<CharacterTable {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search characters...');
    fireEvent.change(searchInput, { target: { value: 'Aragorn' } });

    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(screen.queryByText('Legolas')).not.toBeInTheDocument();
    expect(screen.queryByText('Gimli')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', () => {
    render(<CharacterTable {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search characters...');
    fireEvent.change(searchInput, { target: { value: 'aragorn' } });

    expect(screen.getByText('Aragorn')).toBeInTheDocument();
  });

  it('clears search shows all characters', () => {
    render(<CharacterTable {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search characters...');
    fireEvent.change(searchInput, { target: { value: 'Aragorn' } });
    fireEvent.change(searchInput, { target: { value: '' } });

    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(screen.getByText('Legolas')).toBeInTheDocument();
    expect(screen.getByText('Gimli')).toBeInTheDocument();
  });

  it('shows empty state when no characters', () => {
    render(<CharacterTable {...defaultProps} characters={[]} />);

    expect(
      screen.getByText('No characters yet. Create one to get started.')
    ).toBeInTheDocument();
  });

  it('all action buttons have aria-labels', () => {
    render(<CharacterTable {...defaultProps} />);

    expect(screen.getByLabelText('Play as Aragorn')).toBeInTheDocument();
    expect(screen.getByLabelText('View Aragorn')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit Aragorn')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete Aragorn')).toBeInTheDocument();
  });

  it('table has proper aria-label', () => {
    render(<CharacterTable {...defaultProps} />);

    expect(
      screen.getByRole('table', { name: 'Characters table' })
    ).toBeInTheDocument();
  });

  it('calls onView when character name clicked', () => {
    render(<CharacterTable {...defaultProps} />);

    const characterName = screen.getByText('Aragorn');
    fireEvent.click(characterName);

    expect(mockOnView).toHaveBeenCalledWith('char-1');
  });

  it('calls onView when the Name-cell portrait thumbnail is clicked', () => {
    const { container } = render(<CharacterTable {...defaultProps} />);

    // Portrait now renders as a thumbnail inside the Name cell (mirrors
    // WorldTable); clicking it bubbles to the cell's view handler.
    const firstRow = container.querySelector('tbody tr');
    const thumb = firstRow?.querySelector(
      '.component-character-table-name .component-character-table-thumb'
    );

    expect(thumb).toBeTruthy();

    fireEvent.click(thumb!);
    expect(mockOnView).toHaveBeenCalledWith('char-1');
  });
});
