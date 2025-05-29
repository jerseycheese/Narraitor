import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameStartWizard } from '../GameStartWizard';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { sessionStore } from '@/state/sessionStore';
import { useRouter } from 'next/navigation';

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
    <div data-testid="world-selection-step">
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
    <div data-testid="character-selection-step">
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
    <div data-testid="game-ready-step">
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
    
    // Default store mocks
    (worldStore as unknown as jest.Mock).mockReturnValue({
      worlds: {
        'world-1': { id: 'world-1', name: 'Test World' },
      },
    });
    (characterStore as unknown as jest.Mock).mockReturnValue({
      characters: {
        'char-1': { id: 'char-1', name: 'Test Character', worldId: 'world-1' },
      },
    });
    (sessionStore as unknown as jest.Mock).mockReturnValue({
      initializeSession: jest.fn(),
    });
  });

  it('should start at world selection step', () => {
    render(<GameStartWizard />);
    
    expect(screen.getByTestId('world-selection-step')).toBeInTheDocument();
    expect(screen.queryByTestId('character-selection-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('game-ready-step')).not.toBeInTheDocument();
  });

  it('should show progress indicator for current step', () => {
    render(<GameStartWizard />);
    
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/select world/i)).toBeInTheDocument();
  });

  it('should progress to character selection when world is selected', () => {
    render(<GameStartWizard />);
    
    fireEvent.click(screen.getByText('Select World'));
    
    expect(screen.queryByTestId('world-selection-step')).not.toBeInTheDocument();
    expect(screen.getByTestId('character-selection-step')).toBeInTheDocument();
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/select character/i)).toBeInTheDocument();
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
    
    expect(screen.queryByTestId('character-selection-step')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-ready-step')).toBeInTheDocument();
    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument();
    expect(screen.getByText(/ready to play/i)).toBeInTheDocument();
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
    expect(screen.getByTestId('character-selection-step')).toBeInTheDocument();
    
    // Go back to world selection
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByTestId('world-selection-step')).toBeInTheDocument();
    
    // Go forward again
    fireEvent.click(screen.getByText('Select World'));
    fireEvent.click(screen.getByText('Select Character'));
    expect(screen.getByTestId('game-ready-step')).toBeInTheDocument();
    
    // Go back to character selection
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByTestId('character-selection-step')).toBeInTheDocument();
  });

  it('should initialize session and navigate to play when starting game', async () => {
    const mockInitializeSession = jest.fn((worldId, characterId, onComplete) => {
      onComplete();
    });
    
    (sessionStore as unknown as jest.Mock).mockReturnValue({
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
    expect(screen.queryByTestId('world-selection-step')).not.toBeInTheDocument();
    expect(screen.getByTestId('character-selection-step')).toBeInTheDocument();
    expect(screen.getByText('World: world-1')).toBeInTheDocument();
  });

  it('should handle initial world and character ID props', () => {
    render(<GameStartWizard initialWorldId="world-1" initialCharacterId="char-1" />);
    
    // Should skip to game ready step
    expect(screen.queryByTestId('world-selection-step')).not.toBeInTheDocument();
    expect(screen.queryByTestId('character-selection-step')).not.toBeInTheDocument();
    expect(screen.getByTestId('game-ready-step')).toBeInTheDocument();
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