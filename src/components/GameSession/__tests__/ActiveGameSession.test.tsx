import React from 'react';
import { render, screen } from '@testing-library/react';
import ActiveGameSession from '../ActiveGameSession';

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

// Mock DeleteConfirmationDialog
jest.mock('@/components/DeleteConfirmationDialog/DeleteConfirmationDialog', () => {
  return jest.fn(({ isOpen, title, children }) => 
    isOpen ? <div data-testid="mock-confirmation-dialog">{title} {children}</div> : null
  );
});

// Mock the narrativeStore
jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: jest.fn(() => ({
    segments: {},
    currentEnding: null,
    isGeneratingEnding: false,
    generateEnding: jest.fn(),
    addDecision: jest.fn(),
    selectDecisionOption: jest.fn(),
    getSessionSegments: jest.fn().mockReturnValue([]),
    getSessionDecisions: jest.fn().mockReturnValue([]),
    clearSessionSegments: jest.fn(),
    isSessionEnded: jest.fn().mockReturnValue(false), // Add session locking support
    markSessionEnded: jest.fn()
  }))
}));

// Mock generateUniqueId
jest.mock('@/lib/utils/generateId', () => ({
  generateUniqueId: jest.fn().mockImplementation((prefix) => `${prefix}-12345`)
}));

// Mock sessionStore
jest.mock('@/state/sessionStore', () => ({
  useSessionStore: jest.fn(() => ({
    id: 'test-session',
    worldId: 'test-world',
    characterId: 'test-character',
    status: 'active',
    autoSave: {
      enabled: true,
      status: 'idle',
      lastSaveTime: null,
      errorMessage: null,
      totalSaves: 0,
    },
    updateAutoSaveStatus: jest.fn(),
    recordAutoSave: jest.fn(),
    setAutoSaveEnabled: jest.fn(),
  }))
}));

// Mock worldStore  
jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn(() => ({
    worlds: {
      'test-world': {
        id: 'test-world',
        name: 'Test World'
      }
    }
  }))
}));

// Mock journalStore
jest.mock('@/state/journalStore', () => ({
  useJournalStore: jest.fn(() => ({
    entries: {}
  }))
}));

// Mock characterStore
jest.mock('@/state/characterStore', () => ({
  useCharacterStore: jest.fn((selector) => {
    const state = {
      characters: {
        'test-character': {
          id: 'test-character',
          name: 'Test Character',
          worldId: 'test-world',
          portrait: { type: 'placeholder', url: null }
        }
      },
      currentCharacterId: 'test-character'
    };
    return selector ? selector(state) : state;
  })
}));

describe('ActiveGameSession', () => {
  const mockProps = {
    worldId: 'test-world',
    sessionId: 'test-session',
    world: {
      id: 'test-world',
      name: 'Test World',
      description: 'A test world',
      theme: 'fantasy',
      attributes: [],
      skills: [],
      settings: {
        difficulty: 'medium',
        startingLevel: 1,
        additionalInstructions: '',
        playerCharacterGuidelines: '',
        storyTone: 'balanced',
        enableNarrativeContext: true,
        maxPointPool: 100,
        maxAttributes: 6,
        maxSkills: 10,
        attributePointPool: 27,
        skillPointPool: 50
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
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
    render(<ActiveGameSession {...mockProps} />);
    
    // World info is no longer displayed in the header (removed duplicate display)
    
    // Check that narrative components are rendered
    expect(screen.getByTestId('mock-narrative-history-manager')).toBeInTheDocument();
    expect(screen.getByTestId('mock-narrative-controller')).toBeInTheDocument();
    
    // Check for session controls
    expect(screen.getByText('Start New Session')).toBeInTheDocument();
    expect(screen.getByText('End Session')).toBeInTheDocument();
  });

  it('renders without crashing', () => {
    const { container } = render(<ActiveGameSession {...mockProps} />);
    expect(container).toBeInTheDocument();
  });
});
