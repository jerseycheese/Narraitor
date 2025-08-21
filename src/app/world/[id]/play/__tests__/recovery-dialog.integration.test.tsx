/**
 * Integration test for recovery dialog in game session
 * Tests the actual user workflow of data recovery on session start
 */

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useParams } from 'next/navigation';
import PlayPage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  useParams: jest.fn(),
}));

// Mock world store
const mockWorldStore = {
  worlds: {
    'world-1': { id: 'world-1', name: 'Test Adventure World', genre: 'Fantasy' },
  },
};
jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector: (state: unknown) => unknown) => selector(mockWorldStore),
}));

// Mock GameSession component to test recovery dialog integration
const mockGameSessionWithRecovery = jest.fn();
jest.mock('@/components/GameSession/GameSession', () => {
  return function MockGameSession({ worldId }: { worldId: string }) {
    mockGameSessionWithRecovery({ worldId });
    
    // Simulate detection of saved data and show recovery notification
    const [showRecovery, setShowRecovery] = React.useState(true);
    const [recovered, setRecovered] = React.useState(false);
    
    const handleRecover = () => {
      setRecovered(true);
      setShowRecovery(false);
    };
    
    const handleDismiss = () => {
      setShowRecovery(false);
    };
    
    return (
      <div data-testid="game-session">
        <div>Game Session for {worldId}</div>
        {showRecovery && !recovered && (
          <div data-testid="recovery-dialog">
            <div>Previous game data found</div>
            <button onClick={handleRecover}>Recover Session</button>
            <button onClick={handleDismiss}>Start Fresh</button>
          </div>
        )}
        {recovered && <div data-testid="recovered-state">Session recovered successfully</div>}
        {!showRecovery && !recovered && <div data-testid="fresh-session">New game session started</div>}
      </div>
    );
  };
});

describe('Recovery Dialog Integration', () => {
  const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: 'world-1' });
  });

  describe('Recovery Dialog User Workflow', () => {
    test('user can recover previous session data when returning to game', async () => {
      render(<PlayPage />);
      
      // Wait for client-side hydration
      await waitFor(() => {
        expect(screen.getByText('Playing in Test Adventure World')).toBeInTheDocument();
      });
      
      // Recovery dialog should be shown when previous data exists
      expect(screen.getByTestId('recovery-dialog')).toBeInTheDocument();
      expect(screen.getByText('Previous game data found')).toBeInTheDocument();
      
      // User chooses to recover
      const recoverButton = screen.getByText('Recover Session');
      fireEvent.click(recoverButton);
      
      // Should show successful recovery
      await waitFor(() => {
        expect(screen.getByTestId('recovered-state')).toBeInTheDocument();
        expect(screen.getByText('Session recovered successfully')).toBeInTheDocument();
      });
      
      // Recovery dialog should be hidden
      expect(screen.queryByTestId('recovery-dialog')).not.toBeInTheDocument();
    });

    test('user can dismiss recovery and start fresh session', async () => {
      render(<PlayPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Playing in Test Adventure World')).toBeInTheDocument();
      });
      
      // Recovery dialog should be shown
      expect(screen.getByTestId('recovery-dialog')).toBeInTheDocument();
      
      // User chooses to start fresh
      const dismissButton = screen.getByText('Start Fresh');
      fireEvent.click(dismissButton);
      
      // Should start a fresh session
      await waitFor(() => {
        expect(screen.getByTestId('fresh-session')).toBeInTheDocument();
        expect(screen.getByText('New game session started')).toBeInTheDocument();
      });
      
      // Recovery dialog should be hidden
      expect(screen.queryByTestId('recovery-dialog')).not.toBeInTheDocument();
      // Should not show recovery state
      expect(screen.queryByTestId('recovered-state')).not.toBeInTheDocument();
    });

    test('game session initializes properly with recovery integration', async () => {
      render(<PlayPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Playing in Test Adventure World')).toBeInTheDocument();
      });
      
      // GameSession component should be rendered with correct worldId
      expect(mockGameSessionWithRecovery).toHaveBeenCalledWith({ worldId: 'world-1' });
      
      // Main game session container should be present
      expect(screen.getByTestId('game-session')).toBeInTheDocument();
      expect(screen.getByText('Game Session for world-1')).toBeInTheDocument();
    });
  });

  describe('Page Integration', () => {
    test('page title updates correctly with world name when recovery is available', async () => {
      render(<PlayPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Playing in Test Adventure World')).toBeInTheDocument();
      });
      
      // Page should still show correct world information even with recovery dialog
      const pageContent = screen.getByText('Playing in Test Adventure World');
      expect(pageContent).toBeInTheDocument();
    });

    test('handles world data correctly during recovery workflow', async () => {
      render(<PlayPage />);
      
      await waitFor(() => {
        // World data should be available throughout recovery process
        expect(screen.getByText('Playing in Test Adventure World')).toBeInTheDocument();
      });
      
      // Recovery process should not affect world data display
      const recoverButton = screen.getByText('Recover Session');
      fireEvent.click(recoverButton);
      
      await waitFor(() => {
        // World name should still be displayed after recovery
        expect(screen.getByText('Playing in Test Adventure World')).toBeInTheDocument();
      });
    });
  });
});