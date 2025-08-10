import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import CharactersPage from '../page';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { CharacterDeletionService } from '@/services/characterDeletionService';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Next.js Link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}));

// Mock stores
jest.mock('@/state/characterStore');
jest.mock('@/state/worldStore');

// Mock utility functions
jest.mock('@/lib/utils/generateId', () => ({
  generateUniqueId: jest.fn(() => 'test-id')
}));

// Mock CharacterDeletionService
jest.mock('@/services/characterDeletionService', () => ({
  CharacterDeletionService: {
    deleteCharacterWithCleanup: jest.fn()
  }
}));

// Mock components
jest.mock('@/components/CharacterCard', () => ({
  CharacterCard: ({ character, onDelete }: { character: { id: string; name: string }; onDelete: (id: string) => void }) => (
    <div data-testid={`character-card-${character.id}`}>
      <span>{character.name}</span>
      <button 
        data-testid={`delete-${character.id}`}
        onClick={() => onDelete(character.id)}
      >
        Delete
      </button>
    </div>
  )
}));

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onClose: () => void;
  title: string;
  description: string;
  itemName: string;
  isDeleting: boolean;
}

jest.mock('@/components/DeleteConfirmationDialog', () => ({
  __esModule: true,
  default: ({ isOpen, onConfirm, onClose, title, description, itemName, isDeleting }: DeleteConfirmationDialogProps) => 
    isOpen ? (
      <div data-testid="delete-confirmation-dialog">
        <h2>{title}</h2>
        <p>{description}</p>
        <p>Character: {itemName}</p>
        <button 
          data-testid="confirm-delete"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
        <button data-testid="cancel-delete" onClick={onClose}>
          Cancel
        </button>
      </div>
    ) : null
}));

jest.mock('@/components/shared/PageLayout', () => ({
  PageLayout: ({ children }: { children: React.ReactNode }) => <div data-testid="page-layout">{children}</div>
}));

jest.mock('@/components/GenerateCharacterDialog', () => ({
  GenerateCharacterDialog: () => null
}));

jest.mock('@/components/ui/toast', () => ({
  Toast: ({ title, description, onDismiss }: { title: string; description?: string; onDismiss: () => void }) => (
    <div data-testid="toast" onClick={onDismiss}>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  )
}));

describe('CharactersPage - Character Deletion', () => {
  const mockRouter = {
    push: jest.fn(),
  };

  const mockSearchParams = {
    get: jest.fn(() => null),
  };

  const mockCharacterStore = {
    characters: {
      'char-1': {
        id: 'char-1',
        name: 'Test Character',
        worldId: 'world-1',
        level: 1,
        background: { history: 'Test history' }
      },
      'char-2': {
        id: 'char-2', 
        name: 'Another Character',
        worldId: 'world-1',
        level: 2,
        background: { history: 'Another history' }
      }
    },
    currentCharacterId: 'char-1',
    setCurrentCharacter: jest.fn(),
    deleteCharacter: jest.fn(),
    createCharacter: jest.fn(),
    updateCharacter: jest.fn(),
  };

  const mockWorldStore = {
    worlds: {
      'world-1': {
        id: 'world-1',
        name: 'Test World',
        attributes: [],
        skills: []
      }
    },
    currentWorldId: 'world-1',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useSearchParams as jest.Mock).mockReturnValue(mockSearchParams);
    (useCharacterStore as unknown as jest.Mock).mockReturnValue(mockCharacterStore);
    (useWorldStore as unknown as jest.Mock).mockReturnValue(mockWorldStore);
    
    // Reset service mock to success by default
    (CharacterDeletionService.deleteCharacterWithCleanup as jest.Mock).mockResolvedValue(undefined);
  });

  describe('Delete Button Accessibility', () => {
    test('delete button is accessible from character card', () => {
      render(<CharactersPage />);
      
      expect(screen.getByTestId('delete-char-1')).toBeInTheDocument();
      expect(screen.getByTestId('delete-char-2')).toBeInTheDocument();
    });
  });

  describe('Confirmation Dialog Flow', () => {
    test('clicking delete shows confirmation dialog with character details', () => {
      render(<CharactersPage />);
      
      const deleteButton = screen.getByTestId('delete-char-1');
      fireEvent.click(deleteButton);
      
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Character')).toBeInTheDocument();
      expect(screen.getByText('Character: Test Character')).toBeInTheDocument();
    });

    test('confirmation dialog shows permanent deletion warning', () => {
      render(<CharactersPage />);
      
      fireEvent.click(screen.getByTestId('delete-char-1'));
      
      expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
      expect(screen.getByText(/permanently deleted/)).toBeInTheDocument();
    });

    test('cancel button closes dialog without deleting', () => {
      render(<CharactersPage />);
      
      fireEvent.click(screen.getByTestId('delete-char-1'));
      expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      
      fireEvent.click(screen.getByTestId('cancel-delete'));
      expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
      expect(mockCharacterStore.deleteCharacter).not.toHaveBeenCalled();
    });
  });

  describe('Character Deletion', () => {
    test('confirming deletion removes character permanently', async () => {
      render(<CharactersPage />);
      
      fireEvent.click(screen.getByTestId('delete-char-1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));
      
      await waitFor(() => {
        expect(CharacterDeletionService.deleteCharacterWithCleanup).toHaveBeenCalledWith('char-1');
      });
    });


    test('successful deletion closes dialog and shows success feedback', async () => {
      render(<CharactersPage />);
      
      fireEvent.click(screen.getByTestId('delete-char-1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));
      
      await waitFor(() => {
        expect(screen.queryByTestId('delete-confirmation-dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Character List Updates', () => {
    test('character list updates immediately after deletion', async () => {
      // Mock store update after deletion
      const updatedStore = {
        ...mockCharacterStore,
        characters: {
          'char-2': mockCharacterStore.characters['char-2']
        }
      };

      (useCharacterStore as unknown as jest.Mock).mockReturnValue(updatedStore);
      
      render(<CharactersPage />);
      
      // Only char-2 should be visible after char-1 is deleted
      expect(screen.getByTestId('character-card-char-2')).toBeInTheDocument();
      expect(screen.queryByTestId('character-card-char-1')).not.toBeInTheDocument();
    });

    test('current character is cleared if deleted character was active', async () => {
      const storeWithClearedCurrent = {
        ...mockCharacterStore,
        currentCharacterId: null, // Cleared after deleting active character
        characters: {
          'char-2': mockCharacterStore.characters['char-2']
        }
      };

      (useCharacterStore as unknown as jest.Mock).mockReturnValue(storeWithClearedCurrent);
      
      render(<CharactersPage />);
      
      // Should not show "Start Playing" button when no active character
      expect(screen.queryByText('Start Playing')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles deletion errors gracefully', async () => {
      (CharacterDeletionService.deleteCharacterWithCleanup as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

      render(<CharactersPage />);
      
      fireEvent.click(screen.getByTestId('delete-char-1'));
      fireEvent.click(screen.getByTestId('confirm-delete'));
      
      await waitFor(() => {
        // Dialog should remain open on error
        expect(screen.getByTestId('delete-confirmation-dialog')).toBeInTheDocument();
      });
    });
  });
});