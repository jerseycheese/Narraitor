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
        onView={onView}
        onPlay={onPlay}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.queryByText('No description provided.')).not.toBeInTheDocument();
    expect(screen.queryByText('No description provided')).not.toBeInTheDocument();
  });

  it('marks the active character with a label, not a control', () => {
    render(
      <CharacterCard
        character={mockCharacter}
        isActive={true}
        onView={onView}
        onPlay={onPlay}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByTestId('character-card-active-label')).toHaveTextContent('Active');
    expect(screen.queryByRole('button', { name: /active/i })).not.toBeInTheDocument();
  });

  it('names every action after the character', () => {
    render(
      <CharacterCard
        character={mockCharacter}
        isActive={false}
        onView={onView}
        onPlay={onPlay}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    expect(screen.getByRole('button', { name: 'Play as Aragorn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Aragorn' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Aragorn' })).toBeInTheDocument();
    expect(screen.queryByTestId('character-card-actions-view-button')).not.toBeInTheDocument();
  });

  it('handles user interactions for the card actions and the name', () => {
    render(
      <CharacterCard
        character={mockCharacter}
        isActive={false}
        onView={onView}
        onPlay={onPlay}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByTestId('character-card-actions-play-button'));
    expect(onPlay).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('character-card-actions-edit-button'));
    expect(onEdit).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByTestId('character-card-actions-delete-button'));
    expect(onDelete).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Aragorn' }));
    expect(onView).toHaveBeenCalledTimes(1);
  });
});
