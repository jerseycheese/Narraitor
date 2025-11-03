import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameStartWizard } from '../GameStartWizard';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { useRouter } from 'next/navigation';
import { mockZustandStore, createMockWorldStore, createMockCharacterStore, createMockSessionStore } from '@/lib/test-utils';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/sessionStore');

// Mock child components
jest.mock('../steps/WorldSelectionStep', () => ({
  WorldSelectionStep: ({ onNext }: { onNext: (worldId: string) => void }) => (
    <div>
      <h2>Select a World</h2>
      <button onClick={() => onNext('world-1')}>Select World</button>
    </div>
  ),
}));

jest.mock('../steps/CharacterSelectionStep', () => ({
  CharacterSelectionStep: ({ 
    worldId, 
    onNext, 
    onBack 
  }: { 
    worldId: string; 
    onNext: (characterId: string) => void; 
    onBack: () => void;
  }) => (
    <div>
      <h2>Select a Character</h2>
      <div>World: {worldId}</div>
      <button onClick={() => onNext('char-1')}>Select Character</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

jest.mock('../steps/GameReadyStep', () => ({
  GameReadyStep: ({ 
    worldId, 
    characterId, 
    onStart, 
    onBack 
  }: { 
    worldId: string; 
    characterId: string; 
    onStart: () => void; 
    onBack: () => void;
  }) => (
    <div>
      <h2>Ready to Play</h2>
      <div>World: {worldId}</div>
      <div>Character: {characterId}</div>
      <button onClick={onStart}>Start Playing</button>
      <button onClick={onBack}>Back</button>
    </div>
  ),
}));

describe('GameStartWizard', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    // Default store mocks using typed factories
    mockZustandStore(useWorldStore as jest.MockedFunction<typeof useWorldStore>, createMockWorldStore({
      worlds: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'world-1': { id: 'world-1', name: 'Test World' } as any,
      },
    }));
    mockZustandStore(useCharacterStore as jest.MockedFunction<typeof useCharacterStore>, createMockCharacterStore({
      characters: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        'char-1': { id: 'char-1', name: 'Test Character', worldId: 'world-1' } as any,
      },
    }));
    mockZustandStore(useSessionStore as jest.MockedFunction<typeof useSessionStore>, createMockSessionStore({
      initializeSession: jest.fn(),
    }));
  });

  it('should start at world selection step', () => {
    render(<GameStartWizard />);
    
    expect(screen.getByText('Select a World')).toBeInTheDocument();
    expect(screen.queryByText('Select a Character')).not.toBeInTheDocument();
    expect(screen.queryByText('Ready to Play')).not.toBeInTheDocument();
  });

  it('should show progress indicator for current step', () => {
    render(<GameStartWizard />);
    
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/select world/i, { selector: 'span' })).toBeInTheDocument();
  });

  it('should progress to character selection when world is selected', () => {
    render(<GameStartWizard />);
    
    fireEvent.click(screen.getByText('Select World'));
    
    expect(screen.queryByText('Select a World')).not.toBeInTheDocument();
    expect(screen.getByText('Select a Character')).toBeInTheDocument();
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/select character/i, { selector: 'span' })).toBeInTheDocument();
  });

  it('should pass selected world ID to character selection step', () => {
    render(<GameStartWizard />);
    
    fireEvent.click(screen.getByText('Select World'));
    
    expect(screen.getByText('World: world-1')).toBeInTheDocument();
  });

  it('should progress to game ready step when character is selected', () => {
    render(<GameStartWizard />);
    
    // Select world
    fireEvent.click(screen.getByText('Select World'));
    // Select character
    fireEvent.click(screen.getByText('Select Character'));
    
    expect(screen.queryByText('Select a Character')).not.toBeInTheDocument();
    expect(screen.getByText('Ready to Play')).toBeInTheDocument();
    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/ready to play/i, { selector: 'span' })).toBeInTheDocument();
  });

  it('should pass selected IDs to game ready step', () => {
    render(<GameStartWizard />);
    
    fireEvent.click(screen.getByText('Select World'));
    fireEvent.click(screen.getByText('Select Character'));
    
    expect(screen.getByText('World: world-1')).toBeInTheDocument();
    expect(screen.getByText('Character: char-1')).toBeInTheDocument();
  });

  it('should allow navigating back through steps', () => {
    render(<GameStartWizard />);
    
    // Go to character selection
    fireEvent.click(screen.getByText('Select World'));
    expect(screen.getByText('Select a Character')).toBeInTheDocument();
    
    // Go back to world selection
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Select a World')).toBeInTheDocument();
    
    // Go forward again
    fireEvent.click(screen.getByText('Select World'));
    fireEvent.click(screen.getByText('Select Character'));
    expect(screen.getByText('Ready to Play')).toBeInTheDocument();
    
    // Go back to character selection
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Select a Character')).toBeInTheDocument();
  });

  it('should initialize session and navigate to play when starting game', async () => {
    const mockInitializeSession = jest.fn((worldId, characterId, onComplete) => {
      onComplete();
    });
    
    (useSessionStore as unknown as jest.Mock).mockReturnValue({
      initializeSession: mockInitializeSession,
    });
    
    render(<GameStartWizard />);
    
    // Navigate through wizard
    fireEvent.click(screen.getByText('Select World'));
    fireEvent.click(screen.getByText('Select Character'));
    fireEvent.click(screen.getByText('Start Playing'));
    
    await waitFor(() => {
      expect(mockInitializeSession).toHaveBeenCalledWith(
        'world-1',
        'char-1',
        expect.any(Function)
      );
      expect(mockPush).toHaveBeenCalledWith('/play');
    });
  });

  it('should handle initial world ID prop', () => {
    render(<GameStartWizard initialWorldId="world-1" />);
    
    // Should skip world selection and go directly to character selection
    expect(screen.queryByText('Select a World')).not.toBeInTheDocument();
    expect(screen.getByText('Select a Character')).toBeInTheDocument();
    expect(screen.getByText('World: world-1')).toBeInTheDocument();
  });

  it('should handle initial world and character ID props', () => {
    render(<GameStartWizard initialWorldId="world-1" initialCharacterId="char-1" />);
    
    // Should skip to game ready step
    expect(screen.queryByText('Select a World')).not.toBeInTheDocument();
    expect(screen.queryByText('Select a Character')).not.toBeInTheDocument();
    expect(screen.getByText('Ready to Play')).toBeInTheDocument();
    expect(screen.getByText('World: world-1')).toBeInTheDocument();
    expect(screen.getByText('Character: char-1')).toBeInTheDocument();
  });

  it('should handle onCancel callback', () => {
    const mockOnCancel = jest.fn();
    render(<GameStartWizard onCancel={mockOnCancel} />);
    
    // Assuming wizard has a cancel button
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });
});
