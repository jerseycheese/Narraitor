import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveGameSessionControls from '../ActiveGameSessionControls';
import type { StoreCharacter } from '@/state/characterStore';

jest.mock('../CharacterSummary', () => ({
  __esModule: true,
  default: ({ character }: { character: StoreCharacter }) => (
    <div data-testid="character-summary">{character.name}</div>
  ),
}));

jest.mock('../StorySummarySection', () => ({
  StorySummarySection: () => <div data-testid="story-summary" />,
}));

jest.mock('../ChoiceHistorySection', () => ({
  ChoiceHistorySection: () => <div data-testid="choice-history" />,
}));

jest.mock('@/components/ui/SaveIndicator', () => ({
  SaveIndicator: () => <div data-testid="save-indicator" />,
}));

jest.mock('@/components/ui/CollapsibleSection', () => ({
  CollapsibleSection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-section">{children}</div>
  ),
}));

jest.mock('@/components/inventory/InventoryList', () => ({
  InventoryList: () => <div data-testid="inventory-list" />,
}));

const baseProps = {
  worldId: 'world-1',
  sessionId: 'session-1',
  showEndConfirmation: false,
  onConfirmEndStory: jest.fn(),
  onCloseEndStory: jest.fn(),
  onOpenJournal: jest.fn(),
};

describe('ActiveGameSessionControls', () => {
  it('renders controls and handles journal click when character is present', () => {
    const character = {
      id: 'char-1',
      name: 'Avery',
    } as StoreCharacter;

    render(
      <ActiveGameSessionControls
        {...baseProps}
        character={character}
        characterId="char-1"
      />
    );

    expect(screen.getByTestId('inventory-list')).toBeInTheDocument();
    expect(screen.getByTestId('story-summary')).toBeInTheDocument();
    expect(screen.getByTestId('choice-history')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: /end story/i })).toBeNull();

    const journalButton = screen.getByRole('button', { name: /Open Journal/i });
    fireEvent.click(journalButton);
    expect(baseProps.onOpenJournal).toHaveBeenCalled();
  });

  it('omits character-specific sections when no character is provided', () => {
    render(
      <ActiveGameSessionControls
        {...baseProps}
        character={undefined}
        characterId={undefined}
      />
    );

    expect(screen.queryByTestId('character-summary')).toBeNull();
    expect(screen.queryByTestId('inventory-list')).toBeNull();
    expect(screen.queryByRole('button', { name: /Open Journal/i })).toBeNull();
    expect(screen.getByTestId('story-summary')).toBeInTheDocument();
  });

  it('renders manuscript end-story modal structure when confirmation is open', () => {
    render(
      <ActiveGameSessionControls
        {...baseProps}
        showEndConfirmation={true}
        character={undefined}
        characterId={undefined}
      />
    );

    const dialog = screen.getByRole('dialog', { name: /end story/i });
    expect(dialog).toHaveClass('manuscript-end-story-dialog');

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    const confirmButton = screen.getByRole('button', { name: /confirm end story/i });

    expect(cancelButton).toHaveClass('manuscript-end-story-cancel');
    expect(confirmButton).toHaveClass('manuscript-end-story-confirm');
  });

  // Escape/focus parity with the shared ConfirmationDialog (#1536).
  it('closes the end-story confirmation on Escape', () => {
    const onCloseEndStory = jest.fn();

    render(
      <ActiveGameSessionControls
        {...baseProps}
        onCloseEndStory={onCloseEndStory}
        showEndConfirmation={true}
        character={undefined}
        characterId={undefined}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });

    expect(onCloseEndStory).toHaveBeenCalledTimes(1);
  });

  it('moves focus to Cancel when the end-story confirmation opens', () => {
    render(
      <ActiveGameSessionControls
        {...baseProps}
        showEndConfirmation={true}
        character={undefined}
        characterId={undefined}
      />
    );

    expect(screen.getByRole('button', { name: /cancel/i })).toHaveFocus();
  });
});
