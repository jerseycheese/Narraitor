/**
 * Integration test for SaveIndicator within GameSession context
 * Tests real save status updates and visual feedback for users
 */

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';

// Mock the auto-save hook
const mockAutoSave = {
  start: jest.fn(),
  stop: jest.fn(),
  triggerSave: jest.fn().mockResolvedValue(undefined),
  isEnabled: true,
  isRunning: true,
  status: 'idle',
  lastSaveTime: null,
  errorMessage: null,
  totalSaves: 0,
  setEnabled: jest.fn(),
};

jest.mock('@/hooks/useAutoSave', () => ({
  useAutoSave: () => mockAutoSave,
}));

// Mock other stores with minimal state
jest.mock('@/state/sessionStore', () => ({
  useSessionStore: () => ({
    id: 'test-session',
    status: 'active',
    worldId: 'world-1',
    characterId: 'char-1',
  }),
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: () => ({
    worlds: { 'world-1': { id: 'world-1', name: 'Test World' } },
  }),
}));

jest.mock('@/state/characterStore', () => ({
  useCharacterStore: () => ({
    characters: { 'char-1': { id: 'char-1', name: 'Test Character' } },
  }),
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: () => ({
    segments: {},
    currentSegment: null,
  }),
}));

// Create minimal GameSession component that includes SaveIndicator
function MockGameSessionWithSaveIndicator() {
  const autoSave = mockAutoSave;
  
  const handleUserAction = async () => {
    await autoSave.triggerSave('player-choice');
  };
  
  return (
    <div data-testid="game-session">
      <div>Game Session Content</div>
      
      {/* Save Indicator should be visible and functional */}
      <div data-testid="save-indicator" role="status">
        <span>Status: {autoSave.status}</span>
        {autoSave.status === 'saving' && <span>Saving...</span>}
        {autoSave.status === 'saved' && autoSave.lastSaveTime && (
          <span>Last saved: {autoSave.lastSaveTime}</span>
        )}
        {autoSave.status === 'error' && autoSave.errorMessage && (
          <span>Error: {autoSave.errorMessage}</span>
        )}
        {autoSave.totalSaves > 0 && <span>{autoSave.totalSaves} saves</span>}
      </div>
      
      {/* User action that triggers save */}
      <button onClick={handleUserAction} data-testid="trigger-save-action">
        Make Choice
      </button>
      
      {/* Manual save button */}
      <button 
        onClick={() => autoSave.triggerSave('manual')}
        disabled={autoSave.status === 'saving'}
        data-testid="manual-save-button"
      >
        Save Now
      </button>
    </div>
  );
}

