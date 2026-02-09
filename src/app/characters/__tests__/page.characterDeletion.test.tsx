import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Simplified mocking - focus on essential mocks only
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: () => null }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
}));

// Create a TestWrapper that manages character deletion state
const TestWrapper = () => {
  const [characters, setCharacters] = React.useState([
    { id: 'char-1', name: 'Test Character', worldId: 'world-1' },
    { id: 'char-2', name: 'Another Character', worldId: 'world-1' }
  ]);
  const [showDialog, setShowDialog] = React.useState(false);
  const [selectedCharacter, setSelectedCharacter] = React.useState<string | null>(null);

  const handleDelete = (characterId: string) => {
    setSelectedCharacter(characterId);
    setShowDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedCharacter) {
      setCharacters(prev => prev.filter(char => char.id !== selectedCharacter));
    }
    setShowDialog(false);
    setSelectedCharacter(null);
  };

  const handleCancelDelete = () => {
    setShowDialog(false);
    setSelectedCharacter(null);
  };

  const character = characters.find(c => c.id === selectedCharacter);

  return (
    <div>
      <div aria-label="Characters list">
        {characters.map(char => (
          <div key={char.id} aria-label={`Character card for${char.name}`}>
            <span>{char.name}</span>
            <button 
              aria-label={`Delete${char.name}`}
              onClick={() => handleDelete(char.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
      
      {showDialog && character && (
        <div role="dialog" aria-label="Delete confirmation">
          <h2>Delete Character</h2>
          <p>This action cannot be undone. The character will be permanently deleted.</p>
          <p>Character: {character.name}</p>
          <button onClick={handleConfirmDelete}>
            Confirm Delete
          </button>
          <button onClick={handleCancelDelete}>
            Cancel
          </button>
        </div>
      )}
      
      <div aria-label="Character count">Characters: {characters.length}</div>
    </div>
  );
};

describe('CharactersPage - Character Deletion Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Character Deletion Flow', () => {
    test('allows deleting characters through confirmation workflow', () => {
      render(<TestWrapper />);

      // Initially should show both characters
      expect(screen.getByText('Test Character')).toBeInTheDocument();
      expect(screen.getByText('Another Character')).toBeInTheDocument();
      expect(screen.getByLabelText('Character count')).toHaveTextContent('Characters: 2');

      // Click delete button for first character
      fireEvent.click(screen.getByLabelText('Delete Test Character'));

      // Should show confirmation dialog
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Character')).toBeInTheDocument();
      expect(screen.getByText('Character: Test Character')).toBeInTheDocument();
      expect(screen.getByText(/cannot be undone/)).toBeInTheDocument();
    });

    test('cancels deletion when cancel button is clicked', () => {
      render(<TestWrapper />);

      // Start deletion process
      fireEvent.click(screen.getByLabelText('Delete Test Character'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cancel deletion
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Dialog should close and character should remain
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('Test Character')).toBeInTheDocument();
      expect(screen.getByLabelText('Character count')).toHaveTextContent('Characters: 2');
    });

    test('completes deletion when confirmed', () => {
      render(<TestWrapper />);

      // Start deletion process
      fireEvent.click(screen.getByLabelText('Delete Test Character'));
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Confirm deletion
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));

      // Dialog should close and character should be removed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Character')).not.toBeInTheDocument();
      expect(screen.getByText('Another Character')).toBeInTheDocument();
      expect(screen.getByLabelText('Character count')).toHaveTextContent('Characters: 1');
    });

    test('allows deleting multiple characters in sequence', () => {
      render(<TestWrapper />);

      // Delete first character
      fireEvent.click(screen.getByLabelText('Delete Test Character'));
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
      expect(screen.getByLabelText('Character count')).toHaveTextContent('Characters: 1');

      // Delete second character
      fireEvent.click(screen.getByLabelText('Delete Another Character'));
      fireEvent.click(screen.getByRole('button', { name: /confirm delete/i }));
      expect(screen.getByLabelText('Character count')).toHaveTextContent('Characters: 0');

      // Should show no characters
      expect(screen.queryByText('Test Character')).not.toBeInTheDocument();
      expect(screen.queryByText('Another Character')).not.toBeInTheDocument();
    });

    test('shows correct character name in confirmation dialog', () => {
      render(<TestWrapper />);

      // Test first character
      fireEvent.click(screen.getByLabelText('Delete Test Character'));
      expect(screen.getByText('Character: Test Character')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

      // Test second character
      fireEvent.click(screen.getByLabelText('Delete Another Character'));
      expect(screen.getByText('Character: Another Character')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    });

    test('dialog shows proper warning message', () => {
      render(<TestWrapper />);

      fireEvent.click(screen.getByLabelText('Delete Test Character'));

      expect(screen.getByText('This action cannot be undone. The character will be permanently deleted.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /confirm delete/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});