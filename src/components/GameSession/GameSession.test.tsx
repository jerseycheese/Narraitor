// Just focus on fixing the ESLint errors for the build
import React from 'react';
import { render, screen } from '@testing-library/react';
import GameSession from './GameSession';
import { World } from '@/types/world.types';

// Mock the ErrorDisplay component
jest.mock('@/components/ui/ErrorDisplay/ErrorDisplay', () => ({
  SectionError: function MockSectionError({ title, message }: { title: string; message: string }) {
    return <div data-testid="section-error">{title}: {message}</div>;
  }
}));

// Mock the child components
jest.mock('./GameSessionLoading', () => {
  return function MockGameSessionLoading() {
    return <div data-testid="game-session-loading">Loading game session...</div>;
  };
});

jest.mock('./GameSessionError', () => {
  return function MockGameSessionError({ error }: { error: string }) {
    return <div data-testid="game-session-error">{error}</div>;
  };
});

jest.mock('./GameSessionActive', () => {
  return function MockGameSessionActive() {
    return <div data-testid="game-session-active">Active session</div>;
  };
});

// Mock the custom hook
jest.mock('./hooks/useGameSessionState', () => ({
  useGameSessionState: jest.fn(() => ({
    sessionState: { status: 'initializing' },
    error: null,
    worldExists: true,
    world: undefined,
    worldCharacters: [],
    savedSession: null,
    handleRetry: jest.fn(),
    handleDismissError: jest.fn(),
    startSession: jest.fn(),
    handleSelectChoice: jest.fn(),
    handleResumeSession: jest.fn(),
    handleNewSession: jest.fn(),
    handleEndSession: jest.fn(),
    prevStatusRef: { current: 'initializing' },
  }))
}));

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
  notFound: jest.fn(),
}));

// Import the mocked hook
import { useGameSessionState } from './hooks/useGameSessionState';
const mockedUseGameSessionState = useGameSessionState as jest.MockedFunction<typeof useGameSessionState>;

describe('GameSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays error when world does not exist', () => {
    mockedUseGameSessionState.mockReturnValue({
      sessionState: { status: 'initializing' },
      error: null,
      worldExists: false,
      world: undefined,
      worldCharacters: [],
      savedSession: null,
      handleRetry: jest.fn(),
      handleDismissError: jest.fn(),
      startSession: jest.fn(),
      handleSelectChoice: jest.fn(),
      handleResumeSession: jest.fn(),
      handleNewSession: jest.fn(),
      handleEndSession: jest.fn(),
      prevStatusRef: { current: 'initializing' },
      setError: jest.fn(),
      setSessionState: jest.fn(),
    });
    
    render(<GameSession worldId="non-existent-world" />);
    
    expect(screen.getByTestId('game-session-error-container')).toBeInTheDocument();
  });
  
  test('shows initializing state initially', () => {
    mockedUseGameSessionState.mockReturnValue({
      sessionState: { status: 'initializing' },
      error: null,
      worldExists: true,
      world: undefined,
      worldCharacters: [],
      savedSession: null,
      handleRetry: jest.fn(),
      handleDismissError: jest.fn(),
      startSession: jest.fn(),
      handleSelectChoice: jest.fn(),
      handleResumeSession: jest.fn(),
      handleNewSession: jest.fn(),
      handleEndSession: jest.fn(),
      prevStatusRef: { current: 'initializing' },
      setError: jest.fn(),
      setSessionState: jest.fn(),
    });

    const testWorld: World = {
      id: 'test-world-id',
      name: 'Test World',
      description: 'Test description',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    render(
      <GameSession 
        worldId="test-world-id"
        _stores={{
          worldStore: {
            worlds: {
              'test-world-id': testWorld
            },
          },
          sessionStore: {
            status: 'initializing',
          }
        }}
      />
    );
    
    expect(screen.getByTestId('game-session-no-characters')).toBeInTheDocument();
    expect(screen.getByText('No Characters Found')).toBeInTheDocument();
  });
});