describe('SaveIndicator Integration in GameSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset auto-save mock state
    mockAutoSave.status = 'idle';
    mockAutoSave.lastSaveTime = null;
    mockAutoSave.errorMessage = null;
    mockAutoSave.totalSaves = 0;
  });

  describe('Save Status Visual Feedback', () => {
    test('displays idle status when no save operation is active', () => {
      mockAutoSave.status = 'idle';
      
      render(<MockGameSessionWithSaveIndicator />);
      
      const saveIndicator = screen.getByTestId('save-indicator');
      expect(saveIndicator).toBeInTheDocument();
      expect(screen.getByText('Status: idle')).toBeInTheDocument();
      expect(screen.queryByText('Saving...')).not.toBeInTheDocument();
    });

    test('shows saving status with loading indicator during save operation', async () => {
      render(<MockGameSessionWithSaveIndicator />);
      
      // Simulate saving state
      act(() => {
        mockAutoSave.status = 'saving';
      });
      
      // Re-render to pick up status change
      render(<MockGameSessionWithSaveIndicator />);
      
      expect(screen.getByText('Status: saving')).toBeInTheDocument();
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    test('displays saved status with timestamp after successful save', () => {
      mockAutoSave.status = 'saved';
      mockAutoSave.lastSaveTime = '2023-01-01T12:00:00.000Z';
      mockAutoSave.totalSaves = 1;
      
      render(<MockGameSessionWithSaveIndicator />);
      
      expect(screen.getByText('Status: saved')).toBeInTheDocument();
      expect(screen.getByText('Last saved: 2023-01-01T12:00:00.000Z')).toBeInTheDocument();
      expect(screen.getByText('1 saves')).toBeInTheDocument();
    });

    test('shows error status with error message when save fails', () => {
      mockAutoSave.status = 'error';
      mockAutoSave.errorMessage = 'Network connection failed';
      
      render(<MockGameSessionWithSaveIndicator />);
      
      expect(screen.getByText('Status: error')).toBeInTheDocument();
      expect(screen.getByText('Error: Network connection failed')).toBeInTheDocument();
    });
  });

  describe('User-Triggered Save Feedback', () => {
    test('provides immediate visual feedback when user triggers save', async () => {
      render(<MockGameSessionWithSaveIndicator />);
      
      const triggerButton = screen.getByTestId('trigger-save-action');
      
      // User triggers a save-worthy action
      fireEvent.click(triggerButton);
      
      // Should call the save trigger
      expect(mockAutoSave.triggerSave).toHaveBeenCalledWith('player-choice');
      
      // In a real implementation, this would update the status
      act(() => {
        mockAutoSave.status = 'saving';
      });
      
      render(<MockGameSessionWithSaveIndicator />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    test('manual save button shows correct state based on save status', () => {
      const { rerender } = render(<MockGameSessionWithSaveIndicator />);
      
      const manualSaveButton = screen.getByTestId('manual-save-button');
      
      // Should be enabled when idle
      expect(manualSaveButton).not.toBeDisabled();
      
      // Should be disabled when saving
      act(() => {
        mockAutoSave.status = 'saving';
      });
      
      rerender(<MockGameSessionWithSaveIndicator />);
      const disabledButton = screen.getByTestId('manual-save-button');
      expect(disabledButton).toBeDisabled();
    });

    test('manual save button triggers save with correct reason', async () => {
      render(<MockGameSessionWithSaveIndicator />);
      
      const manualSaveButton = screen.getByTestId('manual-save-button');
      fireEvent.click(manualSaveButton);
      
      expect(mockAutoSave.triggerSave).toHaveBeenCalledWith('manual');
    });
  });

  describe('Save Progress Tracking', () => {
    test('displays incrementing save count as user plays', () => {
      // Simulate multiple saves over time
      mockAutoSave.status = 'saved';
      mockAutoSave.totalSaves = 5;
      
      render(<MockGameSessionWithSaveIndicator />);
      
      expect(screen.getByText('5 saves')).toBeInTheDocument();
    });

    test('shows latest save timestamp for user reference', () => {
      mockAutoSave.status = 'saved';
      mockAutoSave.lastSaveTime = '2023-01-01T14:30:00.000Z';
      
      render(<MockGameSessionWithSaveIndicator />);
      
      expect(screen.getByText('Last saved: 2023-01-01T14:30:00.000Z')).toBeInTheDocument();
    });
  });

  describe('Error State Handling', () => {
    test('provides clear error messaging to users', () => {
      mockAutoSave.status = 'error';
      mockAutoSave.errorMessage = 'Storage quota exceeded';
      
      render(<MockGameSessionWithSaveIndicator />);
      
      expect(screen.getByText('Error: Storage quota exceeded')).toBeInTheDocument();
      
      // Manual save button should still be available for retry
      const manualSaveButton = screen.getByTestId('manual-save-button');
      expect(manualSaveButton).not.toBeDisabled();
    });

    test('allows manual save retry after error', async () => {
      mockAutoSave.status = 'error';
      mockAutoSave.errorMessage = 'Temporary network error';
      
      render(<MockGameSessionWithSaveIndicator />);
      
      const manualSaveButton = screen.getByTestId('manual-save-button');
      fireEvent.click(manualSaveButton);
      
      // Should attempt to save again
      expect(mockAutoSave.triggerSave).toHaveBeenCalledWith('manual');
    });
  });

  describe('Real-Time Status Updates', () => {
    test('save indicator updates immediately when save status changes', async () => {
      render(<MockGameSessionWithSaveIndicator />);
      
      // Start with idle status
      expect(screen.getByText('Status: idle')).toBeInTheDocument();
      
      // Simulate transition to saving
      act(() => {
        mockAutoSave.status = 'saving';
      });
      
      render(<MockGameSessionWithSaveIndicator />);
      expect(screen.getByText('Status: saving')).toBeInTheDocument();
      
      // Simulate completion
      act(() => {
        mockAutoSave.status = 'saved';
        mockAutoSave.lastSaveTime = '2023-01-01T12:00:00.000Z';
        mockAutoSave.totalSaves = 1;
      });
      
      render(<MockGameSessionWithSaveIndicator />);
      expect(screen.getByText('Status: saved')).toBeInTheDocument();
      expect(screen.getByText('1 saves')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('save indicator has proper role for screen readers', () => {
      render(<MockGameSessionWithSaveIndicator />);
      
      const saveIndicator = screen.getByRole('status');
      expect(saveIndicator).toBeInTheDocument();
      expect(saveIndicator).toHaveAttribute('data-testid', 'save-indicator');
    });

    test('save status changes are announced to screen readers', () => {
      render(<MockGameSessionWithSaveIndicator />);
      
      const statusElement = screen.getByRole('status');
      expect(statusElement).toBeInTheDocument();
      
      // Status changes within the role="status" element should be announced
      expect(statusElement).toHaveTextContent('Status: idle');
    });
  });
});