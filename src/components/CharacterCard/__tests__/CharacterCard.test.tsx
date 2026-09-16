import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CharacterCard } from '../CharacterCard';
import type { useCharacterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<typeof useCharacterStore.getState>['characters'][string];

const mockCharacter: StoreCharacter = {
  id: 'char-1',
  name: 'Aragorn',
  description: 'A ranger',
  worldId: 'world-1',
  level: 5,
  isPlayer: true,
  attributes: [],
  skills: [],
  derivedStats: [],
  background: {
    history: 'A noble ranger from the north.',
    personality: 'Brave and selfless.',
    goals: [],
    fears: [],
    relationships: [],
    isKnownFigure: true,
  },
  status: { conditions: [] },
  inventory: { characterId: 'char-1', items: [], capacity: 10, categories: [], itemOrder: [] },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

describe('CharacterCard', () => {
  const onMakeActive = jest.fn();
  const onView = jest.fn();
  const onPlay = jest.fn();
  const onEdit = jest.fn();
  const onDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders character name, level, and background badge', () => {
    render(
      <CharacterCard
        character={mockCharacter}
        isActive={false}
        onMakeActive={onMakeActive}
        onView={onView}
        onPlay={onPlay}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByRole('heading', { name: 'Aragorn' })).toBeInTheDocument();
    expect(screen.getByText('Level 5')).toBeInTheDocument();
    expect(screen.getByText('Known Figure')).toBeInTheDocument();
    expect(screen.getByText('A noble ranger from the north.')).toBeInTheDocument();
  });

  it('does not repeat "No description provided." when description is empty', () => {
    const emptyDescChar = {
      ...mockCharacter,
      background: {
        ...mockCharacter.background,
        history: '',
        personality: '',
      },
    };

    render(
      <CharacterCard
        character={emptyDescChar}
        isActive={false}
        onMakeActive={onMakeActive}
        onView={onView}
        onPlay={onPlay}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByText('No description provided.')).not.toBeInTheDocument();
    expect(screen.queryByText('No description provided')).not.toBeInTheDocument();
  });

  it('renders a clean active badge when character is active and omits loud green banner', () => {
    render(
      <CharacterCard
        character={mockCharacter}
        isActive={true}
        onMakeActive={onMakeActive}
        onView={onView}
        onPlay={onPlay}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByTestId('character-card-active-badge')).toBeInTheDocument();
    expect(screen.getByTestId('character-card-active-badge')).toHaveTextContent('Active');
    expect(screen.queryByText('Currently Active Character')).not.toBeInTheDocument();
  });

  it('provides streamlined buttons (Play, View, Edit, Delete) with Play as secondary variant', () => {
    render(
      <CharacterCard
        character={mockCharacter}
        isActive={false}
        onMakeActive={onMakeActive}
        onView={onView}
        onPlay={onPlay}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    const playBtn = screen.getByTestId('character-card-actions-play-button');
    const viewBtn = screen.getByTestId('character-card-actions-view-button');
    const editBtn = screen.getByTestId('character-card-actions-edit-button');
    const deleteBtn = screen.getByTestId('character-card-actions-delete-button');

    expect(playBtn).toBeInTheDocument();
    expect(playBtn).toHaveClass('card-action-variant-secondary');
    expect(viewBtn).toBeInTheDocument();
    expect(editBtn).toBeInTheDocument();
    expect(deleteBtn).toBeInTheDocument();

    // No Make Active clutter button in action group
    expect(screen.queryByText('Make Active')).not.toBeInTheDocument();
  });

  it('handles user interactions for actions and card click selection', () => {
    render(
      <CharacterCard
        character={mockCharacter}
        isActive={false}
        onMakeActive={onMakeActive}
        onView={onView}
        onPlay={onPlay}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByTestId('character-card-actions-play-button'));
    expect(onPlay).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('character-card-actions-view-button'));
    expect(onView).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('character-card-actions-edit-button'));
    expect(onEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('character-card-actions-delete-button'));
    expect(onDelete).toHaveBeenCalledTimes(1);

    // Clicking inactive card triggers onMakeActive
    fireEvent.click(screen.getByTestId('active-state-card'));
    expect(onMakeActive).toHaveBeenCalledTimes(1);
  });
});
