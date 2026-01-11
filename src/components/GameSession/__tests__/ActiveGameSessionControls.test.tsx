import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ActiveGameSessionControls from '../ActiveGameSessionControls';
import type { Character } from '@/state/characterStore';

jest.mock('../CharacterSummary', () => ({
  __esModule: true,
  default: ({ character }: { character: Character }) => (
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

jest.mock('@/components/ConfirmationDialog', () => ({
  ConfirmationDialog: ({ isOpen }: { isOpen: boolean }) => (
    <div data-testid="confirmation-dialog">{isOpen ? 'open' : 'closed'}</div>
  ),
}));

jest.mock('../JournalFloatingButton', () => ({
  JournalFloatingButton: ({ onClick }: { onClick: () => void }) => (
    <button data-testid="journal-floating" onClick={onClick} />
  ),
}));

jest.mock('@/components/ui/CollapsibleSection', () => ({
  CollapsibleSection: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="collapsible-section">{children}</div>
  ),
}));

jest.mock('@/components/inventory/InventoryList', () => ({
  InventoryList: () => <div data-testid="inventory-list" />,
}));

const baseAutoSave = {
  status: 'idle' as const,
  lastSaveTime: null,
  errorMessage: null,
  totalSaves: 0,
  triggerSave: jest.fn(),
  retry: jest.fn(),
};

const baseProps = {
  worldId: 'world-1',
  sessionId: 'session-1',
  autoSave: baseAutoSave,
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
    } as Character;

    render(
      <ActiveGameSessionControls
        {...baseProps}
        character={character}
        characterId="char-1"
      />
    );

    expect(screen.getByTestId('character-summary')).toBeInTheDocument();
    expect(screen.getByTestId('inventory-list')).toBeInTheDocument();
    expect(screen.getByTestId('story-summary')).toBeInTheDocument();
    expect(screen.getByTestId('choice-history')).toBeInTheDocument();
    expect(screen.getByTestId('save-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('confirmation-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('journal-floating'));
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
    expect(screen.queryByTestId('journal-floating')).toBeNull();
    expect(screen.getByTestId('story-summary')).toBeInTheDocument();
  });
});
