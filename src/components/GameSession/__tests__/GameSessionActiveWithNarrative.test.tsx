import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import GameSessionActiveWithNarrative from '../GameSessionActiveWithNarrative';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { narrativeStore } from '@/state/narrativeStore';
import { Decision } from '@/types/narrative.types';

// Mock the NarrativeController
jest.mock('@/components/Narrative/NarrativeController', () => ({
  NarrativeController: jest.fn(({ onNarrativeGenerated, onChoicesGenerated }) => {
    // Simulate narrative generation by calling the callback
    React.useEffect(() => {
      if (onNarrativeGenerated) {
        onNarrativeGenerated({
          id: 'test-segment',
          content: 'Test narrative content',
          type: 'scene',
          metadata: {
            tags: ['test']
          },
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      // Simulate choice generation by calling the callback
      if (onChoicesGenerated) {
        const mockDecision: Decision = {
          id: 'test-decision',
          prompt: 'What will you do?',
          options: [
            { id: 'option-1', text: 'Option 1' },
            { id: 'option-2', text: 'Option 2' }
          ]
        };
        onChoicesGenerated(mockDecision);
      }
    }, [onNarrativeGenerated, onChoicesGenerated]);
    
    return <div data-testid="mock-narrative-controller">Mock Controller</div>;
  })
}));

// Mock the NarrativeHistoryManager
jest.mock('@/components/Narrative/NarrativeHistoryManager', () => ({
  NarrativeHistoryManager: jest.fn(() => (
    <div data-testid="mock-narrative-history-manager">Mock History Manager</div>
  ))
}));

// Mock the narrativeStore
jest.mock('@/state/narrativeStore', () => ({
  narrativeStore: {
    getState: jest.fn().mockReturnValue({
      addDecision: jest.fn(),
      selectDecisionOption: jest.fn(),
      getSessionSegments: jest.fn().mockReturnValue([]),
      clearSessionSegments: jest.fn()
    })
  }
}));

// Mock generateUniqueId
jest.mock('@/lib/utils/generateId', () => ({
  generateUniqueId: jest.fn().mockImplementation((prefix) => `${prefix}-12345`)
}));

describe('GameSessionActiveWithNarrative', () => {
  const mockProps = {
    worldId: 'test-world',
    sessionId: 'test-session',
    world: {
      id: 'test-world',
      name: 'Test World',
      description: 'A test world',
      theme: 'fantasy'
    },
    onChoiceSelected: jest.fn(),
    onPause: jest.fn(),
    onResume: jest.fn(),
    onEnd: jest.fn(),
    choices: [
      { id: 'choice-1', text: 'Static Choice 1' },
      { id: 'choice-2', text: 'Static Choice 2' }
    ],
    triggerGeneration: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with all required props', () => {
    render(<GameSessionActiveWithNarrative {...mockProps} />);
    
    // Check that world info is displayed
    expect(screen.getByText('Test World')).toBeInTheDocument();
    expect(screen.getByText('fantasy')).toBeInTheDocument();
    
    // Check that narrative components are rendered
    expect(screen.getByTestId('mock-narrative-history-manager')).toBeInTheDocument();
    expect(screen.getByTestId('mock-narrative-controller')).toBeInTheDocument();
    
    // Check for session controls
    expect(screen.getByText('Pause')).toBeInTheDocument();
    expect(screen.getByText('End Session')).toBeInTheDocument();
  });

  it('displays AI-generated choices when available', async () => {
    render(<GameSessionActiveWithNarrative {...mockProps} />);
    
    // Wait for the AI-generated choices to appear
    await waitFor(() => {
      expect(screen.getByText('What will you do?')).toBeInTheDocument();
    });
    
    // Check that AI-generated options are displayed
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    expect(screen.getByText('Option 2')).toBeInTheDocument();
    
    // Static choices should not be displayed when AI choices are available
    expect(screen.queryByText('Static Choice 1')).not.toBeInTheDocument();
  });

  it('handles choice selection correctly for AI-generated choices', async () => {
    render(<GameSessionActiveWithNarrative {...mockProps} />);
    
    // Wait for the AI-generated choices to appear
    await waitFor(() => {
      expect(screen.getByText('Option 1')).toBeInTheDocument();
    });
    
    // Select an AI-generated choice
    fireEvent.click(screen.getByText('Option 1'));
    
    // Check that the choice selection was handled correctly
    expect(narrativeStore.getState().selectDecisionOption).toHaveBeenCalledWith('test-decision', 'option-1');
    expect(mockProps.onChoiceSelected).toHaveBeenCalledWith('option-1');
  });

  it('falls back to static choices when AI-generated choices are not available', () => {
    // Create a modified version of the component that doesn't generate AI choices
    const ModifiedNarrativeController = NarrativeController as jest.Mock;
    ModifiedNarrativeController.mockImplementationOnce(({ onNarrativeGenerated }) => {
      React.useEffect(() => {
        if (onNarrativeGenerated) {
          onNarrativeGenerated({
            id: 'test-segment',
            content: 'Test narrative content',
            type: 'scene',
            metadata: { tags: ['test'] },
            timestamp: new Date(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        // No onChoicesGenerated call here, so no AI choices
      }, [onNarrativeGenerated]);
      
      return <div data-testid="mock-narrative-controller">Mock Controller</div>;
    });
    
    render(<GameSessionActiveWithNarrative {...mockProps} />);
    
    // Check that static choices are displayed
    expect(screen.getByText('Static Choice 1')).toBeInTheDocument();
    expect(screen.getByText('Static Choice 2')).toBeInTheDocument();
  });

  it('handles loading state correctly', () => {
    render(<GameSessionActiveWithNarrative {...mockProps} />);
    
    // Check for loading indicator
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});