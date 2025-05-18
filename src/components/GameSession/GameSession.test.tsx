// Just focus on fixing the ESLint errors for the build
import React from 'react';
import { render, screen } from '@testing-library/react';
import GameSession from './GameSession';
import { World } from '@/types/world.types';

// Mock the ErrorMessage component
jest.mock('@/lib/components/ErrorMessage', () => {
  return function MockErrorMessage({ error }: { error: Error }) {
    return <div data-testid="error-message">{error.message}</div>;
  };
});

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
    handleRetry: jest.fn(),
    handleDismissError: jest.fn(),
    startSession: jest.fn(),
    handleSelectChoice: jest.fn(),
    handlePauseToggle: jest.fn(),
    handleEndSession: jest.fn(),
    prevStatusRef: { current: 'initializing' },
  }))
}));

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  notFound: jest.fn(),
}));

describe('GameSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays error when world does not exist', () => {
    // Mock the hook to return worldExists: false
    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'initializing' },
      error: null,
      worldExists: false,
      handleRetry: jest.fn(),
      handleDismissError: jest.fn(),
      prevStatusRef: { current: 'initializing' },
    });

    render(<GameSession worldId="non-existent-world" />);
    
    expect(screen.getByTestId('game-session-error-container')).toBeInTheDocument();
  });
  
  test('shows initializing state initially', () => {
    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'initializing' },
      error: null,
      worldExists: true,
      startSession: jest.fn(),
      prevStatusRef: { current: 'initializing' },
    });

    render(<GameSession worldId="test-world-id" />);
    
    expect(screen.getByTestId('game-session-initializing')).toBeInTheDocument();
    expect(screen.getByText('Session Not Started')).toBeInTheDocument();
  });

  test('displays loading state', () => {
    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'loading' },
      error: null,
      worldExists: true,
      prevStatusRef: { current: 'loading' },
    });

    render(<GameSession worldId="test-world-id" />);
    
    expect(screen.getByTestId('game-session-loading')).toBeInTheDocument();
  });

  test('displays error state', () => {
    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'error', error: 'Test error' },
      error: null,
      worldExists: true,
      handleRetry: jest.fn(),
      handleDismissError: jest.fn(),
      prevStatusRef: { current: 'error' },
    });

    render(<GameSession worldId="test-world-id" />);
    
    expect(screen.getByTestId('game-session-error')).toBeInTheDocument();
  });

  test('displays active state', () => {
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

    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'active' },
      error: null,
      worldExists: true,
      world: testWorld,
      handleSelectChoice: jest.fn(),
      handlePauseToggle: jest.fn(),
      handleEndSession: jest.fn(),
      prevStatusRef: { current: 'active' },
    });

    render(<GameSession worldId="test-world-id" />);
    
    expect(screen.getByTestId('game-session-active')).toBeInTheDocument();
  });
});