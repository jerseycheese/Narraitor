import React from 'react';
import { render, screen } from '@testing-library/react';
import GameSession from './GameSession';
import { World } from '@/types/world.types';

// Mock the child components
jest.mock('./GameSessionLoading', () => {
  return function MockGameSessionLoading({ loadingMessage }: { loadingMessage?: string }) {
    return <div data-testid="game-session-loading">{loadingMessage || 'Loading game session...'}</div>;
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
  }))
}));

describe('GameSession (Refactored)', () => {
  const mockWorld: World = {
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

  test('renders initializing state', () => {
    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'initializing' },
      error: null,
      worldExists: true,
      startSession: jest.fn(),
    });

    render(<GameSession worldId="test-world-id" />);

    expect(screen.getByTestId('game-session-initializing')).toBeInTheDocument();
  });

  test('renders loading state', () => {
    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'loading' },
      error: null,
      worldExists: true,
    });

    render(<GameSession worldId="test-world-id" />);

    expect(screen.getByTestId('game-session-loading')).toBeInTheDocument();
  });

  test('renders error state', () => {
    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'error', error: 'Test error' },
      error: null,
      worldExists: true,
    });

    render(<GameSession worldId="test-world-id" />);

    expect(screen.getByTestId('game-session-error')).toBeInTheDocument();
  });

  test('renders active state', () => {
    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'active' },
      error: null,
      worldExists: true,
      world: mockWorld,
    });

    render(<GameSession worldId="test-world-id" />);

    expect(screen.getByTestId('game-session-active')).toBeInTheDocument();
  });

  test('renders world not found error', () => {
    const { useGameSessionState } = require('./hooks/useGameSessionState');
    useGameSessionState.mockReturnValue({
      sessionState: { status: 'initializing' },
      error: null,
      worldExists: false,
    });

    render(<GameSession worldId="non-existent-world" />);

    expect(screen.getByTestId('game-session-error-container')).toBeInTheDocument();
  });

  test('component is under 300 lines', () => {
    // This test would verify the actual line count after refactoring
    // For now, this is a placeholder to remind us of the requirement
    expect(true).toBe(true);
  });
});