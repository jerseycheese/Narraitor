import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActiveGameSession from '../ActiveGameSession';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore } from '@/state/characterStore';
import { useJournalStore } from '@/state/journalStore';

// Mock all the stores
jest.mock('@/state/narrativeStore');
jest.mock('@/state/sessionStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/journalStore');

// Mock the narrative components
jest.mock('@/components/Narrative/NarrativeController', () => {
  return function MockNarrativeController() {
    return <div data-testid="narrative-controller">Narrative Controller</div>;
  };
});

jest.mock('@/components/Narrative/NarrativeHistoryManager', () => {
  return function MockNarrativeHistoryManager() {
    return <div data-testid="narrative-history">Narrative History</div>;
  };
});

// Mock the JournalModal component
jest.mock('../JournalModal', () => {
  return {
    JournalModal: function MockJournalModal({ isOpen, onClose }: any) {
      if (!isOpen) return null;
      return (
        <div role="dialog" aria-modal="true" aria-labelledby="journal-modal-title">
          <h2 id="journal-modal-title">Game Journal</h2>
          <button onClick={onClose} aria-label="Close journal">Close</button>
        </div>
      );
    }
  };
});

// Mock other components that might be missing
jest.mock('../CharacterSummary', () => {
  const MockCharacterSummary = ({ character }: any) => {
    return <div data-testid="character-summary">{character.name}</div>;
  };
  return MockCharacterSummary;
});

jest.mock('@/components/DeleteConfirmationDialog/DeleteConfirmationDialog', () => {
  const MockDeleteConfirmationDialog = ({ isOpen }: any) => {
    if (!isOpen) return null;
    return <div data-testid="delete-confirmation-dialog">Delete Confirmation Dialog</div>;
  };
  return MockDeleteConfirmationDialog;
});

jest.mock('@/components/shared/ChoiceSelector', () => {
  return {
    ChoiceSelector: function MockChoiceSelector() {
      return <div data-testid="choice-selector">Choice Selector</div>;
    }
  };
});

jest.mock('@/components/ui/LoadingState', () => {
  return {
    LoadingState: function MockLoadingState({ message }: any) {
      return <div data-testid="loading-state">{message}</div>;
    }
  };
});

jest.mock('../EndingScreen', () => {
  return {
    EndingScreen: function MockEndingScreen() {
      return <div data-testid="ending-screen">Ending Screen</div>;
    }
  };
});

// Mock generateUniqueId utility
jest.mock('@/lib/utils/generateId', () => ({
  generateUniqueId: jest.fn(() => 'mock-id-123')
}));

const mockUseNarrativeStore = useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>;
const mockUseSessionStore = useSessionStore as jest.MockedFunction<typeof useSessionStore>;
const mockUseCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;
const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;

