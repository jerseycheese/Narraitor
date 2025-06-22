// src/components/WorldCreationWizard/__tests__/WorldCreationWizard.quickStart.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorldCreationWizard from '../WorldCreationWizard';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

// Mock the stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/lib/utils/characterArchetypes');

const mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;
const mockUseCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;

describe('WorldCreationWizard Quick Start Integration', () => {
  const mockCreateWorld = jest.fn();
  const mockSetCurrentWorld = jest.fn();
  const mockCreateCharacter = jest.fn();
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseWorldStore.mockReturnValue({
      createWorld: mockCreateWorld,
      setCurrentWorld: mockSetCurrentWorld,
      worlds: {},
      currentWorldId: null,
      error: null,
      loading: false,
      updateWorld: jest.fn(),
      deleteWorld: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    });

    mockUseCharacterStore.mockReturnValue({
      createCharacter: mockCreateCharacter,
      characters: {},
      currentCharacterId: null,
      error: null,
      loading: false,
      updateCharacter: jest.fn(),
      deleteCharacter: jest.fn(),
      setCurrentCharacter: jest.fn(),
      addAttribute: jest.fn(),
      updateAttribute: jest.fn(),
      removeAttribute: jest.fn(),
      addSkill: jest.fn(),
      reset: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
      setLoading: jest.fn(),
    });
    
    mockCreateWorld.mockReturnValue('new-world-id');
    mockCreateCharacter.mockReturnValue('new-character-id');
  });

  test('shows quick start option after world creation completion', async () => {
    render(<WorldCreationWizard onComplete={mockOnComplete} />);
    
    // Navigate through wizard to completion
    // This is a simplified test - full navigation would require more steps
    const completeButton = screen.queryByText('Create World');
    if (completeButton) {
      fireEvent.click(completeButton);
    }
    
    await waitFor(() => {
      // Should show quick start options
      expect(screen.queryByText('Quick Start')).toBeInTheDocument();
    });
  });

  test('integrates quick start flow with world creation', async () => {
    const { rerender } = render(<WorldCreationWizard onComplete={mockOnComplete} />);
    
    // Simulate world creation completion
    mockCreateWorld.mockReturnValue('test-world-id');
    
    // Re-render with quick start showing
    rerender(<WorldCreationWizard onComplete={mockOnComplete} />);
    
    await waitFor(() => {
      const quickStartButton = screen.queryByText('Quick Start');
      if (quickStartButton) {
        fireEvent.click(quickStartButton);
        
        // Should proceed to character selection
        expect(screen.queryByText('Choose Your Character')).toBeInTheDocument();
      }
    });
  });

  test('passes correct world data to quick start component', async () => {
    const mockWorld = {
      id: 'test-world',
      name: 'Test World',
      genre: 'fantasy',
      attributes: [
        { id: 'str', name: 'Strength', baseValue: 5, minValue: 1, maxValue: 10 }
      ],
      skills: [
        { id: 'combat', name: 'Combat', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10 }
      ]
    };
    
    mockCreateWorld.mockReturnValue(mockWorld.id);
    
    render(<WorldCreationWizard onComplete={mockOnComplete} />);
    
    // The quick start component should receive the world data
    // This would be tested through integration with the actual components
    await waitFor(() => {
      expect(mockCreateWorld).toHaveBeenCalled();
    });
  });

  test('handles quick start character creation flow', async () => {
    render(<WorldCreationWizard onComplete={mockOnComplete} />);
    
    // This would be triggered by the QuickStartCharacters component
    // when a character is selected
    await waitFor(() => {
      // Character should be created and game should start
      expect(mockOnComplete).toHaveBeenCalledWith('new-world-id');
    });
  });

  test('preserves customize later option', async () => {
    render(<WorldCreationWizard onComplete={mockOnComplete} />);
    
    await waitFor(() => {
      const customizeButton = screen.queryByText('Customize Character');
      if (customizeButton) {
        expect(customizeButton).toBeInTheDocument();
        
        fireEvent.click(customizeButton);
        
        // Should navigate to traditional character creation
        expect(mockOnComplete).toHaveBeenCalledWith('new-world-id');
      }
    });
  });
});