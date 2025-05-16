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

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  notFound: jest.fn(),
}));

describe('GameSession', () => {
  test('displays error when world does not exist', () => {
    // Arrange - simplified approach with direct props
    render(
      <GameSession 
        worldId="non-existent-world"
        _stores={{
          worldStore: {
            worlds: {},
          },
          sessionStore: {
            status: 'initializing',
            initializeSession: jest.fn(),
          }
        }}
      />
    );
    
    // Assert
    expect(screen.getByTestId('game-session-error-container')).toBeInTheDocument();
  });
  
  test('shows loading state initially', () => {
    // Arrange
    // Mocking simplified with just enough to make the test pass
    // Create a complete World object to satisfy TypeScript
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
    
    // Assert
    expect(screen.getByTestId('game-session-loading')).toBeInTheDocument();
  });
});