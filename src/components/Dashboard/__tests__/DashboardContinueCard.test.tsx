import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DashboardContinueCard } from '../DashboardContinueCard';
import type { SavedSession } from '@/types/game.types';
import type { World } from '@/types/world.types';
import type { Character } from '@/types/character.types';

describe('DashboardContinueCard', () => {
  const mockWorld: World = {
    id: 'world-1',
    name: 'Fantasy Realm',
    genre: 'Fantasy',
    description: 'A magical world',
    loreKeys: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockCharacter: Character = {
    id: 'char-1',
    worldId: 'world-1',
    name: 'Aragorn',
    portrait: { type: 'placeholder', url: null },
    characterSheetData: {},
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  };

  const mockSession: SavedSession = {
    id: 'session-1',
    worldId: 'world-1',
    characterId: 'char-1',
    narrativeCount: 15,
    lastPlayed: '2024-01-05T12:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z'
  };

  const mockOnContinue = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    mockOnContinue.mockClear();
    mockOnDelete.mockClear();
  });

  it('displays session details correctly', () => {
    render(
      <DashboardContinueCard
        session={mockSession}
        world={mockWorld}
        character={mockCharacter}
        onContinue={mockOnContinue}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Fantasy Realm')).toBeInTheDocument();
    expect(screen.getByText('Aragorn')).toBeInTheDocument();
    expect(screen.getByText(/15.*entries/i)).toBeInTheDocument();
  });

  it('calls onContinue when continue button clicked', async () => {
    const user = userEvent.setup();

    render(
      <DashboardContinueCard
        session={mockSession}
        world={mockWorld}
        character={mockCharacter}
        onContinue={mockOnContinue}
        onDelete={mockOnDelete}
      />
    );

    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);

    expect(mockOnContinue).toHaveBeenCalledWith(mockSession.id);
  });

  it('shows delete confirmation dialog when delete clicked', async () => {
    const user = userEvent.setup();

    render(
      <DashboardContinueCard
        session={mockSession}
        world={mockWorld}
        character={mockCharacter}
        onContinue={mockOnContinue}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    await user.click(deleteButton);

    // Confirmation dialog should appear
    expect(screen.getByText(/permanently delete/i)).toBeInTheDocument();
  });

  it('displays character portrait', () => {
    render(
      <DashboardContinueCard
        session={mockSession}
        world={mockWorld}
        character={mockCharacter}
        onContinue={mockOnContinue}
        onDelete={mockOnDelete}
      />
    );

    // CharacterPortrait should be rendered with character name
    expect(screen.getByAltText(/Aragorn/i)).toBeInTheDocument();
  });

  it('shows relative timestamp for last played', () => {
    render(
      <DashboardContinueCard
        session={mockSession}
        world={mockWorld}
        character={mockCharacter}
        onContinue={mockOnContinue}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/last played/i)).toBeInTheDocument();
  });
});
