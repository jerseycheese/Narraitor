import React from 'react';
import { render, screen } from '@testing-library/react';
import GameSessionActiveWithNarrative from '../GameSessionActiveWithNarrative';

// Mock the NarrativeController with simpler implementation
jest.mock('@/components/Narrative/NarrativeController', () => ({
  NarrativeController: jest.fn(() => {
    // Return a simple div instead of complex logic
    return React.createElement('div', { 'data-testid': 'mock-narrative-controller' }, 'Mock Narrative Controller');
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
      getSessionDecisions: jest.fn().mockReturnValue([]),
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
    expect(screen.getByText('⏸️ Pause')).toBeInTheDocument();
    expect(screen.getByText('End Session')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(<GameSessionActiveWithNarrative {...mockProps} />);
    expect(container).toBeInTheDocument();
  });
});