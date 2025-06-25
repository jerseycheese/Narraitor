import React from 'react';
import { render, screen } from '@testing-library/react';
import { World } from '@/types/world.types';

// Simplified mocking - focus on testing component behavior rather than hook abstractions

import GameSession from './GameSession';

// Mock Next.js navigation hooks  
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
  notFound: jest.fn(),
}));

describe('GameSession', () => {
  const mockWorld: World = {
    id: 'test-world-id',
    name: 'Test World',
    description: 'Test description',
    genre: 'fantasy',
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

  test('shows loading state initially while component initializes', () => {
    const mockStores = {
      worldStore: {
        worlds: { 'test-world-id': mockWorld }
      },
      sessionStore: {
        status: 'initializing',
        error: null,
        characterId: null,
        initializeSession: jest.fn(),
        endSession: jest.fn(),
        selectChoice: jest.fn()
      }
    };

    render(<GameSession worldId="test-world-id" _stores={mockStores} />);

    // Test actual behavior: component shows loading while initializing (real behavior!)
    expect(screen.getByTestId('game-session-loading')).toBeInTheDocument();
  });

  test('renders component with proper structure and behavior', () => {
    const mockStores = {
      worldStore: {
        worlds: { 'test-world-id': mockWorld }
      },
      sessionStore: {
        status: 'loading',
        error: null,
        characterId: 'char-1'
      }
    };

    render(<GameSession worldId="test-world-id" _stores={mockStores} />);

    // Test actual behavior: component renders and shows expected loading behavior
    expect(screen.getByTestId('game-session-loading')).toBeInTheDocument();
    expect(screen.getByText('Loading your game...')).toBeInTheDocument();
  });
});