describe('ActiveGameSession - Journal Access Integration', () => {
  const defaultProps = {
    worldId: 'world-1',
    sessionId: 'session-1',
    onChoiceSelected: jest.fn(),
    onEnd: jest.fn()
  };

  const mockCharacter = {
    id: 'char-1',
    name: 'Test Character',
    background: 'Test Background',
    attributes: {},
    skills: {},
    worldId: 'world-1',
    createdAt: '2023-01-01T00:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default store mocks
    mockUseNarrativeStore.mockReturnValue({
      currentEnding: null,
      isGeneratingEnding: false,
      generateEnding: jest.fn(),
      isSessionEnded: jest.fn().mockReturnValue(false),
      getSessionSegments: jest.fn().mockReturnValue([]),
      getSessionDecisions: jest.fn().mockReturnValue([]),
      getLatestDecision: jest.fn().mockReturnValue(null),
      addDecision: jest.fn(),
      selectDecisionOption: jest.fn(),
      updateDecision: jest.fn(),
      clearSessionSegments: jest.fn(),
      segments: {},
      sessionSegments: {},
      decisions: {},
      sessionDecisions: {},
      error: null,
      loading: false
    });

    mockUseSessionStore.mockReturnValue({
      characterId: 'char-1',
      setPlayerChoices: jest.fn(),
      endSession: jest.fn(),
      id: 'session-1',
      status: 'active',
      currentSceneId: null,
      playerChoices: [],
      error: null,
      worldId: 'world-1',
      savedSessions: {}
    });

    mockUseCharacterStore.mockReturnValue({
      characters: { 'char-1': mockCharacter },
      currentCharacterId: 'char-1',
      error: null,
      loading: false
    });

    mockUseJournalStore.mockReturnValue({
      getSessionEntries: jest.fn().mockReturnValue([]),
      markAsRead: jest.fn(),
      addEntry: jest.fn(),
      updateEntry: jest.fn(),
      deleteEntry: jest.fn(),
      getEntriesByType: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
      entries: {},
      sessionEntries: {},
      error: null,
      loading: false
    });
  });

  describe('Journal Access Button', () => {
    it('displays journal access button when character is present', async () => {
      render(<ActiveGameSession {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('journal-access-button')).toBeInTheDocument();
      });

      const journalButton = screen.getByTestId('journal-access-button');
      expect(journalButton).toHaveAttribute('aria-label', 'Open journal');
      expect(journalButton).toHaveAttribute('title', 'View your journal entries');
    });

    it('does not display journal access button when no character is present', async () => {
      mockUseSessionStore.mockReturnValue({
        characterId: null,
        setPlayerChoices: jest.fn(),
        endSession: jest.fn(),
        id: 'session-1',
        status: 'active',
        currentSceneId: null,
        playerChoices: [],
        error: null,
        worldId: 'world-1',
        savedSessions: {}
      });

      mockUseCharacterStore.mockReturnValue({
        characters: {},
        currentCharacterId: null,
        error: null,
        loading: false
      });

      render(<ActiveGameSession {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByTestId('journal-access-button')).not.toBeInTheDocument();
      });
    });

    it('opens journal modal when journal button is clicked', async () => {
      render(<ActiveGameSession {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('journal-access-button')).toBeInTheDocument();
      });

      const journalButton = screen.getByTestId('journal-access-button');
      fireEvent.click(journalButton);

      // Check that the journal modal is opened
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Game Journal')).toBeInTheDocument();
      });
    });

    it('closes journal modal when close button is clicked', async () => {
      render(<ActiveGameSession {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('journal-access-button')).toBeInTheDocument();
      });

      // Open the modal
      const journalButton = screen.getByTestId('journal-access-button');
      fireEvent.click(journalButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close the modal
      const closeButton = screen.getByLabelText('Close journal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('State Preservation', () => {
    it('preserves game session state when journal is opened', async () => {
      const mockOnChoiceSelected = jest.fn();
      
      render(<ActiveGameSession {...defaultProps} onChoiceSelected={mockOnChoiceSelected} />);

      // Verify game session is active
      await waitFor(() => {
        expect(screen.getByTestId('game-session-active')).toBeInTheDocument();
        expect(screen.getByTestId('narrative-history')).toBeInTheDocument();
      });

      // Open journal
      const journalButton = screen.getByTestId('journal-access-button');
      fireEvent.click(journalButton);

      // Verify modal is open but game session is still present underneath
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByTestId('game-session-active')).toBeInTheDocument();
        expect(screen.getByTestId('narrative-history')).toBeInTheDocument();
      });
    });

    it('does not interfere with narrative generation when journal is opened', async () => {
      const mockOnChoiceSelected = jest.fn();
      
      render(<ActiveGameSession {...defaultProps} onChoiceSelected={mockOnChoiceSelected} />);

      // Open journal
      await waitFor(() => {
        expect(screen.getByTestId('journal-access-button')).toBeInTheDocument();
      });

      const journalButton = screen.getByTestId('journal-access-button');
      fireEvent.click(journalButton);

      // Verify that narrative components are still present and functional
      await waitFor(() => {
        expect(screen.getByTestId('narrative-controller')).toBeInTheDocument();
        expect(screen.getByTestId('narrative-history')).toBeInTheDocument();
      });

      // Close journal and verify everything still works
      const closeButton = screen.getByLabelText('Close journal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        expect(screen.getByTestId('narrative-controller')).toBeInTheDocument();
        expect(screen.getByTestId('narrative-history')).toBeInTheDocument();
      });
    });
  });

  describe('Journal Modal Integration', () => {
    it('passes correct props to JournalModal', async () => {
      render(<ActiveGameSession {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('journal-access-button')).toBeInTheDocument();
      });

      const journalButton = screen.getByTestId('journal-access-button');
      fireEvent.click(journalButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify that the journal store method is called with correct session ID
      expect(mockUseJournalStore().getSessionEntries).toHaveBeenCalledWith('session-1');
    });
  });

  describe('Accessibility', () => {
    it('maintains proper focus management when opening and closing journal', async () => {
      render(<ActiveGameSession {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByTestId('journal-access-button')).toBeInTheDocument();
      });

      const journalButton = screen.getByTestId('journal-access-button');
      
      // Focus the journal button
      journalButton.focus();
      expect(journalButton).toHaveFocus();

      // Open journal
      fireEvent.click(journalButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close journal with Escape key or close button
      const closeButton = screen.getByLabelText('Close journal');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });
});